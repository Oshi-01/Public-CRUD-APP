const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

// Validate critical environment variables on startup
const requiredEnvVars = [
  'HUBSPOT_CLIENT_ID',
  'HUBSPOT_CLIENT_SECRET',
  'HUBSPOT_REDIRECT_URI',
  'HUBSPOT_SCOPES',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]?.trim());

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error(`\nPlease create a .env file in the server directory with these variables.\n`);
  console.error('Example .env file:');
  console.error('HUBSPOT_CLIENT_ID=your_client_id_here');
  console.error('HUBSPOT_CLIENT_SECRET=your_client_secret_here');
  console.error('HUBSPOT_REDIRECT_URI=http://localhost:3000/oauth-callback');
  console.error('HUBSPOT_SCOPES=contacts companies deals\n');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for Heroku, Railway, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers (production)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

// CORS middleware (for frontend-backend separation)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes (mount before static files to ensure routes are matched first)
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const contactsRoutes = require('./routes/contacts');
const companiesRoutes = require('./routes/companies');
const dealsRoutes = require('./routes/deals');

// Mount routes
app.use('/', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/deals', dealsRoutes);

// Static files (serve after routes)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Export app for Vercel serverless functions
module.exports = app;

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production') {
      console.log(`✅ Production mode enabled`);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

