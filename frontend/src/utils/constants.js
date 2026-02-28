/**
 * Application-wide constants
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
export const API_TIMEOUT = 30000; // 30 seconds

// Animal Types
export const ANIMAL_TYPES = {
  COW: 'Cow',
  GOAT: 'Goat',
  SHEEP: 'Sheep',
};

export const ANIMAL_TYPE_OPTIONS = [
  { value: 'Cow', label: 'Cow' },
  { value: 'Goat', label: 'Goat' },
  { value: 'Sheep', label: 'Sheep' },
];

// Sex Options
export const SEX_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

// Severity Levels
export const SEVERITY_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const SEVERITY_COLORS = {
  Low: '#28a745',
  Medium: '#ffc107',
  High: '#dc3545',
};

// Seasons
export const SEASONS = [
  'Winter',
  'Spring',
  'Summer',
  'Pre-Monsoon',
  'Autumn',
];

export const SEASON_OPTIONS = [
  { value: 'current', label: 'Current Season' },
  { value: 'Winter', label: 'Winter' },
  { value: 'Spring', label: 'Spring' },
  { value: 'Summer', label: 'Summer' },
  { value: 'Pre-Monsoon', label: 'Pre-Monsoon' },
  { value: 'Autumn', label: 'Autumn' },
  { value: 'seasonal', label: 'All Seasonal' },
  { value: 'non-seasonal', label: 'Non-Seasonal' },
];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Validation
export const PASSWORD_MIN_LENGTH = 8;
export const USERNAME_MIN_LENGTH = 5;
export const USERNAME_MAX_LENGTH = 25;

// Chart Colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  info: '#40c4ff',
  secondary: '#6c757d',
};

export const VACCINATION_CHART_COLORS = {
  vaccinated: '#28a745',
  pending: '#ffc107',
  overdue: '#dc3545',
};

// Status Colors
export const STATUS_COLORS = {
  optimal: '#28a745',
  alert: '#ffc107',
  warning: '#dc3545',
  info: '#40c4ff',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
};

// Query Keys for React Query
export const QUERY_KEYS = {
  auth: {
    user: ['auth', 'user'],
    dashboard: ['auth', 'dashboard'],
  },
  animals: {
    all: ['animals'],
    list: (filters) => ['animals', 'list', filters],
    detail: (id) => ['animals', 'detail', id],
    statistics: ['animals', 'statistics'],
  },
  health: {
    schedules: (filters) => ['health', 'schedules', filters],
    vaccines: (filters) => ['health', 'vaccines', filters],
    upcoming: ['health', 'schedules', 'upcoming'],
    overdue: ['health', 'schedules', 'overdue'],
  },
  environment: {
    status: (location) => ['environment', 'status', location],
    weather: (location) => ['environment', 'weather', location],
  },
  alerts: {
    all: (filters) => ['alerts', filters],
    detail: (id) => ['alerts', 'detail', id],
    statistics: ['alerts', 'statistics'],
    unacknowledged: ['alerts', 'unacknowledged'],
  },
  costs: {
    defaults: (type) => ['costs', 'defaults', type],
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized. Please login again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  REGISTER: 'Registration successful! Please login.',
  LOGOUT: 'Logged out successfully.',
  CREATED: 'Created successfully!',
  UPDATED: 'Updated successfully!',
  DELETED: 'Deleted successfully!',
};
