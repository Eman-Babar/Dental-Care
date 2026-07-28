import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/common/Loader";
import ChangePasswordForm from "../../components/common/ChangePasswordForm";
import {
  DAY_KEYS,
  DAY_LABELS,
  DEFAULT_AVAILABILITY,
  normalizeAvailability,
} from "../../utils/doctorAvailability";

function DoctorProfile() {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience: "",
    bio: "",
  });
  const [availability, setAvailability] = useState({ ...DEFAULT_AVAILABILITY });
  const [allServices, setAllServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [customServices, setCustomServices] = useState([]);
  const [customForm, setCustomForm] = useState({
    title: "",
    description: "",
    duration: "",
    price: "",
  });
  const [addingService, setAddingService] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/doctor/profile"), api.get("/services")])
      .then(([profileRes, servicesRes]) => {
        const data = profileRes.data;
        const profile = data.doctorProfile || {};
        setForm({
          name: data.user?.name || "",
          email: data.user?.email || "",
          phone: data.user?.phone || "",
          specialization: profile.specialization || "",
          qualification: profile.qualification || "",
          experience: profile.experience?.toString() || "",
          bio: profile.bio || "",
        });
        setAvailability(normalizeAvailability(profile.availability));
        setSelectedServiceIds(
          (profile.services || [])
            .filter((service) => service.isGlobal !== false)
            .map((service) => service.id)
        );
        setCustomServices(
          (profile.services || []).filter((service) => service.isGlobal === false)
        );
        setAllServices(servicesRes.data.services || []);
        setCurrentImage(data.user?.image || "");
      })
      .catch(() => toast.error("Could not load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDayToggle = (dayKey) => {
    setAvailability((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled,
      },
    }));
  };

  const handleDayTimeChange = (dayKey, field, value) => {
    setAvailability((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleCustomFormChange = (e) => {
    setCustomForm({ ...customForm, [e.target.name]: e.target.value });
  };

  const handleAddCustomService = async (e) => {
    e.preventDefault();
    if (!customForm.title.trim() || !customForm.description.trim()) {
      toast.error("Service name and description are required");
      return;
    }

    setAddingService(true);
    try {
      const { data } = await api.post("/doctor/services", {
        title: customForm.title.trim(),
        description: customForm.description.trim(),
        duration: customForm.duration || undefined,
        price: customForm.price || undefined,
      });
      setCustomServices((prev) => [...prev, data.service]);
      setCustomForm({ title: "", description: "", duration: "", price: "" });
      toast.success("Custom service added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add service");
    } finally {
      setAddingService(false);
    }
  };

  const handleRemoveCustomService = async (serviceId) => {
    try {
      await api.delete(`/doctor/services/${serviceId}`);
      setCustomServices((prev) => prev.filter((service) => service.id !== serviceId));
      toast.success("Custom service removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove service");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("phone", form.phone);
      payload.append("specialization", form.specialization);
      payload.append("qualification", form.qualification);
      payload.append("experience", form.experience);
      payload.append("bio", form.bio);
      payload.append("availability", JSON.stringify(availability));
      payload.append("serviceIds", JSON.stringify(selectedServiceIds));
      if (imageFile) payload.append("image", imageFile);

      await api.put("/doctor/profile", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshUser();
      toast.success("Profile updated");
      setImageFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-2xl font-semibold">Doctor profile</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Set your weekly availability — patients only see time slots for the
        days and hours you choose.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 border border-[var(--line)] bg-[var(--surface)] p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              Name
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
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            value={form.email}
            className="field bg-[var(--paper)]"
            disabled
          />
        </div>

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
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="image">
            Profile picture
          </label>
          {currentImage && !imageFile && (
            <p className="mb-2 text-xs text-[var(--muted)]">
              Current image uploaded.
            </p>
          )}
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="field !py-2"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Upload a clear photo. If not uploaded, a default male/female avatar
            will be shown on public pages.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
            />
          </div>
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
        </div>

        <div>
          <label className="label">Clinic services</label>
          <p className="mb-3 text-xs text-[var(--muted)]">
            Select from clinic-wide services, or add your own custom services
            below.
          </p>
          <div className="space-y-2">
            {allServices.length ? (
              allServices.map((service) => (
                <label
                  key={service.id}
                  className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-white px-3 py-3"
                >
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="mt-1 h-4 w-4 accent-[var(--brand)]"
                  />
                  <span>
                    <span className="block text-sm font-medium">{service.title}</span>
                    {service.price != null && (
                      <span className="text-xs text-[var(--muted)]">
                        Rs {service.price}
                        {service.duration ? ` · ${service.duration} min` : ""}
                      </span>
                    )}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">
                No clinic services found yet.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="label">Your custom services</label>
          <p className="mb-3 text-xs text-[var(--muted)]">
            Add treatments that are not in the clinic list. Only your patients
            will see these when booking with you.
          </p>

          {customServices.length > 0 && (
            <div className="mb-4 space-y-2">
              {customServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-white px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{service.title}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {service.description}
                    </p>
                    {(service.price != null || service.duration) && (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {service.price != null ? `Rs ${service.price}` : ""}
                        {service.price != null && service.duration ? " · " : ""}
                        {service.duration ? `${service.duration} min` : ""}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomService(service.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-4">
            <div>
              <label className="label" htmlFor="customTitle">
                Service name
              </label>
              <input
                id="customTitle"
                name="title"
                value={customForm.title}
                onChange={handleCustomFormChange}
                className="field"
                placeholder="e.g. Pediatric dental care"
              />
            </div>
            <div>
              <label className="label" htmlFor="customDescription">
                Description
              </label>
              <textarea
                id="customDescription"
                name="description"
                rows={2}
                value={customForm.description}
                onChange={handleCustomFormChange}
                className="field resize-none"
                placeholder="Brief description for patients"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="customDuration">
                  Duration (minutes)
                </label>
                <input
                  id="customDuration"
                  name="duration"
                  type="number"
                  min="0"
                  value={customForm.duration}
                  onChange={handleCustomFormChange}
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="customPrice">
                  Price (Rs)
                </label>
                <input
                  id="customPrice"
                  name="price"
                  type="number"
                  min="0"
                  value={customForm.price}
                  onChange={handleCustomFormChange}
                  className="field"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddCustomService}
              className="btn-secondary w-full sm:w-auto"
              disabled={addingService}
            >
              {addingService ? "Adding..." : "Add custom service"}
            </button>
          </div>
        </div>

        <div>
          <label className="label">Weekly availability</label>
          <p className="mb-3 text-xs text-[var(--muted)]">
            Check the days you are available and set start/end time for each
            day. Patients will only see slots within these hours.
          </p>
          <div className="space-y-2">
            {DAY_KEYS.map((dayKey) => {
              const day = availability[dayKey];
              return (
                <div
                  key={dayKey}
                  className="grid grid-cols-[auto_1fr_1fr] items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-3 py-2 sm:grid-cols-[auto_120px_1fr_1fr]"
                >
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={() => handleDayToggle(dayKey)}
                      className="h-4 w-4 accent-[var(--brand)]"
                    />
                    <span className="min-w-[72px]">{DAY_LABELS[dayKey]}</span>
                  </label>
                  <span className="hidden text-xs text-[var(--muted)] sm:block">
                    {day.enabled ? "Available" : "Off"}
                  </span>
                  <input
                    type="time"
                    value={day.start}
                    disabled={!day.enabled}
                    onChange={(e) =>
                      handleDayTimeChange(dayKey, "start", e.target.value)
                    }
                    className="field !py-2 disabled:opacity-50"
                  />
                  <input
                    type="time"
                    value={day.end}
                    disabled={!day.enabled}
                    onChange={(e) =>
                      handleDayTimeChange(dayKey, "end", e.target.value)
                    }
                    className="field !py-2 disabled:opacity-50"
                  />
                </div>
              );
            })}
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
          />
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>

      <ChangePasswordForm />
    </div>
  );
}

export default DoctorProfile;
