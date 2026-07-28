import { useEffect, useState } from "react";
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

  useEffect(() => {
    api
      .get("/admin/reviews")
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => toast.error("Could not load reviews"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Patient reviews</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        See which patient reviewed which doctor
      </p>

      <div className="mt-6 space-y-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No reviews yet.</p>
        ) : (
          reviews.map((item) => (
            <article
              key={item.id}
              className="border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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
                <p className="text-sm font-medium text-[var(--ink)]">
                  {item.appointment?.service?.title || "Visit"} · {item.rating}/5
                  · {formatDate(item.createdAt)}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.comment}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminReviews;
