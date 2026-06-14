/**
 * Adversarial tests — constants.js
 * Targets the 151 surviving mutants from the Stryker baseline run.
 * Every assertion uses exact equality (toBe / toEqual) to catch StringLiteral,
 * ArrayDeclaration, ArrowFunction, and LogicalOperator mutations.
 */
import { describe, it, expect } from 'vitest';
import {
  ANIMAL_TYPES,
  ANIMAL_TYPE_OPTIONS,
  SEX_OPTIONS,
  SEVERITY_LEVELS,
  SEVERITY_COLORS,
  SEASONS,
  SEASON_OPTIONS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  PASSWORD_MIN_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  STORAGE_KEYS,
  CHART_COLORS,
  VACCINATION_CHART_COLORS,
  STATUS_COLORS,
  QUERY_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  API_TIMEOUT,
} from '@/utils/constants';

// ── Animal Types ────────────────────────────────────────────────────────────

describe('ANIMAL_TYPES exact values', () => {
  it('COW is exactly "Cow"', () => expect(ANIMAL_TYPES.COW).toBe('Cow'));
  it('GOAT is exactly "Goat"', () => expect(ANIMAL_TYPES.GOAT).toBe('Goat'));
  it('SHEEP is exactly "Sheep"', () => expect(ANIMAL_TYPES.SHEEP).toBe('Sheep'));
  it('has exactly 3 keys', () => expect(Object.keys(ANIMAL_TYPES).length).toBe(3));
});

describe('ANIMAL_TYPE_OPTIONS exact shape', () => {
  it('has exactly 3 options', () => expect(ANIMAL_TYPE_OPTIONS.length).toBe(3));
  it('first option is Cow', () => {
    expect(ANIMAL_TYPE_OPTIONS[0].value).toBe('Cow');
    expect(ANIMAL_TYPE_OPTIONS[0].label).toBe('Cow');
  });
  it('second option is Goat', () => {
    expect(ANIMAL_TYPE_OPTIONS[1].value).toBe('Goat');
    expect(ANIMAL_TYPE_OPTIONS[1].label).toBe('Goat');
  });
  it('third option is Sheep', () => {
    expect(ANIMAL_TYPE_OPTIONS[2].value).toBe('Sheep');
    expect(ANIMAL_TYPE_OPTIONS[2].label).toBe('Sheep');
  });
});

// ── Sex Options ─────────────────────────────────────────────────────────────

describe('SEX_OPTIONS', () => {
  it('has exactly 2 entries', () => expect(SEX_OPTIONS.length).toBe(2));
  it('first is Male', () => {
    expect(SEX_OPTIONS[0].value).toBe('Male');
    expect(SEX_OPTIONS[0].label).toBe('Male');
  });
  it('second is Female', () => {
    expect(SEX_OPTIONS[1].value).toBe('Female');
    expect(SEX_OPTIONS[1].label).toBe('Female');
  });
});

// ── Severity Levels (used by Alert system) ──────────────────────────────────

describe('SEVERITY_LEVELS', () => {
  it('LOW is exactly "Low"', () => expect(SEVERITY_LEVELS.LOW).toBe('Low'));
  it('MEDIUM is exactly "Medium"', () => expect(SEVERITY_LEVELS.MEDIUM).toBe('Medium'));
  it('HIGH is exactly "High"', () => expect(SEVERITY_LEVELS.HIGH).toBe('High'));
  it('has exactly 3 levels', () => expect(Object.keys(SEVERITY_LEVELS).length).toBe(3));
});

describe('SEVERITY_COLORS — exact hex values', () => {
  it('Low is green #28a745', () => expect(SEVERITY_COLORS.Low).toBe('#28a745'));
  it('Medium is amber #ffc107', () => expect(SEVERITY_COLORS.Medium).toBe('#ffc107'));
  it('High is red #dc3545', () => expect(SEVERITY_COLORS.High).toBe('#dc3545'));
});

// ── Seasons (Pakistan livestock calendar) ───────────────────────────────────

describe('SEASONS', () => {
  it('has exactly 5 seasons', () => expect(SEASONS.length).toBe(5));
  it('contains Winter', () => expect(SEASONS).toContain('Winter'));
  it('contains Spring', () => expect(SEASONS).toContain('Spring'));
  it('contains Summer', () => expect(SEASONS).toContain('Summer'));
  it('contains Pre-Monsoon', () => expect(SEASONS).toContain('Pre-Monsoon'));
  it('contains Autumn', () => expect(SEASONS).toContain('Autumn'));
  it('Winter is first season', () => expect(SEASONS[0]).toBe('Winter'));
});

describe('SEASON_OPTIONS', () => {
  it('has exactly 8 entries', () => expect(SEASON_OPTIONS.length).toBe(8));
  it('first entry is current season', () => {
    expect(SEASON_OPTIONS[0].value).toBe('current');
    expect(SEASON_OPTIONS[0].label).toBe('Current Season');
  });
});

// ── Pagination ──────────────────────────────────────────────────────────────

describe('Pagination constants', () => {
  it('DEFAULT_PAGE_SIZE is 20', () => expect(DEFAULT_PAGE_SIZE).toBe(20));
  it('PAGE_SIZE_OPTIONS has 4 entries', () => expect(PAGE_SIZE_OPTIONS.length).toBe(4));
  it('PAGE_SIZE_OPTIONS are [10, 20, 50, 100]', () => {
    expect(PAGE_SIZE_OPTIONS).toEqual([10, 20, 50, 100]);
  });
});

// ── Validation constraints (used in registration/profile forms) ─────────────

describe('Validation constants', () => {
  it('PASSWORD_MIN_LENGTH is exactly 8', () => expect(PASSWORD_MIN_LENGTH).toBe(8));
  it('USERNAME_MIN_LENGTH is exactly 5', () => expect(USERNAME_MIN_LENGTH).toBe(5));
  it('USERNAME_MAX_LENGTH is exactly 25', () => expect(USERNAME_MAX_LENGTH).toBe(25));
  it('USERNAME_MIN_LENGTH < USERNAME_MAX_LENGTH', () => {
    expect(USERNAME_MIN_LENGTH).toBeLessThan(USERNAME_MAX_LENGTH);
  });
});

// ── API config ───────────────────────────────────────────────────────────────

describe('API_TIMEOUT', () => {
  it('is 30000ms (30 seconds)', () => expect(API_TIMEOUT).toBe(30000));
});

// ── Storage keys (used for JWT token management) ────────────────────────────

describe('STORAGE_KEYS exact values', () => {
  it('ACCESS_TOKEN key is "access_token"', () => {
    expect(STORAGE_KEYS.ACCESS_TOKEN).toBe('access_token');
  });
  it('REFRESH_TOKEN key is "refresh_token"', () => {
    expect(STORAGE_KEYS.REFRESH_TOKEN).toBe('refresh_token');
  });
  it('USER key is "user"', () => {
    expect(STORAGE_KEYS.USER).toBe('user');
  });
  it('THEME key is "theme"', () => {
    expect(STORAGE_KEYS.THEME).toBe('theme');
  });
  it('SIDEBAR_COLLAPSED key is "sidebar_collapsed"', () => {
    expect(STORAGE_KEYS.SIDEBAR_COLLAPSED).toBe('sidebar_collapsed');
  });
  it('has exactly 5 keys', () => expect(Object.keys(STORAGE_KEYS).length).toBe(5));
});

// ── Chart colors (used in dashboard charts) ─────────────────────────────────

describe('CHART_COLORS', () => {
  it('primary is #3b82f6', () => expect(CHART_COLORS.primary).toBe('#3b82f6'));
  it('success is #28a745', () => expect(CHART_COLORS.success).toBe('#28a745'));
  it('warning is #ffc107', () => expect(CHART_COLORS.warning).toBe('#ffc107'));
  it('danger is #dc3545', () => expect(CHART_COLORS.danger).toBe('#dc3545'));
  it('info is #40c4ff', () => expect(CHART_COLORS.info).toBe('#40c4ff'));
});

describe('VACCINATION_CHART_COLORS (health dashboard)', () => {
  it('vaccinated is #28a745', () => expect(VACCINATION_CHART_COLORS.vaccinated).toBe('#28a745'));
  it('pending is #ffc107', () => expect(VACCINATION_CHART_COLORS.pending).toBe('#ffc107'));
  it('overdue is #dc3545', () => expect(VACCINATION_CHART_COLORS.overdue).toBe('#dc3545'));
});

describe('STATUS_COLORS (environment monitoring)', () => {
  it('optimal is #28a745', () => expect(STATUS_COLORS.optimal).toBe('#28a745'));
  it('alert is #ffc107', () => expect(STATUS_COLORS.alert).toBe('#ffc107'));
  it('warning is #dc3545', () => expect(STATUS_COLORS.warning).toBe('#dc3545'));
  it('info is #40c4ff', () => expect(STATUS_COLORS.info).toBe('#40c4ff'));
});

// ── Query Keys (used by React Query caching) ────────────────────────────────

describe('QUERY_KEYS', () => {
  it('animals.all is ["animals"]', () => {
    expect(QUERY_KEYS.animals.all).toEqual(['animals']);
  });
  it('animals.statistics is ["animals", "statistics"]', () => {
    expect(QUERY_KEYS.animals.statistics).toEqual(['animals', 'statistics']);
  });
  it('animals.list returns array with filters', () => {
    const result = QUERY_KEYS.animals.list({ type: 'Cow' });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toBe('animals');
    expect(result).toContain('list');
  });
  it('animals.detail returns array with id', () => {
    const result = QUERY_KEYS.animals.detail(5);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain(5);
  });
  it('auth.dashboard is ["auth", "dashboard"]', () => {
    expect(QUERY_KEYS.auth.dashboard).toEqual(['auth', 'dashboard']);
  });
  it('alerts.active is ["alerts", "active"]', () => {
    expect(QUERY_KEYS.alerts.active).toEqual(['alerts', 'active']);
  });
  it('health.upcoming is ["health", "schedules", "upcoming"]', () => {
    expect(QUERY_KEYS.health.upcoming).toEqual(['health', 'schedules', 'upcoming']);
  });
  it('health.overdue is ["health", "schedules", "overdue"]', () => {
    expect(QUERY_KEYS.health.overdue).toEqual(['health', 'schedules', 'overdue']);
  });
});

// ── Error / Success messages ─────────────────────────────────────────────────

describe('ERROR_MESSAGES', () => {
  it('UNAUTHORIZED contains "login"', () => {
    expect(ERROR_MESSAGES.UNAUTHORIZED.toLowerCase()).toContain('login');
  });
  it('NETWORK_ERROR references connection', () => {
    expect(ERROR_MESSAGES.NETWORK_ERROR.toLowerCase()).toContain('network');
  });
});

describe('SUCCESS_MESSAGES', () => {
  it('LOGIN contains "successful"', () => {
    expect(SUCCESS_MESSAGES.LOGIN.toLowerCase()).toContain('successful');
  });
  it('DELETED references deletion', () => {
    expect(SUCCESS_MESSAGES.DELETED.toLowerCase()).toContain('deleted');
  });
});
