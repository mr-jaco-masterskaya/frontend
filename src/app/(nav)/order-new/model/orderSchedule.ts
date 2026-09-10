const DATE_PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})\s-\s(\d{2}):(\d{2})$/;

/**
 * Converts the operator-facing date/time fields to the API preorder format.
 * The backend treats the beginning of the selected interval as the requested
 * preorder time; the end of the interval remains presentation-only.
 */
export function toPreorderAt(date: string, time: string): string | null {
  const dateMatch = DATE_PATTERN.exec(date.trim());
  const timeMatch = TIME_PATTERN.exec(time.trim());
  if (!dateMatch || !timeMatch) return null;

  const [, day, month, year] = dateMatch;
  const [, startHour, startMinute] = timeMatch;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    parsedDate.getFullYear() !== Number(year)
    || parsedDate.getMonth() !== Number(month) - 1
    || parsedDate.getDate() !== Number(day)
  ) return null;

  return `${year}-${month}-${day} ${startHour}:${startMinute}`;
}
