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

function formatTimestamp(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [apps, docs] = await Promise.all([
        api.get("/admin/appointments"),
        api.get("/admin/doctors"),
      ]);
      setAppointments(apps.data.appointments || []);
      setDoctors(docs.data.doctors || []);
    } catch {
      toast.error("Could not load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const assignDoctor = async (appointmentId, doctorId) => {
    if (!doctorId) return;
    setBusyId(appointmentId);
    try {
      await api.put(`/admin/appointments/${appointmentId}/assign`, {
        doctorId: Number(doctorId),
      });
      toast.success("Doctor assigned");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Assign failed");
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (appointmentId, status) => {
    setBusyId(appointmentId);
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status });
      toast.success(`Marked as ${status}`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Status update failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Appointment requests</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        View incoming requests, confirm or decline, and mark as handled
      </p>

      <div className="mt-6 space-y-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No appointments yet.</p>
        ) : (
          appointments.map((item) => (
            <article
              key={item.id}
              className="border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      {item.patient?.name} → {item.doctor?.name || "Unassigned"}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {item.service?.title} · {formatDate(item.appointmentDate)} ·{" "}
                      {item.appointmentTime}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.patient?.email}
                      {item.patient?.phone ? ` · ${item.patient.phone}` : ""}
                    </p>
                    {item.currentProblem && (
                      <p className="mt-2 text-sm text-[var(--ink)]">
                        {item.currentProblem}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Received: {formatTimestamp(item.createdAt)}
                    </p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
                    {item.status}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <select
                    className="field !py-2 sm:max-w-[16rem]"
                    defaultValue=""
                    disabled={busyId === item.id}
                    onChange={(e) => assignDoctor(item.id, e.target.value)}
                  >
                    <option value="">Assign / change doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-primary !px-3 !py-2 text-sm"
                      disabled={busyId === item.id || item.status === "APPROVED"}
                      onClick={() => setStatus(item.id, "APPROVED")}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="btn-secondary !px-3 !py-2 text-sm"
                      disabled={busyId === item.id || item.status === "REJECTED"}
                      onClick={() => setStatus(item.id, "REJECTED")}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className="btn-secondary !px-3 !py-2 text-sm"
                      disabled={busyId === item.id || item.status === "COMPLETED"}
                      onClick={() => setStatus(item.id, "COMPLETED")}
                    >
                      Mark handled
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminAppointments;
