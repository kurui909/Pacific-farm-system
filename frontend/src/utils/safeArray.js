// src/utils/safeArray.js

/**
 * Ensures a value is always an array
 * @param {any} data - The data to ensure is an array
 * @returns {Array} - Always returns an array
 */
export const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data === null || data === undefined) return [];
  if (typeof data === 'object') {
    // Check for common array-like properties in API responses
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.pens)) return data.pens;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.inventory)) return data.inventory;
    if (Array.isArray(data.sales)) return data.sales;
    if (Array.isArray(data.notifications)) return data.notifications;
    if (Array.isArray(data.alerts)) return data.alerts;
    if (Array.isArray(data.blocks)) return data.blocks;
    if (Array.isArray(data.production)) return data.production;
    if (Array.isArray(data.feed)) return data.feed;
    if (Array.isArray(data.ingredients)) return data.ingredients;
    if (Array.isArray(data.mixes)) return data.mixes;
  }
  return [];
};

/**
 * Safely reduces an array
 * @param {any} arr - The array or array-like object
 * @param {Function} reducer - The reducer function
 * @param {any} initialValue - The initial value
 * @returns {any} - The reduced value
 */
export const safeReduce = (arr, reducer, initialValue) => {
  const safeArr = ensureArray(arr);
  if (safeArr.length === 0) return initialValue;
  return safeArr.reduce(reducer, initialValue);
};

/**
 * Safely maps over an array
 * @param {any} arr - The array or array-like object
 * @param {Function} mapper - The mapper function
 * @returns {Array} - The mapped array
 */
export const safeMap = (arr, mapper) => {
  return ensureArray(arr).map(mapper);
};

/**
 * Safely filters an array
 * @param {any} arr - The array or array-like object
 * @param {Function} predicate - The filter predicate
 * @returns {Array} - The filtered array
 */
export const safeFilter = (arr, predicate) => {
  return ensureArray(arr).filter(predicate);
};

/**
 * Safely gets the length of an array
 * @param {any} arr - The array or array-like object
 * @returns {number} - The length of the array
 */
export const safeLength = (arr) => {
  return ensureArray(arr).length;
};

/**
 * Safely checks if array is empty
 * @param {any} arr - The array or array-like object
 * @returns {boolean} - True if empty
 */
export const isEmpty = (arr) => {
  return ensureArray(arr).length === 0;
};

/**
 * Safely checks if array has items
 * @param {any} arr - The array or array-like object
 * @returns {boolean} - True if has items
 */
export const hasItems = (arr) => {
  return ensureArray(arr).length > 0;
};