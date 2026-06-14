// @vitest-environment node
/**
 * Unit tests — animalsAPI client module.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { animalsAPI } from '@/api/animals';

beforeEach(() => {
  localStorage.setItem('access_token', 'fake-access-token');
});

describe('animalsAPI', () => {

  describe('getAll()', () => {
    it('returns paginated list of animals', async () => {
      const res = await animalsAPI.getAll();
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('results');
      expect(Array.isArray(res.data.results)).toBe(true);
      expect(res.data.count).toBe(2);
    });

    it('results contain required animal fields', async () => {
      const res = await animalsAPI.getAll();
      const animal = res.data.results[0];
      expect(animal).toHaveProperty('id');
      expect(animal).toHaveProperty('animal_type');
      expect(animal).toHaveProperty('sex');
      expect(animal).toHaveProperty('is_healthy');
    });
  });

  describe('getById()', () => {
    it('returns a single animal by id', async () => {
      const res = await animalsAPI.getById(1);
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(1);
      expect(res.data.animal_type).toBe('Cow');
    });
  });

  describe('create()', () => {
    it('returns 201 on successful animal creation', async () => {
      const res = await animalsAPI.create({
        animal_type: 'Sheep',
        age: '6 months',
        sex: 'Female',
      });
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
    });
  });
});
