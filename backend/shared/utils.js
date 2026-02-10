// Shared utilities for all QUICKAID microservices
const crypto = require('crypto');

/**
 * Generate a prefixed unique ID
 * @param {string} prefix - ID prefix (e.g., 'USR', 'BKG', 'HSP')
 * @returns {string} Generated ID
 */
function genId(prefix = 'ID') {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Get current UTC timestamp in ISO format
 * @returns {string} ISO timestamp
 */
function nowUTC() {
  return new Date().toISOString();
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine inventory freshness state based on last update time
 * @param {string} lastUpdateISO - Last update timestamp in ISO format
 * @returns {string} 'verified' | 'unverified' | 'disabled'
 */
function freshnessState(lastUpdateISO) {
  const last = new Date(lastUpdateISO).getTime();
  const diffMin = (Date.now() - last) / 60000;
  if (diffMin <= 5) return 'verified';
  if (diffMin <= 10) return 'unverified';
  return 'disabled';
}

/**
 * Hash a value using SHA-256
 * @param {string} value - Value to hash
 * @returns {string} Hex-encoded hash
 */
function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

/**
 * Create HMAC-SHA256 signature
 * @param {string} payload - Payload to sign
 * @param {string} secret - Secret key
 * @returns {string} Base64-encoded signature
 */
function hmacSign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64');
}

/**
 * Verify HMAC-SHA256 signature
 * @param {string} payload - Original payload
 * @param {string} signature - Signature to verify
 * @param {string} secret - Secret key
 * @returns {boolean} Whether signature is valid
 */
function hmacVerify(payload, signature, secret) {
  const expected = hmacSign(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise<any>} Result of function
 */
async function retry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}

/**
 * Validate required fields in an object
 * @param {object} obj - Object to validate
 * @param {string[]} required - Required field names
 * @returns {{valid: boolean, missing: string[]}}
 */
function validateRequired(obj, required) {
  const missing = required.filter(field => obj[field] === undefined || obj[field] === null);
  return { valid: missing.length === 0, missing };
}

/**
 * Sanitize phone number to E.164 format
 * @param {string} phone - Phone number
 * @returns {string} Sanitized phone number
 */
function sanitizePhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

module.exports = {
  genId,
  nowUTC,
  distanceKm,
  freshnessState,
  sha256,
  hmacSign,
  hmacVerify,
  sleep,
  retry,
  validateRequired,
  sanitizePhone
};
