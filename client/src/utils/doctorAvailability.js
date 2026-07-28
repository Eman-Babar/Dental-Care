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
  mon: { enabled: true, start: "09:00", end: "17:00" },
  tue: { enabled: true, start: "09:00", end: "17:00" },
  wed: { enabled: true, start: "09:00", end: "17:00" },
  thu: { enabled: true, start: "09:00", end: "17:00" },
  fri: { enabled: true, start: "09:00", end: "17:00" },
  sat: { enabled: true, start: "09:00", end: "17:00" },
  sun: { enabled: false, start: "09:00", end: "17:00" },
};

export function normalizeAvailability(raw) {
  if (!raw) return { ...DEFAULT_AVAILABILITY };

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ...DEFAULT_AVAILABILITY };
    }
  }

  const result = { ...DEFAULT_AVAILABILITY };
  for (const key of DAY_KEYS) {
    const day = parsed?.[key];
    if (!day || typeof day !== "object") continue;
    result[key] = {
      enabled: Boolean(day.enabled),
      start: day.start || "09:00",
      end: day.end || "17:00",
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
