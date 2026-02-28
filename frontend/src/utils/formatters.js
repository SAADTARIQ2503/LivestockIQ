import { format, formatDistance, formatRelative } from 'date-fns';

/**
 * Format a date to a readable string
 * @param {Date|string} date - Date to format
 * @param {string} formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns {string} Formatted date
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Format date and time
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

/**
 * Format time only
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time
 */
export const formatTime = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
};

/**
 * Format date relative to now (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative date
 */
export const formatRelativeDate = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number with commas
 * @param {number} number - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number
 */
export const formatNumber = (number, decimals = 0) => {
  if (typeof number !== 'number') return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/**
 * Format percentage
 * @param {number} value - Value to format (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (typeof value !== 'number') return '';
  return `${formatNumber(value, decimals)}%`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Capitalize first letter
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
