import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Shield, Smile, Stethoscope, AlignCenter, Siren } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/common/Loader";
import Footer from "../components/layout/Footer";
import Seo from "../components/common/Seo";
import { useSiteContent } from "../hooks/useSiteContent";

const ICONS = [Sparkles, Shield, Smile, Stethoscope, AlignCenter, Siren];

function Services() {
  const { get } = useSiteContent();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const heading = get("services.heading", "Our services");
  const subtext = get(
    "services.subtext",
    "Evidence-based treatments delivered with a gentle touch."
  );

  useEffect(() => {
    setLoading(true);
    api
      .get("/services")
      .then(({ data }) => setServices(data?.services || []))
      .catch(() => toast.error("Could not load services"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="page-shell">
      <Seo title="Services" description={`${heading}. ${subtext}`} />
      <section className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1800&q=80"
          alt="Dental instruments in a clean clinic"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[var(--brand-deep)]/75" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-white sm:px-5 sm:py-24">
          <h1 className="font-display text-3xl font-semibold sm:text-5xl md:text-6xl">
            {heading}
          </h1>
          <p className="mt-4 max-w-lg text-base text-white/80 sm:text-lg">
            {subtext}
          </p>
        </div>
      </section>

      <section className="section-pad">
        {services.length === 0 ? (
          <div className="mx-auto max-w-2xl text-center text-sm text-[var(--muted)]">
            No services found right now.
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const Icon = ICONS[index % ICONS.length];
              const description = service.description || "";
              return (
                <motion.article
                  key={service.id ?? service.title ?? index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex flex-col border border-[var(--line)] bg-[var(--surface)] p-7"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--mist)] text-[var(--brand)]">
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
                    {service.title || "Service"}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                    {description}
                  </p>
                  {(service.duration || service.price != null) && (
                    <p className="mt-3 text-xs font-medium text-[var(--brand)]">
                      {service.duration ? `${service.duration} min` : null}
                      {service.duration && service.price != null ? " · " : null}
                      {service.price != null ? `From Rs ${service.price}` : null}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link
                      to={`/services/${service.id}`}
                      className="btn-secondary !px-4 !py-2.5 text-sm"
                    >
                      Learn more
                    </Link>
                    <Link
                      to="/appointment"
                      className="btn-primary !px-4 !py-2.5 text-sm"
                    >
                      Book
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default Services;
