import { ParkingStatus } from '../types';

export function formatFacilityDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    // If string has ISO date and time, extract components directly to preserve
    // the garage facility's local arrival time without browser timezone distortion
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (match) {
      const [, y, m, d, h, min] = match;
      const year = parseInt(y, 10);
      const monthIdx = parseInt(m, 10) - 1;
      const day = parseInt(d, 10);
      const hour = parseInt(h, 10);
      const minute = parseInt(min, 10);
      const isPM = hour >= 12;
      const period = isPM ? 'PM' : 'AM';
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return `${day} ${monthNames[monthIdx]} ${year}, ${h12}:${String(minute).padStart(2, '0')} ${period}`;
    }

    const dt = new Date(isoString);
    if (isNaN(dt.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(dt);
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    let normalized = isoString;
    // If backend serialized naive UTC without Z or timezone offset, append Z
    // so the browser parses it as UTC and displays the user's present local time
    if (
      normalized.includes('T') &&
      !normalized.endsWith('Z') &&
      !/[+-]\d{2}:\d{2}$/.test(normalized)
    ) {
      normalized = normalized + 'Z';
    }

    const d = new Date(normalized);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatTimezone(tz: string): string {
  return tz.replace('_', ' ');
}

export function getStatusTheme(status: ParkingStatus | string): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barColor: string;
  ringColor: string;
  iconBg: string;
} {
  switch (status) {
    case 'Low':
      return {
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/30',
        badgeText: 'text-emerald-700 dark:text-emerald-400',
        badgeBorder: 'border-emerald-200 dark:border-emerald-900/60',
        barColor: 'bg-emerald-500',
        ringColor: 'stroke-emerald-500',
        iconBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
      };
    case 'Moderate':
      return {
        badgeBg: 'bg-amber-50 dark:bg-amber-950/30',
        badgeText: 'text-amber-800 dark:text-amber-300',
        badgeBorder: 'border-amber-200 dark:border-amber-900/60',
        barColor: 'bg-amber-400',
        ringColor: 'stroke-amber-400',
        iconBg: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
      };
    case 'High':
      return {
        badgeBg: 'bg-orange-50 dark:bg-orange-950/30',
        badgeText: 'text-orange-800 dark:text-orange-300',
        badgeBorder: 'border-orange-200 dark:border-orange-900/60',
        barColor: 'bg-orange-500',
        ringColor: 'stroke-orange-500',
        iconBg: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300',
      };
    case 'Nearly Full':
    default:
      return {
        badgeBg: 'bg-rose-50 dark:bg-rose-950/30',
        badgeText: 'text-rose-800 dark:text-rose-300',
        badgeBorder: 'border-rose-200 dark:border-rose-900/60',
        barColor: 'bg-rose-500',
        ringColor: 'stroke-rose-500',
        iconBg: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
      };
  }
}
