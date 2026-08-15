export const SLOT_MINUTES = 30;
export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DEFAULT_AVAILABILITY = {
  mon: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] },
  tue: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] },
  wed: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] },
  thu: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] },
  fri: { enabled: true, start: "09:00", end: "17:00", breaks: [{ start: "13:00", end: "14:00" }] },
  sat: { enabled: true, start: "09:00", end: "17:00", breaks: [] },
  sun: { enabled: false, start: "09:00", end: "17:00", breaks: [] },
};

export function minutesToHHMM(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export function timeToMinutes(timeStr) {
  const [h, m] = String(timeStr || "00:00").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function normalizeBreaks(rawBreaks) {
  if (!Array.isArray(rawBreaks)) return [];
  return rawBreaks
    .map((b) => ({
      start: String(b?.start || "").trim(),
      end: String(b?.end || "").trim(),
    }))
    .filter((b) => {
      const s = timeToMinutes(b.start);
      const e = timeToMinutes(b.end);
      return s != null && e != null && e > s;
    });
}

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
    result[key] = {
      enabled: Boolean(day.enabled),
      start: String(day.start || fallback.start),
      end: String(day.end || fallback.end),
      breaks: normalizeBreaks(day.breaks ?? fallback.breaks),
    };
  }
  return result;
}

export function getDayKeyFromDate(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const index = date.getDay();
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[index];
}

export function toDateOnly(dateInput) {
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function formatDateOnly(dateInput) {
  const d = toDateOnly(dateInput);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildSlotsForRange(startTime, endTime, stepMinutes = SLOT_MINUTES) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start == null || end == null || start > end) return [];

  const slots = [];
  for (let m = start; m <= end; m += stepMinutes) {
    slots.push(minutesToHHMM(m));
  }
  return slots;
}

function slotOverlapsBreak(slotStartMin, slotEndMin, breaks) {
  for (const b of breaks || []) {
    const bs = timeToMinutes(b.start);
    const be = timeToMinutes(b.end);
    if (bs == null || be == null) continue;
    if (slotStartMin < be && slotEndMin > bs) return true;
  }
  return false;
}

/**
 * Build bookable start times for a doctor on a date.
 * durationMinutes: service length (defaults to SLOT_MINUTES)
 */
export function getDoctorSlotsForDate(
  availability,
  dateStr,
  { durationMinutes = SLOT_MINUTES, onLeave = false } = {}
) {
  if (onLeave) {
    return {
      dayKey: getDayKeyFromDate(dateStr),
      slots: [],
      breaks: [],
      message: "Doctor is on leave this day.",
      onLeave: true,
    };
  }

  const schedule = normalizeAvailability(availability);
  const dayKey = getDayKeyFromDate(dateStr);
  const day = schedule[dayKey];
  const duration = Math.max(Number(durationMinutes) || SLOT_MINUTES, SLOT_MINUTES);

  if (!day?.enabled) {
    return {
      dayKey,
      slots: [],
      breaks: day?.breaks || [],
      message: "Doctor is not available on this day.",
      onLeave: false,
    };
  }

  const startMin = timeToMinutes(day.start);
  const endMin = timeToMinutes(day.end);
  if (startMin == null || endMin == null || endMin <= startMin) {
    return {
      dayKey,
      slots: [],
      breaks: day.breaks || [],
      start: day.start,
      end: day.end,
      message: "No slots configured for this day.",
      onLeave: false,
    };
  }

  const slots = [];
  for (let m = startMin; m + duration <= endMin; m += SLOT_MINUTES) {
    if (slotOverlapsBreak(m, m + duration, day.breaks)) continue;
    slots.push(minutesToHHMM(m));
  }

  return {
    dayKey,
    slots,
    breaks: day.breaks || [],
    start: day.start,
    end: day.end,
    duration,
    message: slots.length ? null : "No slots available for this day (check hours/breaks).",
    onLeave: false,
  };
}

export function isSlotInDoctorSchedule(
  availability,
  dateStr,
  slotTime,
  options = {}
) {
  const { slots } = getDoctorSlotsForDate(availability, dateStr, options);
  return slots.includes(slotTime);
}

/** True if [slotStart, slotStart+duration) overlaps any booked start+assumed SLOT or known block. */
export function filterSlotsAgainstBookings(slots, bookedTimes, durationMinutes = SLOT_MINUTES) {
  const duration = Math.max(Number(durationMinutes) || SLOT_MINUTES, SLOT_MINUTES);
  const bookedStarts = (bookedTimes || [])
    .map((t) => timeToMinutes(t))
    .filter((m) => m != null);

  return slots.filter((slot) => {
    const start = timeToMinutes(slot);
    if (start == null) return false;
    const end = start + duration;
    for (const booked of bookedStarts) {
      const bookedEnd = booked + SLOT_MINUTES;
      if (start < bookedEnd && end > booked) return false;
    }
    return true;
  });
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
