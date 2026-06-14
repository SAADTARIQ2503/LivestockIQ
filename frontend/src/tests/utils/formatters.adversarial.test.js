/**
 * Adversarial tests — formatters.js.
 * Each test targets a specific surviving mutant identified by Stryker.
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

// ─── formatDate ─────────────────────────────────────────────────────────────

describe('formatDate — adversarial', () => {
  it('KILL ConditionalExpression/false: string input produces correct month', () => {
    // ConditionalExpression→false always skips new Date() wrap.
    // If date-fns can't handle a raw string, output will differ.
    expect(formatDate('2026-01-15')).toBe('Jan 15, 2026');
  });

  it('KILL ConditionalExpression/true: Date object produces correct output', () => {
    // ConditionalExpression→true always wraps in new Date(date).
    // new Date(existingDate) == same date — but exact string must match.
    expect(formatDate(new Date('2026-01-15'))).toBe('Jan 15, 2026');
  });

  it('KILL EqualityOperator/!==: string and Date object produce same value', () => {
    const fromString = formatDate('2026-06-14');
    const fromDate = formatDate(new Date('2026-06-14'));
    expect(fromString).toBe(fromDate);
  });

  it('KILL StringLiteral/string→backslash: custom format string is respected', () => {
    // StringLiteral mutant replaces 'string' → '\\' in the typeof check.
    // This makes typeof date === '\\' → always false → skips new Date().
    // Verify that the default format produces the exact expected token layout.
    const result = formatDate('2026-03-07');
    expect(result).toBe('Mar 07, 2026');
  });
});

// ─── formatDateTime ──────────────────────────────────────────────────────────

describe('formatDateTime — adversarial', () => {
  it('KILL ConditionalExpression/false: string input formats date and time exactly', () => {
    const result = formatDateTime('2026-03-07T09:05:00');
    expect(result).toBe('Mar 07, 2026 09:05');
  });

  it('KILL ConditionalExpression/true: Date object formats correctly', () => {
    const result = formatDateTime(new Date('2026-03-07T09:05:00'));
    expect(result).toContain('Mar');
    expect(result).toContain('2026');
  });
});

// ─── formatTime ──────────────────────────────────────────────────────────────

describe('formatTime — adversarial', () => {
  it('KILL ConditionalExpression/false: produces exact HH:mm from string', () => {
    const result = formatTime('2026-06-14T08:30:00');
    expect(result).toBe('08:30');
  });

  it('KILL ConditionalExpression/true: Date object produces exact HH:mm', () => {
    const d = new Date(2026, 5, 14, 8, 30, 0);
    const result = formatTime(d);
    expect(result).toBe('08:30');
  });
});

// ─── formatRelativeDate ───────────────────────────────────────────────────────

describe('formatRelativeDate — adversarial', () => {
  it('KILL ObjectLiteral/{}: addSuffix:true must include "ago" for past dates', () => {
    // Without addSuffix:true, formatDistance returns "X minutes" not "X minutes ago"
    const pastDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const result = formatRelativeDate(pastDate);
    expect(result).toMatch(/ago/);
  });

  it('KILL BooleanLiteral/false: addSuffix option is active', () => {
    const oldDate = new Date('2024-01-01');
    const result = formatRelativeDate(oldDate);
    expect(result).toMatch(/ago/);
  });

  it('KILL ConditionalExpression/false: string date produces suffix', () => {
    const result = formatRelativeDate('2024-01-01');
    expect(result).toMatch(/ago/);
  });
});

// ─── formatCurrency ──────────────────────────────────────────────────────────

describe('formatCurrency — adversarial', () => {
  it('KILL ObjectLiteral/{}: must include currency symbol $', () => {
    // Without style:'currency', Intl.NumberFormat produces "1,000" not "$1,000.00"
    const result = formatCurrency(1000);
    expect(result).toBe('$1,000.00');
  });

  it('KILL ObjectLiteral/{}: must include exactly 2 decimal places', () => {
    expect(formatCurrency(1)).toBe('$1.00');
    expect(formatCurrency(1.5)).toBe('$1.50');
  });

  it('KILL ObjectLiteral/{}: EUR currency symbol must appear', () => {
    const result = formatCurrency(500, 'EUR');
    expect(result).toMatch(/€|EUR/);
  });
});

// ─── formatNumber ────────────────────────────────────────────────────────────

describe('formatNumber — adversarial', () => {
  it('KILL ObjectLiteral/{}: decimals=0 must round, not show fractional digits', () => {
    // Without minimumFractionDigits/maximumFractionDigits, default allows decimals.
    expect(formatNumber(1000.7, 0)).toBe('1,001');
  });

  it('KILL ObjectLiteral/{}: decimals=2 must show exactly 2 places', () => {
    expect(formatNumber(3.1, 2)).toBe('3.10');
  });

  it('KILL ObjectLiteral/{}: zero decimals on integer produces no decimal point', () => {
    expect(formatNumber(42, 0)).toBe('42');
    expect(formatNumber(42, 0)).not.toContain('.');
  });
});

// ─── formatPercentage ────────────────────────────────────────────────────────

describe('formatPercentage — adversarial', () => {
  it('KILL ObjectLiteral/{}: one decimal place by default', () => {
    expect(formatPercentage(75)).toBe('75.0%');
  });

  it('KILL ObjectLiteral/{}: exactly 2 decimals when specified', () => {
    expect(formatPercentage(33.3, 2)).toBe('33.30%');
  });
});

// ─── truncateText ────────────────────────────────────────────────────────────

describe('truncateText — adversarial', () => {
  it('KILL EqualityOperator/<=→<: text exactly at maxLength is NOT truncated', () => {
    // Original: text.length <= maxLength → return text (no truncation)
    // Mutant  : text.length < maxLength  → at exactly maxLength, truncates
    expect(truncateText('Hello', 5)).toBe('Hello');
    expect(truncateText('Hello', 5)).not.toContain('...');
  });

  it('KILL MethodExpression/substring→text: truncated text must end with correct prefix', () => {
    // Mutant drops .substring(0, maxLength), producing "${text}..." (full text + ellipsis)
    const result = truncateText('Hello World', 5);
    expect(result).toBe('Hello...');
    expect(result).not.toBe('Hello World...');
  });

  it('KILL MethodExpression: truncation cuts at the right character boundary', () => {
    expect(truncateText('ABCDEFGHIJ', 3)).toBe('ABC...');
  });
});

// ─── formatFileSize ──────────────────────────────────────────────────────────

describe('formatFileSize — adversarial', () => {
  it('KILL ArithmeticOperator//→*: 1024 bytes must equal exactly 1 KB', () => {
    // Mutant changes bytes/Math.pow(k,i) → bytes*Math.pow(k,i)
    // 1024 / 1024^1 = 1  ✓
    // 1024 * 1024^1 = 1,048,576  ✗ (would show as 'MB' range)
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('KILL StringLiteral/sizes[]: MB label must appear for megabyte input', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });

  it('KILL StringLiteral/sizes[]: GB label must appear for gigabyte input', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('KILL StringLiteral/sizes[]: KB label is the correct unit for 2048 bytes', () => {
    expect(formatFileSize(2048)).toBe('2 KB');
  });
});
