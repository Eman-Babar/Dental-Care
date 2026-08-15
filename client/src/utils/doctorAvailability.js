export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_LABELS = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export const DEFAULT_AVAILABILITY = {
  mon: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] },
  tue: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] },
  wed: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] },
  thu: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] },
  fri: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] },
  sat: { enabled: true, start: "09:00", end: "17:00", breaks: [] },
  sun: { enabled: false, start: "09:00", end: "17:00", breaks: [] },
};

export function normalizeAvailability(raw) {
  const result = {};
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }

  for (const key of DAY_KEYS) {
    const fallback = DEFAULT_AVAILABILITY[key];
    const day = parsed?.[key];
    if (!day || typeof day !== "object") {
      result[key] = {
        enabled: fallback.enabled,
        start: fallback.start,
        end: fallback.end,
        breaks: [...(fallback.breaks || [])],
      };
      continue;
    }
    const breaks = Array.isArray(day.breaks)
      ? day.breaks
          .map((b) => ({
            start: b?.start || "13:00",
            end: b?.end || "14:00",
          }))
          .filter((b) => b.start && b.end)
      : [...(fallback.breaks || [])];
    result[key] = {
      enabled: Boolean(day.enabled),
      start: day.start || fallback.start,
      end: day.end || fallback.end,
      breaks,
    };
  }
  return result;
}

export function groupSlots(slots = []) {
  const grouped = { morning: [], afternoon: [], evening: [] };
  for (const slot of slots) {
    const hour = Number(String(slot).split(":")[0]);
    if (hour < 12) grouped.morning.push(slot);
    else if (hour < 16) grouped.afternoon.push(slot);
    else grouped.evening.push(slot);
  }
  return grouped;
}
