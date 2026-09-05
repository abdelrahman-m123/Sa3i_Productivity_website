const test = require("node:test");
const assert = require("node:assert/strict");
const { scheduleTasks, zonedDateTimeToUtc } = require("../services/scheduler");

const baseOptions = {
  startDate: "2026-09-02",
  deadline: "2026-09-02",
  timeZone: "UTC",
  workingHours: { start: "09:00", end: "17:00" },
  includeWeekends: false,
  now: new Date("2026-09-02T08:00:00.000Z"),
};

test("places tasks around existing commitments", () => {
  const result = scheduleTasks({
    ...baseOptions,
    tasks: [
      { title: "First", estimatedMinutes: 60, priority: "high", order: 1 },
      { title: "Second", estimatedMinutes: 90, priority: "medium", order: 2 },
    ],
    busyIntervals: [
      { start: "2026-09-02T10:00:00.000Z", end: "2026-09-02T11:00:00.000Z" },
    ],
  });

  assert.equal(result.items[0].scheduledStart, "2026-09-02T09:00:00.000Z");
  assert.equal(result.items[0].scheduledEnd, "2026-09-02T10:00:00.000Z");
  assert.equal(result.items[1].scheduledStart, "2026-09-02T11:00:00.000Z");
  assert.equal(result.items[1].scheduledEnd, "2026-09-02T12:30:00.000Z");
  assert.equal(result.scheduledMinutes, 150);
});

test("leaves work unscheduled when no slot is large enough", () => {
  const result = scheduleTasks({
    ...baseOptions,
    tasks: [{ title: "Long task", estimatedMinutes: 120, priority: "high", order: 1 }],
    busyIntervals: [
      { start: "2026-09-02T09:30:00.000Z", end: "2026-09-02T16:30:00.000Z" },
    ],
  });

  assert.equal(result.items[0].scheduledStart, null);
  assert.match(result.items[0].unscheduledReason, /Not enough free time/);
});

test("converts local working time to UTC with the requested time zone", () => {
  const cairoNineAm = zonedDateTimeToUtc("2026-09-02", "09:00", "Africa/Cairo");
  assert.equal(cairoNineAm.toISOString(), "2026-09-02T06:00:00.000Z");
});
