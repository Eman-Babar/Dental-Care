import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { isDentalProblem } from "../../utils/dentalProblem";
import { groupSlots } from "../../utils/doctorAvailability";
import { getDoctorServices } from "../../utils/doctorServices";
import { useSiteContent } from "../../hooks/useSiteContent";

const empty = {
  serviceId: "",
  doctorId: "",
  appointmentDate: "",
  appointmentTime: "",
  currentProblem: "",
  medicalHistory: "",
  notes: "",
};

function toLocalDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isPastDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  const [hours, minutes] = timeStr.split(":").map(Number);
  const dt = new Date(dateStr);
  dt.setHours(hours, minutes || 0, 0, 0);
  return dt.getTime() <= Date.now();
}

function PatientBook() {
  const navigate = useNavigate();
  const { get } = useSiteContent();
  const maintenanceOn = ["true", "1", "yes", "on"].includes(
    String(get("site.maintenance", "false")).trim().toLowerCase()
  );
  const maintenanceMsg = get(
    "site.maintenance_message",
    "Online booking is temporarily paused. Please contact the clinic."
  );
  const [allServices, setAllServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState("");

  const today = useMemo(() => toLocalDateInput(new Date()), []);
  const groupedSlots = useMemo(() => groupSlots(slots), [slots]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor.id) === String(form.doctorId)),
    [doctors, form.doctorId]
  );

  const availableServices = useMemo(
    () => getDoctorServices(allServices, selectedDoctor),
    [allServices, selectedDoctor]
  );

  useEffect(() => {
    Promise.all([api.get("/services"), api.get("/doctors")])
      .then(([svc, docs]) => {
        setAllServices(svc.data.services || []);
        setDoctors(docs.data.doctors || []);
      })
      .catch(() => toast.error("Could not load booking options"));
  }, []);

  useEffect(() => {
    if (!form.doctorId || !form.appointmentDate) {
      setSlots([]);
      setSlotsMessage("");
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsMessage("");

    api
      .get(`/doctors/${form.doctorId}/slots`, {
        params: { date: form.appointmentDate },
      })
      .then(({ data }) => {
        if (cancelled) return;
        setSlots(data.slots || []);
        setSlotsMessage(data.message || "");
      })
      .catch(() => {
        if (cancelled) return;
        setSlots([]);
        setSlotsMessage("Could not load available slots.");
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.doctorId, form.appointmentDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "doctorId") {
        next.serviceId = "";
        next.appointmentTime = "";
      }
      if (name === "appointmentDate") {
        next.appointmentTime = "";
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.appointmentTime) {
      toast.error("Please select a time slot");
      return;
    }

    if (!slots.includes(form.appointmentTime)) {
      toast.error("Please select one of the available time slots");
      return;
    }

    if (isPastDateTime(form.appointmentDate, form.appointmentTime)) {
      toast.error("You cannot book a past date or time");
      return;
    }

    const dentalCheck = isDentalProblem(form.currentProblem);
    if (!dentalCheck.ok) {
      toast.error(dentalCheck.message);
      return;
    }

    setLoading(true);
    try {
      await api.post("/appointments", {
        serviceId: Number(form.serviceId),
        doctorId: Number(form.doctorId),
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        currentProblem: form.currentProblem,
        medicalHistory: form.medicalHistory || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Appointment sent to doctor for review");
      navigate("/patient");
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const slotSections = [
    { key: "morning", title: "Morning" },
    { key: "afternoon", title: "Afternoon" },
    { key: "evening", title: "Evening" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
        Book a new visit
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Select a doctor first — services and time slots update based on that
        doctor&apos;s profile.
      </p>

      {maintenanceOn ? (
        <div className="mt-6 border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="font-semibold text-[var(--ink)]">Booking paused</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{maintenanceMsg}</p>
        </div>
      ) : (
      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4 sm:mt-8 sm:p-6"
      >
        <div>
          <label className="label" htmlFor="doctorId">
            Doctor
          </label>
          <select
            id="doctorId"
            name="doctorId"
            value={form.doctorId}
            onChange={handleChange}
            className="field"
            required
          >
            <option value="">Select doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
                {doctor.doctorProfile?.specialization
                  ? ` — ${doctor.doctorProfile.specialization}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="serviceId">
            Service
          </label>
          <select
            id="serviceId"
            name="serviceId"
            value={form.serviceId}
            onChange={handleChange}
            className="field"
            required
            disabled={!form.doctorId}
          >
            <option value="">
              {form.doctorId
                ? availableServices.length
                  ? "Select service"
                  : "This doctor has no services set yet"
                : "Select a doctor first"}
            </option>
            {availableServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
                {service.price != null ? ` — Rs ${service.price}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="appointmentDate">
              Date
            </label>
            <input
              id="appointmentDate"
              name="appointmentDate"
              type="date"
              min={today}
              value={form.appointmentDate}
              onChange={handleChange}
              className="field"
              required
              disabled={!form.doctorId || !form.serviceId}
            />
          </div>
          <div>
            <label className="label">Pick a time</label>
            <p className="mb-3 text-xs text-[var(--muted)]">
              {!form.doctorId || !form.appointmentDate
                ? "Select doctor and date to see available slots"
                : slotsLoading
                  ? "Loading available slots..."
                  : slots.length
                    ? "Available slots for your selected doctor and day"
                    : slotsMessage || "No slots available for this day"}
            </p>

            <div className="space-y-4">
              {slotSections.map((section) => {
                const sectionSlots = groupedSlots[section.key];
                if (!sectionSlots.length) return null;

                return (
                  <div key={section.key}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {section.title}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {sectionSlots.map((slot) => {
                        const isActive = form.appointmentTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                appointmentTime: slot,
                              }))
                            }
                            disabled={slotsLoading}
                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                              isActive
                                ? "border-[var(--brand)] bg-[var(--mist)] text-[var(--brand-deep)]"
                                : "border-[var(--line)] bg-white text-[var(--ink)]"
                            } ${slotsLoading ? "cursor-not-allowed opacity-45" : "hover:border-[var(--brand-soft)]"}`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <input
              type="hidden"
              name="appointmentTime"
              value={form.appointmentTime}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="currentProblem">
            Current problem
          </label>
          <textarea
            id="currentProblem"
            name="currentProblem"
            rows={3}
            value={form.currentProblem}
            onChange={handleChange}
            className="field resize-none"
            placeholder="Describe your dental concern (tooth pain, gum bleeding, cavity...)"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="medicalHistory">
            Medical history (optional)
          </label>
          <textarea
            id="medicalHistory"
            name="medicalHistory"
            rows={2}
            value={form.medicalHistory}
            onChange={handleChange}
            className="field resize-none"
            placeholder="Allergies, medications, past treatments..."
          />
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Notes (optional)
          </label>
          <input
            id="notes"
            name="notes"
            type="text"
            value={form.notes}
            onChange={handleChange}
            className="field"
            placeholder="Any extra note for the clinic"
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Submitting..." : "Submit for doctor review"}
        </button>
      </form>
      )}
    </div>
  );
}

export default PatientBook;
