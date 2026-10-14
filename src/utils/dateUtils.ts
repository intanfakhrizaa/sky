/**
 * Utility functions for formatting order timestamps with exact hours, minutes, and seconds.
 * Ensures consistent WIB time representation across incoming, processing, outgoing, and completed orders.
 */

export function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  // Handle SQLite standard format "YYYY-MM-DD HH:MM:SS" or ISO format
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  const d = new Date(normalized);
  if (isNaN(d.getTime())) {
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
  }
  return d;
}

/**
 * Format full date with hour, minute, and second in Indonesian locale.
 * Example: "14 Okt 2026, 15:34:20 WIB"
 */
export function formatFullDateTime(dateStr?: string | null): string {
  const d = parseDate(dateStr);
  if (!d) return '-';

  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} WIB`;
}

/**
 * Format time only with seconds.
 * Example: "15:34:20 WIB"
 */
export function formatTimeWithSeconds(dateStr?: string | null): string {
  const d = parseDate(dateStr);
  if (!d) return '-';

  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds} WIB`;
}

/**
 * Format short date and time (hour and minute).
 * Example: "14 Okt 15:34"
 */
export function formatShortDateTime(dateStr?: string | null): string {
  const d = parseDate(dateStr);
  if (!d) return '-';

  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[d.getMonth()];
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${day} ${month}, ${hours}:${minutes} WIB`;
}

/**
 * Calculates human-readable elapsed duration between two dates.
 * Example: "45 menit" or "2 jam 15 menit"
 */
export function formatElapsedDuration(startStr?: string | null, endStr?: string | null): string {
  const start = parseDate(startStr);
  if (!start) return '-';
  const end = endStr ? parseDate(endStr) || new Date() : new Date();

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Baru saja (< 1 mnt)';
  if (diffMinutes < 60) return `${diffMinutes} menit`;
  if (diffHours < 24) {
    return remainingMinutes > 0 ? `${diffHours} jam ${remainingMinutes} mnt` : `${diffHours} jam`;
  }
  return `${diffDays} hari ${diffHours % 24} jam`;
}
