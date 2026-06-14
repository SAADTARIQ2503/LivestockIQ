// @vitest-environment node
/**
 * Unit tests — authAPI client module.
 * Tests that each method calls the correct endpoint with the correct payload.
 * HTTP responses are intercepted by MSW (Mock Service Worker).
 *
 * Uses node environment so MSW's http interceptor works with axios.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { authAPI } from '@/api/auth';

describe('authAPI', () => {

  describe('register()', () => {
    it('returns 201 and success message for valid payload', async () => {
      const res = await authAPI.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass@123',
        password2: 'TestPass@123',
        first_name: 'Test',
        last_name: 'User',
      });
      expect(res.status).toBe(201);
      expect(res.data.message).toMatch(/created/i);
    });
  });

  describe('login()', () => {
    it('returns access and refresh tokens for valid credentials', async () => {
      const res = await authAPI.login({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass@123',
      });
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('access');
      expect(res.data).toHaveProperty('refresh');
      expect(res.data.user.username).toBe('testuser');
    });

    it('throws for invalid credentials', async () => {
      await expect(
        authAPI.login({ username: 'testuser', email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow();
    });
  });

  describe('getProfile()', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'fake-access-token');
    });

    it('returns user profile data', async () => {
      const res = await authAPI.getProfile();
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('username');
      expect(res.data).toHaveProperty('email');
    });
  });

  describe('getDashboardStats()', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'fake-access-token');
    });

    it('returns dashboard statistics', async () => {
      const res = await authAPI.getDashboardStats();
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('total_animals');
      expect(res.data).toHaveProperty('total_farms');
    });
  });
});
