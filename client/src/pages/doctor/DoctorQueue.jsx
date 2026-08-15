import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";

const ACTIONS = [
  { status: "CALLED", label: "Call" },
  { status: "IN_PROGRESS", label: "Start" },
  { status: "DONE", label: "Done" },
  { status: "SKIPPED", label: "Skip" },
];

function statusColor(status) {
  switch (status) {
    case "WAITING":
      return "text-amber-700";
    case "CALLED":
      return "text-sky-700";
    case "IN_PROGRESS":
      return "text-[var(--brand-deep)]";
    case "DONE":
      return "text-emerald-700";
    case "SKIPPED":
      return "text-[var(--muted)]";
    default:
      return "text-[var(--ink)]";
  }
}

function DoctorQueue() {
  const [tickets, setTickets] = useState([]);
  const [waiting, setWaiting] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toastOnFail = useRef(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/doctor/queue", { timeout: 90000 });
      setTickets(data.tickets || []);
      setWaiting(data.waiting || 0);
      setError("");
      toastOnFail.current = false;
    } catch (err) {
      const msg =
        err.code === "ECONNABORTED"
          ? "Server is slow to respond. Please try again."
          : err.response?.data?.message ||
            (err.message?.includes("Network")
              ? "Cannot reach API. Make sure the server is running on port 5000."
              : "Could not load queue");
      setError(msg);
      if (toastOnFail.current) {
        toast.error(msg);
        toastOnFail.current = false;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const callNext = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/doctor/queue/next");
      toast.success(data.message || "Next patient called");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "No waiting tickets");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id, status) => {
    setBusy(true);
    try {
      await api.put(`/doctor/queue/${id}/status`, { status });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Today&apos;s queue</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Walk-in tickets for you (and unassigned) · {waiting} waiting
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary !px-4 !py-2 text-sm"
            disabled={busy}
            onClick={() => {
              toastOnFail.current = true;
              setLoading(true);
              load();
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || waiting === 0}
            onClick={callNext}
          >
            Call next
          </button>
        </div>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {tickets.length === 0 && !error ? (
          <p className="text-sm text-[var(--muted)]">
            No tickets in your queue today. Reception can issue tickets from Admin
            → Tickets (assign you as doctor).
          </p>
        ) : (
          tickets.map((t) => (
            <article
              key={t.id}
              className="border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold">
                    {t.tokenLabel}
                  </p>
                  <p className="font-medium">{t.patientName}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {t.service?.title || "General"}
                    {t.phone ? ` · ${t.phone}` : ""}
                    {!t.doctorId ? " · Unassigned" : ""}
                  </p>
                  <p className={`mt-1 text-sm font-semibold ${statusColor(t.status)}`}>
                    {String(t.status || "").replace("_", " ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ACTIONS.map((a) => (
                    <button
                      key={a.status}
                      type="button"
                      disabled={busy || t.status === a.status || t.status === "DONE"}
                      onClick={() => setStatus(t.id, a.status)}
                      className="border border-[var(--line)] px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <p className="text-xs text-[var(--muted)]">
        Public display board:{" "}
        <a className="underline" href="/queue" target="_blank" rel="noreferrer">
          /queue
        </a>
      </p>
    </div>
  );
}

export default DoctorQueue;
