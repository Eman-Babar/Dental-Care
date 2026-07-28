import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../common/Loader";

const DEFAULT_MALE_IMAGE = "/doctor-male.svg";
const DEFAULT_FEMALE_IMAGE = "/doctor-female.svg";
const FEMALE_NAME_HINTS = [
  "sarah",
  "ayesha",
  "fatima",
  "zainab",
  "amna",
  "maryam",
  "iqra",
  "sana",
  "hina",
  "maham",
  "sidra",
  "anaya",
];

function DoctorsSection() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiRoot = useMemo(() => {
    return (
      api.defaults.baseURL?.replace(/\/api\/?$/, "") ||
      "http://localhost:5000"
    );
  }, []);

  const getImageUrl = (src) => {
    if (!src) return null;
    if (String(src).startsWith("http")) return src;
    if (String(src).startsWith("/")) return `${apiRoot}${src}`;
    return `${apiRoot}/${src}`;
  };

  const getDoctorFallback = (doctor) => {
    const name = String(doctor?.name || "").toLowerCase();
    const isFemale = FEMALE_NAME_HINTS.some((hint) => name.includes(hint));
    return isFemale ? DEFAULT_FEMALE_IMAGE : DEFAULT_MALE_IMAGE;
  };

  useEffect(() => {
    setLoading(true);
    api
      .get("/doctors")
      .then(({ data }) => setDoctors(data?.doctors || []))
      .catch(() => toast.error("Could not load doctors"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="section-pad bg-[var(--surface)]">
        <Loader />
      </section>
    );
  }

  const visible = doctors.slice(0, 3);

  return (
    <section className="section-pad bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
              Meet our dentists
            </h2>
            <p className="mt-4 text-[var(--muted)]">
              Specialists who treat patients with patience — not just teeth.
            </p>
          </div>
          <Link to="/doctors" className="btn-secondary">
            View full team
          </Link>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {visible.length === 0 ? (
            <div className="col-span-full text-sm text-[var(--muted)]">
              No doctors found right now.
            </div>
          ) : (
            visible.map((doctor, index) => (
            <motion.article
              key={doctor.id ?? doctor.name ?? index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="group"
            >
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={getImageUrl(doctor.image) || getDoctorFallback(doctor)}
                  alt={doctor.name || "Doctor"}
                  className="h-80 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold text-[var(--ink)]">
                {doctor.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-[var(--brand)]">
                {doctor.doctorProfile?.specialization || "Dentist"}
              </p>
            </motion.article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default DoctorsSection;
