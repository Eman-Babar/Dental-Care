import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/audit-logs")
      .then(({ data }) => setLogs(data.logs || []))
      .catch(() => toast.error("Could not load audit logs"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Audit logs</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Track important actions across the clinic system
      </p>

      <div className="mt-6 space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No audit logs yet.</p>
        ) : (
          logs.map((log) => (
            <article
              key={log.id}
              className="border border-[var(--line)] bg-[var(--surface)] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-[var(--ink)]">{log.action}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {log.details || "No details"}
                  </p>
                  <p className="mt-2 text-xs text-[var(--brand)]">
                    {log.entity || "System"}
                    {log.entityId ? ` #${log.entityId}` : ""}
                    {log.actorRole ? ` · by ${log.actorRole}` : ""}
                    {log.actorEmail ? ` (${log.actorEmail})` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-[var(--muted)]">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminAuditLogs;
