import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";

const empty = {
  title: "",
  description: "",
  duration: "",
  price: "",
  image: "",
};

function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/services");
      setServices(data.services || []);
    } catch {
      toast.error("Could not load services");
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

  const startEdit = (service) => {
    setEditingId(service.id);
    setForm({
      title: service.title || "",
      description: service.description || "",
      duration: service.duration ?? "",
      price: service.price ?? "",
      image: service.image || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      duration: form.duration || undefined,
      price: form.price || undefined,
      image: form.image || undefined,
    };
    try {
      if (editingId) {
        await api.put(`/services/${editingId}`, payload);
        toast.success("Service updated");
      } else {
        await api.post("/services", payload);
        toast.success("Service added");
      }
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success("Service deleted");
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
        <h2 className="font-display text-2xl font-semibold">Services</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Edit titles and descriptions patients see on the site
        </p>
        <div className="mt-5 space-y-3">
          {services.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No services yet.</p>
          ) : (
            services.map((service) => (
              <article
                key={service.id}
                className="flex flex-col gap-3 border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{service.title}</p>
                  <p className="text-sm text-[var(--muted)]">{service.description}</p>
                  <p className="mt-1 text-xs text-[var(--brand)]">
                    {service.duration ? `${service.duration} min` : "Duration n/a"}
                    {" · "}
                    {service.price != null ? `Rs ${service.price}` : "Price n/a"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary !px-3 !py-2 text-sm"
                    onClick={() => startEdit(service)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-secondary !px-3 !py-2 text-sm"
                    onClick={() => handleDelete(service.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="mx-auto max-w-2xl">
        <h2 className="font-display text-2xl font-semibold">
          {editingId ? "Edit service" : "Add service"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4 border border-[var(--line)] bg-[var(--surface)] p-6"
        >
          <div>
            <label className="label">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="field"
              placeholder="e.g. Dental Cleaning"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="field resize-none"
              placeholder="What this treatment includes..."
              required
            />
          </div>
          <div>
            <label className="label">Image URL (optional)</label>
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
              <label className="label">Duration (minutes)</label>
              <input
                name="duration"
                type="number"
                min="1"
                value={form.duration}
                onChange={handleChange}
                className="field"
              />
            </div>
            <div>
              <label className="label">Price (Rs)</label>
              <input
                name="price"
                type="number"
                min="0"
                value={form.price}
                onChange={handleChange}
                className="field"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add service"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

export default AdminServices;
