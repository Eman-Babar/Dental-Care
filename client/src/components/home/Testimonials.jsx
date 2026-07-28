import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Ali Khan",
    review:
      "The clinic feels calm and professional. My cleaning was thorough and the team explained everything clearly.",
  },
  {
    name: "Ayesha Ahmed",
    review:
      "Booking online was simple, and the waiting area is spotless. I finally found a dentist my kids are not afraid of.",
  },
  {
    name: "Usman Tariq",
    review:
      "Root canal without the dread — careful work, modern tools, and follow-up that actually checked on me.",
  },
];

function Testimonials() {
  return (
    <section className="section-pad clinic-pattern bg-[var(--mist)]">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-xl font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
          Stories from our patients
        </h2>
        <p className="mt-4 max-w-lg text-[var(--muted)]">
          Real visits. Real relief. The reason families return year after year.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.blockquote
              key={item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="border-t-2 border-[var(--brand)] pt-6"
            >
              <p className="text-[var(--ink)] leading-relaxed">
                “{item.review}”
              </p>
              <footer className="mt-5 text-sm font-semibold text-[var(--brand-deep)]">
                {item.name}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
