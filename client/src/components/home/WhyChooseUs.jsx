import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Heart, Sparkles, Clock } from "lucide-react";

const POINTS = [
  {
    icon: Shield,
    title: "Hygiene-first chairs",
    text: "Strict sterilisation protocols and modern equipment in every room.",
  },
  {
    icon: Heart,
    title: "Gentle, honest care",
    text: "Dentists who explain options clearly — no pressure, no jargon.",
  },
  {
    icon: Sparkles,
    title: "Full smile services",
    text: "Cleaning, whitening, orthodontics, and restorative care under one roof.",
  },
  {
    icon: Clock,
    title: "Book on your schedule",
    text: "Online requests confirmed quickly by phone, email, or WhatsApp.",
  },
];

function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid min-h-[520px] lg:grid-cols-2">
        <div className="relative min-h-[320px]">
          <img
            src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1400&q=80"
            alt="Dentist speaking with a patient in a calm clinic"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center bg-[var(--mist)] px-6 py-16 md:px-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
              Why families choose DentalCare
            </h2>
            <p className="mt-5 max-w-md text-[var(--muted)]">
              Sterile rooms, digital diagnostics, and dentists who explain every
              step — so you leave informed, not anxious.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {POINTS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--brand)]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{item.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link to="/about" className="btn-secondary mt-10 self-start">
              Learn about us
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
