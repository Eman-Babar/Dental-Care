import { motion } from "framer-motion";
import { useSiteContent } from "../../hooks/useSiteContent";

function Stats() {
  const { get } = useSiteContent();

  const items = [
    { value: get("stats.patients", "2,500+"), label: "Happy patients" },
    { value: get("stats.years", "10+"), label: "Years of care" },
    { value: get("stats.doctors", "8+"), label: "Specialist dentists" },
    { value: get("stats.treatments", "5,000+"), label: "Successful treatments" },
  ];

  return (
    <section className="border-y border-[var(--line)] bg-[var(--brand-deep)] text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-5 md:grid-cols-4 md:py-14">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            className="text-center"
          >
            <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              {item.value}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-white/65 sm:text-sm">
              {item.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default Stats;
