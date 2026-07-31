import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import api from "../../api/axios";

const FALLBACK = [
  {
    id: "f1",
    patient: { name: "Ali Khan" },
    rating: 5,
    comment:
      "The clinic feels calm and professional. My cleaning was thorough and the team explained everything clearly.",
    doctor: { name: "Dr. Ahmed Ali" },
    appointment: { service: { title: "Dental Cleaning" } },
  },
  {
    id: "f2",
    patient: { name: "Ayesha Ahmed" },
    rating: 5,
    comment:
      "Booking online was simple, and the waiting area is spotless. I finally found a dentist my kids are not afraid of.",
    doctor: { name: "Dr. Sarah Khan" },
    appointment: { service: { title: "General Checkup" } },
  },
  {
    id: "f3",
    patient: { name: "Usman Tariq" },
    rating: 5,
    comment:
      "Root canal without the dread — careful work, modern tools, and follow-up that actually checked on me.",
    doctor: { name: "Dr. Sarah Khan" },
    appointment: { service: { title: "Root Canal Treatment" } },
  },
];

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? "fill-amber-500" : "text-[var(--line)]"}
        />
      ))}
    </div>
  );
}

function Testimonials() {
  const [reviews, setReviews] = useState(FALLBACK);

  useEffect(() => {
    api
      .get("/reviews", { params: { limit: 6 } })
      .then(({ data }) => {
        if (data.reviews?.length) setReviews(data.reviews);
      })
      .catch(() => {
        /* keep fallback testimonials */
      });
  }, []);

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
          {reviews.slice(0, 6).map((item, index) => (
            <motion.blockquote
              key={item.id ?? item.patient?.name ?? index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="border-t-2 border-[var(--brand)] bg-[var(--surface)]/70 p-6 pt-6"
            >
              <Stars rating={item.rating || 5} />
              <p className="mt-4 text-[var(--ink)] leading-relaxed">
                “{item.comment}”
              </p>
              <footer className="mt-5">
                <p className="text-sm font-semibold text-[var(--brand-deep)]">
                  {item.patient?.name || "Patient"}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {[item.appointment?.service?.title, item.doctor?.name]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
