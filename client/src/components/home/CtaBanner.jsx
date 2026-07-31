import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useSiteContent } from "../../hooks/useSiteContent";

function CtaBanner() {
  const { get } = useSiteContent();
  const phone = get("contact.phone", "+92 300 1234567");
  const whatsapp = get("contact.whatsapp", "923001234567");

  return (
    <section className="relative overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1800&q=80"
        alt="DentalCare treatment room ready for patients"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[var(--brand-deep)]/88" />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-5 sm:py-20 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl text-white"
        >
          <h2 className="font-display text-3xl font-semibold sm:text-4xl md:text-5xl">
            Ready for a calmer dental visit?
          </h2>
          <p className="mt-4 max-w-lg text-sm text-white/80 sm:text-base">
            Book online in minutes, or message us on WhatsApp — our team will
            confirm your preferred time.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/appointment"
              className="btn-primary !bg-white !text-[var(--brand-deep)] hover:!bg-[var(--mist)]"
            >
              Book appointment
            </Link>
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi DentalCare, I would like to book an appointment.")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/50 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <MessageCircle size={18} />
              WhatsApp us
            </a>
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="inline-flex items-center justify-center rounded-xl px-2 py-3.5 text-sm font-medium text-white/85 underline-offset-4 hover:underline sm:px-4"
            >
              Call {phone}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CtaBanner;
