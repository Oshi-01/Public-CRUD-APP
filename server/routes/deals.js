const express = require('express');
const axios = require('axios');
const { HUBSPOT_API_BASE } = require('../config/constants');
const { getAccessToken } = require('../utils/tokens');

const router = express.Router();

/**
 * GET /api/deals
 * Fetch deals from HubSpot CRM
 */
router.get('/', async (req, res) => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized. Please connect your HubSpot account.' 
    });
  }

  try {
    const { after, limit = 20 } = req.query;
    
    const params = {
      limit: Math.min(parseInt(limit) || 20, 100), // Max 100 per page
      properties: 'dealname,amount,dealstage',
    };

    // Add cursor for next page
    if (after) {
      params.after = after;
    }

    const response = await axios.get(`${HUBSPOT_API_BASE}/crm/v3/objects/deals`, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { results, paging } = response.data;
    
    res.json({
      results,
      paging: {
        next: paging?.next?.after || null, // Cursor for next page
        prev: paging?.prev?.before || null, // Cursor for previous page
      },
      hasMore: !!paging?.next?.after
    });
  } catch (e) {
    console.error('Error fetching deals:', e.response?.data || e.message);
    res.status(500).json({ 
      error: 'Failed to fetch deals', 
      details: e.response?.data || e.message 
    });
  }
});

/**
 * GET /api/deals/search
 * Search deals by name (for association dropdown)
 */
router.get('/search', async (req, res) => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized. Please connect your HubSpot account.' 
    });
  }

  try {
    const { q, limit = 50 } = req.query;
    
    const params = {
      limit: Math.min(parseInt(limit) || 50, 100),
      properties: 'dealname,amount,dealstage',
    };

    // If search query provided, use search API
    if (q && q.trim()) {
      const searchResponse = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/deals/search`,
        {
          filterGroups: [{
            filters: [{
              propertyName: 'dealname',
              operator: 'CONTAINS_TOKEN',
              value: q.trim()
            }]
          }],
          limit: Math.min(parseInt(limit) || 50, 100),
          properties: ['dealname', 'amount', 'dealstage']
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return res.json({
        results: searchResponse.data.results || [],
        hasMore: !!searchResponse.data.paging?.next?.after
      });
    }

    // Otherwise return regular list
    const response = await axios.get(`${HUBSPOT_API_BASE}/crm/v3/objects/deals`, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    res.json({
      results: response.data.results || [],
      hasMore: !!response.data.paging?.next?.after
    });
  } catch (e) {
    console.error('Error searching deals:', e.response?.data || e.message);
    res.status(500).json({ 
      error: 'Failed to search deals', 
      details: e.response?.data || e.message 
    });
  }
});

/**
 * POST /api/deals
 * Create a new deal in HubSpot CRM
 */
router.post('/', async (req, res) => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized. Please connect your HubSpot account.' 
    });
  }

  try {
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    res.status(201).json(response.data);
  } catch (e) {
    console.error('Error creating deal:', e.response?.data || e.message);
    res.status(500).json({ 
      error: 'Failed to create deal', 
      details: e.response?.data || e.message 
    });
  }
});

/**
 * PUT /api/deals/:id
 * Update a deal in HubSpot CRM
 */
router.put('/:id', async (req, res) => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized. Please connect your HubSpot account.' 
    });
  }

  try {
    const dealId = req.params.id;
    const response = await axios.patch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    res.json(response.data);
  } catch (e) {
    console.error('Error updating deal:', e.response?.data || e.message);
    res.status(500).json({ 
      error: 'Failed to update deal', 
      details: e.response?.data || e.message 
    });
  }
});

module.exports = router;

