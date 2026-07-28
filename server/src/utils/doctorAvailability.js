export const SLOT_MINUTES = 30;
export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DEFAULT_AVAILABILITY = {
  mon: { enabled: true, start: "09:00", end: "17:00" },
  tue: { enabled: true, start: "09:00", end: "17:00" },
  wed: { enabled: true, start: "09:00", end: "17:00" },
  thu: { enabled: true, start: "09:00", end: "17:00" },
  fri: { enabled: true, start: "09:00", end: "17:00" },
  sat: { enabled: true, start: "09:00", end: "17:00" },
  sun: { enabled: false, start: "09:00", end: "17:00" },
};

function minutesToHHMM(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMinutes(timeStr) {
  const [h, m] = String(timeStr || "00:00").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

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
      start: String(day.start || "09:00"),
      end: String(day.end || "17:00"),
    };
  }
  return result;
}

export function getDayKeyFromDate(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const index = date.getDay(); // 0 Sun ... 6 Sat
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[index];
}

export function buildSlotsForRange(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start == null || end == null || start > end) return [];

  const slots = [];
  for (let m = start; m <= end; m += SLOT_MINUTES) {
    slots.push(minutesToHHMM(m));
  }
  return slots;
}

export function getDoctorSlotsForDate(availability, dateStr) {
  const schedule = normalizeAvailability(availability);
  const dayKey = getDayKeyFromDate(dateStr);
  const day = schedule[dayKey];

  if (!day?.enabled) {
    return { dayKey, slots: [], message: "Doctor is not available on this day." };
  }

  const slots = buildSlotsForRange(day.start, day.end);
  return {
    dayKey,
    slots,
    start: day.start,
    end: day.end,
    message: slots.length ? null : "No slots configured for this day.",
  };
}

export function isSlotInDoctorSchedule(availability, dateStr, slotTime) {
  const { slots } = getDoctorSlotsForDate(availability, dateStr);
  return slots.includes(slotTime);
}

export function summarizeAvailability(availability) {
  const schedule = normalizeAvailability(availability);
  const enabledDays = DAY_KEYS.filter((key) => schedule[key].enabled);
  if (!enabledDays.length) return "No days set";

  const labels = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };

  const first = schedule[enabledDays[0]];
  const sameHours = enabledDays.every(
    (key) =>
      schedule[key].start === first.start && schedule[key].end === first.end
  );

  const dayText =
    enabledDays.length === 7
      ? "Every day"
      : enabledDays.map((key) => labels[key]).join(", ");

  if (sameHours) {
    return `${dayText} · ${first.start} - ${first.end}`;
  }
  return dayText;
}
