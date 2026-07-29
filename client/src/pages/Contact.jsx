import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "../components/layout/Footer";
import Seo from "../components/common/Seo";
import { useSiteContent } from "../hooks/useSiteContent";

function Contact() {
  const { get } = useSiteContent();

  const heading = get("contact.heading", "Visit the clinic");
  const subtext = get(
    "contact.subtext",
    "We are here for checkups, emergencies, and everything in between. Walk in or book ahead."
  );
  const address = get("contact.address", "12 Clinic Avenue, Gulberg, Lahore");
  const phone = get("contact.phone", "+92 300 1234567");
  const email = get("contact.email", "hello@dentalcare.com");
  const hours = get("contact.hours", "Mon–Sat · 9:00 AM – 5:00 PM");

  return (
    <div className="page-shell">
      <Seo
        title="Contact"
        description={`Contact DentalCare — ${address}. Phone ${phone}.`}
      />
      <section className="section-pad">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
              {heading}
            </h1>
            <p className="mt-4 max-w-md text-sm text-[var(--muted)] sm:text-base">
              {subtext}
            </p>

            <ul className="mt-10 space-y-5">
              <li className="flex gap-4">
                <MapPin className="mt-1 shrink-0 text-[var(--brand)]" size={20} />
                <div>
                  <p className="font-semibold text-[var(--ink)]">Address</p>
                  <p className="text-sm text-[var(--muted)]">{address}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <Phone className="mt-1 shrink-0 text-[var(--brand)]" size={20} />
                <div>
                  <p className="font-semibold text-[var(--ink)]">Phone</p>
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="text-sm text-[var(--muted)] hover:text-[var(--brand)]"
                  >
                    {phone}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <Mail className="mt-1 shrink-0 text-[var(--brand)]" size={20} />
                <div>
                  <p className="font-semibold text-[var(--ink)]">Email</p>
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-[var(--muted)] hover:text-[var(--brand)]"
                  >
                    {email}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <Clock className="mt-1 shrink-0 text-[var(--brand)]" size={20} />
                <div>
                  <p className="font-semibold text-[var(--ink)]">Hours</p>
                  <p className="text-sm text-[var(--muted)]">{hours}</p>
                </div>
              </li>
            </ul>

            <Link to="/appointment" className="btn-primary mt-10 inline-flex">
              Book appointment
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl"
          >
            <img
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80"
              alt="DentalCare clinic exterior and reception"
              className="h-full min-h-[260px] w-full object-cover sm:min-h-[420px]"
            />
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Contact;
