/**
 * Phone and email rules shared by the public forms (before sending) and the server (before
 * storing), so a value the form accepts is never refused by the server afterwards. Pure.
 */

const BENGALI_ZERO = 0x09e6;
const ARABIC_INDIC_ZERO = 0x0660;
const EXTENDED_ARABIC_ZERO = 0x06f0;

/** Bengali (০-৯) and Arabic-Indic (٠-٩ / ۰-۹) digits as ASCII digits; other characters unchanged. */
export function toAsciiDigits(value: string): string {
  return value.replace(/[০-৯٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const zero = code >= BENGALI_ZERO ? BENGALI_ZERO : code >= EXTENDED_ARABIC_ZERO ? EXTENDED_ARABIC_ZERO : ARABIC_INDIC_ZERO;
    return String(code - zero);
  });
}

/** Shortest accepted number: a local landline such as 02-8912345 without its area code. */
export const MIN_PHONE_DIGITS = 7;
export const MAX_PHONE_DIGITS = 15;

export const countPhoneDigits = (value: string): number => toAsciiDigits(value).replace(/\D/g, '').length;

/** A mobile or landline number in any common notation, with digits in any supported script. */
export function isValidPhone(value: string): boolean {
  const digits = countPhoneDigits(value);
  return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string): boolean => value.length <= 254 && EMAIL_RE.test(value.trim());
