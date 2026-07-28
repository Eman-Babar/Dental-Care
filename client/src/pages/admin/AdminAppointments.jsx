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

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);

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
    setAssigning(appointmentId);
    try {
      await api.put(`/admin/appointments/${appointmentId}/assign`, {
        doctorId: Number(doctorId),
      });
      toast.success("Doctor assigned");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Assign failed");
    } finally {
      setAssigning(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">All appointments</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Review clinic bookings and reassign doctors when needed
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
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold text-[var(--ink)]">
                    {item.patient?.name} → {item.doctor?.name || "Unassigned"}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {item.service?.title} · {formatDate(item.appointmentDate)} ·{" "}
                    {item.appointmentTime}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
                    {item.status}
                  </p>
                </div>
                <div className="flex w-full items-center gap-2 lg:w-auto lg:min-w-[16rem]">
                  <select
                    className="field !py-2"
                    defaultValue=""
                    disabled={assigning === item.id}
                    onChange={(e) => assignDoctor(item.id, e.target.value)}
                  >
                    <option value="">Assign / change doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
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
