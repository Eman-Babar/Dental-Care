import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSiteContent } from "../../hooks/useSiteContent";
import Seo from "../common/Seo";

function Hero() {
  const { get } = useSiteContent();

  const brand = get("home.brand", "DentalCare");
  const headline = get("home.headline", "Calm visits. Lasting smiles.");
  const subtext = get(
    "home.subtext",
    "Family dentistry with gentle hands, modern equipment, and care that fits your schedule."
  );
  const heroImage = get(
    "home.hero_image",
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=2000&q=80"
  );

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <Seo
        title="DentalCare — Family Dental Clinic"
        description={subtext}
      />
      <motion.img
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        src={heroImage}
        alt="Bright modern dental clinic interior"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-deep)]/88 via-[var(--brand-deep)]/55 to-[var(--brand)]/25" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-12 pt-24 sm:px-5 sm:pb-16 sm:pt-28 md:justify-center md:pb-24 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-xl text-white"
        >
          <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-7xl">
            {brand}
          </p>
          <h1 className="mt-4 font-display text-2xl font-medium leading-snug text-white/95 sm:mt-5 sm:text-3xl md:text-4xl">
            {headline}
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/80 sm:mt-4 sm:text-base md:text-lg">
            {subtext}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <Link
              to="/appointment"
              className="btn-primary w-full !bg-white !text-[var(--brand-deep)] hover:!bg-[var(--mist)] sm:w-auto"
            >
              Book appointment
            </Link>
            <Link
              to="/services"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/50 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              View services
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
