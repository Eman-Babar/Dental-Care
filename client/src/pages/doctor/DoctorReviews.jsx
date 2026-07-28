import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";

function DoctorReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/doctor/reviews")
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => toast.error("Could not load reviews"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Patient reviews</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Feedback from patients after completed visits
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {reviews.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No reviews yet.</p>
        ) : (
          reviews.map((item) => (
            <article
              key={item.id}
              className="border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <p className="font-semibold">{item.patient?.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {item.appointment?.service?.title} · {item.rating}/5
              </p>
              <p className="mt-3 text-sm">{item.comment}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default DoctorReviews;
