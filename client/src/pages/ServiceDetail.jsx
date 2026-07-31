import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/common/Loader";
import Footer from "../components/layout/Footer";
import Seo from "../components/common/Seo";

function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/services/${id}`)
      .then(({ data }) => setService(data.service))
      .catch(() => {
        toast.error("Could not load this service");
        setService(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;

  if (!service) {
    return (
      <div className="page-shell section-pad text-center">
        <p className="text-[var(--muted)]">Service not found.</p>
        <Link to="/services" className="btn-secondary mt-6 inline-flex">
          Back to services
        </Link>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Seo
        title={service.title}
        description={service.description || `${service.title} at DentalCare Clinic.`}
      />

      <section className="relative overflow-hidden">
        <img
          src={
            service.image ||
            "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1800&q=80"
          }
          alt={service.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[var(--brand-deep)]/78" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-white sm:px-5 sm:py-24">
          <Link
            to="/services"
            className="text-sm font-medium text-white/75 hover:text-white"
          >
            ← All services
          </Link>
          <h1 className="mt-4 font-display text-3xl font-semibold sm:text-5xl md:text-6xl">
            {service.title}
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            {service.description}
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
              What to expect
            </h2>
            <ul className="mt-6 space-y-4 text-[var(--ink)]">
              <li className="border-l-2 border-[var(--brand)] pl-4">
                Clinical assessment tailored to your dental history and goals
              </li>
              <li className="border-l-2 border-[var(--brand)] pl-4">
                Clear explanation of options, timeline, and aftercare
              </li>
              <li className="border-l-2 border-[var(--brand)] pl-4">
                Gentle techniques in a sterilised, modern treatment room
              </li>
            </ul>
            <p className="mt-8 text-sm leading-relaxed text-[var(--muted)]">
              Every smile is different. After your consultation we confirm the
              best plan for your oral health — whether this is a one-visit
              cleaning or a multi-step restorative pathway.
            </p>
          </motion.div>

          <aside className="h-fit border border-[var(--line)] bg-[var(--surface)] p-6">
            <h3 className="font-display text-xl font-semibold">Visit details</h3>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-[var(--line)] pb-3">
                <dt className="text-[var(--muted)]">Duration</dt>
                <dd className="font-medium text-[var(--ink)]">
                  {service.duration ? `${service.duration} min` : "As advised"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[var(--line)] pb-3">
                <dt className="text-[var(--muted)]">From</dt>
                <dd className="font-medium text-[var(--ink)]">
                  {service.price != null ? `Rs ${service.price}` : "On consultation"}
                </dd>
              </div>
            </dl>
            <Link to="/appointment" className="btn-primary mt-6 w-full">
              Book this treatment
            </Link>
            <Link
              to="/faq"
              className="mt-3 block text-center text-sm font-medium text-[var(--brand)] hover:underline"
            >
              Read FAQs
            </Link>
          </aside>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default ServiceDetail;
