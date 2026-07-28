import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";

function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/patients");
      setPatients(data.patients || []);
    } catch {
      toast.error("Could not load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this patient account?")) return;
    try {
      await api.delete(`/admin/patients/${id}`);
      toast.success("Patient deleted");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Patients</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        All registered patient accounts
      </p>
      <div className="mt-6 space-y-3">
        {patients.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No patients yet.</p>
        ) : (
          patients.map((patient) => (
            <article
              key={patient.id}
              className="flex flex-col gap-3 border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{patient.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {patient.email}
                  {patient.phone ? ` · ${patient.phone}` : ""}
                </p>
                <p className="mt-1 text-xs text-[var(--brand)]">
                  {patient._count?.patientAppointments || 0} appointments
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary !px-3 !py-2 text-sm"
                onClick={() => handleDelete(patient.id)}
              >
                Delete
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminPatients;
