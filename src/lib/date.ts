import { Timestamp } from 'firebase/firestore';

/**
 * Formats a date to MM/DD/YYYY format
 * @param date - The date to format (Date object, Timestamp, or string)
 * @returns Formatted date string like "10/12/2025"
 */
export function formatNotificationDate(date: Date | Timestamp | string): string {
  let dateObj: Date;
  if (date instanceof Timestamp) {
    dateObj = date.toDate();
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    dateObj = new Date(date);
  }
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${month}/${day}/${year}`;
}