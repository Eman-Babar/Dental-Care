import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";
import { groupSlots } from "../../utils/doctorAvailability";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toLocalDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function StatusBadge({ status }) {
  const colors = {
    PENDING: "text-[var(--warn)]",
    APPROVED: "text-[var(--ok)]",
    REJECTED: "text-[var(--danger)]",
    COMPLETED: "text-[var(--brand)]",
    CANCELLED: "text-[var(--muted)]",
  };

  return (
    <span
      className={`text-xs font-semibold uppercase tracking-wide ${
        colors[status] || "text-[var(--muted)]"
      }`}
    >
      {status}
    </span>
  );
}

function AppointmentCard({ appointment }) {
  return (
    <article className="border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
            {appointment.service?.title || "Dental service"}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {appointment.doctor?.name || "Doctor pending"}
            {appointment.doctor?.doctorProfile?.specialization
              ? ` · ${appointment.doctor.doctorProfile.specialization}`
              : ""}
          </p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      <p className="mt-4 text-sm text-[var(--ink)]">
        {formatDate(appointment.appointmentDate)} · {appointment.appointmentTime}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {appointment.currentProblem}
      </p>
      {appointment.rejectionReason && (
        <p className="mt-2 text-sm text-[var(--danger)]">
          Rejection reason: {appointment.rejectionReason}
        </p>
      )}
      {appointment.cancellationReason && (
        <p className="mt-2 text-sm text-[var(--danger)]">
          Cancellation reason: {appointment.cancellationReason}
        </p>
      )}
    </article>
  );
}

function UpcomingAppointmentCard({ appointment, onUpdated }) {
  const [mode, setMode] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const today = useMemo(() => toLocalDateInput(new Date()), []);
  const groupedSlots = useMemo(() => groupSlots(slots), [slots]);

  useEffect(() => {
    if (mode !== "reschedule" || !rescheduleDate || !appointment.doctor?.id) {
      setSlots([]);
      setSlotsMessage("");
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);

    api
      .get(`/doctors/${appointment.doctor.id}/slots`, {
        params: { date: rescheduleDate },
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
  }, [mode, rescheduleDate, appointment.doctor?.id]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }

    setBusy(true);
    try {
      await api.put(`/patient/appointments/${appointment.id}/cancel`, {
        cancellationReason: cancelReason.trim(),
      });
      toast.success("Appointment cancelled");
      setMode(null);
      setCancelReason("");
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancellation failed");
    } finally {
      setBusy(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Please select a new date and time");
      return;
    }

    setBusy(true);
    try {
      await api.put(`/patient/appointments/${appointment.id}/reschedule`, {
        appointmentDate: rescheduleDate,
        appointmentTime: rescheduleTime,
      });
      toast.success("Appointment rescheduled");
      setMode(null);
      setRescheduleDate("");
      setRescheduleTime("");
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reschedule failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
            {appointment.service?.title || "Dental service"}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {appointment.doctor?.name || "Doctor pending"}
            {appointment.doctor?.doctorProfile?.specialization
              ? ` · ${appointment.doctor.doctorProfile.specialization}`
              : ""}
          </p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      <p className="mt-4 text-sm text-[var(--ink)]">
        {formatDate(appointment.appointmentDate)} · {appointment.appointmentTime}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {appointment.currentProblem}
      </p>

      {!mode && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary !px-4 !py-2 text-sm"
            onClick={() => {
              setMode("reschedule");
              setRescheduleDate("");
              setRescheduleTime("");
            }}
          >
            Reschedule
          </button>
          <button
            type="button"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            onClick={() => {
              setMode("cancel");
              setCancelReason("");
            }}
          >
            Cancel appointment
          </button>
        </div>
      )}

      {mode === "cancel" && (
        <div className="mt-4 border-t border-[var(--line)] pt-4">
          <label className="label">Cancellation reason</label>
          <textarea
            rows={2}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="field resize-none"
            placeholder="Why do you want to cancel this appointment?"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="btn-primary !px-4 !py-2 text-sm"
              disabled={busy}
              onClick={handleCancel}
            >
              Confirm cancel
            </button>
            <button
              type="button"
              className="btn-secondary !px-4 !py-2 text-sm"
              onClick={() => setMode(null)}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="mt-4 space-y-4 border-t border-[var(--line)] pt-4">
          <div>
            <label className="label" htmlFor={`date-${appointment.id}`}>
              New date
            </label>
            <input
              id={`date-${appointment.id}`}
              type="date"
              min={today}
              value={rescheduleDate}
              onChange={(e) => {
                setRescheduleDate(e.target.value);
                setRescheduleTime("");
              }}
              className="field"
            />
          </div>

          {rescheduleDate && (
            <div>
              <label className="label">New time</label>
              <p className="mb-3 text-xs text-[var(--muted)]">
                {slotsLoading
                  ? "Loading available slots..."
                  : slots.length
                    ? "Choose a new slot with the same doctor"
                    : slotsMessage || "No slots available for this day"}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {["morning", "afternoon", "evening"].map((section) =>
                  groupSlots(slots)[section].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      disabled={slotsLoading}
                      onClick={() => setRescheduleTime(slot)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        rescheduleTime === slot
                          ? "border-[var(--brand)] bg-[var(--mist)] text-[var(--brand-deep)]"
                          : "border-[var(--line)] bg-white text-[var(--ink)]"
                      }`}
                    >
                      {slot}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary !px-4 !py-2 text-sm"
              disabled={busy}
              onClick={handleReschedule}
            >
              Confirm reschedule
            </button>
            <button
              type="button"
              className="btn-secondary !px-4 !py-2 text-sm"
              onClick={() => setMode(null)}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function PatientAppointments() {
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [up, hist] = await Promise.all([
        api.get("/patient/upcoming"),
        api.get("/patient/history"),
      ]);
      setUpcoming(up.data.appointments || []);
      setHistory(hist.data.appointments || []);
    } catch {
      toast.error("Could not load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
          Upcoming
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pending or approved visits — you can reschedule or cancel with a reason
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No upcoming appointments.</p>
          ) : (
            upcoming.map((item) => (
              <UpcomingAppointmentCard
                key={item.id}
                appointment={item}
                onUpdated={load}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
          Previous
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Completed, rejected, or cancelled visits
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {history.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No previous appointments yet.</p>
          ) : (
            history.map((item) => (
              <AppointmentCard key={item.id} appointment={item} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default PatientAppointments;
