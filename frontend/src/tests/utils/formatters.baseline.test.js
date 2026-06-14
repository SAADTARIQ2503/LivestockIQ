/**
 * Baseline tests — formatters.js utility module.
 * Happy-path coverage only (no mutation-specific assertions).
 */
import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeDate,
  formatCurrency,
  formatNumber,
  formatPercentage,
  truncateText,
  capitalize,
  formatFileSize,
} from '@/utils/formatters';

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-06-14');
    expect(result).toContain('2026');
  });

  it('returns empty string for falsy input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('accepts a Date object', () => {
    const result = formatDate(new Date('2026-01-01'));
    expect(result).toContain('Jan');
  });
});

describe('formatDateTime', () => {
  it('formats date and time', () => {
    const result = formatDateTime('2026-06-14T10:30:00');
    expect(result).toContain('2026');
  });

  it('returns empty string for falsy input', () => {
    expect(formatDateTime(null)).toBe('');
  });
});

describe('formatTime', () => {
  it('formats time from date string', () => {
    const result = formatTime('2026-06-14T14:30:00');
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('returns empty string for falsy input', () => {
    expect(formatTime(null)).toBe('');
  });
});

describe('formatRelativeDate', () => {
  it('returns a relative string', () => {
    const result = formatRelativeDate(new Date());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty string for falsy input', () => {
    expect(formatRelativeDate(null)).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats positive numbers as USD', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('1,000');
  });

  it('returns empty string for non-number', () => {
    expect(formatCurrency('abc')).toBe('');
    expect(formatCurrency(null)).toBe('');
  });

  it('formats with custom currency', () => {
    const result = formatCurrency(500, 'EUR');
    expect(result).toContain('500');
  });
});

describe('formatNumber', () => {
  it('formats integer with commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('returns empty string for non-number', () => {
    expect(formatNumber('abc')).toBe('');
  });

  it('formats with decimals', () => {
    const result = formatNumber(3.14159, 2);
    expect(result).toContain('3.14');
  });
});

describe('formatPercentage', () => {
  it('appends percent sign', () => {
    expect(formatPercentage(75)).toContain('%');
  });

  it('returns empty string for non-number', () => {
    expect(formatPercentage('abc')).toBe('');
  });
});

describe('truncateText', () => {
  it('truncates long text', () => {
    const result = truncateText('Hello world this is a long string', 10);
    expect(result.length).toBeGreaterThan(10);
    expect(result).toContain('...');
  });

  it('returns text unchanged if short enough', () => {
    expect(truncateText('Short', 50)).toBe('Short');
  });

  it('returns the input for falsy value', () => {
    expect(truncateText(null, 10)).toBeNull();
  });
});

describe('capitalize', () => {
  it('capitalizes first letter and lowercases rest', () => {
    expect(capitalize('hELLO')).toBe('Hello');
  });

  it('returns empty string for falsy input', () => {
    expect(capitalize('')).toBe('');
    expect(capitalize(null)).toBe('');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats kilobytes', () => {
    const result = formatFileSize(1024);
    expect(result).toContain('KB');
  });

  it('formats megabytes', () => {
    const result = formatFileSize(1024 * 1024);
    expect(result).toContain('MB');
  });
});
