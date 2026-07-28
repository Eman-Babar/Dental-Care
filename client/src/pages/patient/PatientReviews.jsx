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

function PatientReviews() {
  const [reviews, setReviews] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    appointmentId: "",
    rating: "5",
    comment: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [mine, canReview] = await Promise.all([
        api.get("/patient/reviews"),
        api.get("/patient/reviews/eligible"),
      ]);
      setReviews(mine.data.reviews || []);
      setEligible(canReview.data.appointments || []);
    } catch {
      toast.error("Could not load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/patient/reviews", {
        appointmentId: Number(form.appointmentId),
        rating: Number(form.rating),
        comment: form.comment,
      });
      toast.success("Review submitted");
      setForm({ appointmentId: "", rating: "5", comment: "" });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit review");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-10">
      <section className="mx-auto max-w-2xl">
        <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
          Write a review
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Share feedback after a completed visit.
        </p>

        {eligible.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--muted)]">
            No completed visits waiting for a review.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 border border-[var(--line)] bg-[var(--surface)] p-6"
          >
            <div>
              <label className="label" htmlFor="appointmentId">
                Completed visit
              </label>
              <select
                id="appointmentId"
                name="appointmentId"
                value={form.appointmentId}
                onChange={(e) =>
                  setForm({ ...form, appointmentId: e.target.value })
                }
                className="field"
                required
              >
                <option value="">Select visit</option>
                {eligible.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.service?.title} with {item.doctor?.name} ·{" "}
                    {formatDate(item.appointmentDate)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="rating">
                Rating
              </label>
              <select
                id="rating"
                name="rating"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className="field"
                required
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="comment">
                Your review
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={4}
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                className="field resize-none"
                placeholder="How was your experience?"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Submitting..." : "Submit review"}
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
          My reviews
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {reviews.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No reviews yet.</p>
          ) : (
            reviews.map((item) => (
              <article
                key={item.id}
                className="border border-[var(--line)] bg-[var(--surface)] p-5"
              >
                <p className="font-semibold text-[var(--ink)]">
                  {item.doctor?.name}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.appointment?.service?.title} · {item.rating}/5
                </p>
                <p className="mt-3 text-sm text-[var(--ink)]">{item.comment}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default PatientReviews;
