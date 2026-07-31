import prisma from "../config/prisma.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { validateDentalProblem } from "../utils/dentalProblem.js";
import { writeAuditLog } from "../utils/auditLog.js";
import { notifyClinicNewRequest } from "../utils/appointmentEmails.js";
import { sendPasswordSetupEmail } from "../utils/passwordReset.js";
import { getClinicBrand } from "../utils/brand.js";

function normalize(text = "") {
  return String(text).trim().toLowerCase();
}

function detectIntent(message) {
  const t = normalize(message);

  if (
    /\b(hi|hello|hey|salam|assalam|aoa|start|help)\b/.test(t) ||
    t === "?"
  ) {
    return "greeting";
  }
  if (/\b(book|appointments?|visits?|schedule|booking)\b/.test(t)) {
    return "book";
  }
  // optional "s" so chips like "Services" match (service ≠ services with \b)
  if (
    /\b(services?|treatments?|cleaning|whitening|root canal|braces|prices?|costs?|fees?)\b/.test(
      t
    )
  ) {
    return "services";
  }
  if (/\b(doctors?|dentists?|specialists?|team|staff)\b/.test(t)) {
    return "doctors";
  }
  if (/\b(hours?|timings?|open|close|times?|when)\b/.test(t)) {
    return "hours";
  }
  if (
    /\b(address|location|where|map|gulberg|lahore|contact|phone|whatsapp|email)\b/.test(
      t
    )
  ) {
    return "contact";
  }
  if (/\b(faqs?|pain|hurt|child|kids?|cancel|reschedule|sensitive)\b/.test(t)) {
    return "faq";
  }
  if (/\b(cancel|stop|reset|start over|menu)\b/.test(t)) {
    return "reset";
  }
  return "unknown";
}

function parseDate(input) {
  const raw = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  return null;
}

function parseTime(input) {
  const raw = String(input).trim().toLowerCase();
  const m24 = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (m24) return `${m24[1].padStart(2, "0")}:${m24[2]}`;
  const m12 = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (m12) {
    let h = Number(m12[1]);
    const m = m12[2] || "00";
    if (m12[3] === "pm" && h < 12) h += 12;
    if (m12[3] === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  return null;
}

async function getSiteMap() {
  const rows = await prisma.siteContent.findMany();
  const map = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

async function findOrCreateGuest({ name, email, phone }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    if (existing.role !== "PATIENT") {
      return { error: "That email belongs to a staff account. Please use another email." };
    }
    return { patient: existing };
  }
  const patient = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : null,
      password: await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10),
      role: "PATIENT",
    },
  });
  sendPasswordSetupEmail(patient, "welcome").catch((err) =>
    console.error("Chat guest welcome email failed:", err)
  );
  return { patient };
}

function matchService(services, message) {
  const text = normalize(message);
  const asNum = Number(text);
  if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= services.length) {
    return services[asNum - 1];
  }
  return (
    services.find((s) => normalize(s.title) === text) ||
    services.find(
      (s) =>
        normalize(s.title).includes(text) || text.includes(normalize(s.title))
    ) ||
    null
  );
}

function matchDoctor(doctors, message) {
  const text = normalize(message);
  if (text.includes("any") || text === "skip" || text === "no preference") {
    return { id: null, name: "Any available" };
  }
  const asNum = Number(text);
  if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= doctors.length) {
    return doctors[asNum - 1];
  }
  return (
    doctors.find((d) => normalize(d.name) === text) ||
    doctors.find(
      (d) =>
        normalize(d.name).includes(text) || text.includes(normalize(d.name))
    ) ||
    null
  );
}

function helpMenu(brand = "DentalCare") {
  return [
    `I'm the ${brand} assistant 🦷`,
    "I can help with:",
    "• Book appointment",
    "• Our services & prices",
    "• Doctors",
    "• Clinic hours & location",
    "• Common FAQs",
    "",
    "Type a topic or tap a suggestion below.",
  ].join("\n");
}

/**
 * Public visitor chatbot (no login required)
 * POST /api/chat
 */
export const publicChat = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    const context = req.body.context || { step: "idle", draft: {} };

    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    const [services, doctors, site] = await Promise.all([
      prisma.service.findMany({
        where: { isGlobal: true },
        orderBy: { title: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "DOCTOR" },
        select: {
          id: true,
          name: true,
          doctorProfile: { select: { specialization: true, bio: true } },
        },
        orderBy: { name: "asc" },
      }),
      getSiteMap(),
    ]);

    const address = site["contact.address"] || "12 Clinic Avenue, Gulberg, Lahore";
    const phone = site["contact.phone"] || "+92 300 1234567";
    const email = site["contact.email"] || "hello@dentalcare.com";
    const hours = site["contact.hours"] || "Mon–Sat · 9:00 AM – 5:00 PM";
    const whatsapp = site["contact.whatsapp"] || "923001234567";
    const brand = site["home.brand"] || (await getClinicBrand());

    const step = context.step || "idle";
    const draft = { ...(context.draft || {}) };
    const intent = detectIntent(message);

    // --- Booking conversation ---
    if (step === "ask_service" || (step === "idle" && intent === "book")) {
      if (step === "idle") {
        if (!services.length) {
          return res.json({
            reply: "Booking isn't available right now — no services listed yet. Please call the clinic.",
            context: { step: "idle", draft: {} },
            suggestions: ["Clinic hours", "Contact", "Doctors"],
          });
        }
        const list = services
          .map(
            (s, i) =>
              `${i + 1}. ${s.title}${s.price != null ? ` — Rs ${s.price}` : ""}`
          )
          .join("\n");
        return res.json({
          reply: `Great — let's book a visit.\nWhich service?\n${list}\n\nReply with a number or service name.`,
          context: { step: "ask_service", draft: {} },
          suggestions: services.slice(0, 4).map((s) => s.title),
        });
      }

      const selected = matchService(services, message);
      if (!selected) {
        return res.json({
          reply: "Please choose a service by number or name from the list.",
          context: { step: "ask_service", draft },
          suggestions: services.slice(0, 4).map((s) => s.title),
        });
      }
      draft.serviceId = selected.id;
      draft.serviceName = selected.title;

      if (!doctors.length) {
        return res.json({
          reply: `Service: ${selected.title}.\nWhat is your full name?`,
          context: { step: "ask_name", draft },
          suggestions: [],
        });
      }

      const list = doctors
        .map(
          (d, i) =>
            `${i + 1}. ${d.name}${
              d.doctorProfile?.specialization
                ? ` (${d.doctorProfile.specialization})`
                : ""
            }`
        )
        .join("\n");
      return res.json({
        reply: `Service: ${selected.title}.\nPreferred doctor? (or type "Any")\n${list}`,
        context: { step: "ask_doctor", draft },
        suggestions: ["Any", ...doctors.slice(0, 3).map((d) => d.name)],
      });
    }

    if (step === "ask_doctor") {
      const selected = matchDoctor(doctors, message);
      if (!selected) {
        return res.json({
          reply: 'Please pick a doctor by number/name, or type "Any".',
          context: { step: "ask_doctor", draft },
          suggestions: ["Any", ...doctors.slice(0, 3).map((d) => d.name)],
        });
      }
      draft.doctorId = selected.id;
      draft.doctorName = selected.name;
      return res.json({
        reply: `Doctor: ${selected.name}.\nWhat is your full name?`,
        context: { step: "ask_name", draft },
        suggestions: [],
      });
    }

    if (step === "ask_name") {
      if (message.length < 2) {
        return res.json({
          reply: "Please enter your full name.",
          context: { step: "ask_name", draft },
        });
      }
      draft.name = message;
      return res.json({
        reply: `Thanks, ${message}. What is your email?`,
        context: { step: "ask_email", draft },
        suggestions: [],
      });
    }

    if (step === "ask_email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message)) {
        return res.json({
          reply: "Please enter a valid email address.",
          context: { step: "ask_email", draft },
        });
      }
      draft.email = message.trim().toLowerCase();
      return res.json({
        reply: "Phone number? (or type Skip)",
        context: { step: "ask_phone", draft },
        suggestions: ["Skip"],
      });
    }

    if (step === "ask_phone") {
      if (normalize(message) !== "skip") {
        draft.phone = message.trim();
      }
      return res.json({
        reply: "Preferred date? (YYYY-MM-DD or DD/MM/YYYY)",
        context: { step: "ask_date", draft },
        suggestions: [],
      });
    }

    if (step === "ask_date") {
      const date = parseDate(message);
      if (!date) {
        return res.json({
          reply: "Please use a valid date like 2026-08-15 or 15/08/2026.",
          context: { step: "ask_date", draft },
        });
      }
      draft.appointmentDate = date;
      return res.json({
        reply: "Preferred time? (e.g. 10:00 or 10:30 AM — 9:00–17:00)",
        context: { step: "ask_time", draft },
        suggestions: ["09:00", "10:00", "11:00", "14:00", "16:00"],
      });
    }

    if (step === "ask_time") {
      const time = parseTime(message);
      if (!time) {
        return res.json({
          reply: "Please enter a valid time like 10:00 or 2:30 PM.",
          context: { step: "ask_time", draft },
          suggestions: ["09:00", "10:00", "11:00", "14:00"],
        });
      }
      draft.appointmentTime = time;
      return res.json({
        reply: "Briefly describe your dental concern (e.g. toothache, cleaning, whitening).",
        context: { step: "ask_problem", draft },
        suggestions: ["Toothache", "Routine cleaning", "Whitening consult"],
      });
    }

    if (step === "ask_problem") {
      const dentalCheck = validateDentalProblem(message);
      if (!dentalCheck.ok) {
        return res.json({
          reply: dentalCheck.message,
          context: { step: "ask_problem", draft },
          suggestions: ["Toothache", "Gum bleeding", "Dental cleaning"],
        });
      }
      draft.currentProblem = message.trim();

      const when = `${draft.appointmentDate} at ${draft.appointmentTime}`;
      return res.json({
        reply: [
          "Please confirm your booking:",
          `• Service: ${draft.serviceName}`,
          `• Doctor: ${draft.doctorName || "Any"}`,
          `• Name: ${draft.name}`,
          `• Email: ${draft.email}`,
          draft.phone ? `• Phone: ${draft.phone}` : null,
          `• When: ${when}`,
          `• Concern: ${draft.currentProblem}`,
          "",
          'Reply "Confirm" to submit, or "Cancel" to stop.',
        ]
          .filter(Boolean)
          .join("\n"),
        context: { step: "confirm", draft },
        suggestions: ["Confirm", "Cancel"],
      });
    }

    if (step === "confirm") {
      if (/\b(cancel|no|stop)\b/i.test(message)) {
        return res.json({
          reply: "Booking cancelled. How else can I help?",
          context: { step: "idle", draft: {} },
          suggestions: ["Book appointment", "Services", "Clinic hours"],
        });
      }
      if (!/\b(confirm|yes|ok|sure|submit)\b/i.test(message)) {
        return res.json({
          reply: 'Please reply "Confirm" to submit or "Cancel" to stop.',
          context: { step: "confirm", draft },
          suggestions: ["Confirm", "Cancel"],
        });
      }

      const guest = await findOrCreateGuest({
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
      });
      if (guest.error) {
        return res.json({
          reply: guest.error,
          context: { step: "idle", draft: {} },
          suggestions: ["Book appointment", "Help"],
        });
      }

      const appointmentDateTime = new Date(draft.appointmentDate);
      const [hh, mm] = draft.appointmentTime.split(":").map(Number);
      appointmentDateTime.setHours(hh, mm, 0, 0);
      if (appointmentDateTime.getTime() <= Date.now()) {
        return res.json({
          reply: "That date/time is in the past. Let's pick a future slot — type Book appointment.",
          context: { step: "idle", draft: {} },
          suggestions: ["Book appointment"],
        });
      }

      const appointment = await prisma.appointment.create({
        data: {
          patientId: guest.patient.id,
          doctorId: draft.doctorId || null,
          serviceId: Number(draft.serviceId),
          appointmentDate: new Date(draft.appointmentDate),
          appointmentTime: draft.appointmentTime,
          currentProblem: draft.currentProblem,
          status: "PENDING",
        },
        include: {
          patient: {
            select: { id: true, name: true, email: true, phone: true },
          },
          doctor: { select: { id: true, name: true, email: true } },
          service: true,
        },
      });

      await writeAuditLog({
        actorId: guest.patient.id,
        actorRole: "PATIENT",
        actorEmail: guest.patient.email,
        action: "CHATBOT_APPOINTMENT_REQUEST",
        entity: "Appointment",
        entityId: appointment.id,
        details: `Chatbot booking: ${appointment.service?.title}`,
      });

      notifyClinicNewRequest(appointment).catch(() => {});

      return res.json({
        reply: [
          "✅ Appointment request submitted!",
          `Reference #${appointment.id}`,
          "Our team will confirm shortly by email or phone.",
          "",
          "You can also track visits after registering with the same email.",
          "Anything else I can help with?",
        ].join("\n"),
        context: { step: "idle", draft: {} },
        suggestions: ["Services", "Clinic hours", "Doctors", "Help"],
      });
    }

    if (intent === "reset") {
      return res.json({
        reply: helpMenu(brand),
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Services", "Doctors", "Clinic hours"],
      });
    }

    if (intent === "greeting") {
      return res.json({
        reply: helpMenu(brand),
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Services", "Doctors", "Clinic hours", "FAQs"],
      });
    }

    if (intent === "services") {
      const list = services.length
        ? services
            .map(
              (s) =>
                `• ${s.title}${s.price != null ? ` — Rs ${s.price}` : ""}${
                  s.duration ? ` (${s.duration} min)` : ""
                }\n  ${s.description || ""}`
            )
            .join("\n\n")
        : "No services listed yet.";
      return res.json({
        reply: `Our treatments:\n\n${list}\n\nWant to book one? Type Book appointment.`,
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Doctors", "Clinic hours"],
      });
    }

    if (intent === "doctors") {
      const list = doctors.length
        ? doctors
            .map(
              (d) =>
                `• ${d.name}${
                  d.doctorProfile?.specialization
                    ? ` — ${d.doctorProfile.specialization}`
                    : ""
                }${
                  d.doctorProfile?.bio ? `\n  ${d.doctorProfile.bio}` : ""
                }`
            )
            .join("\n\n")
        : "No doctors listed yet.";
      return res.json({
        reply: `Our dental team:\n\n${list}`,
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Services", "Clinic hours"],
      });
    }

    if (intent === "hours") {
      return res.json({
        reply: `Clinic hours: ${hours}\nSunday: Emergency only`,
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Location", "Contact"],
      });
    }

    if (intent === "contact") {
      return res.json({
        reply: [
          `${brand} Clinic`,
          `Address: ${address}`,
          `Phone: ${phone}`,
          `Email: ${email}`,
          `WhatsApp: https://wa.me/${whatsapp}`,
          `Hours: ${hours}`,
        ].join("\n"),
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Services", "FAQs"],
      });
    }

    if (intent === "faq") {
      return res.json({
        reply: [
          "Quick FAQs:",
          "• Book online anytime — no account required for a request.",
          "• Checkups are usually every 6 months.",
          "• We welcome children and use gentle techniques.",
          "• Cancel/reschedule by calling/WhatsApp or via patient portal after login.",
          "",
          "More answers are on the FAQ page. Want to book a visit?",
        ].join("\n"),
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Services", "Clinic hours"],
      });
    }

    return res.json({
      reply:
        "I didn't catch that. Try: Book appointment, Services, Doctors, Clinic hours, or Contact.",
      context: { step: "idle", draft: {} },
      suggestions: ["Book appointment", "Services", "Doctors", "Clinic hours", "Help"],
    });
  } catch (error) {
    console.error("Public chat error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
