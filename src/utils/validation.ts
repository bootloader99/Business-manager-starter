export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31, leapYear ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
  ][month - 1];

  return day <= daysInMonth;
}

export function getTodayDateInput(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateInputToIsoTimestamp(value: string): string {
  if (!isValidDateInput(value)) {
    throw new Error('Enter a valid date in YYYY-MM-DD format.');
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12).toISOString();
}

export function isValidStoredDate(value: string): boolean {
  const datePart = value.slice(0, 10);
  if (!isValidDateInput(datePart)) return false;
  return value.length === 10 || !Number.isNaN(Date.parse(value));
}

export function normalizeInternationalPhoneInput(value: string): string {
  const trimmed = value.trim();
  const hasLeadingPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '').slice(0, 15);
  return digits ? `${hasLeadingPlus ? '+' : ''}${digits}` : '';
}

export function validateInternationalPhone(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^\+?[1-9]\d{6,14}$/.test(normalized.replace(/[\s().-]/g, ''))) {
    return 'Enter a valid phone number with country code (7–15 digits).';
  }
  return null;
}

// Keep these aliases for existing consumers and projects that specifically
// choose Indian mobile-number validation.
export function normalizeIndianPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  return digits.slice(0, 10);
}

export function validateIndianPhone(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return 'Use digits only for an Indian mobile number.';
  if (!/^[6-9]\d{9}$/.test(normalized)) return 'Enter a valid 10-digit Indian mobile number.';
  return null;
}

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return null;
  if (/\s/.test(email) || email.indexOf('@') <= 0 || email.indexOf('@') !== email.lastIndexOf('@')) {
    return 'Enter a valid email address.';
  }

  const atIndex = email.indexOf('@');
  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (
    !localPart || !domain || localPart.startsWith('.') ||
    localPart.endsWith('.') || localPart.includes('..')
  ) {
    return 'Enter a valid email address.';
  }

  const labels = domain.split('.');
  if (
    labels.length < 2 ||
    labels.some(label =>
      !label || label.startsWith('-') || label.endsWith('-') ||
      !/^[a-zA-Z0-9-]+$/.test(label)
    ) ||
    labels[labels.length - 1].length < 2
  ) {
    return 'Enter a valid email address.';
  }
  return null;
}
