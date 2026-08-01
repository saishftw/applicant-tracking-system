import type { ScoreUnit } from "@/schema";
import { DEMO_NOW } from "./constants";

/** Native-unit score string: rubric → "3.2", percentage → "85%" (ADR 0002). */
export function formatScore(score: number, unit: ScoreUnit): string {
  return unit === "percentage" ? `${Math.round(score)}%` : score.toFixed(1);
}

/** The "/5" suffix for rubric scores; percentages are self-denominated. */
export function scoreDenominator(unit: ScoreUnit): string | null {
  return unit === "rubric_1_5" ? "/5" : null;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

export function relativeTime(iso: string, now: Date = DEMO_NOW): string {
  const abs = Math.abs(now.getTime() - new Date(iso).getTime());
  const unit = (n: number, u: string) => `${n} ${u}${n === 1 ? "" : "s"} ago`;
  if (abs < MIN) return "just now";
  if (abs < HOUR) return unit(Math.floor(abs / MIN), "min");
  if (abs < DAY) return unit(Math.round(abs / HOUR), "hour");
  if (abs < WEEK) return unit(Math.round(abs / DAY), "day");
  if (abs < MONTH) return unit(Math.round(abs / WEEK), "week");
  return unit(Math.round(abs / MONTH), "month");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
