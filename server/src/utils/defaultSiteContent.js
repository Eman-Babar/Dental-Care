export const DEFAULT_SITE_CONTENT = [
  {
    key: "home.brand",
    label: "Clinic brand name",
    group: "brand",
    value: "DentalCare",
  },
  {
    key: "brand.tagline",
    label: "Brand tagline",
    group: "brand",
    value: "Calm visits. Lasting smiles.",
  },
  {
    key: "brand.seo_description",
    label: "Default SEO description",
    group: "brand",
    value:
      "Modern family dentistry. Book appointments online for checkups, cleaning, whitening, and more.",
  },
  {
    key: "brand.og_image",
    label: "Social share image URL (Open Graph)",
    group: "brand",
    value:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "brand.logo_url",
    label: "Logo image URL (optional)",
    group: "brand",
    value: "",
  },
  {
    key: "home.headline",
    label: "Home headline",
    group: "home",
    value: "Calm visits. Lasting smiles.",
  },
  {
    key: "home.subtext",
    label: "Home supporting text",
    group: "home",
    value:
      "Family dentistry with gentle hands, modern equipment, and care that fits your schedule.",
  },
  {
    key: "home.hero_image",
    label: "Home hero image URL",
    group: "home",
    value:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=2000&q=80",
  },
  {
    key: "about.heading",
    label: "About page heading",
    group: "about",
    value: "About our clinic",
  },
  {
    key: "about.body",
    label: "About page body",
    group: "about",
    value:
      "We are a neighbourhood clinic focused on gentle, honest dentistry. Our team combines modern diagnostics with a calm chairside manner so every visit feels clear and reassuring — whether you need a checkup, whitening, or restorative care.",
  },
  {
    key: "about.image",
    label: "About page image URL",
    group: "about",
    value:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1400&q=80",
  },
  {
    key: "services.heading",
    label: "Services page heading",
    group: "services",
    value: "Our services",
  },
  {
    key: "services.subtext",
    label: "Services page intro",
    group: "services",
    value: "Evidence-based treatments delivered with a gentle touch.",
  },
  {
    key: "doctors.heading",
    label: "Doctors page heading",
    group: "doctors",
    value: "Our dental team",
  },
  {
    key: "doctors.subtext",
    label: "Doctors page intro",
    group: "doctors",
    value: "Licensed specialists dedicated to gentle, evidence-based care.",
  },
  {
    key: "contact.heading",
    label: "Contact page heading",
    group: "contact",
    value: "Visit the clinic",
  },
  {
    key: "contact.subtext",
    label: "Contact page intro",
    group: "contact",
    value:
      "We are here for checkups, emergencies, and everything in between. Walk in or book ahead.",
  },
  {
    key: "contact.address",
    label: "Clinic address",
    group: "contact",
    value: "12 Clinic Avenue, Gulberg, Lahore",
  },
  {
    key: "contact.phone",
    label: "Clinic phone",
    group: "contact",
    value: "+92 300 1234567",
  },
  {
    key: "contact.email",
    label: "Clinic email",
    group: "contact",
    value: "hello@dentalcare.com",
  },
  {
    key: "contact.hours",
    label: "Clinic hours",
    group: "contact",
    value: "Mon–Sat · 9:00 AM – 5:00 PM",
  },
  {
    key: "contact.whatsapp",
    label: "WhatsApp number (digits with country code)",
    group: "contact",
    value: "923001234567",
  },
  {
    key: "clinic.closedDates",
    label: "Closed / holiday dates (JSON array of YYYY-MM-DD)",
    group: "contact",
    value: "[]",
  },
  {
    key: "contact.map_embed",
    label: "Google Maps embed URL",
    group: "contact",
    value:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3402.5!2d74.3436!3d31.5204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDMxJzEzLjQiTiA3NMKwMjAnMzYuOSJF!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s",
  },
  {
    key: "stats.patients",
    label: "Happy patients count label",
    group: "home",
    value: "2,500+",
  },
  {
    key: "stats.years",
    label: "Years of experience label",
    group: "home",
    value: "10+",
  },
  {
    key: "stats.doctors",
    label: "Specialist dentists count",
    group: "home",
    value: "8+",
  },
  {
    key: "stats.treatments",
    label: "Successful treatments label",
    group: "home",
    value: "5,000+",
  },
  {
    key: "faq.heading",
    label: "FAQ page heading",
    group: "faq",
    value: "Frequently asked questions",
  },
  {
    key: "faq.subtext",
    label: "FAQ page intro",
    group: "faq",
    value:
      "Quick answers before you book — or message us if you need something more specific.",
  },
  {
    key: "faq.items",
    label: "FAQ items (JSON array of {q, a})",
    group: "faq",
    value: JSON.stringify(
      [
        {
          q: "How do I book an appointment?",
          a: "Use Book Visit on the website — no account required. Choose a service, preferred date and time, and submit. Our team confirms by email or phone.",
        },
        {
          q: "Do you treat children?",
          a: "Yes. We welcome families and offer gentle checkups and cleanings for kids in a calm chairside environment.",
        },
        {
          q: "What should I bring to my first visit?",
          a: "Bring any previous dental records or X-rays if you have them, a list of medications, and your preferred payment method.",
        },
        {
          q: "How often should I visit the dentist?",
          a: "Most patients benefit from a checkup and cleaning every six months. Your dentist may recommend a different schedule based on your oral health.",
        },
        {
          q: "Can I cancel or reschedule?",
          a: "Registered patients can manage bookings from the patient portal. Visitors can contact us by phone or WhatsApp and we will update your request.",
        },
        {
          q: "Where is the clinic located?",
          a: "See the Contact page for address, map, WhatsApp, and clinic hours.",
        },
      ],
      null,
      0
    ),
  },
  {
    key: "payment.enabled",
    label: "Show payment instructions (true/false)",
    group: "payment",
    value: "true",
  },
  {
    key: "payment.heading",
    label: "Payment section heading",
    group: "payment",
    value: "How to pay your deposit",
  },
  {
    key: "payment.instructions",
    label: "Bank / JazzCash / EasyPaisa payment instructions",
    group: "payment",
    value:
      "Transfer the deposit and keep the receipt.\n\nJazzCash / EasyPaisa: 0300-1234567 (DentalCare Clinic)\nBank transfer: Meezan Bank — Acc Title: DentalCare Clinic — Acc No: 0123456789\n\nAfter transfer, open your patient portal and tap “I’ve paid” so we can verify.",
  },
  {
    key: "payment.currency",
    label: "Payment currency code (for Stripe)",
    group: "payment",
    value: "pkr",
  },
  {
    key: "site.maintenance",
    label: "Maintenance mode — pause online booking (true/false)",
    group: "ops",
    value: "false",
  },
  {
    key: "site.maintenance_message",
    label: "Maintenance banner / booking pause message",
    group: "ops",
    value:
      "Online booking is temporarily paused. Please call or WhatsApp the clinic to schedule.",
  },
];
