import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "../components/layout/Footer";
import Seo from "../components/common/Seo";
import { useSiteContent } from "../hooks/useSiteContent";

function About() {
  const { get } = useSiteContent();

  const heading = get("about.heading", "About DentalCare");
  const body = get(
    "about.body",
    "DentalCare is a neighbourhood clinic focused on gentle, honest dentistry. Our team combines modern diagnostics with a calm chairside manner so every visit feels clear and reassuring — whether you need a checkup, whitening, or restorative care."
  );
  const image = get(
    "about.image",
    "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1400&q=80"
  );

  return (
    <div className="page-shell">
      <Seo
        title="About"
        description="Learn about DentalCare — our team, values, and approach to gentle family dentistry."
      />

      <section className="section-pad">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">
              Est. neighbourhood clinic
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
              {heading}
            </h1>
            <p className="mt-5 max-w-xl whitespace-pre-line text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              {body}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["Hygiene", "Sterile protocols every visit"],
                ["Clarity", "Transparent treatment plans"],
                ["Comfort", "Calm care for all ages"],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="border-l-2 border-[var(--brand)] pl-3"
                >
                  <p className="font-semibold text-[var(--ink)]">{title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/appointment" className="btn-primary">
                Book appointment
              </Link>
              <Link to="/doctors" className="btn-secondary">
                Meet the team
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative min-h-[280px] overflow-hidden sm:min-h-[420px]"
          >
            <img
              src={image}
              alt="DentalCare clinic team and treatment room"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--mist)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-5 md:grid-cols-3">
          {[
            {
              title: "Patient-first visits",
              text: "We listen first, then recommend only what your oral health needs.",
            },
            {
              title: "Modern diagnostics",
              text: "Digital tools help us plan accurately and keep appointments efficient.",
            },
            {
              title: "Follow-through care",
              text: "Email confirmations, clear aftercare, and easy rebooking when you need us.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default About;
