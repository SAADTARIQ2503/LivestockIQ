/**
 * Setup for node-environment tests (API client tests).
 * Does not import @testing-library/jest-dom (browser-only).
 */
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

// Clear localStorage stub for node tests
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] ?? null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; },
};

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  global.localStorage.clear();
});
afterAll(() => server.close());
