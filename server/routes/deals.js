const express = require('express');
const axios = require('axios');
const { HUBSPOT_API_BASE, DEAL_TYPE_ID } = require('../config/constants');
const { checkAuth, getAxiosConfig, handleError, parseLimit } = require('../utils/routeHelpers');

const router = express.Router();

const DEAL_PROPERTIES = ['dealname', 'amount', 'dealstage'];

router.use(checkAuth);

// Helper: Format paginated response
const formatResponse = (data) => ({
  results: data.results || [],
  hasMore: !!data.paging?.next?.after
});

/**
 * GET /api/deals - Fetch deals
 */
router.get('/', async (req, res) => {
  try {
    const { after, limit = 20 } = req.query;
    const params = {
      limit: parseLimit(limit),
      properties: DEAL_PROPERTIES.join(','),
      ...(after && { after })
    };

    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
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
    handleError(res, e, 'fetch deals');
  }
});

/**
 * GET /api/deals/count - Get total count
 */
router.get('/count', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/limits/records`,
      getAxiosConfig(req.accessToken)
    );

    const entry = data?.hubspotDefinedObjectTypes?.find(i => i.objectTypeId === DEAL_TYPE_ID);
    res.json({ total: entry?.usage ?? 0 });
  } catch (e) {
    handleError(res, e, 'fetch deals count');
  }
});

/**
 * GET /api/deals/search - Search deals (must be before /:id route)
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    const parsedLimit = parseLimit(limit, 50);

    if (q?.trim()) {
      const { data } = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/deals/search`,
        {
          filterGroups: [{ filters: [{ propertyName: 'dealname', operator: 'CONTAINS_TOKEN', value: q.trim() }] }],
          limit: parsedLimit,
          properties: DEAL_PROPERTIES
        },
        getAxiosConfig(req.accessToken, true)
      );
      return res.json(formatResponse(data));
    }

    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      { params: { limit: parsedLimit, properties: DEAL_PROPERTIES.join(',') }, ...getAxiosConfig(req.accessToken) }
    );
    res.json(formatResponse(data));
  } catch (e) {
    handleError(res, e, 'search deals');
  }
});

/**
 * GET /api/deals/:id - Get deal details
 */
router.get('/:id', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${req.params.id}`,
      {
        params: {
          properties: 'dealname,amount,dealstage,pipeline,closedate,createdate,lastmodifieddate,description'
        },
        headers: {
          Authorization: `Bearer ${req.accessToken}`,
        }
      }
    );
    res.json(data);
  } catch (e) {
    handleError(res, e, 'fetch deal details');
  }
});

/**
 * POST /api/deals - Create deal
 */
router.post('/', async (req, res) => {
  try {
    const { data } = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      req.body,
      getAxiosConfig(req.accessToken, true)
    );
    res.status(201).json(data);
  } catch (e) {
    handleError(res, e, 'create deal');
  }
});

/**
 * PUT /api/deals/:id - Update deal
 */
router.put('/:id', async (req, res) => {
  try {
    const { data } = await axios.patch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${req.params.id}`,
      req.body,
      getAxiosConfig(req.accessToken, true)
    );
    res.json(data);
  } catch (e) {
    handleError(res, e, 'update deal');
  }
});

module.exports = router;