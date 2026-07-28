import prisma from "../config/prisma.js";
import { validateDentalProblem } from "../utils/dentalProblem.js";
import { writeAuditLog } from "../utils/auditLog.js";
import {
  getDoctorSlotsForDate,
  isSlotInDoctorSchedule,
} from "../utils/doctorAvailability.js";
import {
  doctorOffersService,
  getDoctorServicesFromList,
} from "../utils/doctorServices.js";

const CLINIC_OPEN_TIME = "09:00";
const CLINIC_CLOSE_TIME = "17:00";

function toLocalDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalTimeInput(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function normalize(text = "") {
  return String(text).trim().toLowerCase();
}

function isPastDateTime(dateStr, timeStr) {
  const [hours, minutes] = String(timeStr).split(":").map(Number);
  const dt = new Date(dateStr);
  dt.setHours(hours, minutes || 0, 0, 0);
  return Number.isNaN(dt.getTime()) || dt.getTime() <= Date.now();
}

function parseDate(input) {
  const raw = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

function parseTime(input) {
  const raw = String(input).trim().toLowerCase();
  const match24 = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (match24) {
    return `${match24[1].padStart(2, "0")}:${match24[2]}`;
  }

  const match12 = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (match12) {
    let h = Number(match12[1]);
    const m = match12[2] || "00";
    const meridiem = match12[3];
    if (meridiem === "pm" && h < 12) h += 12;
    if (meridiem === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  return null;
}

function isAfterClinicHours(timeStr) {
  return String(timeStr) > CLINIC_CLOSE_TIME;
}

function isBeforeClinicHours(timeStr) {
  return String(timeStr) < CLINIC_OPEN_TIME;
}

function isValidSlotStep(timeStr) {
  const [, mm] = String(timeStr).split(":").map(Number);
  return mm === 0 || mm === 30;
}

function matchByNumberOrName(list, message, nameKey = "name") {
  const text = normalize(message);
  const asNum = Number(text);
  if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= list.length) {
    return list[asNum - 1];
  }

  const exact = list.find((item) => normalize(item[nameKey]) === text);
  if (exact) return exact;

  const matches = list.filter(
    (item) =>
      normalize(item[nameKey]).includes(text) ||
      text.includes(normalize(item[nameKey]))
  );
  return matches.length === 1 ? matches[0] : null;
}

async function getClinicData(patientId) {
  const [services, doctors, appointments] = await Promise.all([
    prisma.service.findMany({ orderBy: { title: "asc" } }),
    prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: {
        id: true,
        name: true,
        doctorProfile: {
          select: {
            specialization: true,
            services: {
              select: { id: true, title: true, isGlobal: true },
              orderBy: { title: "asc" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.appointment.findMany({
      where: { patientId },
      include: { service: true, doctor: true },
      orderBy: [{ appointmentDate: "desc" }, { appointmentTime: "desc" }],
    }),
  ]);

  const upcoming = appointments
    .filter((a) => ["PENDING", "APPROVED"].includes(a.status))
    .sort((a, b) => {
      const da = new Date(a.appointmentDate).getTime();
      const db = new Date(b.appointmentDate).getTime();
      if (da !== db) return da - db;
      return String(a.appointmentTime).localeCompare(String(b.appointmentTime));
    });

  const history = appointments.filter((a) =>
    ["COMPLETED", "REJECTED", "CANCELLED"].includes(a.status)
  );

  return { services, doctors, appointments, upcoming, history };
}

function formatAppointment(item, index) {
  const date = new Date(item.appointmentDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const prefix = typeof index === "number" ? `${index}. ` : "• ";
  return `${prefix}${item.service?.title || "Service"} with ${
    item.doctor?.name || "doctor"
  } on ${date} at ${item.appointmentTime} — ${item.status}`;
}

function formatAppointmentsReply(upcoming, history, all) {
  const total = all.length;
  if (total === 0) {
    return "You have no appointments yet.\n\nType \"Book appointment\" to schedule one.";
  }

  const upLines =
    upcoming.length > 0
      ? upcoming.map((a, i) => formatAppointment(a, i + 1)).join("\n")
      : "None";

  const histLines =
    history.length > 0
      ? history.map((a, i) => formatAppointment(a, i + 1)).join("\n")
      : "None";

  return [
    `Your appointments (total: ${total})`,
    "",
    `Upcoming / active (${upcoming.length}):`,
    upLines,
    "",
    `Previous (${history.length}):`,
    histLines,
  ].join("\n");
}

function detectIntent(message) {
  const text = normalize(message);

  // Appointments BEFORE book — "my appointments" contains "appointment"
  if (
    /(my\s+appointments?|upcoming\s+appointments?|appointment\s+status|appointment\s+history|view\s+appointments?|show\s+appointments?|all\s+appointments?|appointments?\s+list)/.test(
      text
    ) ||
    text === "4" ||
    text === "appointments" ||
    text === "my appointments"
  ) {
    return "appointments";
  }
  if (
    /(^book\b|\bbook\s+(an?\s+)?(appointment|visit)|schedule\s+(an?\s+)?(appointment|visit)|make\s+(an?\s+)?appointment|new\s+booking|\bbooking\b)/.test(
      text
    ) ||
    text === "1" ||
    text === "book appointment" ||
    text === "book another"
  ) {
    return "book";
  }
  if (
    /(service|treatment|cleaning|whitening|root canal)/.test(text) ||
    text === "2"
  ) {
    return "services";
  }
  if (/(doctor|dentist|specialist)/.test(text) || text === "3") {
    return "doctors";
  }
  if (
    /(hour|timing|open|contact|address|phone|location|clinic)/.test(text) ||
    text === "5"
  ) {
    return "clinic";
  }
  if (/(help|menu|options|start)/.test(text)) {
    return "help";
  }
  if (/(cancel|stop|reset|never ?mind)/.test(text)) {
    return "cancel";
  }
  return "unknown";
}

function helpText() {
  return [
    "I can help with DentalCare info and bookings. Try:",
    "1) Book appointment",
    "2) Services",
    "3) Doctors",
    "4) My appointments",
    "5) Clinic hours / contact",
    "Or type cancel anytime to reset booking.",
  ].join("\n");
}

async function isSlotTaken(doctorId, appointmentDate, appointmentTime) {
  const existing = await prisma.appointment.findFirst({
    where: {
      doctorId: Number(doctorId),
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { in: ["PENDING", "APPROVED"] },
    },
  });
  return Boolean(existing);
}

async function getAvailableSlotsForDoctor(doctorId, dateStr) {
  const doctor = await prisma.user.findFirst({
    where: { id: Number(doctorId), role: "DOCTOR" },
    include: { doctorProfile: true },
  });

  if (!doctor) {
    return { slots: [], message: "Doctor not found." };
  }

  const schedule = getDoctorSlotsForDate(
    doctor.doctorProfile?.availability,
    dateStr
  );

  if (!schedule.slots.length) {
    return {
      slots: [],
      message:
        schedule.message || "Doctor is not available on this day.",
    };
  }

  const bookedRows = await prisma.appointment.findMany({
    where: {
      doctorId: Number(doctorId),
      appointmentDate: new Date(dateStr),
      status: { in: ["PENDING", "APPROVED"] },
    },
    select: { appointmentTime: true },
  });
  const booked = bookedRows.map((row) => row.appointmentTime);

  let slots = schedule.slots.filter((slot) => !booked.includes(slot));

  const today = toLocalDateInput(new Date());
  if (dateStr === today) {
    const minTime = toLocalTimeInput(new Date());
    slots = slots.filter((slot) => slot >= minTime);
  }

  return {
    slots,
    message: slots.length
      ? null
      : "All slots are booked or unavailable for this day.",
  };
}

export const patientChat = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    const incomingContext = req.body.context || { step: "idle", draft: {} };

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const context = {
      step: incomingContext.step || "idle",
      draft: { ...(incomingContext.draft || {}) },
    };

    const data = await getClinicData(req.user.id);
    const intent = detectIntent(message);

    // Cancel / reset
    if (intent === "cancel") {
      return res.json({
        reply: "Okay, booking cancelled. How else can I help?\n\n" + helpText(),
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Services", "My appointments"],
      });
    }

    // Allow help + my appointments during booking without losing draft (help only)
    if (context.step && context.step !== "idle") {
      if (intent === "help") {
        return res.json({
          reply:
            "You are in the middle of booking. Continue with the current step, or type cancel to reset.\n\n" +
            helpText(),
          context,
          suggestions: ["Cancel"],
        });
      }

      if (intent === "appointments") {
        return res.json({
          reply:
            formatAppointmentsReply(data.upcoming, data.history, data.appointments) +
            "\n\n(Your booking draft is still open — continue answering, or type cancel.)",
          context,
          suggestions: ["Cancel"],
        });
      }

      if (context.step === "ask_doctor") {
        const selected = matchByNumberOrName(data.doctors, message, "name");
        if (!selected) {
          const list = data.doctors
            .map((d, i) => `${i + 1}. ${d.name}`)
            .join("\n");
          return res.json({
            reply: `Please choose a doctor by number or name:\n${list}`,
            context,
            suggestions: data.doctors.slice(0, 4).map((d) => d.name),
          });
        }

        const doctorServices = getDoctorServicesFromList(
          data.services,
          selected.doctorProfile
        );

        context.draft.doctorId = selected.id;
        context.draft.doctorName = selected.name;
        context.step = "ask_service";
        const list = doctorServices
          .map((s, i) => `${i + 1}. ${s.title}`)
          .join("\n");
        return res.json({
          reply: `Doctor ${selected.name} selected. Which service?\n${list}`,
          context,
          suggestions: doctorServices.slice(0, 4).map((s) => s.title),
        });
      }

      if (context.step === "ask_service") {
        const doctor = data.doctors.find(
          (item) => item.id === Number(context.draft.doctorId)
        );
        const doctorServices = getDoctorServicesFromList(
          data.services,
          doctor?.doctorProfile
        );
        const selected = matchByNumberOrName(
          doctorServices.map((s) => ({ ...s, name: s.title })),
          message,
          "name"
        );
        if (!selected) {
          const list = doctorServices
            .map((s, i) => `${i + 1}. ${s.title}`)
            .join("\n");
          return res.json({
            reply: `Please choose a service offered by ${context.draft.doctorName}:\n${list}`,
            context,
            suggestions: doctorServices.slice(0, 4).map((s) => s.title),
          });
        }
        context.draft.serviceId = selected.id;
        context.draft.serviceName = selected.title;
        context.step = "ask_date";
        return res.json({
          reply: `Great — ${selected.title} with ${context.draft.doctorName}. What date? (YYYY-MM-DD or DD/MM/YYYY)`,
          context,
          suggestions: [],
        });
      }

      if (context.step === "ask_date") {
        const date = parseDate(message);
        if (!date) {
          return res.json({
            reply:
              "I could not read that date. Please use YYYY-MM-DD (example: 2026-08-15).",
            context,
          });
        }
        const onlyDate = new Date(date);
        onlyDate.setHours(23, 59, 59, 999);
        if (onlyDate.getTime() < Date.now()) {
          return res.json({
            reply: "That date is in the past. Please choose today or a future date.",
            context,
          });
        }
        context.draft.appointmentDate = date;
        context.step = "ask_time";

        const slotInfo = await getAvailableSlotsForDoctor(
          context.draft.doctorId,
          date
        );

        if (!slotInfo.slots.length) {
          return res.json({
            reply:
              slotInfo.message ||
              "This doctor has no available slots on that day. Please choose another date.",
            context: { ...context, step: "ask_date" },
          });
        }

        return res.json({
          reply: [
            `Date set to ${date}. Available slots with ${context.draft.doctorName}:`,
            slotInfo.slots.join(", "),
            "",
            "What time? (HH:MM, example 10:30 or 2:00 pm)",
          ].join("\n"),
          context,
          suggestions: slotInfo.slots.slice(0, 6),
        });
      }

      if (context.step === "ask_time") {
        const time = parseTime(message);
        if (!time) {
          return res.json({
            reply: "Please send time like 10:30 or 2:00 pm.",
            context,
          });
        }
        if (isBeforeClinicHours(time)) {
          return res.json({
            reply: "Clinic booking starts from 9:00 AM. Please choose a slot from 09:00 onward.",
            context,
          });
        }
        if (isAfterClinicHours(time)) {
          return res.json({
            reply: "Clinic booking time is only until 5:00 PM. Please choose a time up to 17:00.",
            context,
          });
        }
        if (!isValidSlotStep(time)) {
          return res.json({
            reply: "Appointments are available in fixed 30-minute slots only (for example 09:00, 09:30).",
            context,
          });
        }

        const doctor = await prisma.user.findFirst({
          where: {
            id: Number(context.draft.doctorId),
            role: "DOCTOR",
          },
          include: { doctorProfile: true },
        });

        if (
          !doctor ||
          !isSlotInDoctorSchedule(
            doctor.doctorProfile?.availability,
            context.draft.appointmentDate,
            time
          )
        ) {
          const slotInfo = await getAvailableSlotsForDoctor(
            context.draft.doctorId,
            context.draft.appointmentDate
          );
          return res.json({
            reply: slotInfo.slots.length
              ? `That time is outside this doctor's schedule. Available slots: ${slotInfo.slots.join(", ")}`
              : "That time is outside this doctor's available schedule for that day.",
            context,
            suggestions: slotInfo.slots.slice(0, 6),
          });
        }

        if (isPastDateTime(context.draft.appointmentDate, time)) {
          return res.json({
            reply: "That date/time is in the past. Choose a future time.",
            context,
          });
        }
        if (
          await isSlotTaken(
            context.draft.doctorId,
            context.draft.appointmentDate,
            time
          )
        ) {
          return res.json({
            reply:
              "That time is already booked with this doctor. Please choose another time.",
            context,
          });
        }
        context.draft.appointmentTime = time;
        context.step = "ask_problem";
        return res.json({
          reply: "What dental problem or reason should I add for the doctor?",
          context,
        });
      }

      if (context.step === "ask_problem") {
        const dentalCheck = validateDentalProblem(message);
        if (!dentalCheck.ok) {
          return res.json({
            reply: dentalCheck.message,
            context,
          });
        }
        context.draft.currentProblem = message;
        context.step = "confirm";
        return res.json({
          reply: [
            "Please confirm this booking:",
            `Service: ${context.draft.serviceName}`,
            `Doctor: ${context.draft.doctorName}`,
            `Date: ${context.draft.appointmentDate}`,
            `Time: ${context.draft.appointmentTime}`,
            `Problem: ${context.draft.currentProblem}`,
            "",
            "Reply YES to book, or NO to cancel.",
          ].join("\n"),
          context,
          suggestions: ["Yes", "No"],
        });
      }

      if (context.step === "confirm") {
        if (/^(y|yes|ok|confirm|book)$/i.test(message)) {
          if (
            isPastDateTime(
              context.draft.appointmentDate,
              context.draft.appointmentTime
            )
          ) {
            return res.json({
              reply:
                "That slot is now in the past. Let's start again. Type: book appointment",
              context: { step: "idle", draft: {} },
            });
          }

          const service = await prisma.service.findUnique({
            where: { id: Number(context.draft.serviceId) },
          });
          const doctor = await prisma.user.findFirst({
            where: {
              id: Number(context.draft.doctorId),
              role: "DOCTOR",
            },
            include: {
              doctorProfile: {
                include: {
                  services: { select: { id: true } },
                },
              },
            },
          });
          if (!service || !doctor) {
            return res.json({
              reply:
                "That service or doctor is no longer available. Let's start again. Type: book appointment",
              context: { step: "idle", draft: {} },
            });
          }

          if (!doctorOffersService(doctor.doctorProfile, context.draft.serviceId)) {
            return res.json({
              reply:
                "That doctor no longer offers the selected service. Type: book appointment",
              context: { step: "idle", draft: {} },
            });
          }

          if (
            !isSlotInDoctorSchedule(
              doctor.doctorProfile?.availability,
              context.draft.appointmentDate,
              context.draft.appointmentTime
            )
          ) {
            return res.json({
              reply:
                "That time is no longer available for this doctor. Type: book appointment",
              context: { step: "idle", draft: {} },
            });
          }

          if (
            await isSlotTaken(
              context.draft.doctorId,
              context.draft.appointmentDate,
              context.draft.appointmentTime
            )
          ) {
            return res.json({
              reply:
                "That slot was just taken. Please choose another time. Type: book appointment",
              context: { step: "idle", draft: {} },
            });
          }

          const appointment = await prisma.appointment.create({
            data: {
              patientId: req.user.id,
              doctorId: Number(context.draft.doctorId),
              serviceId: Number(context.draft.serviceId),
              appointmentDate: new Date(context.draft.appointmentDate),
              appointmentTime: context.draft.appointmentTime,
              currentProblem: context.draft.currentProblem,
              status: "PENDING",
            },
            include: {
              service: true,
              doctor: { select: { name: true } },
            },
          });

          await writeAuditLog({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: "APPOINTMENT_CREATED_VIA_CHAT",
            entity: "Appointment",
            entityId: appointment.id,
            details: `Chat booking: ${appointment.service.title}`,
          });

          return res.json({
            reply: `Booked! Your ${appointment.service.title} with ${appointment.doctor.name} is PENDING doctor review.\n\n${helpText()}`,
            context: { step: "idle", draft: {} },
            suggestions: ["My appointments", "Book another", "Services"],
          });
        }

        if (/^(n|no|cancel)$/i.test(message)) {
          return res.json({
            reply: "Booking cancelled.\n\n" + helpText(),
            context: { step: "idle", draft: {} },
            suggestions: ["Book appointment", "Services", "My appointments"],
          });
        }

        return res.json({
          reply: "Please reply YES to confirm or NO to cancel.",
          context,
          suggestions: ["Yes", "No"],
        });
      }
    }

    // Idle intents
    if (intent === "book") {
      if (!data.services.length || !data.doctors.length) {
        return res.json({
          reply:
            "Booking is unavailable right now (no services/doctors found).",
          context: { step: "idle", draft: {} },
        });
      }
      const list = data.doctors
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
        reply: `Let's book an appointment. Which doctor?\n${list}`,
        context: { step: "ask_doctor", draft: {} },
        suggestions: data.doctors.slice(0, 4).map((d) => d.name),
      });
    }

    if (intent === "services") {
      const list = data.services
        .map(
          (s) =>
            `• ${s.title}${s.price != null ? ` — Rs ${s.price}` : ""}${
              s.duration ? ` (${s.duration} min)` : ""
            }\n  ${s.description}`
        )
        .join("\n\n");
      return res.json({
        reply: list || "No services found yet.",
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Doctors", "My appointments"],
      });
    }

    if (intent === "doctors") {
      const list = data.doctors
        .map(
          (d) =>
            `• ${d.name}${
              d.doctorProfile?.specialization
                ? ` — ${d.doctorProfile.specialization}`
                : ""
            }`
        )
        .join("\n");
      return res.json({
        reply: list || "No doctors found yet.",
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Services", "Clinic hours"],
      });
    }

    if (intent === "appointments") {
      return res.json({
        reply: formatAppointmentsReply(
          data.upcoming,
          data.history,
          data.appointments
        ),
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Services", "Help"],
      });
    }

    if (intent === "clinic") {
      return res.json({
        reply: [
          "DentalCare Clinic",
          "Address: 12 Clinic Avenue, Gulberg, Lahore",
          "Phone: +92 300 1234567",
          "Email: hello@dentalcare.clinic",
          "Hours: Mon–Sat 9:00 AM – 8:00 PM",
          "Sunday: Emergency only",
        ].join("\n"),
        context: { step: "idle", draft: {} },
        suggestions: ["Book appointment", "Doctors", "Services"],
      });
    }

    return res.json({
      reply: helpText(),
      context: { step: "idle", draft: {} },
      suggestions: [
        "Book appointment",
        "Services",
        "Doctors",
        "My appointments",
        "Clinic hours",
      ],
    });
  } catch (error) {
    console.error("Patient chat error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
