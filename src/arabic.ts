/**
 * Utilities for formatting Arabic-Indic numerals and localized strings.
 */

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicDigits(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.replace(/[0-9]/g, (d) => ARABIC_DIGITS[parseInt(d, 10)]);
}

/**
 * Format a seconds countdown or decimal with Arabic-Indic numerals
 */
export function formatArabicSeconds(seconds: number): string {
  const formatted = seconds.toFixed(1);
  return toArabicDigits(formatted);
}
