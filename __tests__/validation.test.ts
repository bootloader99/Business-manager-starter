import {
  formatDateInput,
  isValidDateInput,
  normalizeIndianPhoneInput,
  normalizeInternationalPhoneInput,
  validateEmail,
  validateIndianPhone,
  validateInternationalPhone,
} from '../src/utils/validation';

describe('date input validation', () => {
  it('formats typed digits progressively and accepts pasted ISO dates', () => {
    expect(formatDateInput('2026')).toBe('2026');
    expect(formatDateInput('202610')).toBe('2026-10');
    expect(formatDateInput('20261015')).toBe('2026-10-15');
    expect(formatDateInput('2026-10-15')).toBe('2026-10-15');
  });

  it('validates month lengths and leap years', () => {
    expect(isValidDateInput('2024-02-29')).toBe(true);
    expect(isValidDateInput('2025-02-29')).toBe(false);
    expect(isValidDateInput('2026-04-31')).toBe(false);
    expect(isValidDateInput('2026-13-01')).toBe(false);
    expect(isValidDateInput('2026-10-15')).toBe(true);
  });
});

describe('Indian mobile validation', () => {
  it('normalizes pasted digits and optional +91 prefixes to ten digits', () => {
    expect(normalizeIndianPhoneInput('+91 98765 43210')).toBe('9876543210');
    expect(normalizeIndianPhoneInput('987654321012')).toBe('9876543210');
  });

  it('allows an empty optional phone but rejects incomplete or invalid values', () => {
    expect(validateIndianPhone('')).toBeNull();
    expect(validateIndianPhone('98765')).not.toBeNull();
    expect(validateIndianPhone('1234567890')).not.toBeNull();
    expect(validateIndianPhone('9876543210')).toBeNull();
  });
});

describe('international phone validation', () => {
  it('preserves a leading plus and supports common formatting while typing', () => {
    expect(normalizeInternationalPhoneInput('+44 (0) 20 7946 0958')).toBe('+4402079460958');
    expect(normalizeInternationalPhoneInput('987 654 3210')).toBe('9876543210');
  });

  it('accepts international-length numbers and rejects alphabetic or too-short values', () => {
    expect(validateInternationalPhone('+44 20 7946 0958')).toBeNull();
    expect(validateInternationalPhone('9876543210')).toBeNull();
    expect(validateInternationalPhone('abc phone')).not.toBeNull();
    expect(validateInternationalPhone('123')).not.toBeNull();
    expect(validateInternationalPhone('')).toBeNull();
  });
});

describe('email validation', () => {
  it('trims whitespace and accepts plausible email addresses', () => {
    expect(validateEmail('  person+tag@example.co.in  ')).toBeNull();
    expect(validateEmail('')).toBeNull();
  });

  it('rejects missing @, missing domain, and embedded spaces', () => {
    expect(validateEmail('person.example.com')).not.toBeNull();
    expect(validateEmail('person@')).not.toBeNull();
    expect(validateEmail('person@example')).not.toBeNull();
    expect(validateEmail('person name@example.com')).not.toBeNull();
  });
});
