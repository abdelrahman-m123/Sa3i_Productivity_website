const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SLOT_INCREMENT_MINUTES = 15;

const pad = (value) => String(value).padStart(2, "0");

const parseDateKey = (dateKey) => {
  if (!DATE_PATTERN.test(dateKey || "")) {
    return null;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

const isValidDateKey = (dateKey) => Boolean(parseDateKey(dateKey));

const addDays = (dateKey, days) => {
  const parsed = parseDateKey(dateKey);
  if (!parsed) {
    throw new Error("Invalid date");
  }

  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

const normalizeTimeZone = (timeZone) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return "UTC";
  }
};

const getDateKeyInTimeZone = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
};

const getTimeZoneOffsetMs = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return representedAsUtc - date.getTime();
};

const zonedDateTimeToUtc = (dateKey, time, requestedTimeZone) => {
  const parsedDate = parseDateKey(dateKey);
  const timeMatch = TIME_PATTERN.exec(time || "");

  if (!parsedDate || !timeMatch) {
    throw new Error("Invalid local date or time");
  }

  const timeZone = normalizeTimeZone(requestedTimeZone);
  const wallClockAsUtc = Date.UTC(
    parsedDate.year,
    parsedDate.month - 1,
    parsedDate.day,
    Number(timeMatch[1]),
    Number(timeMatch[2])
  );
  let candidate = new Date(wallClockAsUtc);
  let offset = getTimeZoneOffsetMs(candidate, timeZone);
  candidate = new Date(wallClockAsUtc - offset);

  const correctedOffset = getTimeZoneOffsetMs(candidate, timeZone);
  if (correctedOffset !== offset) {
    candidate = new Date(wallClockAsUtc - correctedOffset);
  }

  return candidate;
};

const getPlanningRange = ({ startDate, deadline, timeZone }) => ({
  start: zonedDateTimeToUtc(startDate, "00:00", timeZone),
  end: zonedDateTimeToUtc(addDays(deadline, 1), "00:00", timeZone),
});

const roundUp = (timestamp, incrementMinutes = SLOT_INCREMENT_MINUTES) => {
  const increment = incrementMinutes * 60 * 1000;
  return Math.ceil(timestamp / increment) * increment;
};

const subtractBusyIntervals = (start, end, busyIntervals) => {
  const slots = [];
  let cursor = start;

  for (const busy of busyIntervals) {
    const busyStart = Math.max(start, busy.start);
    const busyEnd = Math.min(end, busy.end);

    if (busyEnd <= cursor || busyStart >= end) {
      continue;
    }

    if (busyStart > cursor) {
      slots.push({ start: cursor, end: busyStart });
    }

    cursor = Math.max(cursor, busyEnd);
    if (cursor >= end) {
      break;
    }
  }

  if (cursor < end) {
    slots.push({ start: cursor, end });
  }

  return slots;
};

const scheduleTasks = ({
  tasks,
  startDate,
  deadline,
  timeZone,
  workingHours,
  includeWeekends = false,
  busyIntervals = [],
  now = new Date(),
  bufferMinutes = 15,
}) => {
  const normalizedTimeZone = normalizeTimeZone(timeZone);
  const normalizedBusy = busyIntervals
    .map((interval) => ({
      start: new Date(interval.start).getTime(),
      end: new Date(interval.end).getTime(),
    }))
    .filter((interval) => Number.isFinite(interval.start) && interval.end > interval.start)
    .sort((first, second) => first.start - second.start);
  const freeSlots = [];
  const today = getDateKeyInTimeZone(now, normalizedTimeZone);

  for (let dateKey = startDate; dateKey <= deadline; dateKey = addDays(dateKey, 1)) {
    const parsed = parseDateKey(dateKey);
    const weekday = new Date(
      Date.UTC(parsed.year, parsed.month - 1, parsed.day)
    ).getUTCDay();

    if (!includeWeekends && (weekday === 0 || weekday === 6)) {
      continue;
    }

    let dayStart = zonedDateTimeToUtc(dateKey, workingHours.start, normalizedTimeZone).getTime();
    const dayEnd = zonedDateTimeToUtc(dateKey, workingHours.end, normalizedTimeZone).getTime();

    if (dateKey === today) {
      dayStart = Math.max(dayStart, roundUp(now.getTime()));
    }

    if (dayStart >= dayEnd) {
      continue;
    }

    freeSlots.push(...subtractBusyIntervals(dayStart, dayEnd, normalizedBusy));
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const orderedTasks = [...tasks].sort((first, second) => {
    if (first.order !== second.order) {
      return first.order - second.order;
    }
    return priorityOrder[first.priority] - priorityOrder[second.priority];
  });
  let totalEstimatedMinutes = 0;
  let scheduledMinutes = 0;

  const items = orderedTasks.map((task) => {
    const durationMinutes = Math.max(
      SLOT_INCREMENT_MINUTES,
      Math.min(480, Math.ceil(Number(task.estimatedMinutes) / SLOT_INCREMENT_MINUTES) * SLOT_INCREMENT_MINUTES)
    );
    const durationMs = durationMinutes * 60 * 1000;
    totalEstimatedMinutes += durationMinutes;
    const slotIndex = freeSlots.findIndex((slot) => slot.end - slot.start >= durationMs);

    if (slotIndex === -1) {
      return {
        ...task,
        estimatedMinutes: durationMinutes,
        scheduledStart: null,
        scheduledEnd: null,
        unscheduledReason: "Not enough free time before the deadline",
      };
    }

    const slot = freeSlots[slotIndex];
    const scheduledStart = new Date(slot.start);
    const scheduledEnd = new Date(slot.start + durationMs);
    const nextSlotStart = scheduledEnd.getTime() + bufferMinutes * 60 * 1000;

    if (nextSlotStart < slot.end) {
      freeSlots[slotIndex] = { start: nextSlotStart, end: slot.end };
    } else {
      freeSlots.splice(slotIndex, 1);
    }

    scheduledMinutes += durationMinutes;
    return {
      ...task,
      estimatedMinutes: durationMinutes,
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: scheduledEnd.toISOString(),
      unscheduledReason: null,
    };
  });

  return { items, totalEstimatedMinutes, scheduledMinutes };
};

module.exports = {
  addDays,
  getDateKeyInTimeZone,
  getPlanningRange,
  isValidDateKey,
  normalizeTimeZone,
  scheduleTasks,
  zonedDateTimeToUtc,
};
