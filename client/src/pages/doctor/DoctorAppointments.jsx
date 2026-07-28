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

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [list, dash] = await Promise.all([
        api.get("/doctor/appointments"),
        api.get("/doctor/dashboard"),
      ]);
      setAppointments(list.data.appointments || []);
      setStats(dash.data);
    } catch {
      toast.error("Could not load doctor appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    setBusyId(id);
    try {
      await api.put(`/doctor/appointments/${id}/approve`);
      toast.success("Appointment approved");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approve failed");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    if (!reason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setBusyId(id);
    try {
      await api.put(`/doctor/appointments/${id}/reject`, {
        rejectionReason: reason,
      });
      toast.success("Appointment rejected");
      setRejectId(null);
      setReason("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reject failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader />;

  const pending = appointments.filter((a) => a.status === "PENDING");
  const others = appointments.filter((a) => a.status !== "PENDING");

  return (
    <div className="space-y-8">
      {stats && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Pending", stats.pending],
            ["Approved", stats.approved],
            ["Completed", stats.completed],
            ["Today", stats.todayAppointments],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <p className="text-xs text-[var(--muted)]">{label}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="font-display text-2xl font-semibold">Review requests</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Approve or reject patient appointment forms
        </p>
        <div className="mt-5 space-y-4">
          {pending.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No pending requests.</p>
          ) : (
            pending.map((item) => (
              <article
                key={item.id}
                className="border border-[var(--line)] bg-[var(--surface)] p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold">
                      {item.patient?.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.service?.title} · {formatDate(item.appointmentDate)} ·{" "}
                      {item.appointmentTime}
                    </p>
                    <p className="mt-3 text-sm text-[var(--ink)]">
                      {item.currentProblem}
                    </p>
                    {item.medicalHistory && (
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        History: {item.medicalHistory}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      className="btn-primary !px-4 !py-2 text-sm"
                      disabled={busyId === item.id}
                      onClick={() => approve(item.id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn-secondary !px-4 !py-2 text-sm"
                      onClick={() => {
                        setRejectId(item.id);
                        setReason("");
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {rejectId === item.id && (
                  <div className="mt-4 border-t border-[var(--line)] pt-4">
                    <label className="label" htmlFor={`reason-${item.id}`}>
                      Rejection reason
                    </label>
                    <textarea
                      id={`reason-${item.id}`}
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="field resize-none"
                      placeholder="Why is this appointment rejected?"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="btn-primary !px-4 !py-2 text-sm"
                        disabled={busyId === item.id}
                        onClick={() => reject(item.id)}
                      >
                        Confirm reject
                      </button>
                      <button
                        type="button"
                        className="btn-secondary !px-4 !py-2 text-sm"
                        onClick={() => setRejectId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">All my appointments</h2>
        <div className="mt-5 space-y-3">
          {others.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No other appointments yet.</p>
          ) : (
            others.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-2 border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{item.patient?.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {item.service?.title} · {formatDate(item.appointmentDate)} ·{" "}
                    {item.appointmentTime}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
                  {item.status}
                </span>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default DoctorAppointments;
