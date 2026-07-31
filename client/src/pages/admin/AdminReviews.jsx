import { useEffect, useMemo, useState } from "react";
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

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("pending");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/reviews");
      setReviews(data.reviews || []);
    } catch {
      toast.error("Could not load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const pending = reviews.filter((r) => !r.isPublished).length;
    const published = reviews.filter((r) => r.isPublished).length;
    return { pending, published, all: reviews.length };
  }, [reviews]);

  const filtered = useMemo(() => {
    if (filter === "pending") return reviews.filter((r) => !r.isPublished);
    if (filter === "published") return reviews.filter((r) => r.isPublished);
    return reviews;
  }, [reviews, filter]);

  const setVisibility = async (id, isPublished) => {
    setBusyId(id);
    try {
      await api.put(`/admin/reviews/${id}/visibility`, { isPublished });
      toast.success(isPublished ? "Review published" : "Review hidden");
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
      <h2 className="font-display text-2xl font-semibold">Patient reviews</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Approve reviews before they appear on the public website
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { id: "pending", label: "Pending", count: counts.pending },
          { id: "published", label: "Published", count: counts.published },
          { id: "all", label: "All", count: counts.all },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              filter === tab.id
                ? "bg-[var(--brand)] text-white"
                : "bg-[var(--mist)] text-[var(--muted)]"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs opacity-80">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No reviews in this tab.</p>
        ) : (
          filtered.map((item) => (
            <article
              key={item.id}
              className="border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-[var(--muted)]">Reviewed by</p>
                  <p className="font-semibold text-[var(--ink)]">
                    {item.patient?.name}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {item.patient?.email}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-[var(--muted)]">About doctor</p>
                  <p className="font-semibold text-[var(--ink)]">
                    {item.doctor?.name}
                  </p>
                  <p className="text-sm text-[var(--brand)]">
                    {item.doctor?.doctorProfile?.specialization || "Dentist"}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-[var(--line)] pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {item.appointment?.service?.title || "Visit"} · {item.rating}
                    /5 · {formatDate(item.createdAt)}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.isPublished
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.isPublished ? "Published" : "Pending"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.comment}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {!item.isPublished ? (
                    <button
                      type="button"
                      className="btn-primary !px-3 !py-1.5 text-xs"
                      disabled={busyId === item.id}
                      onClick={() => setVisibility(item.id, true)}
                    >
                      Publish
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                      disabled={busyId === item.id}
                      onClick={() => setVisibility(item.id, false)}
                    >
                      Hide
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminReviews;
