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

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/doctors", {
        ...form,
        experience: form.experience ? Number(form.experience) : undefined,
      });
      toast.success("Doctor created");
      setForm(emptyDoctor);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this doctor account?")) return;
    try {
      await api.delete(`/admin/doctors/${id}`);
      toast.success("Doctor deleted");
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
              </div>
              <button
                type="button"
                className="btn-secondary !px-3 !py-2 text-sm"
                onClick={() => handleDelete(doctor.id)}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl">
        <h2 className="font-display text-2xl font-semibold">Add doctor</h2>
        <form
          onSubmit={handleCreate}
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
          </div>
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
              rows={2}
              value={form.bio}
              onChange={handleChange}
              className="field resize-none"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Creating..." : "Create doctor"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default AdminDoctors;
