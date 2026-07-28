import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "../components/layout/Footer";

function Contact() {
  return (
    <div className="page-shell">
      <section className="section-pad">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
              Visit the clinic
            </h1>
            <p className="mt-4 max-w-md text-sm text-[var(--muted)] sm:text-base">
              We are here for checkups, emergencies, and everything in between.
              Walk in or book ahead.
            </p>

            <ul className="mt-10 space-y-5">
              <li className="flex gap-4">
                <MapPin className="mt-1 shrink-0 text-[var(--brand)]" size={20} />
                <div>
                  <p className="font-semibold text-[var(--ink)]">Address</p>
                  <p className="text-sm text-[var(--muted)]">
                    12 Clinic Avenue, Gulberg, Lahore
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Phone className="mt-1 shrink-0 text-[var(--brand)]" size={20} />
                <div>
                  <p className="font-semibold text-[var(--ink)]">Phone</p>
                  <p className="text-sm text-[var(--muted)]">+92 300 1234567</p>
                </div>
              </li>
              <li className="flex gap-4">
                <Mail className="mt-1 shrink-0 text-[var(--brand)]" size={20} />
                <div>
                  <p className="font-semibold text-[var(--ink)]">Email</p>
                  <p className="text-sm text-[var(--muted)]">
                    hello@dentalcare.clinic
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Clock className="mt-1 shrink-0 text-[var(--brand)]" size={20} />
                <div>
                  <p className="font-semibold text-[var(--ink)]">Hours</p>
                  <p className="text-sm text-[var(--muted)]">
                    Mon–Sat 9:00 AM – 8:00 PM
                  </p>
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
