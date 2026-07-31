import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Footer from "../components/layout/Footer";
import Seo from "../components/common/Seo";
import { useSiteContent } from "../hooks/useSiteContent";

const FALLBACK_FAQS = [
  {
    q: "How do I book an appointment?",
    a: "Use Book Visit on the website — no account required. Choose a service, preferred date and time, and submit. Our team confirms by email or phone.",
  },
  {
    q: "Do you treat children?",
    a: "Yes. We welcome families and offer gentle checkups and cleanings for kids in a calm chairside environment.",
  },
  {
    q: "Can I cancel or reschedule?",
    a: "Registered patients can manage bookings from the patient portal. Visitors can contact us by phone or WhatsApp and we will update your request.",
  },
];

function parseFaqs(raw) {
  if (!raw) return FALLBACK_FAQS;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return FALLBACK_FAQS;
    return parsed
      .filter((item) => item && item.q && item.a)
      .map((item) => ({ q: String(item.q), a: String(item.a) }));
  } catch {
    return FALLBACK_FAQS;
  }
}

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="border-b border-[var(--line)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-[var(--ink)]">{item.q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[var(--brand)] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-[var(--muted)]">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Faq() {
  const { get, content } = useSiteContent();
  const brand = get("home.brand", "DentalCare");
  const heading = get("faq.heading", "Frequently asked questions");
  const subtext = get(
    "faq.subtext",
    "Quick answers before you book — or message us if you need something more specific."
  );
  const faqs = useMemo(
    () => parseFaqs(content["faq.items"] || ""),
    [content]
  );
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="page-shell">
      <Seo
        title="FAQ"
        description={`Frequently asked questions about ${brand} appointments, treatments, and clinic visits.`}
      />
      <section className="section-pad">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
            {heading}
          </h1>
          <p className="mt-4 text-[var(--muted)]">{subtext}</p>

          <div className="mt-10 border-t border-[var(--line)]">
            {faqs.map((item, index) => (
              <FaqItem
                key={`${item.q}-${index}`}
                item={item}
                open={openIndex === index}
                onToggle={() =>
                  setOpenIndex((prev) => (prev === index ? -1 : index))
                }
              />
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/appointment" className="btn-primary">
              Book appointment
            </Link>
            <Link to="/contact" className="btn-secondary">
              Contact the clinic
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Faq;
