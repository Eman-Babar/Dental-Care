import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/common/Loader";
import Footer from "../components/layout/Footer";
import Seo from "../components/common/Seo";
import { useSiteContent } from "../hooks/useSiteContent";

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

function DoctorsPage() {
  const { get } = useSiteContent();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const heading = get("doctors.heading", "Our dental team");
  const subtext = get(
    "doctors.subtext",
    "Licensed specialists dedicated to gentle, evidence-based care at DentalCare Clinic."
  );

  const apiRoot = useMemo(() => {
    return api.defaults.baseURL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
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

  if (loading) return <Loader />;

  return (
    <div className="page-shell">
      <Seo title="Doctors" description={subtext} />
      <section className="section-pad pb-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
            {heading}
          </h1>
          <p className="mt-4 max-w-xl text-sm text-[var(--muted)] sm:text-base">
            {subtext}
          </p>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-5 sm:pb-20">
        <div className="mx-auto grid max-w-6xl gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
          {doctors.length === 0 ? (
            <div className="col-span-full text-center text-sm text-[var(--muted)]">
              No doctors found right now.
            </div>
          ) : (
            doctors.map((doctor, index) => (
              <motion.article
                key={doctor.id ?? doctor.name ?? index}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <img
                  src={getImageUrl(doctor.image) || getDoctorFallback(doctor)}
                  alt={`${doctor.name || "Doctor"} — ${doctor.doctorProfile?.specialization || "Dentist"}`}
                  className="h-80 w-full rounded-2xl object-cover"
                />
                <h2 className="mt-5 font-display text-2xl font-semibold">
                  {doctor.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-[var(--brand)]">
                  {doctor.doctorProfile?.specialization || "Dentist"}
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {doctor.doctorProfile?.bio || ""}
                </p>
                <Link
                  to="/appointment"
                  className="btn-secondary mt-5 inline-flex !px-4 !py-2 text-sm"
                >
                  Book with {doctor.name}
                </Link>
              </motion.article>
            ))
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default DoctorsPage;
