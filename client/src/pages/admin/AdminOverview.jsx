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

function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then(({ data }) => setStats(data.dashboard))
      .catch(() => toast.error("Could not load admin stats"))
      .finally(() => setLoading(false));
  }, []);

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
  ];

  const serviceStats = stats.serviceStats || [];

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-2xl font-semibold">Clinic overview</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Live counts across patients, doctors, and visits
        </p>
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
