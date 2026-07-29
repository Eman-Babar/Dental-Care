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
    "DentalCare is a neighbourhood clinic focused on gentle, honest dentistry."
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
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
              {heading}
            </h1>
            <p className="mt-5 max-w-xl whitespace-pre-line text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              {body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/appointment" className="btn-primary">
                Book appointment
              </Link>
              <Link to="/contact" className="btn-secondary">
                Contact us
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative min-h-[280px] overflow-hidden sm:min-h-[360px]"
          >
            <img
              src={image}
              alt="DentalCare clinic team and treatment room"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default About;
