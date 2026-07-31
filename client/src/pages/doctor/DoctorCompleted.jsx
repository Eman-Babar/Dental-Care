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

function DoctorCompleted() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/doctor/completed")
      .then(({ data }) => setAppointments(data.appointments || []))
      .catch(() => toast.error("Could not load completed visits"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Completed visits</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Past treatments you have finished
      </p>
      <div className="mt-6 space-y-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No completed visits yet.</p>
        ) : (
          appointments.map((item) => (
            <article
              key={item.id}
              className="border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <p className="font-semibold">{item.patient?.name}</p>
              <p className="text-sm text-[var(--muted)]">
                {item.service?.title} · {formatDate(item.appointmentDate)} ·{" "}
                {item.appointmentTime}
              </p>
              {item.notes ? (
                <p className="mt-2 text-sm text-[var(--ink)]">
                  <span className="text-[var(--muted)]">Notes: </span>
                  {item.notes}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default DoctorCompleted;
