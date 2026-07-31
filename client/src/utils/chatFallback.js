/**
 * Offline / API-down replies so the public chatbot still helps
 * when the backend chat route is unreachable.
 */
export function getFallbackReply(message, siteGet = () => "") {
  const t = String(message || "").trim().toLowerCase();
  const phone = siteGet("contact.phone", "+92 300 1234567");
  const email = siteGet("contact.email", "hello@dentalcare.pk");
  const address = siteGet("contact.address", "Gulberg, Lahore");
  const hours = siteGet("contact.hours", "Mon–Sat 10:00 AM – 8:00 PM");

  if (/\b(hi|hello|hey|salam|assalam|aoa|help)\b/.test(t) || t === "?") {
    return {
      reply:
        "I'm the DentalCare assistant 🦷\nI can help with:\n• Book appointment\n• Services & prices\n• Doctors\n• Clinic hours & location\n• FAQs\n\nType a topic or tap a suggestion below.",
      suggestions: ["Book appointment", "Services", "Doctors", "Clinic hours", "FAQs"],
    };
  }

  if (/\b(book|appointments?|visits?|schedule)\b/.test(t)) {
    return {
      reply:
        "To book a visit, open Book visit and submit your details — or tell me your name, phone, preferred date (YYYY-MM-DD), and time (e.g. 10:00).\n\nYou can also WhatsApp the clinic from the link below the chat.",
      suggestions: ["Clinic hours", "Services", "Contact"],
    };
  }

  if (
    /\b(services?|treatments?|cleaning|whitening|root canal|braces|prices?|costs?)\b/.test(
      t
    )
  ) {
    return {
      reply:
        "Popular treatments include checkups, cleaning, whitening, fillings, root canal, braces/aligners, and implants. Exact fees depend on your case — book a consultation for a clear plan.",
      suggestions: ["Book appointment", "Doctors", "FAQs"],
    };
  }

  if (/\b(doctors?|dentists?|specialists?|team)\b/.test(t)) {
    return {
      reply:
        "Our dentists are listed on the Doctors page. You can pick a preferred doctor when booking, or leave it open and we'll assign the next available specialist.",
      suggestions: ["Book appointment", "Services", "Clinic hours"],
    };
  }

  if (/\b(hours?|timings?|open|close|times?|when)\b/.test(t)) {
    return {
      reply: `Clinic hours: ${hours}\n\nClosed on major public holidays — WhatsApp us if you're unsure.`,
      suggestions: ["Book appointment", "Contact", "Location"],
    };
  }

  if (/\b(address|location|where|map|contact|phone|whatsapp|email)\b/.test(t)) {
    return {
      reply: `📍 ${address}\n📞 ${phone}\n✉️ ${email}\n\nSee Contact for the map and WhatsApp.`,
      suggestions: ["Book appointment", "Clinic hours", "FAQs"],
    };
  }

  if (/\b(faqs?|pain|hurt|child|kids?|cancel|reschedule|sensitive)\b/.test(t)) {
    return {
      reply:
        "Quick answers:\n• Mild sensitivity after cleaning is common for 1–2 days.\n• Children's visits are welcome — tell us age when booking.\n• To cancel/reschedule, message us as early as you can.\n\nFor emergencies, call or WhatsApp the clinic.",
      suggestions: ["Book appointment", "Contact", "Services"],
    };
  }

  return {
    reply:
      "I can help with booking, services, doctors, hours, location, and FAQs. Tap a suggestion or try WhatsApp if you need a person.",
    suggestions: ["Book appointment", "Services", "Doctors", "Clinic hours", "Contact"],
  };
}
