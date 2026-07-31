import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/common/PasswordInput";
import { useSiteContent } from "../hooks/useSiteContent";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { get } = useSiteContent();
  const brand = get("home.brand", "DentalCare");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", formData);
      login(data.token, data.user);
      toast.success(`Account created — welcome to ${brand}`);
      navigate("/patient", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell clinic-pattern flex min-h-screen">
      <div className="relative hidden w-[48%] overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1400&q=80"
          alt="Dental care consultation"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-deep)]/85 via-[var(--brand)]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <p className="font-display text-4xl font-semibold">{brand}</p>
          <p className="mt-3 max-w-sm text-white/85">
            Join our patient community and book visits in a few taps.
          </p>
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
            Patient registration
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Create a patient account — you will go straight to your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="field"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@email.com"
                className="field"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="03XX-XXXXXXX"
                className="field"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating account..." : `Join ${brand}`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[var(--brand)]">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-[var(--muted)]">
            Clinic staff accounts are created by the admin only.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;
