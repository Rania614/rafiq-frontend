/**
 * Formats an ISO date string into a highly readable format (e.g., "24 Oct 2023").
 * Falls back to an empty string if the date is invalid.
 * 
 * @param dateStr - The ISO date string to format.
 * @returns The formatted date string or empty string if invalid.
 */
export function formatProjectDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
