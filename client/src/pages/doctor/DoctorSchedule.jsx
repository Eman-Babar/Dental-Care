import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";

function toLocalDateInput(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function DoctorSchedule() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(toLocalDateInput());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/doctor/leaves");
      setLeaves(data.leaves || []);
    } catch {
      toast.error("Could not load leave days");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addLeave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/doctor/leaves", { date, reason: reason.trim() || undefined });
      toast.success("Leave saved — booking blocked for this day");
      setReason("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save leave");
    } finally {
      setSaving(false);
    }
  };

  const removeLeave = async (id) => {
    try {
      await api.delete(`/doctor/leaves/${id}`);
      toast.success("Leave removed");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove leave");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="font-display text-2xl font-semibold">Schedule & leave</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Weekly hours and breaks are under My profile. Here you mark full days
          off so patients cannot book those dates.
        </p>
      </div>

      <form
        onSubmit={addLeave}
        className="space-y-3 border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5"
      >
        <h3 className="font-display text-lg font-semibold">Add leave day</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="leaveDate">
              Date
            </label>
            <input
              id="leaveDate"
              type="date"
              min={toLocalDateInput()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="leaveReason">
              Reason (optional)
            </label>
            <input
              id="leaveReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="field"
              placeholder="Conference, personal…"
            />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Block this day"}
        </button>
      </form>

      <section>
        <h3 className="font-display text-lg font-semibold">Upcoming leave</h3>
        <div className="mt-3 space-y-2">
          {leaves.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No leave days set.</p>
          ) : (
            leaves.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between gap-3 border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
              >
                <div>
                  <p className="font-medium">{leave.date}</p>
                  {leave.reason ? (
                    <p className="text-sm text-[var(--muted)]">{leave.reason}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-1.5 text-sm"
                  onClick={() => removeLeave(leave.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default DoctorSchedule;
