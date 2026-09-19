// Calendar export: everything is generated client-side. No scheduler, no server.
import { addMonthsClamped } from "./dates";

export function recheckDate(fromDate: string, months: number): Date {
  // Clamped so a 31st never overflows into the following month.
  return addMonthsClamped(fromDate, months);
}

export function formatChineseDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function icsDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

export function buildIcs(date: Date, title: string, description: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//health-logbook//zh-HK//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@health-logbook`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(date)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(date: Date, title: string, description: string) {
  const blob = new Blob([buildIcs(date, title, description)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "血壓複查提醒.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(date: Date, title: string, description: string): string {
  const day = icsDate(date);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${day}/${day}`,
    details: description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
