# Deployment Guide

This guide explains how to deploy the HubSpot CRM Dashboard with the frontend on Vercel and backend on Render.

## Architecture

- **Frontend**: Static files in `public/` folder → Deployed to Vercel
- **Backend**: Express server in `server/` folder → Deployed to Render

## Repository Setup

**You can use ONE repository (monorepo) for both frontend and backend!**

The current configuration supports deploying both from the same repository:
- Vercel deploys from the `public/` folder
- Render deploys from the `server/` folder

**Option 1: One Repository (Recommended) ✅**
- Simpler setup
- Easier to maintain
- Single source of truth
- Current configuration supports this

**Option 2: Two Separate Repositories**
- More separation
- Independent deployments
- Requires additional setup (see below)

## Prerequisites

1. **HubSpot App Setup**
   - Create a HubSpot app at [developers.hubspot.com](https://developers.hubspot.com/)
   - Note your Client ID and Client Secret
   - Configure Redirect URLs (see below)

2. **Accounts**
   - Vercel account (free tier works)
   - Render account (free tier works)

## Step 1: Deploy Backend to Render

### 1.1 Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (same repo for monorepo, or separate backend repo)
4. Configure the service:
   - **Name**: `hubspot-crm-dashboard-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Root Directory**: Leave empty (or set to `server` if using monorepo)
   - **Build Command**: `cd server && npm install` (or just `npm install` if root is `server`)
   - **Start Command**: `cd server && npm start` (or just `npm start` if root is `server`)
   - **Plan**: Free

**Note for Monorepo**: If your root directory is set to `server`, use:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 1.2 Set Environment Variables in Render

In the Render dashboard, go to your service → Environment tab, and add:

```
NODE_ENV=production
PORT=10000
HUBSPOT_CLIENT_ID=your_client_id_here
HUBSPOT_CLIENT_SECRET=your_client_secret_here
HUBSPOT_REDIRECT_URI=https://your-vercel-app.vercel.app/oauth-callback
HUBSPOT_SCOPES=contacts companies deals
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Important Notes:**
- Replace `your-vercel-app.vercel.app` with your actual Vercel domain (you'll get this after deploying)
- The `HUBSPOT_REDIRECT_URI` must match exactly what's registered in HubSpot
- Render will assign a URL like `your-app.onrender.com` - note this URL

### 1.3 Deploy

Click "Create Web Service" and wait for deployment to complete. Note your Render URL (e.g., `https://hubspot-crm-dashboard-backend.onrender.com`)

## Step 2: Configure HubSpot App

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/)
2. Open your app settings
3. Go to the **Auth** tab
4. Under **Redirect URLs**, add:
   - `https://your-vercel-app.vercel.app/oauth-callback` (your Vercel frontend URL)
   - `http://localhost:3000/oauth-callback` (for local development)

## Step 3: Deploy Frontend to Vercel

### 3.1 Create a New Project on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository (same repo for monorepo, or separate frontend repo)
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: Leave as default (project root)
   - **Build Command**: `node build-frontend.js`
   - **Output Directory**: `public`
   - **Install Command**: Leave empty or `echo 'No install needed'`

**Note**: The `vercel.json` file already configures this, so Vercel should auto-detect these settings.

### 3.2 Set Environment Variables in Vercel

In Vercel dashboard → Project Settings → Environment Variables, add:

```
API_BASE_URL=https://your-render-app.onrender.com
```

**Important:** Replace `your-render-app.onrender.com` with your actual Render backend URL (from Step 1.3)

### 3.3 Deploy

Click "Deploy" and wait for deployment to complete. Note your Vercel URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update Configuration

After both deployments are complete:

### 4.1 Update Render Environment Variables

Go back to Render and update:
- `HUBSPOT_REDIRECT_URI` to your actual Vercel URL: `https://your-vercel-app.vercel.app/oauth-callback`
- `FRONTEND_URL` to your actual Vercel URL: `https://your-vercel-app.vercel.app`

Then redeploy the Render service.

### 4.2 Update Vercel Environment Variables

In Vercel, update:
- `API_BASE_URL` to your actual Render URL: `https://your-render-app.onrender.com`

Then redeploy the Vercel project.

### 4.3 Update HubSpot Redirect URLs

Make sure your HubSpot app has the correct redirect URL registered (from Step 2).

## Step 5: Test Deployment

1. Visit your Vercel frontend URL
2. Click "Connect HubSpot Account"
3. Complete the OAuth flow
4. Verify the dashboard loads correctly

## Troubleshooting

### CORS Errors

If you see CORS errors, check:
- `FRONTEND_URL` is set correctly in Render
- The frontend URL matches what's in the CORS allowed origins

### OAuth Redirect Errors

If OAuth fails:
- Verify `HUBSPOT_REDIRECT_URI` in Render matches HubSpot app settings exactly
- Check that the redirect URL includes the protocol (`https://`)
- Ensure the redirect URL is registered in HubSpot

### API Connection Errors

If the frontend can't connect to the backend:
- Verify `API_BASE_URL` is set in Vercel
- Check that the Render service is running (not sleeping)
- Verify the Render URL is correct

### Render Service Sleeping

Render free tier services sleep after 15 minutes of inactivity. The first request after sleep may take 30-60 seconds. Consider:
- Using a paid Render plan for always-on service
- Setting up a cron job to ping the health endpoint
- Using a service like UptimeRobot to keep it awake

## Local Development

For local development, you don't need to set `API_BASE_URL` - the app will use relative paths.

1. Start the backend:
```bash
cd server
npm install
npm start
```

2. The frontend will be served by the backend at `http://localhost:3000`

## Environment Variables Summary

### Render (Backend)
- `NODE_ENV=production`
- `PORT=10000`
- `HUBSPOT_CLIENT_ID`
- `HUBSPOT_CLIENT_SECRET`
- `HUBSPOT_REDIRECT_URI`
- `HUBSPOT_SCOPES`
- `FRONTEND_URL`

### Vercel (Frontend)
- `API_BASE_URL` (your Render backend URL)

## Alternative: Two Separate Repositories

If you prefer to split into two repositories:

### Frontend Repository Setup

1. Create a new GitHub repository for frontend
2. Copy these files/folders:
   - `public/` folder
   - `build-frontend.js`
   - `vercel.json`
   - `.gitignore` (update if needed)
3. Update `vercel.json`:
   - Remove `buildCommand` (or keep it if you copy `build-frontend.js`)
   - Set `outputDirectory` to `public` (or root if you move files)
4. Deploy to Vercel from this repository

### Backend Repository Setup

1. Create a new GitHub repository for backend
2. Copy these files/folders:
   - `server/` folder
   - `render.yaml` (update paths if needed)
   - `.gitignore` (update if needed)
3. Update `render.yaml`:
   - Change `buildCommand` to `npm install` (no `cd server`)
   - Change `startCommand` to `npm start` (no `cd server`)
4. Deploy to Render from this repository

### Environment Variables for Separate Repos

Same as monorepo setup, but make sure:
- Frontend repo: Set `API_BASE_URL` in Vercel
- Backend repo: Set all backend env vars in Render

## Support

If you encounter issues:
1. Check the Render logs for backend errors
2. Check the Vercel build logs for frontend issues
3. Verify all environment variables are set correctly
4. Ensure HubSpot app configuration matches your redirect URLs
5. For monorepo: Verify root directories are set correctly in both platforms

