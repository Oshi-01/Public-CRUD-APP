// In-memory token store (use Redis/DB in production)
const tokenStore = new Map();

const DEFAULT_USER = 'demo';

/**
 * Get tokens for a user
 * @param {string} userId - User identifier
 * @returns {Object|undefined} - Token object or undefined
 */
const getTokens = (userId = DEFAULT_USER) => tokenStore.get(userId);

/**
 * Get access token for a user
 * @param {string} userId - User identifier
 * @returns {string|null} - Access token or null
 */
const getAccessToken = (userId = DEFAULT_USER) => getTokens(userId)?.accessToken || null;

/**
 * Get refresh token for a user
 * @param {string} userId - User identifier
 * @returns {string|null} - Refresh token or null
 */
const getRefreshToken = (userId = DEFAULT_USER) => getTokens(userId)?.refreshToken || null;

/**
 * Check if tokens are expired
 * @param {string} userId - User identifier
 * @returns {boolean} - True if expired or not found
 */
const isTokenExpired = (userId = DEFAULT_USER) => {
  const tokens = getTokens(userId);
  if (!tokens?.expiresAt) return true;
  return Date.now() >= tokens.expiresAt - 60000; // 1 min buffer
};

/**
 * Set tokens for a user
 * @param {string} userId - User identifier
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @param {number} expiresAt - Expiration timestamp (ms)
 */
const setTokens = (userId, accessToken, refreshToken, expiresAt = null) => {
  tokenStore.set(userId, { accessToken, refreshToken, expiresAt });
};

/**
 * Clear tokens for a user
 * @param {string} userId - User identifier
 */
const clearTokens = (userId = DEFAULT_USER) => tokenStore.delete(userId);

/**
 * Check if user has tokens
 * @param {string} userId - User identifier
 * @returns {boolean} - True if tokens exist
 */
const hasTokens = (userId = DEFAULT_USER) => tokenStore.has(userId);

module.exports = {
  getAccessToken,
  getRefreshToken,
  getTokens,
  setTokens,
  clearTokens,
  isTokenExpired,
  hasTokens
};