const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { HUBSPOT_AUTH_URL, HUBSPOT_TOKEN_URL, HUBSPOT_API_BASE } = require('../config/constants');
const { setTokens, getRefreshToken, clearTokens } = require('../utils/tokens');

const router = express.Router();

// In-memory state store (use Redis/DB in production)
const stateStore = new Map();

// Helper function to normalize redirect URI
function normalizeRedirectUri(uri, req) {
  if (!uri) return null;
  
  let normalized = uri.trim();
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || (req.secure ? 'https' : 'http');
  
  // If URI doesn't start with http:// or https://, construct it from request
  if (!normalized.match(/^https?:\/\//)) {
    // If URI starts with /, prepend protocol and host
    if (normalized.startsWith('/')) {
      normalized = `${protocol}://${host}${normalized}`;
    } else {
      // Otherwise, assume it's a full URL missing protocol
      normalized = `${protocol}://${normalized}`;
    }
  }
  
  // In production, if redirect URI contains localhost but request is from production domain,
  // replace it with the actual production domain
  if (normalized.includes('localhost') && !host.includes('localhost')) {
    try {
      // Extract the path from the redirect URI
      const urlObj = new URL(normalized);
      const path = urlObj.pathname;
      // Construct new URI with production host
      normalized = `${protocol}://${host}${path}`;
    } catch (e) {
      // If URL parsing fails, assume it's a path and construct from scratch
      const path = normalized.includes('/') ? normalized.substring(normalized.indexOf('/')) : '/oauth-callback';
      normalized = `${protocol}://${host}${path}`;
    }
  }
  
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  
  return normalized;
}

router.get('/auth', (req, res) => {
  const clientId = process.env.HUBSPOT_CLIENT_ID?.trim();
  let redirectUri = process.env.HUBSPOT_REDIRECT_URI?.trim();
  const scopes = process.env.HUBSPOT_SCOPES?.trim();
  const optionalScopes = process.env.HUBSPOT_OPTIONAL_SCOPES?.trim();

  if (!clientId || !redirectUri || !scopes) {
    return res.status(500).send('<h1>Configuration Error</h1><p>Missing required environment variables.</p>');
  }

  // Normalize redirect URI
  redirectUri = normalizeRedirectUri(redirectUri, req);
  
  if (!redirectUri) {
    return res.status(500).send('<h1>Configuration Error</h1><p>Invalid redirect URI configuration.</p>');
  }

  // Log the redirect URI being used (for debugging)
  console.log('OAuth redirect URI:', redirectUri);

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  // Store the redirect URI in state so callback can use the same one
  stateStore.set(state, { 
    timestamp: Date.now(),
    redirectUri: redirectUri 
  });

  // Clean up old states (older than 10 minutes)
  const TEN_MINUTES = 10 * 60 * 1000;
  for (const [key, value] of stateStore) {
    if (Date.now() - value.timestamp > TEN_MINUTES) {
      stateStore.delete(key);
    }
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    state,
  });

  // Add optional scopes if configured
  if (optionalScopes) {
    params.append('optional_scope', optionalScopes);
  }

  res.redirect(`${HUBSPOT_AUTH_URL}?${params.toString()}`);
});

router.get('/oauth-callback', async (req, res) => {
  const { code, error, error_description, state } = req.query;

  // Validate state parameter for CSRF protection
  if (!state || !stateStore.has(state)) {
    return res.status(400).send('<h1>Invalid State</h1><p>CSRF validation failed.</p>');
  }
  
  // Get redirect URI from state (stored during /auth request)
  const stateData = stateStore.get(state);
  let redirectUri = stateData?.redirectUri;
  stateStore.delete(state);

  if (error) {
    // Redirect to login page with error message
    const errorMsg = encodeURIComponent(`${error}: ${error_description || ''}`);
    return res.redirect(`/login.html?error=${errorMsg}`);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  const clientId = process.env.HUBSPOT_CLIENT_ID?.trim();
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET?.trim();
  
  // If redirect URI wasn't stored in state, fall back to env var
  if (!redirectUri) {
    redirectUri = process.env.HUBSPOT_REDIRECT_URI?.trim();
  }

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).send('<h1>Configuration Error</h1><p>Missing environment variables.</p>');
  }

  // Normalize redirect URI (must match the one used in /auth)
  redirectUri = normalizeRedirectUri(redirectUri, req);
  
  if (!redirectUri) {
    return res.status(500).send('<h1>Configuration Error</h1><p>Invalid redirect URI configuration.</p>');
  }

  // Log the redirect URI being used (for debugging)
  console.log('OAuth callback redirect URI:', redirectUri);

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await axios.post(HUBSPOT_TOKEN_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    
    // Store tokens with expiration time
    const expiresAt = Date.now() + (expires_in * 1000);
    setTokens('demo', access_token, refresh_token, expiresAt);

    // Redirect to dashboard after successful login
    res.redirect('/');
  } catch (e) {
    console.error('OAuth error:', e.response?.data || e.message);
    res.status(500).send('OAuth error: Failed to exchange code for token');
  }
});

router.get('/logout', async (req, res) => {
  // Determine where to send the user after logout
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  const loginPath = '/login.html';
  const redirectUrl = frontendUrl
    ? `${frontendUrl.replace(/\/$/, '')}${loginPath}`
    : loginPath;

  try {
    const refreshToken = getRefreshToken('demo'); // Get stored refresh token
    
    if (refreshToken) {
      // Delete the refresh token from HubSpot
      try {
        await axios.delete(
          `${HUBSPOT_API_BASE}/oauth/v1/refresh-tokens/${refreshToken}`
        );
      } catch (deleteError) {
        // Log error but continue with local token clearing
        console.error('Error deleting refresh token from HubSpot:', deleteError.response?.data || deleteError.message);
      }
    }
    
    // Clear local tokens
    clearTokens('demo');
    
    // Redirect to frontend login page after logout
    res.redirect(redirectUrl);
  } catch (e) {
    console.error('Logout error:', e.response?.data || e.message);
    // Clear local tokens even if HubSpot deletion fails
    clearTokens('demo');
    // Redirect to frontend login page after logout
    res.redirect(redirectUrl);
  }
});

module.exports = router;