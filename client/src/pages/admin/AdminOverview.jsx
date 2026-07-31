import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";

const STATUS = [
  { key: "pending", label: "Pending", color: "#b45309" },
  { key: "approved", label: "Approved", color: "#0f766e" },
  { key: "rejected", label: "Rejected", color: "#b91c1c" },
  { key: "completed", label: "Completed", color: "#0a6b6b" },
];

function ServiceChart({ data }) {
  const maxTotal = useMemo(
    () => Math.max(...data.map((item) => item.total || 0), 1),
    [data]
  );

  return (
    <div className="mt-8 space-y-5">
      {data.map((item) => (
        <div key={item.serviceId}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-[var(--ink)]">{item.service}</p>
            <p className="text-xs text-[var(--muted)]">{item.total} total</p>
          </div>
          <div className="flex h-8 w-full overflow-hidden rounded-md bg-[var(--mist)]">
            {STATUS.map((status) => {
              const value = item[status.key] || 0;
              if (!value) return null;
              const width = `${(value / maxTotal) * 100}%`;
              return (
                <div
                  key={status.key}
                  title={`${status.label}: ${value}`}
                  style={{ width, backgroundColor: status.color }}
                  className="flex items-center justify-center text-[10px] font-semibold text-white"
                >
                  {value > 0 ? value : ""}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-4 pt-2">
        {STATUS.map((status) => (
          <div key={status.key} className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: status.color }}
            />
            {status.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyTrendChart({ data }) {
  const maxVal = useMemo(
    () => Math.max(...data.map((d) => Math.max(d.created || 0, d.completed || 0)), 1),
    [data]
  );

  if (!data?.length) return null;

  return (
    <div className="mt-6">
      <div className="flex h-40 items-end gap-1.5 sm:gap-2">
        {data.map((day) => (
          <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-28 w-full items-end justify-center gap-0.5">
              <div
                title={`New: ${day.created}`}
                className="w-[45%] max-w-[14px] bg-[var(--brand)]"
                style={{ height: `${(day.created / maxVal) * 100}%`, minHeight: day.created ? 4 : 0 }}
              />
              <div
                title={`Completed: ${day.completed}`}
                className="w-[45%] max-w-[14px] bg-[var(--brand-deep)]"
                style={{
                  height: `${(day.completed / maxVal) * 100}%`,
                  minHeight: day.completed ? 4 : 0,
                }}
              />
            </div>
            <p className="truncate text-[10px] text-[var(--muted)]">{day.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 bg-[var(--brand)]" /> New requests
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 bg-[var(--brand-deep)]" /> Completed
        </span>
      </div>
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opsBusy, setOpsBusy] = useState(false);

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then(({ data }) => setStats(data.dashboard))
      .catch(() => toast.error("Could not load admin stats"))
      .finally(() => setLoading(false));
  }, []);

  const downloadBackup = async () => {
    setOpsBusy(true);
    try {
      const { data } = await api.get("/admin/backup", { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clinic-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Clinic backup downloaded");
    } catch {
      toast.error("Backup failed");
    } finally {
      setOpsBusy(false);
    }
  };

  const sendDigest = async () => {
    setOpsBusy(true);
    try {
      const { data } = await api.post("/admin/digest/send");
      toast.success(data.message || "Digest sent");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send digest");
    } finally {
      setOpsBusy(false);
    }
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setOpsBusy(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const { data } = await api.post("/admin/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        toast.success(`Uploaded — URL copied: ${data.url}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setOpsBusy(false);
    }
  };

  if (loading) return <Loader />;
  if (!stats) return null;

  const cards = [
    ["Patients", stats.totalPatients],
    ["Doctors", stats.totalDoctors],
    ["Appointments", stats.totalAppointments],
    ["Pending", stats.pendingAppointments],
    ["Approved", stats.approvedAppointments],
    ["Rejected", stats.rejectedAppointments || 0],
    ["Completed", stats.completedAppointments],
    [
      "Collected (Rs)",
      Math.round(stats.paymentStats?.totalCollected || 0).toLocaleString(),
    ],
  ];

  const payment = stats.paymentStats || {};
  const paymentCards = [
    ["Unpaid", payment.unpaid || 0],
    ["Deposit due", payment.depositDue || 0],
    ["Deposit paid", payment.depositPaid || 0],
    ["Fully paid", payment.paid || 0],
  ];

  const serviceStats = stats.serviceStats || [];
  const dailyTrend = stats.dailyTrend || [];

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Clinic overview</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Live counts across patients, doctors, visits, and payments
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={opsBusy}
              onClick={downloadBackup}
              className="border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink)] disabled:opacity-50"
            >
              Download backup
            </button>
            <button
              type="button"
              disabled={opsBusy}
              onClick={sendDigest}
              className="border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--ink)] disabled:opacity-50"
            >
              Send digest now
            </button>
            <label className="cursor-pointer border border-[var(--line)] bg-[var(--brand-deep)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
              Upload image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={opsBusy}
                onChange={uploadImage}
              />
            </label>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value]) => (
            <div
              key={label}
              className="border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <p className="text-sm text-[var(--muted)]">{label}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-[var(--ink)]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
        <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
          Last 14 days
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          New booking requests vs completed visits
        </p>
        <DailyTrendChart data={dailyTrend} />
      </section>

      <section>
        <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
          Payments
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Deposit and payment status across all appointments
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paymentCards.map(([label, value]) => (
            <div
              key={label}
              className="border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <p className="text-xs text-[var(--muted)]">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--brand-deep)]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
        <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
          Appointments by service
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pending, approved, rejected, and completed counts for each service
        </p>

        {serviceStats.length === 0 ? (
          <p className="mt-8 text-sm text-[var(--muted)]">
            No service appointment data yet.
          </p>
        ) : (
          <>
            <ServiceChart data={serviceStats} />

            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                    <th className="py-2 pr-3 font-medium">Service</th>
                    <th className="py-2 pr-3 font-medium">Total</th>
                    <th className="py-2 pr-3 font-medium">Pending</th>
                    <th className="py-2 pr-3 font-medium">Approved</th>
                    <th className="py-2 pr-3 font-medium">Rejected</th>
                    <th className="py-2 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceStats.map((item) => (
                    <tr
                      key={item.serviceId}
                      className="border-b border-[var(--line)] text-[var(--ink)]"
                    >
                      <td className="py-3 pr-3 font-medium">{item.service}</td>
                      <td className="py-3 pr-3">{item.total}</td>
                      <td className="py-3 pr-3">{item.pending}</td>
                      <td className="py-3 pr-3">{item.approved}</td>
                      <td className="py-3 pr-3">{item.rejected}</td>
                      <td className="py-3">{item.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default AdminOverview;
