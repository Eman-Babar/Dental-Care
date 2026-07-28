import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";

function DoctorOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/doctor/dashboard")
      .then(({ data }) => setStats(data))
      .catch(() => toast.error("Could not load overview"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!stats) return null;

  const cards = [
    ["Pending requests", stats.pending, "/doctor/requests"],
    ["Upcoming approved", stats.approved, "/doctor/upcoming"],
    ["Completed", stats.completed, "/doctor/completed"],
    ["Today", stats.todayAppointments, "/doctor/upcoming"],
  ];

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Overview</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Quick view of your clinic workload
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, to]) => (
          <Link
            key={label}
            to={to}
            className="border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-[var(--brand)]"
          >
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DoctorOverview;
