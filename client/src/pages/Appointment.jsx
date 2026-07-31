import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Footer from "../components/layout/Footer";
import Seo from "../components/common/Seo";
import { isDentalProblem } from "../utils/dentalProblem";
import { useAuth } from "../context/AuthContext";
import PaymentInstructions from "../components/common/PaymentInstructions";
import { useSiteContent } from "../hooks/useSiteContent";

const empty = {
  name: "",
  email: "",
  phone: "",
  serviceId: "",
  doctorId: "",
  appointmentDate: "",
  appointmentTime: "",
  currentProblem: "",
  notes: "",
};

function toLocalDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function Appointment() {
  const { isAuthenticated, user } = useAuth();
  const { get } = useSiteContent();
  const maintenanceOn = ["true", "1", "yes", "on"].includes(
    String(get("site.maintenance", "false")).trim().toLowerCase()
  );
  const maintenanceMsg = get(
    "site.maintenance_message",
    "Online booking is temporarily paused. Please contact the clinic."
  );
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const today = useMemo(() => toLocalDateInput(new Date()), []);

  useEffect(() => {
    Promise.all([api.get("/services"), api.get("/doctors")])
      .then(([svc, docs]) => {
        setServices(svc.data.services || []);
        setDoctors(docs.data.doctors || []);
      })
      .catch(() => toast.error("Could not load booking options"));
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === "PATIENT" && user?.name) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isDentalProblem(form.currentProblem).ok) {
      toast.error(
        isDentalProblem(form.currentProblem).message ||
          "Please describe a dental-related concern."
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/appointments/public", {
        ...form,
        serviceId: Number(form.serviceId),
        doctorId: form.doctorId ? Number(form.doctorId) : undefined,
      });
      setDone(true);
      setForm(empty);
      toast.success("Request sent — the clinic will confirm soon.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <Seo
        title="Book appointment"
        description="Request a dental appointment online. DentalCare will confirm your visit by email or phone."
      />

      <section className="section-pad">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl md:text-5xl">
            Book your dental visit
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)] sm:text-base">
            No account required. Submit a request and our team will confirm it
            from the clinic dashboard.
          </p>

          {isAuthenticated && user?.role === "PATIENT" && (
            <p className="mt-4 text-sm text-[var(--brand-deep)]">
              Prefer your patient portal?{" "}
              <Link to="/patient/book" className="font-semibold underline">
                Book from dashboard
              </Link>
            </p>
          )}

          {done ? (
            <div className="mt-8 space-y-4">
              <div className="border border-[var(--line)] bg-[var(--surface)] p-6">
                <p className="font-display text-xl font-semibold text-[var(--ink)]">
                  Request received
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  We have your details. Staff will review and confirm. Check your
                  email — and if a deposit is due, use the payment instructions
                  below or your patient portal after you set a password.
                </p>
                <button
                  type="button"
                  className="btn-primary mt-6"
                  onClick={() => setDone(false)}
                >
                  Submit another request
                </button>
              </div>
              <PaymentInstructions />
            </div>
          ) : maintenanceOn ? (
            <div className="mt-8 border border-[var(--line)] bg-[var(--surface)] p-6">
              <p className="font-display text-xl font-semibold text-[var(--ink)]">
                Booking paused
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">{maintenanceMsg}</p>
              <Link to="/contact" className="btn-primary mt-6 inline-flex">
                Contact the clinic
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-4 border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="name">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="field"
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="phone">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    className="field"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="03XX XXXXXXX"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="field"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="serviceId">
                    Service
                  </label>
                  <select
                    id="serviceId"
                    name="serviceId"
                    className="field"
                    value={form.serviceId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="doctorId">
                    Preferred doctor (optional)
                  </label>
                  <select
                    id="doctorId"
                    name="doctorId"
                    className="field"
                    value={form.doctorId}
                    onChange={handleChange}
                  >
                    <option value="">Any available</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                        {d.doctorProfile?.specialization
                          ? ` — ${d.doctorProfile.specialization}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="appointmentDate">
                    Preferred date
                  </label>
                  <input
                    id="appointmentDate"
                    name="appointmentDate"
                    type="date"
                    className="field"
                    min={today}
                    value={form.appointmentDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="appointmentTime">
                    Preferred time
                  </label>
                  <input
                    id="appointmentTime"
                    name="appointmentTime"
                    type="time"
                    className="field"
                    value={form.appointmentTime}
                    onChange={handleChange}
                    required
                    step={1800}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="currentProblem">
                  Reason for visit
                </label>
                <textarea
                  id="currentProblem"
                  name="currentProblem"
                  className="field min-h-[100px]"
                  value={form.currentProblem}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Toothache, checkup, whitening consult"
                />
              </div>

              <div>
                <label className="label" htmlFor="notes">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className="field min-h-[72px]"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full sm:w-auto"
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send appointment request"}
              </button>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Appointment;
