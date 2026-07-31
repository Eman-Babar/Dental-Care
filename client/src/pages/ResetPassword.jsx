import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";
import PasswordInput from "../components/common/PasswordInput";
import { useSiteContent } from "../hooks/useSiteContent";

function ResetPassword() {
  const { get } = useSiteContent();
  const brand = get("home.brand", "DentalCare");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Missing reset token. Request a new link.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        token,
        password,
      });
      toast.success(data.message || "Password updated");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reset password");
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
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Choose a password of at least 6 characters.
        </p>

        {!token ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              This link is missing a token. Request a fresh reset email.
            </p>
            <Link to="/forgot-password" className="btn-primary inline-flex">
              Request reset link
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="password">
                New password
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="label" htmlFor="confirm">
                Confirm password
              </label>
              <PasswordInput
                id="confirm"
                name="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Saving…" : "Update password"}
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

export default ResetPassword;
