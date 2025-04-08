/**
 * Type guard to check if an object is a Firebase Timestamp
 */
export function isFirebaseTimestamp(obj: any): obj is { toDate: () => Date } {
  return obj && typeof obj === 'object' && typeof obj.toDate === 'function';
}

/**
 * Format a date or timestamp to a localized string
 */
export function formatDate(date: Date | string | any | null, locale = 'he-IL'): string {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (isFirebaseTimestamp(date)) {
    dateObj = date.toDate();
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '';
  }
  
  return dateObj.toLocaleDateString(locale);
} 