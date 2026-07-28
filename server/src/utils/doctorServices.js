export function parseServiceIds(raw) {
  if (raw == null || raw === "") return null;

  if (Array.isArray(raw)) {
    return raw.map(Number).filter((id) => id > 0);
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(Number).filter((id) => id > 0)
      : null;
  } catch {
    return null;
  }
}

export function doctorOffersService(doctorProfile, serviceId) {
  const selected = doctorProfile?.services || [];
  if (!selected.length) return true;
  return selected.some((service) => service.id === Number(serviceId));
}

export function getDoctorServicesFromList(allServices, doctorProfile) {
  const selected = doctorProfile?.services || [];
  if (!selected.length) return allServices;
  return selected;
}
