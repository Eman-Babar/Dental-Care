import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";
import PasswordInput from "../../components/common/PasswordInput";

const emptyDoctor = {
  name: "",
  email: "",
  password: "",
  phone: "",
  image: "",
  specialization: "",
  qualification: "",
  experience: "",
  bio: "",
  workingDays: "Mon-Sat",
  workingHours: "9:00 AM - 5:00 PM",
};

function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(emptyDoctor);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/doctors");
      setDoctors(data.doctors || []);
    } catch {
      toast.error("Could not load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startEdit = (doctor) => {
    setEditingId(doctor.id);
    setForm({
      name: doctor.name || "",
      email: doctor.email || "",
      password: "",
      phone: doctor.phone || "",
      image: doctor.image || "",
      specialization: doctor.doctorProfile?.specialization || "",
      qualification: doctor.doctorProfile?.qualification || "",
      experience: doctor.doctorProfile?.experience ?? "",
      bio: doctor.doctorProfile?.bio || "",
      workingDays: doctor.doctorProfile?.workingDays || "Mon-Sat",
      workingHours: doctor.doctorProfile?.workingHours || "9:00 AM - 5:00 PM",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyDoctor);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/doctors/${editingId}`, {
          name: form.name,
          phone: form.phone,
          image: form.image || undefined,
          specialization: form.specialization,
          qualification: form.qualification,
          experience: form.experience ? Number(form.experience) : undefined,
          bio: form.bio,
          workingDays: form.workingDays,
          workingHours: form.workingHours,
        });
        toast.success("Doctor updated");
      } else {
        await api.post("/admin/doctors", {
          ...form,
          experience: form.experience ? Number(form.experience) : undefined,
        });
        toast.success("Doctor created");
      }
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this doctor account?")) return;
    try {
      await api.delete(`/admin/doctors/${id}`);
      toast.success("Doctor deleted");
      if (editingId === id) cancelEdit();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-2xl font-semibold">Doctors</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Update bios, specialization, and profile images without code
        </p>
        <div className="mt-5 space-y-3">
          {doctors.map((doctor) => (
            <article
              key={doctor.id}
              className="flex flex-col gap-3 border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{doctor.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {doctor.doctorProfile?.specialization || "Dentist"} ·{" "}
                  {doctor.email}
                </p>
                {doctor.doctorProfile?.bio && (
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {doctor.doctorProfile.bio}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-2 text-sm"
                  onClick={() => startEdit(doctor)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-2 text-sm"
                  onClick={() => handleDelete(doctor.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl">
        <h2 className="font-display text-2xl font-semibold">
          {editingId ? "Edit doctor" : "Add doctor"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4 border border-[var(--line)] bg-[var(--surface)] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="field"
                required
              />
            </div>
            {!editingId && (
              <div>
                <label className="label">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="field"
                  required
                />
              </div>
            )}
          </div>
          {!editingId && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Password</label>
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="field"
                />
              </div>
            </div>
          )}
          {editingId && (
            <div>
              <label className="label">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="field"
              />
            </div>
          )}
          <div>
            <label className="label">Profile image URL</label>
            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              className="field"
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Specialization</label>
              <input
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                className="field"
                required
              />
            </div>
            <div>
              <label className="label">Experience (years)</label>
              <input
                name="experience"
                type="number"
                min="0"
                value={form.experience}
                onChange={handleChange}
                className="field"
              />
            </div>
          </div>
          <div>
            <label className="label">Qualification</label>
            <input
              name="qualification"
              value={form.qualification}
              onChange={handleChange}
              className="field"
            />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea
              name="bio"
              rows={3}
              value={form.bio}
              onChange={handleChange}
              className="field resize-none"
              placeholder="Short bio shown on the public doctors page"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create doctor"}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

export default AdminDoctors;
