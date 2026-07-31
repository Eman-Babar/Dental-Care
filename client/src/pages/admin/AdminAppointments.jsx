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

function paymentBadge(status) {
  const map = {
    UNPAID: "bg-stone-100 text-stone-700",
    DEPOSIT_DUE: "bg-amber-100 text-amber-800",
    DEPOSIT_PAID: "bg-sky-100 text-sky-800",
    PAID: "bg-emerald-100 text-emerald-800",
    WAIVED: "bg-violet-100 text-violet-800",
  };
  return map[status] || "bg-[var(--mist)] text-[var(--muted)]";
}

function AppointmentActions({
  item,
  doctors,
  busyId,
  activeTab,
  assignDoctor,
  setStatus,
  setPayment,
  sendReminder,
}) {
  return (
    <div className="flex flex-col gap-2">
      <select
        className="field !py-1.5 !text-xs"
        value={item.doctor?.id || ""}
        disabled={busyId === item.id}
        onChange={(e) => assignDoctor(item.id, e.target.value)}
      >
        <option value="">Assign doctor</option>
        {doctors.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.name}
          </option>
        ))}
      </select>
      <select
        className="field !py-1.5 !text-xs"
        value={item.paymentStatus || "UNPAID"}
        disabled={busyId === item.id}
        onChange={(e) => setPayment(item.id, e.target.value)}
      >
        <option value="UNPAID">Pay: Unpaid</option>
        <option value="DEPOSIT_DUE">Pay: Deposit due</option>
        <option value="DEPOSIT_PAID">Pay: Deposit paid</option>
        <option value="PAID">Pay: Fully paid</option>
        <option value="WAIVED">Pay: Waived</option>
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
        {(activeTab === "pending" || activeTab === "approved") && (
          <button
            type="button"
            className="btn-secondary !px-2 !py-1 text-xs"
            disabled={busyId === item.id}
            onClick={() => sendReminder(item.id)}
          >
            Remind
          </button>
        )}
      </div>
    </div>
  );
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

  const setPayment = async (appointmentId, paymentStatus) => {
    setBusyId(appointmentId);
    try {
      await api.put(`/appointments/${appointmentId}/payment`, { paymentStatus });
      toast.success("Payment status updated");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment update failed");
    } finally {
      setBusyId(null);
    }
  };

  const sendReminder = async (appointmentId) => {
    setBusyId(appointmentId);
    try {
      const { data } = await api.post(`/appointments/${appointmentId}/remind`);
      toast.success(data.message || "Reminder sent");
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      await load();
    } catch (err) {
      const wa = err.response?.data?.whatsappUrl;
      toast.error(err.response?.data?.message || "Reminder failed");
      if (wa) window.open(wa, "_blank", "noopener,noreferrer");
    } finally {
      setBusyId(null);
    }
  };

  const showActions = activeTab === "pending" || activeTab === "approved";

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Appointments</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Pending, approved, completed, and rejected — patients receive email on
            confirm or decline
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary !px-4 !py-2 text-sm"
          onClick={async () => {
            try {
              const { data } = await api.get("/admin/appointments/export", {
                responseType: "blob",
              });
              const url = window.URL.createObjectURL(new Blob([data]));
              const a = document.createElement("a");
              a.href = url;
              a.download = `appointments-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              toast.success("CSV downloaded");
            } catch {
              toast.error("Could not export CSV");
            }
          }}
        >
          Export CSV
        </button>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-[var(--line)] pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
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

      {filtered.length === 0 ? (
        <p className="mt-4 border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
          No {activeTab} appointments.
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="mt-4 space-y-3 md:hidden">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      {item.patient?.name || "—"}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {item.patient?.email}
                    </p>
                    {item.patient?.phone && (
                      <p className="text-xs text-[var(--muted)]">
                        {item.patient.phone}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusBadge(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-[var(--muted)]">Service</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      {item.service?.title || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Doctor</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      {item.doctor?.name || "Unassigned"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Visit</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      {formatDate(item.appointmentDate)} · {item.appointmentTime}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Payment</dt>
                    <dd>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${paymentBadge(item.paymentStatus)}`}
                      >
                        {(item.paymentStatus || "UNPAID").replace(/_/g, " ")}
                      </span>
                      {item.depositAmount != null && (
                        <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                          Deposit Rs {item.depositAmount}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Approved</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      {isApproved(item) ? "Yes" : "No"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">
                  {item.currentProblem || "—"}
                </p>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  Received {formatTimestamp(item.createdAt)}
                </p>
                {showActions && (
                  <div className="mt-3 border-t border-[var(--line)] pt-3">
                    <AppointmentActions
                      item={item}
                      doctors={doctors}
                      busyId={busyId}
                      activeTab={activeTab}
                      assignDoctor={assignDoctor}
                      setStatus={setStatus}
                      setPayment={setPayment}
                      sendReminder={sendReminder}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto border border-[var(--line)] bg-[var(--surface)] md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
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
                  <th className="px-4 py-3 font-semibold text-[var(--ink)]">Payment</th>
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
                      <span className="line-clamp-2">
                        {item.currentProblem || "—"}
                      </span>
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
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${paymentBadge(item.paymentStatus)}`}
                      >
                        {(item.paymentStatus || "UNPAID").replace(/_/g, " ")}
                      </span>
                      {item.depositAmount != null && (
                        <div className="mt-1 text-[10px] text-[var(--muted)]">
                          Dep Rs {item.depositAmount}
                          {item.amountPaid > 0 ? ` · paid ${item.amountPaid}` : ""}
                        </div>
                      )}
                      {item.paymentClaimedAt &&
                        !["DEPOSIT_PAID", "PAID"].includes(
                          item.paymentStatus || ""
                        ) && (
                          <div className="mt-1 text-[10px] font-semibold text-amber-700">
                            Patient claimed payment — verify
                          </div>
                        )}
                      {item.reminderSentAt && (
                        <div className="mt-1 text-[10px] text-[var(--ok)]">Reminded</div>
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
                        <div className="min-w-[200px]">
                          <AppointmentActions
                            item={item}
                            doctors={doctors}
                            busyId={busyId}
                            activeTab={activeTab}
                            assignDoctor={assignDoctor}
                            setStatus={setStatus}
                            setPayment={setPayment}
                            sendReminder={sendReminder}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminAppointments;
