import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Loader from "../../components/common/Loader";
import { invalidateSiteContentCache } from "../../hooks/useSiteContent";

function AdminContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/content/admin");
      setItems(data.items || []);
    } catch {
      toast.error("Could not load site content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (key, value) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, value } : item))
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/content/admin/bulk", {
        items: items.map(({ key, value, label }) => ({ key, value, label })),
      });
      invalidateSiteContentCache();
      toast.success("Site content saved");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  const groups = items.reduce((acc, item) => {
    const g = item.group || "general";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Site content</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Edit page headings, text, and image URLs without touching code
      </p>

      <form onSubmit={handleSave} className="mt-6 space-y-8">
        {Object.entries(groups).map(([group, groupItems]) => (
          <section key={group}>
            <h3 className="font-display text-lg font-semibold capitalize text-[var(--brand-deep)]">
              {group}
            </h3>
            <div className="mt-3 space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4">
              {groupItems.map((item) => (
                <div key={item.key}>
                  <label className="label" htmlFor={item.key}>
                    {item.label}
                  </label>
                  {item.value?.length > 120 || item.key.includes("body") ? (
                    <textarea
                      id={item.key}
                      className="field min-h-[100px]"
                      value={item.value}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                    />
                  ) : (
                    <input
                      id={item.key}
                      className="field"
                      value={item.value}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                    />
                  )}
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.key}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save all changes"}
        </button>
      </form>
    </div>
  );
}

export default AdminContent;
