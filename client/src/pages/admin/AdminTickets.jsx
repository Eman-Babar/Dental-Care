import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";

function toLocalDateInput(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function AdminTickets() {
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [date, setDate] = useState(toLocalDateInput());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patientName: "",
    phone: "",
    doctorId: "",
    serviceId: "",
    notes: "",
  });

  const loadMeta = async () => {
    try {
      const [docs, svcs] = await Promise.all([
        api.get("/admin/doctors"),
        api.get("/services"),
      ]);
      setDoctors(docs.data.doctors || docs.data || []);
      setServices(svcs.data.services || []);
    } catch {
      toast.error("Could not load doctors/services");
    }
  };

  const loadTickets = async (d = date) => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/tickets", { params: { date: d } });
      setTickets(data.tickets || []);
    } catch {
      toast.error("Could not load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadTickets(date);
  }, [date]);

  const doctorOptions = useMemo(() => {
    if (Array.isArray(doctors) && doctors[0]?.name) return doctors;
    return [];
  }, [doctors]);

  const issue = async (e) => {
    e.preventDefault();
    if (!form.patientName.trim()) {
      toast.error("Patient name required");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/admin/tickets", {
        patientName: form.patientName.trim(),
        phone: form.phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
        doctorId: form.doctorId ? Number(form.doctorId) : undefined,
        serviceId: form.serviceId ? Number(form.serviceId) : undefined,
        date,
      });
      toast.success(data.message || "Ticket issued");
      setForm({
        patientName: "",
        phone: "",
        doctorId: form.doctorId,
        serviceId: "",
        notes: "",
      });
      await loadTickets(date);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not issue ticket");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id, status) => {
    try {
      await api.put(`/admin/tickets/${id}/status`, { status });
      await loadTickets(date);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Walk-in tickets</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Reception issues tokens for same-day patients
          </p>
        </div>
        <div>
          <label className="label" htmlFor="ticketDate">
            Date
          </label>
          <input
            id="ticketDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field"
          />
        </div>
      </div>

      <form
        onSubmit={issue}
        className="grid gap-3 border border-[var(--line)] bg-[var(--surface)] p-4 sm:grid-cols-2 sm:p-5"
      >
        <div className="sm:col-span-2">
          <h3 className="font-display text-lg font-semibold">Issue ticket</h3>
        </div>
        <div>
          <label className="label">Patient name</label>
          <input
            className="field"
            value={form.patientName}
            onChange={(e) => setForm({ ...form, patientName: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="field"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Doctor</label>
          <select
            className="field"
            value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {doctorOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Service</label>
          <select
            className="field"
            value={form.serviceId}
            onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
          >
            <option value="">General</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <input
            className="field"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Issuing…" : "Issue token"}
          </button>
          <a
            href="/queue"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary ml-2 inline-flex"
          >
            Open display board
          </a>
        </div>
      </form>

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-2">
          {tickets.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No tickets for this date.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {t.tokenLabel} · {t.patientName}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {t.doctor?.name || "Unassigned"}
                    {t.service?.title ? ` · ${t.service.title}` : ""}
                    {" · "}
                    {t.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["WAITING", "CALLED", "IN_PROGRESS", "DONE", "CANCELLED"].map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        className="border border-[var(--line)] px-2 py-1 text-[11px] font-medium"
                        onClick={() => setStatus(t.id, s)}
                      >
                        {s}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminTickets;
