import { useState } from "react";
import { Mail, MapPin, Phone, Clock, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Footer from "../components/layout/Footer";
import Seo from "../components/common/Seo";
import { useSiteContent } from "../hooks/useSiteContent";
import api from "../api/axios";

function Contact() {
  const { get } = useSiteContent();

  const brand = get("home.brand", "DentalCare");
  const heading = get("contact.heading", "Visit the clinic");
  const subtext = get(
    "contact.subtext",
    "We are here for checkups, emergencies, and everything in between. Walk in or book ahead."
  );
  const address = get("contact.address", "12 Clinic Avenue, Gulberg, Lahore");
  const phone = get("contact.phone", "+92 300 1234567");
  const email = get("contact.email", "hello@dentalcare.com");
  const hours = get("contact.hours", "Mon–Sat · 9:00 AM – 5:00 PM");
  const whatsapp = get("contact.whatsapp", "923001234567");
  const mapEmbed = get(
    "contact.map_embed",
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.747!2d74.3436!3d31.5204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39190483a053b7d5%3A0x4c4a0c0c0c0c0c0c!2sGulberg%20Lahore!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post("/contact", form);
      toast.success(data.message || "Message sent");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-shell">
      <Seo
        title="Contact"
        description={`Contact ${brand} — ${address}. Phone ${phone}.`}
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
                <MessageCircle
                  className="mt-1 shrink-0 text-[var(--brand)]"
                  size={20}
                />
                <div>
                  <p className="font-semibold text-[var(--ink)]">WhatsApp</p>
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[var(--muted)] hover:text-[var(--brand)]"
                  >
                    Chat with the clinic
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

            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/appointment" className="btn-primary">
                Book appointment
              </Link>
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi ${brand}, I would like to book an appointment.`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
            >
              <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
                Send a message
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                We will reply by email or phone as soon as we can.
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="label" htmlFor="name">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="field"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="contact-email">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      className="field"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="contact-phone">
                      Phone (optional)
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      className="field"
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="message">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="field"
                    value={form.message}
                    onChange={handleChange}
                    required
                    minLength={10}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto"
                  disabled={sending}
                >
                  {sending ? "Sending…" : "Send enquiry"}
                </button>
              </div>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
            >
              <iframe
                title={`${brand} clinic location map`}
                src={mapEmbed}
                className="h-[220px] w-full border-0 sm:h-[280px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </motion.div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Contact;
