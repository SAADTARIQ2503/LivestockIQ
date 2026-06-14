import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

// Mock localStorage (both jsdom and node environments)
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

// Mock window.location for redirect tests (jsdom only)
if (typeof window !== 'undefined') {
  delete window.location;
  window.location = { href: '' };
}

// MSW server lifecycle (both environments — single source of truth)
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());
