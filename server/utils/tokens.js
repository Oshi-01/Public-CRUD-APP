
let tokensByUser = {};

/**
 * Get access token for a user
 * @param {string} userId - User identifier (defaults to 'demo')
 * @returns {string|null} - Access token or null if not found
 */
function getAccessToken(userId = 'demo') {
  const tokens = tokensByUser[userId];
  return tokens?.access_token || null;
}

/**
 * Set tokens for a user
 * @param {string} userId - User identifier
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
function setTokens(userId, accessToken, refreshToken) {
  tokensByUser[userId] = {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

/**
 * Get refresh token for a user
 * @param {string} userId - User identifier (defaults to 'demo')
 * @returns {string|null} - Refresh token or null if not found
 */
function getRefreshToken(userId = 'demo') {
  const tokens = tokensByUser[userId];
  return tokens?.refresh_token || null;
}

/**
 * Clear tokens for a user
 * @param {string} userId - User identifier (defaults to 'demo')
 */
function clearTokens(userId = 'demo') {
  delete tokensByUser[userId];
}

module.exports = {
  getAccessToken,
  setTokens,
  getRefreshToken,
  clearTokens,
};

