import { motion } from "framer-motion";

function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid min-h-[520px] lg:grid-cols-2">
        <div className="relative min-h-[320px]">
          <img
            src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1400&q=80"
            alt="Dentist speaking with a patient"
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
            <ul className="mt-8 space-y-4 text-[var(--ink)]">
              <li className="border-l-2 border-[var(--brand)] pl-4">
                Experienced dentists across orthodontics, surgery & cosmetics
              </li>
              <li className="border-l-2 border-[var(--brand)] pl-4">
                Online booking that fits busy weekdays and weekends
              </li>
              <li className="border-l-2 border-[var(--brand)] pl-4">
                Strict hygiene protocols in every chair
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
