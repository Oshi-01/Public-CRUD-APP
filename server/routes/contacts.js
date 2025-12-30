const express = require('express');
const axios = require('axios');
const { HUBSPOT_API_BASE, CONTACT_TYPE_ID } = require('../config/constants');
const { checkAuth, getAxiosConfig, handleError, parseLimit } = require('../utils/routeHelpers');

const router = express.Router();

// Association type IDs
const ASSOCIATION_TYPES = {
  company: 3,  // Contact to Company
  deal: 5      // Contact to Deal
};

router.use(checkAuth);

// Helper: Get associations
const getAssociations = async (req, res, fromObjectType, toObjectType) => {
  try {
    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v4/associations/${fromObjectType}/${toObjectType}/batch/read`,
      {
        params: {
          inputs: JSON.stringify([{ id: req.params.id }])
        },
        ...getAxiosConfig(req.accessToken)
      }
    );
    res.json(data || { results: [] });
  } catch (e) {
    handleError(res, e, `fetch ${toObjectType} associations`);
  }
};

// Helper: Create association
const createAssociation = async (req, res, toObjectType, toId, associationTypeId) => {
  try {
    // Use v4 API with default association type (matches working private app pattern)
    const { data } = await axios.put(
      `${HUBSPOT_API_BASE}/crm/v4/objects/contacts/${req.params.contactId}/associations/default/${toObjectType}/${toId}`,
      {},
      getAxiosConfig(req.accessToken, true)
    );
    res.json(data || { success: true });
  } catch (e) {
    // If association already exists (409), return success
    if (e.response?.status === 409) {
      return res.json({ success: true, message: 'Association already exists' });
    }
    console.error('Association creation error:', e.response?.data || e.message);
    handleError(res, e, `associate contact with ${toObjectType.slice(0, -1)}`);
  }
};

// Helper: Delete association
const deleteAssociation = async (req, res, toObjectType, toId, associationTypeId) => {
  try {
    // Use v4 API - no need to specify association type ID
    await axios.delete(
      `${HUBSPOT_API_BASE}/crm/v4/objects/contacts/${req.params.contactId}/associations/${toObjectType}/${toId}`,
      getAxiosConfig(req.accessToken)
    );
    res.json({ success: true });
  } catch (e) {
    // If association not found (404), return success (already removed)
    if (e.response?.status === 404) {
      return res.json({ success: true, message: 'Association not found' });
    }
    console.error('Association deletion error:', e.response?.data || e.message);
    handleError(res, e, `remove ${toObjectType.slice(0, -1)} association`);
  }
};

/**
 * GET /api/contacts - Fetch contacts
 */
router.get('/', async (req, res) => {
  try {
    const { after, limit = 20 } = req.query;
    const params = {
      limit: parseLimit(limit),
      properties: 'firstname,lastname,email',
      ...(after && { after })
    };

    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      { params, ...getAxiosConfig(req.accessToken) }
    );

    res.json({
      results: data.results,
      paging: {
        next: data.paging?.next?.after || null,
        prev: data.paging?.prev?.before || null,
      },
      hasMore: !!data.paging?.next?.after
    });
  } catch (e) {
    handleError(res, e, 'fetch contacts');
  }
});

/**
 * GET /api/contacts/count - Get total count
 */
router.get('/count', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/limits/records`,
      getAxiosConfig(req.accessToken)
    );

    const entry = data?.hubspotDefinedObjectTypes?.find(i => i.objectTypeId === CONTACT_TYPE_ID);
    res.json({ total: entry?.usage ?? 0 });
  } catch (e) {
    handleError(res, e, 'fetch contacts count');
  }
});

/**
 * GET /api/contacts/:id/associations - Get all associations for a contact with details (MUST be before /:id)
 */
router.get('/:id/associations', async (req, res) => {
  try {
    // Use v4 API to get associations
    const [companiesRes, dealsRes] = await Promise.all([
      axios.get(
        `${HUBSPOT_API_BASE}/crm/v4/objects/contacts/${req.params.id}/associations/companies`,
        getAxiosConfig(req.accessToken)
      ).catch(() => ({ data: { results: [] } })),
      axios.get(
        `${HUBSPOT_API_BASE}/crm/v4/objects/contacts/${req.params.id}/associations/deals`,
        getAxiosConfig(req.accessToken)
      ).catch(() => ({ data: { results: [] } }))
    ]);

    const companyIds = (companiesRes.data?.results || []).map(item => item.toObjectId);
    const dealIds = (dealsRes.data?.results || []).map(item => item.toObjectId);

    // Fetch company details
    let companies = [];
    if (companyIds.length > 0) {
      try {
        const companiesData = await axios.post(
          `${HUBSPOT_API_BASE}/crm/v3/objects/companies/batch/read`,
          {
            inputs: companyIds.map(id => ({ id })),
            properties: ['name', 'domain']
          },
          getAxiosConfig(req.accessToken, true)
        );
        companies = companiesData.data?.results || [];
      } catch (e) {
        console.error('Error fetching company details:', e.message);
      }
    }

    // Fetch deal details
    let deals = [];
    if (dealIds.length > 0) {
      try {
        const dealsData = await axios.post(
          `${HUBSPOT_API_BASE}/crm/v3/objects/deals/batch/read`,
          {
            inputs: dealIds.map(id => ({ id })),
            properties: ['dealname', 'amount', 'dealstage']
          },
          getAxiosConfig(req.accessToken, true)
        );
        deals = dealsData.data?.results || [];
      } catch (e) {
        console.error('Error fetching deal details:', e.message);
      }
    }

    res.json({
      companies: companies.map(c => ({
        id: c.id,
        name: c.properties?.name || `Company ${c.id}`,
        domain: c.properties?.domain || ''
      })),
      deals: deals.map(d => ({
        id: d.id,
        name: d.properties?.dealname || `Deal ${d.id}`,
        amount: d.properties?.amount || '',
        stage: d.properties?.dealstage || ''
      }))
    });
  } catch (e) {
    handleError(res, e, 'fetch associations');
  }
});

/**
 * POST /api/contacts/:contactId/associations/company/:companyId - Create association (MUST be before /:id)
 */
router.post('/:contactId/associations/company/:companyId', (req, res) => {
  createAssociation(req, res, 'companies', req.params.companyId, ASSOCIATION_TYPES.company);
});

/**
 * DELETE /api/contacts/:contactId/associations/company/:companyId - Remove association (MUST be before /:id)
 */
router.delete('/:contactId/associations/company/:companyId', (req, res) => {
  deleteAssociation(req, res, 'companies', req.params.companyId, ASSOCIATION_TYPES.company);
});

/**
 * POST /api/contacts/:contactId/associations/deal/:dealId - Create association (MUST be before /:id)
 */
router.post('/:contactId/associations/deal/:dealId', (req, res) => {
  createAssociation(req, res, 'deals', req.params.dealId, ASSOCIATION_TYPES.deal);
});

/**
 * DELETE /api/contacts/:contactId/associations/deal/:dealId - Remove association (MUST be before /:id)
 */
router.delete('/:contactId/associations/deal/:dealId', (req, res) => {
  deleteAssociation(req, res, 'deals', req.params.dealId, ASSOCIATION_TYPES.deal);
});

/**
 * GET /api/contacts/:id - Get contact details (MUST be after association routes)
 */
router.get('/:id', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${req.params.id}`,
      {
        params: {
          properties: 'firstname,lastname,email,phone,mobilephone,company,website,lifecyclestage,lead_status,hs_lead_status,createdate,lastmodifieddate'
        },
        headers: {
          Authorization: `Bearer ${req.accessToken}`,
        }
      }
    );
    res.json(data);
  } catch (e) {
    handleError(res, e, 'fetch contact details');
  }
});

/**
 * POST /api/contacts - Create contact
 */
router.post('/', async (req, res) => {
  try {
    const { data } = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      req.body,
      getAxiosConfig(req.accessToken, true)
    );
    res.status(201).json(data);
  } catch (e) {
    handleError(res, e, 'create contact');
  }
});

/**
 * PUT /api/contacts/:id - Update contact
 */
router.put('/:id', async (req, res) => {
  try {
    const { data } = await axios.patch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${req.params.id}`,
      req.body,
      getAxiosConfig(req.accessToken, true)
    );
    res.json(data);
  } catch (e) {
    handleError(res, e, 'update contact');
  }
});

module.exports = router;
