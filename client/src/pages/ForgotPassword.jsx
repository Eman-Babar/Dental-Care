import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useSiteContent } from "../hooks/useSiteContent";

function ForgotPassword() {
  const { get } = useSiteContent();
  const brand = get("home.brand", "DentalCare");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success(data.message || "Check your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell clinic-pattern flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 shadow-sm"
      >
        <p className="font-display text-2xl font-semibold text-[var(--brand-deep)]">
          {brand}
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-[var(--ink)]">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Enter your account email and we will send a reset link if it is
          registered.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl bg-[var(--mist)] p-4 text-sm text-[var(--brand-deep)]">
            If that email is on file, a reset link is on its way. Check spam too.
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-[var(--brand)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
