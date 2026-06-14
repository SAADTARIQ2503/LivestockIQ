/**
 * Unit tests — constants.js
 */
import { describe, it, expect } from 'vitest';
import {
  ANIMAL_TYPES,
  ANIMAL_TYPE_OPTIONS,
  STORAGE_KEYS,
} from '@/utils/constants';

describe('ANIMAL_TYPES', () => {
  it('contains Cow, Goat, Sheep', () => {
    expect(ANIMAL_TYPES.COW).toBe('Cow');
    expect(ANIMAL_TYPES.GOAT).toBe('Goat');
    expect(ANIMAL_TYPES.SHEEP).toBe('Sheep');
  });
});

describe('ANIMAL_TYPE_OPTIONS', () => {
  it('is an array with at least 3 entries', () => {
    expect(Array.isArray(ANIMAL_TYPE_OPTIONS)).toBe(true);
    expect(ANIMAL_TYPE_OPTIONS.length).toBeGreaterThanOrEqual(3);
  });

  it('each option has value and label properties', () => {
    ANIMAL_TYPE_OPTIONS.forEach(opt => {
      expect(opt).toHaveProperty('value');
      expect(opt).toHaveProperty('label');
    });
  });

  it('values match ANIMAL_TYPES', () => {
    const values = ANIMAL_TYPE_OPTIONS.map(o => o.value);
    expect(values).toContain('Cow');
    expect(values).toContain('Goat');
    expect(values).toContain('Sheep');
  });
});

describe('STORAGE_KEYS', () => {
  it('defines ACCESS_TOKEN and REFRESH_TOKEN keys', () => {
    expect(STORAGE_KEYS).toHaveProperty('ACCESS_TOKEN');
    expect(STORAGE_KEYS).toHaveProperty('REFRESH_TOKEN');
  });
});
