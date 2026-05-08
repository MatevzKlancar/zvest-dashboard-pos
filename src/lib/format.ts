import { DayOfWeek } from "./types";

export function formatRetryAfter(seconds: number): string {
  if (seconds <= 0) return "now";
  if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (remMin === 0) return `${hours}h`;
  return `${hours}h ${remMin}m`;
}

// Backend uses 0=Sun..6=Sat (JS Date.getDay convention).
// UI shows Mon..Sun. Use this order to render.
export const UI_DAY_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export const DAY_LABELS_LONG: Record<DayOfWeek, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export function normalizeTime(value: string): string {
  // Accepts "HH:MM" or "HH:MM:SS", returns "HH:MM:SS"
  if (!value) return value;
  const parts = value.split(":");
  if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`;
  return value;
}

export function timeForInput(value: string): string {
  // Returns "HH:MM" for <input type="time">
  if (!value) return "";
  const parts = value.split(":");
  return `${parts[0]}:${parts[1] ?? "00"}`;
}

// Compute the next 7 calendar days (in the plan's timezone) that have an enabled entry.
// Returns up to 7 occurrences in chronological order.
export interface NextSendOccurrence {
  date: Date; // UTC instant when this entry would fire (approx — DST safe via Intl)
  dayOfWeek: DayOfWeek;
  send_time_local: string;
  title: string;
  category: string;
}

export function computeNextSends(
  entries: Array<{
    day_of_week: DayOfWeek;
    send_time_local: string;
    title: string;
    notification_type: string;
    is_active?: boolean;
  }>,
  timezone: string,
  now: Date = new Date()
): NextSendOccurrence[] {
  const enabled = entries.filter((e) => e.is_active !== false);
  if (enabled.length === 0) return [];

  const byDay = new Map<DayOfWeek, (typeof enabled)[number]>();
  for (const e of enabled) byDay.set(e.day_of_week, e);

  const out: NextSendOccurrence[] = [];

  // Iterate next 14 calendar days to safely capture 7 enabled occurrences
  // (most plans have 1-7 enabled, so this is plenty).
  for (let i = 0; i < 14 && out.length < 7; i++) {
    const candidate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dow = getDowInTimezone(candidate, timezone);
    const entry = byDay.get(dow);
    if (!entry) continue;

    const fireAt = buildLocalDateTime(candidate, entry.send_time_local, timezone);
    if (fireAt.getTime() <= now.getTime()) continue; // skip past-time today

    out.push({
      date: fireAt,
      dayOfWeek: dow,
      send_time_local: entry.send_time_local,
      title: entry.title,
      category: entry.notification_type,
    });
  }

  return out;
}

function getDowInTimezone(date: Date, timezone: string): DayOfWeek {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });
  const wk = fmt.format(date);
  const map: Record<string, DayOfWeek> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wk] ?? 0;
}

function buildLocalDateTime(date: Date, timeStr: string, timezone: string): Date {
  // Returns a Date that represents `timeStr` on the calendar date of `date` in `timezone`.
  // Approach: format the date in target TZ to get y/m/d, then construct an ISO-like string
  // and resolve the corresponding UTC instant by binary nudging — but a simpler approach:
  // build candidate UTC, measure offset by formatting it in target TZ, then correct.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  const [hh, mm] = timeForInput(timeStr).split(":");

  // Construct a UTC date for that wall-clock time, then adjust by timezone offset.
  const naive = new Date(`${y}-${m}-${d}T${hh}:${mm}:00Z`);
  // Determine the offset of `timezone` at that instant.
  const offsetMin = getTimezoneOffsetMinutes(naive, timezone);
  return new Date(naive.getTime() - offsetMin * 60_000);
}

function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
  // Returns the offset in minutes east of UTC for `timezone` at `date`.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const obj: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") obj[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(obj.year),
    Number(obj.month) - 1,
    Number(obj.day),
    Number(obj.hour) === 24 ? 0 : Number(obj.hour),
    Number(obj.minute),
    Number(obj.second)
  );
  return (asUTC - date.getTime()) / 60_000;
}

export function formatInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
