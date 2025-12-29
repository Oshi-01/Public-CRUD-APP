const express = require('express');
const axios = require('axios');
const { HUBSPOT_API_BASE } = require('../config/constants');
const { getAccessToken } = require('../utils/tokens');

const router = express.Router();

/**
 * GET /api/contacts
 * Fetch contacts from HubSpot CRM
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
      properties: 'firstname,lastname,email',
    };

    // Add cursor for next page
    if (after) {
      params.after = after;
    }

    const response = await axios.get(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
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
    console.error('Error fetching contacts:', e.response?.data || e.message);
    res.status(500).json({ 
      error: 'Failed to fetch contacts', 
      details: e.response?.data || e.message 
    });
  }
});

/**
 * POST /api/contacts
 * Create a new contact in HubSpot CRM
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
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
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
    console.error('Error creating contact:', e.response?.data || e.message);
    res.status(500).json({ 
      error: 'Failed to create contact', 
      details: e.response?.data || e.message 
    });
  }
});

/**
 * PUT /api/contacts/:id
 * Update a contact in HubSpot CRM
 */
router.put('/:id', async (req, res) => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized. Please connect your HubSpot account.' 
    });
  }

  try {
    const contactId = req.params.id;
    const response = await axios.patch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`,
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
    console.error('Error updating contact:', e.response?.data || e.message);
    res.status(500).json({ 
      error: 'Failed to update contact', 
      details: e.response?.data || e.message 
    });
  }
});

/**
 * POST /api/contacts/:contactId/associations/company/:companyId
 * Associate a contact with a company using v4 API
 */
router.post('/:contactId/associations/company/:companyId', async (req, res) => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized. Please connect your HubSpot account.' 
    });
  }

  try {
    const { contactId, companyId } = req.params;
    
    // Use v4 API for batch create associations
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v4/associations/contacts/companies/batch/create`,
      {
        inputs: [{
          from: { id: contactId },
          to: { id: companyId },
          types: [{
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId: 3 // Contact to Company association type
          }]
        }]
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    res.json(response.data || { success: true });
  } catch (e) {
    console.error('Error associating contact with company:', e.response?.data || e.message);
    res.status(500).json({ 
      error: 'Failed to associate contact with company', 
      details: e.response?.data || e.message 
    });
  }
});

/**
 * POST /api/contacts/:contactId/associations/deal/:dealId
 * Associate a contact with a deal using v4 API
 */
router.post('/:contactId/associations/deal/:dealId', async (req, res) => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized. Please connect your HubSpot account.' 
    });
  }

  try {
    const { contactId, dealId } = req.params;
    
    // Use v4 API for batch create associations
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v4/associations/contacts/deals/batch/create`,
      {
        inputs: [{
          from: { id: contactId },
          to: { id: dealId },
          types: [{
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId: 5 // Contact to Deal association type
          }]
        }]
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    res.json(response.data || { success: true });
  } catch (e) {
    console.error('Error associating contact with deal:', e.response?.data || e.message);
    res.status(500).json({ 
      error: 'Failed to associate contact with deal', 
      details: e.response?.data || e.message 
    });
  }
});

module.exports = router;

