import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import PasswordInput from "./PasswordInput";

function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password changed");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-4 border border-[var(--line)] bg-[var(--surface)] p-6"
    >
      <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
        Change password
      </h3>
      <div>
        <label className="label" htmlFor="currentPassword">
          Current password
        </label>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          value={form.currentPassword}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="newPassword">
          New password
        </label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          minLength={6}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          minLength={6}
          required
        />
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}

export default ChangePasswordForm;
