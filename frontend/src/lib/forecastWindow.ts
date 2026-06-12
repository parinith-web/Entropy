const IST = "Asia/Kolkata";
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

export interface ForecastWindow {
  issuedAt: Date;
  validUntil: Date;
}

function partValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((p) => p.type === type)?.value ?? "0";
}

/** Snap the reference time to the start of the current 3-hour IST forecast slot. */
export function computeISTForecastWindow(reference = new Date()): ForecastWindow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(reference);

  const year = parseInt(partValue(parts, "year"), 10);
  const month = parseInt(partValue(parts, "month"), 10);
  const day = parseInt(partValue(parts, "day"), 10);
  const hour = parseInt(partValue(parts, "hour"), 10);
  const slotHour = Math.floor(hour / 3) * 3;

  const pad = (n: number) => String(n).padStart(2, "0");
  const issuedAt = new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(slotHour)}:00:00+05:30`,
  );

  return {
    issuedAt,
    validUntil: new Date(issuedAt.getTime() + THREE_HOURS_MS),
  };
}

export function parseForecastWindow(
  issuedAt?: string,
  validUntil?: string,
): ForecastWindow | null {
  if (!issuedAt || !validUntil) return null;
  const issued = new Date(issuedAt);
  const until = new Date(validUntil);
  if (Number.isNaN(issued.getTime()) || Number.isNaN(until.getTime())) return null;
  return { issuedAt: issued, validUntil: until };
}

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: IST,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
};

const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: IST,
  day: "numeric",
  month: "short",
  ...TIME_OPTS,
};

export function formatForecastIssuedAt(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", DATE_TIME_OPTS).format(date);
}

export function formatForecastValidUntil(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", TIME_OPTS).format(date);
}

export function formatForecastHeader({ issuedAt, validUntil }: ForecastWindow): string {
  return `Refreshed ${formatForecastIssuedAt(issuedAt)} IST · Valid until ${formatForecastValidUntil(validUntil)} IST`;
}
