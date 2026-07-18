import type { Measurement } from "./schemas";

export interface ParsedMeasurement {
  id: string;
  name: string;
  value: number;
  unit: string;
  elapsedSeconds: number;
  raw: string;
}

const unitPattern =
  "mV|V|mA|A|mW|W|kPa|Pa|°C|C|kg|mg|g|mL|L|mm|cm|Ω|ohms?|%|pH";
const readingPattern = new RegExp(
  `(-?\\d+(?:\\.\\d+)?)\\s*(${unitPattern})(?:\\s*(?:at|after)\\s*(\\d+(?:\\.\\d+)?)\\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h))?`,
  "gi",
);
const timePattern =
  /\b(?:at|after)\s+(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h)\b/i;

function secondsFor(value: number, unit: string): number {
  const normalized = unit.toLowerCase();
  if (/^(?:hours?|hrs?|h)$/.test(normalized)) return value * 3_600;
  if (/^(?:minutes?|mins?|m)$/.test(normalized)) return value * 60;
  return value;
}

function normalizeUnit(unit: string): string {
  if (/^ohms?$/i.test(unit)) return "Ω";
  return unit;
}

function toId(name: string, seconds: number, index: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "measurement"}-${seconds}s-${index + 1}`;
}

/** Parses only numeric readings with recognized scientific units; other prose is ignored. */
export function parseMeasurementLine(input: string): ParsedMeasurement[] {
  const normalized = input.replace(/[−–]/g, "-").trim();
  if (!normalized) return [];

  const colonIndex = normalized.indexOf(":");
  const labelSource =
    colonIndex >= 0 ? normalized.slice(0, colonIndex).trim() : "Measurement";
  const readingSource =
    colonIndex >= 0 ? normalized.slice(colonIndex + 1) : normalized;
  const timeInLabel = labelSource.match(timePattern);
  const defaultSeconds = timeInLabel
    ? secondsFor(Number(timeInLabel[1]), timeInLabel[2])
    : 0;
  const name =
    labelSource
      .replace(timePattern, "")
      .replace(/\s+/g, " ")
      .replace(/[,:;\s-]+$/g, "") || "Measurement";

  const parsed: ParsedMeasurement[] = [];
  readingPattern.lastIndex = 0;
  for (const match of readingSource.matchAll(readingPattern)) {
    const value = Number(match[1]);
    const elapsedSeconds = match[3]
      ? secondsFor(Number(match[3]), match[4])
      : defaultSeconds;
    parsed.push({
      id: toId(name, elapsedSeconds, parsed.length),
      name,
      value,
      unit: normalizeUnit(match[2]),
      elapsedSeconds,
      raw: match[0],
    });
  }
  return parsed;
}

export function parseMeasurements(input: string): ParsedMeasurement[] {
  return input
    .split(/\r?\n|;(?=\s*[A-Za-z])/)
    .flatMap((line) => parseMeasurementLine(line));
}

/** Returns a new array ordered for charting without mutating validated source data. */
export function sortMeasurements<
  T extends Pick<Measurement, "elapsedSeconds" | "capturedAt" | "id">,
>(measurements: readonly T[]): T[] {
  return [...measurements].sort((left, right) => {
    const byElapsed = left.elapsedSeconds - right.elapsedSeconds;
    if (byElapsed !== 0) return byElapsed;
    const byTimestamp = (left.capturedAt ?? "").localeCompare(
      right.capturedAt ?? "",
    );
    return byTimestamp !== 0 ? byTimestamp : left.id.localeCompare(right.id);
  });
}
