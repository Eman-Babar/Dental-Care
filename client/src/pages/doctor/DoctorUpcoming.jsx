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

function DoctorUpcoming() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/doctor/upcoming");
      setAppointments(data.appointments || []);
    } catch {
      toast.error("Could not load upcoming visits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const complete = async (id) => {
    setBusyId(id);
    try {
      await api.put(`/doctor/appointments/${id}/complete`, {
        notes: noteDrafts[id] || "",
      });
      toast.success("Marked as completed");
      setNoteDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Upcoming visits</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Approved appointments — add optional visit notes, then mark complete
      </p>
      <div className="mt-6 space-y-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No upcoming appointments.</p>
        ) : (
          appointments.map((item) => (
            <article
              key={item.id}
              className="border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{item.patient?.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {item.service?.title} · {formatDate(item.appointmentDate)} ·{" "}
                    {item.appointmentTime}
                  </p>
                  <p className="mt-1 text-sm">{item.currentProblem}</p>
                </div>
                <button
                  type="button"
                  className="btn-primary shrink-0 !px-4 !py-2 text-sm"
                  disabled={busyId === item.id}
                  onClick={() => complete(item.id)}
                >
                  Mark completed
                </button>
              </div>
              <label className="mt-3 block text-xs font-medium text-[var(--muted)]">
                Visit notes (optional)
                <textarea
                  className="mt-1 w-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
                  rows={2}
                  value={noteDrafts[item.id] || ""}
                  onChange={(e) =>
                    setNoteDrafts((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
                  placeholder="Treatment notes for clinic record…"
                />
              </label>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default DoctorUpcoming;
