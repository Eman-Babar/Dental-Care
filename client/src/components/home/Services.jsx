import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Shield,
  Smile,
  Stethoscope,
  AlignCenter,
  Siren,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../common/Loader";

function ServicesSection() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const ICONS = [Sparkles, Shield, Smile, Stethoscope, AlignCenter, Siren];

  useEffect(() => {
    setLoading(true);
    api
      .get("/services")
      .then(({ data }) => setServices(data?.services || []))
      .catch(() => toast.error("Could not load services"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="section-pad bg-[var(--surface)]">
        <Loader />
      </section>
    );
  }

  return (
    <section className="section-pad bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
            Care for every smile
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            From everyday cleanings to restorative treatment — one clinic for
            your whole family.
          </p>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {services.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">No services found.</div>
          ) : (
            services.map((service, index) => {
              const Icon = ICONS[index % ICONS.length];
              return (
                <motion.div
                  key={service.id ?? service.title ?? index}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--mist)] text-[var(--brand)]">
                    <Icon size={22} strokeWidth={1.75} />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
                    {service.title || "Service"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {service.description || ""}
                  </p>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="mt-12">
          <Link to="/services" className="btn-secondary">
            See all treatments
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
