const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { HUBSPOT_AUTH_URL, HUBSPOT_TOKEN_URL, HUBSPOT_API_BASE } = require('../config/constants');
const { setTokens, getRefreshToken, clearTokens } = require('../utils/tokens');

const router = express.Router();

// In-memory state store (use Redis/DB in production)
const stateStore = new Map();
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Helper: Get environment config
const getEnvConfig = () => ({
  clientId: process.env.HUBSPOT_CLIENT_ID?.trim(),
  clientSecret: process.env.HUBSPOT_CLIENT_SECRET?.trim(),
  redirectUri: process.env.HUBSPOT_REDIRECT_URI?.trim(),
  scopes: process.env.HUBSPOT_SCOPES?.trim(),
  optionalScopes: process.env.HUBSPOT_OPTIONAL_SCOPES?.trim(),
  frontendUrl: process.env.FRONTEND_URL?.trim()?.replace(/\/$/, '')
});

// Helper: Normalize redirect URI
const normalizeRedirectUri = (uri, req) => {
  if (!uri) return null;

  let normalized = uri.trim();
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || (req.secure ? 'https' : 'http');

  // Add protocol if missing
  if (!normalized.match(/^https?:\/\//)) {
    normalized = normalized.startsWith('/')
      ? `${protocol}://${host}${normalized}`
      : `${protocol}://${normalized}`;
  }

  // Replace localhost with production host if needed
  if (normalized.includes('localhost') && !host.includes('localhost')) {
    try {
      const { pathname } = new URL(normalized);
      normalized = `${protocol}://${host}${pathname}`;
    } catch {
      const path = normalized.includes('/') 
        ? normalized.substring(normalized.indexOf('/')) 
        : '/oauth-callback';
      normalized = `${protocol}://${host}${path}`;
    }
  }

  return normalized.replace(/\/$/, '');
};

// Helper: Clean expired states
const cleanExpiredStates = () => {
  const now = Date.now();
  for (const [key, { timestamp }] of stateStore) {
    if (now - timestamp > STATE_EXPIRY_MS) stateStore.delete(key);
  }
};

// Helper: Build redirect URL
const buildRedirectUrl = (frontendUrl, path) => 
  frontendUrl ? `${frontendUrl}${path}` : path;

/**
 * GET /auth - Initiate OAuth flow
 */
router.get('/auth', (req, res) => {
  const { clientId, redirectUri: envRedirectUri, scopes, optionalScopes } = getEnvConfig();

  if (!clientId || !envRedirectUri || !scopes) {
    return res.status(500).send('<h1>Configuration Error</h1><p>Missing required environment variables.</p>');
  }

  const redirectUri = normalizeRedirectUri(envRedirectUri, req);
  if (!redirectUri) {
    return res.status(500).send('<h1>Configuration Error</h1><p>Invalid redirect URI configuration.</p>');
  }

  console.log('OAuth redirect URI:', redirectUri);

  // Generate CSRF state
  const state = crypto.randomBytes(16).toString('hex');
  stateStore.set(state, { timestamp: Date.now(), redirectUri });
  cleanExpiredStates();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    state
  });

  if (optionalScopes) params.append('optional_scope', optionalScopes);

  res.redirect(`${HUBSPOT_AUTH_URL}?${params}`);
});

/**
 * GET /oauth-callback - Handle OAuth callback
 */
router.get('/oauth-callback', async (req, res) => {
  const { code, error, error_description, state } = req.query;
  const { clientId, clientSecret, redirectUri: envRedirectUri, frontendUrl } = getEnvConfig();

  // Validate CSRF state
  if (!state || !stateStore.has(state)) {
    return res.status(400).send('<h1>Invalid State</h1><p>CSRF validation failed.</p>');
  }

  const stateData = stateStore.get(state);
  stateStore.delete(state);

  if (error) {
    return res.redirect(`/login.html?error=${encodeURIComponent(`${error}: ${error_description || ''}`)}`);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  const redirectUri = normalizeRedirectUri(stateData?.redirectUri || envRedirectUri, req);
  
  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).send('<h1>Configuration Error</h1><p>Missing environment variables.</p>');
  }

  console.log('OAuth callback redirect URI:', redirectUri);

  try {
    const { data } = await axios.post(
      HUBSPOT_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const expiresAt = Date.now() + (data.expires_in * 1000);
    setTokens('demo', data.access_token, data.refresh_token, expiresAt);

    res.redirect(buildRedirectUrl(frontendUrl, '/'));
  } catch (e) {
    console.error('OAuth error:', e.response?.data || e.message);
    res.status(500).send('OAuth error: Failed to exchange code for token');
  }
});

/**
 * GET /logout - Clear tokens and logout
 */
router.get('/logout', async (req, res) => {
  const { frontendUrl } = getEnvConfig();
  const redirectUrl = buildRedirectUrl(frontendUrl, '/login.html');

  try {
    const refreshToken = getRefreshToken('demo');

    if (refreshToken) {
      await axios.delete(`${HUBSPOT_API_BASE}/oauth/v1/refresh-tokens/${refreshToken}`)
        .catch(e => console.error('Error deleting refresh token:', e.response?.data || e.message));
    }
  } catch (e) {
    console.error('Logout error:', e.response?.data || e.message);
  } finally {
    clearTokens('demo');
    res.redirect(redirectUrl);
  }
});

module.exports = router;