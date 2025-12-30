const express = require('express');
const axios = require('axios');
const { HUBSPOT_API_BASE } = require('../config/constants');
const { getAccessToken } = require('../utils/tokens');

const router = express.Router();

// Middleware: Check authorization
const checkAuth = (req, res, next) => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized. Please connect your HubSpot account.' 
    });
  }
  req.accessToken = accessToken;
  next();
};

router.use(checkAuth);

// Helper: Create axios config
const getAxiosConfig = (accessToken) => ({
  headers: { Authorization: `Bearer ${accessToken}` }
});

// Helper: Fetch account info via OAuth endpoint
const fetchOAuthAccountInfo = async (accessToken) => {
  const { data } = await axios.get(
    `${HUBSPOT_API_BASE}/oauth/v1/access-tokens/${accessToken}`,
    getAxiosConfig(accessToken)
  );

  const { hub_domain, hub_id, user } = data;

  return {
    portalId: hub_id,
    accountName: hub_domain || `HubSpot Account ${hub_id || ''}`.trim(),
    hubDomain: hub_domain,
    userEmail: user,
    ...data
  };
};

// Helper: Fallback to get portal ID from CRM API
const fetchFallbackAccountInfo = async (accessToken) => {
  const { headers } = await axios.get(
    `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
    { params: { limit: 1 }, ...getAxiosConfig(accessToken) }
  );

  const portalId = headers['x-hubspot-portal-id'] || headers['x-hubspot-portal'] || 'Connected';

  return {
    portalId,
    accountName: `HubSpot Account ${portalId}`
  };
};

/**
 * GET /api/account - Fetch HubSpot account information
 */
router.get('/', async (req, res) => {
  try {
    const accountInfo = await fetchOAuthAccountInfo(req.accessToken);
    res.json(accountInfo);
  } catch (e) {
    console.error('Error fetching account info:', e.response?.data || e.message);

    try {
      const fallbackInfo = await fetchFallbackAccountInfo(req.accessToken);
      res.json(fallbackInfo);
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError.response?.data || fallbackError.message);
      res.status(500).json({ 
        error: 'Failed to fetch account information', 
        details: e.response?.data || e.message 
      });
    }
  }
});

module.exports = router;