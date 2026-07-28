import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
          Reason: {appointment.rejectionReason}
        </p>
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
          Pending review and approved visits
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No upcoming appointments.</p>
          ) : (
            upcoming.map((item) => (
              <AppointmentCard key={item.id} appointment={item} />
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
