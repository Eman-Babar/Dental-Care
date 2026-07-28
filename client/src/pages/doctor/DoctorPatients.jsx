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

function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/doctor/patients")
      .then(({ data }) => setPatients(data.patients || []))
      .catch(() => toast.error("Could not load patients"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">My patients</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Patients who booked with you
      </p>
      <div className="mt-6 space-y-3">
        {patients.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No patients yet.</p>
        ) : (
          patients.map((patient) => (
            <article
              key={patient.id}
              className="border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <p className="font-semibold">{patient.name}</p>
              <p className="text-sm text-[var(--muted)]">
                {patient.email}
                {patient.phone ? ` · ${patient.phone}` : ""}
              </p>
              <p className="mt-2 text-xs text-[var(--brand)]">
                {patient.visits} visit(s) · Last: {formatDate(patient.lastVisit)} ·{" "}
                {patient.lastStatus}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default DoctorPatients;
