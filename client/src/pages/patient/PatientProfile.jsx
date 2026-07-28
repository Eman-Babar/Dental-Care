import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/common/Loader";
import ChangePasswordForm from "../../components/common/ChangePasswordForm";

function PatientProfile() {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/patient/profile")
      .then(({ data }) => {
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
        });
      })
      .catch(() => toast.error("Could not load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/patient/profile", {
        name: form.name,
        phone: form.phone,
      });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
        My profile
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Keep your contact details up to date for appointment reminders.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 border border-[var(--line)] bg-[var(--surface)] p-6"
      >
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
            value={form.email}
            className="field bg-[var(--paper)]"
            disabled
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
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <ChangePasswordForm />
    </div>
  );
}

export default PatientProfile;
