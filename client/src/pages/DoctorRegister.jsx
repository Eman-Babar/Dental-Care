import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/common/PasswordInput";

const empty = {
  name: "",
  email: "",
  phone: "",
  password: "",
  specialization: "",
  qualification: "",
  experience: "",
  bio: "",
  workingDays: "Mon-Sat",
  workingHours: "9:00 AM - 5:00 PM",
};

function DoctorRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register-doctor", {
        ...form,
        experience: form.experience ? Number(form.experience) : undefined,
      });
      login(data.token, data.user);
      toast.success("Doctor account created — welcome to DentalCare");
      navigate("/doctor", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Doctor registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell clinic-pattern flex min-h-screen">
      <div className="relative hidden w-[42%] overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=1400&q=80"
          alt="Dentist at DentalCare clinic"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-deep)]/85 via-[var(--brand)]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <p className="font-display text-4xl font-semibold">DentalCare</p>
          <p className="mt-3 max-w-sm text-white/85">
            Join as a dentist — manage appointments, approve visits, and update
            your clinical profile.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg"
        >
          <p className="font-display text-3xl font-semibold text-[var(--brand-deep)] lg:hidden">
            DentalCare
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-[var(--ink)]">
            Doctor registration
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create your doctor account. You will go straight to the doctor dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="field"
                  placeholder="Dr. Your Name"
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
                  value={form.phone}
                  onChange={handleChange}
                  className="field"
                  placeholder="03XX-XXXXXXX"
                />
              </div>
            </div>

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
                className="field"
                placeholder="doctor@email.com"
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
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="specialization">
                  Specialization
                </label>
                <input
                  id="specialization"
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  className="field"
                  placeholder="Orthodontist, Surgeon..."
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="qualification">
                  Qualification
                </label>
                <input
                  id="qualification"
                  name="qualification"
                  value={form.qualification}
                  onChange={handleChange}
                  className="field"
                  placeholder="BDS, MDS..."
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="experience">
                  Experience (years)
                </label>
                <input
                  id="experience"
                  name="experience"
                  type="number"
                  min="0"
                  value={form.experience}
                  onChange={handleChange}
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="workingDays">
                  Working days
                </label>
                <input
                  id="workingDays"
                  name="workingDays"
                  value={form.workingDays}
                  onChange={handleChange}
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="workingHours">
                  Working hours
                </label>
                <input
                  id="workingHours"
                  name="workingHours"
                  value={form.workingHours}
                  onChange={handleChange}
                  className="field"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={form.bio}
                onChange={handleChange}
                className="field resize-none"
                placeholder="Short introduction for patients..."
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating doctor account..." : "Register as doctor"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-[var(--brand)]">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-[var(--muted)]">
            Registering as a patient?{" "}
            <Link to="/register" className="font-semibold text-[var(--brand)]">
              Patient signup
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default DoctorRegister;
