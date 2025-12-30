// utils/routeHelpers.js
const { getAccessToken } = require('./tokens');

exports.checkAuth = (req, res, next) => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return res.status(401).json({ 
      error: 'Not authorized. Please connect your HubSpot account.' 
    });
  }
  req.accessToken = accessToken;
  next();
};

exports.getAxiosConfig = (accessToken, isPost = false) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`,
    ...(isPost && { 'Content-Type': 'application/json' })
  }
});

exports.handleError = (res, e, action) => {
  console.error(`Error ${action}:`, e.response?.data || e.message);
  res.status(e.response?.status || 500).json({ 
    error: `Failed to ${action}`, 
    details: e.response?.data || e.message 
  });
};

exports.parseLimit = (limit, defaultVal = 20) => Math.min(parseInt(limit) || defaultVal, 100);

