import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { UserRound } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../utils/storage";
import PasswordInput from "../components/common/PasswordInput";
import { useSiteContent } from "../hooks/useSiteContent";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { get } = useSiteContent();
  const brand = get("home.brand", "DentalCare");
  const tagline = get(
    "brand.tagline",
    "Gentle dentistry for the whole family — clean smiles, calm visits, trusted care."
  );
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}`);
      navigate(dashboardPathForRole(data.user.role), { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell clinic-pattern flex min-h-screen">
      <div className="relative hidden w-[48%] overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1400&q=80"
          alt="Modern dental clinic treatment room"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-deep)]/85 via-[var(--brand)]/45 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <p className="font-display text-4xl font-semibold leading-tight">
            {brand}
          </p>
          <p className="mt-3 max-w-sm text-base text-white/85">{tagline}</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <p className="font-display text-3xl font-semibold text-[var(--brand-deep)] lg:hidden">
            {brand}
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-[var(--ink)] md:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Sign in to manage appointments and your dental records.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@email.com"
                className="field"
                required
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label !mb-0" htmlFor="password">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[var(--brand)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in to clinic"}
            </button>
          </form>

          <div className="mt-8 border-t border-[var(--line)] pt-6">
            <p className="text-center text-sm font-medium text-[var(--ink)]">
              New patient?
            </p>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="mt-4 flex w-full flex-col items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-4 text-center transition hover:border-[var(--brand)] hover:bg-[var(--mist)]"
            >
              <UserRound className="text-[var(--brand)]" size={22} />
              <span className="text-sm font-semibold text-[var(--ink)]">
                Create patient account
              </span>
              <span className="text-xs text-[var(--muted)]">
                Doctors are added by the clinic admin
              </span>
            </button>
          </div>

          <p className="mt-5 text-center text-sm">
            <Link
              to="/home"
              className="text-[var(--muted)] underline-offset-2 hover:underline"
            >
              Browse clinic without signing in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
