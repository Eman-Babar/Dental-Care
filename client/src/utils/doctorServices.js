export function getDoctorServices(allServices, doctor) {
  const selected = doctor?.doctorProfile?.services || [];
  if (!selected.length) return allServices;
  return [...selected].sort((a, b) =>
    String(a.title).localeCompare(String(b.title))
  );
}
