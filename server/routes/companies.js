const express = require('express');
const axios = require('axios');
const { HUBSPOT_API_BASE, COMPANY_TYPE_ID } = require('../config/constants');
const { checkAuth, getAxiosConfig, handleError, parseLimit } = require('../utils/routeHelpers');

const router = express.Router();

router.use(checkAuth);

/**
 * GET /api/companies - Fetch companies
 */
router.get('/', async (req, res) => {
  try {
    const { after, limit = 20 } = req.query;
    const params = {
      limit: parseLimit(limit),
      properties: 'name,domain,phone,website,industry,city,state,country,zip',
      ...(after && { after })
    };

    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/companies`,
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
    handleError(res, e, 'fetch companies');
  }
});

/**
 * GET /api/companies/count - Get total count
 */
router.get('/count', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/limits/records`,
      getAxiosConfig(req.accessToken)
    );

    const entry = data?.hubspotDefinedObjectTypes?.find(i => i.objectTypeId === COMPANY_TYPE_ID);
    res.json({ total: entry?.usage ?? 0 });
  } catch (e) {
    handleError(res, e, 'fetch companies count');
  }
});

/**
 * GET /api/companies/search - Search companies (must be before /:id route)
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    const parsedLimit = parseLimit(limit, 50);
    const properties = ['name', 'domain'];

    if (q?.trim()) {
      const { data } = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/companies/search`,
        {
          filterGroups: [{ filters: [{ propertyName: 'name', operator: 'CONTAINS_TOKEN', value: q.trim() }] }],
          limit: parsedLimit,
          properties
        },
        getAxiosConfig(req.accessToken, true)
      );
      return res.json({ results: data.results || [], hasMore: !!data.paging?.next?.after });
    }

    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/companies`,
      { params: { limit: parsedLimit, properties: properties.join(',') }, ...getAxiosConfig(req.accessToken) }
    );
    res.json({ results: data.results || [], hasMore: !!data.paging?.next?.after });
  } catch (e) {
    handleError(res, e, 'search companies');
  }
});

/**
 * GET /api/companies/:id - Get company details
 */
router.get('/:id', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/companies/${req.params.id}`,
      {
        params: {
          properties: 'name,domain,phone,website,industry,city,state,country,zip,description,numberofemployees,annualrevenue,createdate,lastmodifieddate'
        },
        headers: {
          Authorization: `Bearer ${req.accessToken}`,
        }
      }
    );
    res.json(data);
  } catch (e) {
    handleError(res, e, 'fetch company details');
  }
});

/**
 * POST /api/companies - Create company
 */
router.post('/', async (req, res) => {
  try {
    const { data } = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/companies`,
      req.body,
      getAxiosConfig(req.accessToken, true)
    );
    res.status(201).json(data);
  } catch (e) {
    handleError(res, e, 'create company');
  }
});

/**
 * PUT /api/companies/:id - Update company
 */
router.put('/:id', async (req, res) => {
  try {
    const { data } = await axios.patch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/companies/${req.params.id}`,
      req.body,
      getAxiosConfig(req.accessToken, true)
    );
    res.json(data);
  } catch (e) {
    handleError(res, e, 'update company');
  }
});

module.exports = router;