const express = require('express');
const axios = require('axios');
const { HUBSPOT_API_BASE } = require('../config/constants');
const { getAccessToken } = require('../utils/tokens');

const router = express.Router();

/**
 * GET /api/account
 * Fetch HubSpot account information
 */
router.get('/', async (req, res) => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized. Please connect your HubSpot account.' 
    });
  }

  try {
    // Fetch account information from HubSpot OAuth access tokens endpoint
    const accountInfoRes = await axios.get(
      `${HUBSPOT_API_BASE}/oauth/v1/access-tokens/${accessToken}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const { hub_domain, hub_id, user } = accountInfoRes.data;
    
    // hub_domain = account name (e.g., "meowmix.com")
    // hub_id = HubSpot account ID
    // user = email of the user who authorized
    
    const accountName = hub_domain || `HubSpot Account ${hub_id || ''}`.trim();
    
    return res.json({
      portalId: hub_id,
      accountName,
      hubDomain: hub_domain,
      userEmail: user,
      ...accountInfoRes.data,
    });
  } catch (e) {
    console.error('Error fetching account info:', e.response?.data || e.message);
    
    // Fallback: try to get portal ID from a CRM API call
    try {
      const testResponse = await axios.get(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
        params: { limit: 1 },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      // Extract portal ID from response headers or use a default
      const portalId = testResponse.headers['x-hubspot-portal-id'] || 
                      testResponse.headers['x-hubspot-portal'] || 
                      'Connected';
      
      return res.json({
        portalId,
        accountName: `HubSpot Account ${portalId}`,
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Failed to fetch account information', 
        details: e.response?.data || e.message 
      });
    }
  }
});

module.exports = router;

