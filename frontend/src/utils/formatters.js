// src/utils/formatters.js

/**
 * Format a date as relative time (e.g., "2 hours ago", "yesterday", "on Jan 5")
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return 'Unknown date';
  
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  // Same day: show time difference
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'yesterday';
  
  // Within last 7 days: show day name
  if (diffDay < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `on ${days[date.getDay()]}`;
  }
  
  // Older: show date
  return `on ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat().format(num);
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format phone number (basic US formatting)
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Format API error message – extracts readable message from various error shapes
 */
export const formatApiError = (error, fallback = 'An unexpected error occurred') => {
  if (!error) return fallback;
  
  // Axios error with response data
  if (error.response?.data) {
    const data = error.response.data;
    
    // FastAPI validation error (list of errors)
    if (data.detail && Array.isArray(data.detail)) {
      return data.detail
        .map((err) => err.msg || err.message || JSON.stringify(err))
        .join(', ');
    }
    
    // String detail
    if (typeof data.detail === 'string') return data.detail;
    
    // Message field
    if (typeof data.message === 'string') return data.message;
    
    // Non-field error
    if (typeof data.error === 'string') return data.error;
  }
  
  // Error with message property
  if (error.message) return error.message;
  
  // Fallback
  return fallback;
};

/**
 * Format a date as a string
 */
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}