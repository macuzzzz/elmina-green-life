import { useEffect, useState } from 'react';

const TZ = 'Asia/Kuala_Lumpur';

/** `?hour=20` (or 19.5) overrides the Malaysia hour, for reviewing day/night. */
function readHourOverride(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('hour');
  if (raw === null) return null;
  const h = Number(raw);
  return Number.isFinite(h) && h >= 0 && h < 24 ? h : null;
}

export const HOUR_OVERRIDE = readHourOverride();

const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hourCycle: 'h23',
});

/** Fractional hour (0–24) in Malaysia time. */
export function malaysiaHour(date = new Date()): number {
  if (HOUR_OVERRIDE !== null) return HOUR_OVERRIDE;
  const parts = partsFmt.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get('hour') + get('minute') / 60 + get('second') / 3600;
}

/** Date shifted so that toLocale* in TZ shows the overridden hour, if any. */
export function malaysiaNow(): Date {
  const now = new Date();
  if (HOUR_OVERRIDE === null) return now;
  const diffH = HOUR_OVERRIDE - malaysiaHourReal(now);
  return new Date(now.getTime() + diffH * 3_600_000);
}

function malaysiaHourReal(date: Date) {
  const parts = partsFmt.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get('hour') + get('minute') / 60 + get('second') / 3600;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** "Tue, 20 Oct 2026" and "7:24 PM" in Malaysia time. */
export function formatMalaysia(date: Date) {
  const p = dateFmt.formatToParts(date);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return { date: `${g('weekday')}, ${g('day')} ${g('month')} ${g('year')}`, time: timeFmt.format(date) };
}

/** Mock temperature: ~25°C at dawn, ~33°C mid-afternoon. */
export function mockTemperature(hour: number) {
  const t = Math.max(0, Math.sin((Math.PI * (hour - 7)) / 13));
  return Math.round(25 + 8 * t);
}

/** 1 at full day, 0 at night, smooth around 7am / 7pm. */
export function dayFactor(hour: number) {
  const s = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  return s(6.4, 7.4, hour) * (1 - s(18.7, 19.6, hour));
}

export function useMalaysiaClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => malaysiaNow());
  useEffect(() => {
    const id = setInterval(() => setNow(malaysiaNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
