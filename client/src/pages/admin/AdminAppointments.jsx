import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";

const TABS = [
  { id: "pending", label: "Pending", statuses: ["PENDING"] },
  { id: "approved", label: "Approved", statuses: ["APPROVED"] },
  { id: "completed", label: "Completed", statuses: ["COMPLETED"] },
  { id: "rejected", label: "Rejected", statuses: ["REJECTED", "CANCELLED"] },
];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimestamp(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status) {
  const map = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-sky-100 text-sky-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-stone-200 text-stone-700",
  };
  return map[status] || "bg-[var(--mist)] text-[var(--muted)]";
}

function isApproved(item) {
  return ["APPROVED", "COMPLETED"].includes(item.status);
}

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

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

  const counts = useMemo(() => {
    const result = {};
    for (const tab of TABS) {
      result[tab.id] = appointments.filter((a) =>
        tab.statuses.includes(a.status)
      ).length;
    }
    return result;
  }, [appointments]);

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab);
    return appointments.filter((a) => tab.statuses.includes(a.status));
  }, [appointments, activeTab]);

  const assignDoctor = async (appointmentId, doctorId) => {
    if (!doctorId) return;
    setBusyId(appointmentId);
    try {
      await api.put(`/admin/appointments/${appointmentId}/assign`, {
        doctorId: Number(doctorId),
      });
      toast.success("Doctor assigned");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Assign failed");
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (appointmentId, status) => {
    setBusyId(appointmentId);
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status });
      const labels = {
        APPROVED: "Approved — confirmation email sent to patient",
        REJECTED: "Declined — patient notified by email",
        COMPLETED: "Marked as handled",
      };
      toast.success(labels[status] || `Marked as ${status}`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Status update failed");
    } finally {
      setBusyId(null);
    }
  };

  const showActions = activeTab === "pending" || activeTab === "approved";

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Appointments</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Pending, approved, completed, and rejected — patients receive email on
        confirm or decline
      </p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-[var(--line)] pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-[var(--brand)] text-white"
                : "bg-[var(--mist)] text-[var(--muted)] hover:text-[var(--brand-deep)]"
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-white text-[var(--brand-deep)]"
              }`}
            >
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto border border-[var(--line)] bg-[var(--surface)]">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--muted)]">
            No {activeTab} appointments.
          </p>
        ) : (
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--mist)]/60">
                <th className="px-4 py-3 font-semibold text-[var(--ink)]">Patient</th>
                <th className="px-4 py-3 font-semibold text-[var(--ink)]">Contact</th>
                <th className="px-4 py-3 font-semibold text-[var(--ink)]">Service</th>
                <th className="px-4 py-3 font-semibold text-[var(--ink)]">Doctor</th>
                <th className="px-4 py-3 font-semibold text-[var(--ink)]">Visit</th>
                <th className="px-4 py-3 font-semibold text-[var(--ink)]">Problem</th>
                <th className="px-4 py-3 font-semibold text-[var(--ink)]">Received</th>
                <th className="px-4 py-3 font-semibold text-[var(--ink)]">Approved</th>
                <th className="px-4 py-3 font-semibold text-[var(--ink)]">Status</th>
                {showActions && (
                  <th className="px-4 py-3 font-semibold text-[var(--ink)]">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--paper)]/80"
                >
                  <td className="px-4 py-3 font-medium text-[var(--ink)]">
                    {item.patient?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    <div>{item.patient?.email || "—"}</div>
                    {item.patient?.phone && (
                      <div className="text-xs">{item.patient.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink)]">
                    {item.service?.title || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink)]">
                    {item.doctor?.name || "Unassigned"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--muted)]">
                    {formatDate(item.appointmentDate)}
                    <br />
                    <span className="text-xs">{item.appointmentTime}</span>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-[var(--muted)]">
                    <span className="line-clamp-2">{item.currentProblem || "—"}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-[var(--muted)]">
                    {formatTimestamp(item.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {isApproved(item) ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <span aria-hidden>✓</span> Yes
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadge(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-4 py-3">
                      <div className="flex min-w-[220px] flex-col gap-2">
                        <select
                          className="field !py-1.5 !text-xs"
                          value={item.doctor?.id || ""}
                          disabled={busyId === item.id}
                          onChange={(e) =>
                            assignDoctor(item.id, e.target.value)
                          }
                        >
                          <option value="">Assign doctor</option>
                          {doctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                              {doctor.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex flex-wrap gap-1">
                          {activeTab === "pending" && (
                            <>
                              <button
                                type="button"
                                className="btn-primary !px-2 !py-1 text-xs"
                                disabled={busyId === item.id}
                                onClick={() => setStatus(item.id, "APPROVED")}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="btn-secondary !px-2 !py-1 text-xs"
                                disabled={busyId === item.id}
                                onClick={() => setStatus(item.id, "REJECTED")}
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {activeTab === "approved" && (
                            <button
                              type="button"
                              className="btn-secondary !px-2 !py-1 text-xs"
                              disabled={busyId === item.id}
                              onClick={() => setStatus(item.id, "COMPLETED")}
                            >
                              Mark handled
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminAppointments;
