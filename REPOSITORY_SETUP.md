# Repository Setup Guide

## Quick Answer: Do You Need Two Repositories?

**No! You can use ONE repository (monorepo) for both frontend and backend.**

## Option 1: One Repository (Monorepo) ✅ Recommended

### Structure
```
your-repo/
├── public/          # Frontend (deployed to Vercel)
├── server/          # Backend (deployed to Render)
├── vercel.json      # Vercel config (deploys public/)
├── render.yaml      # Render config (deploys server/)
└── build-frontend.js
```

### Advantages
- ✅ Single source of truth
- ✅ Easier to maintain
- ✅ Simpler setup
- ✅ Shared configuration files
- ✅ Easier local development

### How It Works

**Vercel (Frontend)**
- Connects to your GitHub repo
- Uses `vercel.json` which specifies `outputDirectory: "public"`
- Automatically deploys from the `public/` folder

**Render (Backend)**
- Connects to the same GitHub repo
- Uses `render.yaml` which specifies `buildCommand: cd server && npm install`
- Automatically builds and deploys from the `server/` folder

### Setup Steps

1. Push your code to ONE GitHub repository
2. Connect the same repo to both Vercel and Render
3. Configure each platform as described in `DEPLOYMENT.md`
4. Done! Both will deploy from the same repo

---

## Option 2: Two Separate Repositories

### Structure

**Frontend Repository:**
```
frontend-repo/
├── public/          # All frontend files
├── vercel.json
└── build-frontend.js
```

**Backend Repository:**
```
backend-repo/
├── server/          # All backend files (or move contents to root)
├── render.yaml
└── package.json     # (if moved to root)
```

### Advantages
- ✅ Complete separation
- ✅ Independent version control
- ✅ Different access permissions
- ✅ Separate CI/CD pipelines

### Disadvantages
- ❌ More complex setup
- ❌ Need to maintain two repos
- ❌ Harder to keep in sync

### Setup Steps

#### Frontend Repository

1. Create new GitHub repo (e.g., `hubspot-crm-frontend`)
2. Copy these files:
   ```bash
   cp -r public/ frontend-repo/
   cp build-frontend.js frontend-repo/
   cp vercel.json frontend-repo/
   ```
3. Update `vercel.json` if needed (should work as-is)
4. Push to GitHub
5. Deploy to Vercel from this repo

#### Backend Repository

1. Create new GitHub repo (e.g., `hubspot-crm-backend`)
2. Copy these files:
   ```bash
   cp -r server/ backend-repo/
   cp render.yaml backend-repo/
   ```
3. Update `render.yaml`:
   ```yaml
   buildCommand: npm install  # Remove "cd server &&"
   startCommand: npm start    # Remove "cd server &&"
   ```
4. **OR** move server contents to root:
   ```bash
   # Move everything from server/ to root
   mv server/* backend-repo/
   mv server/.* backend-repo/ 2>/dev/null || true
   ```
5. Push to GitHub
6. Deploy to Render from this repo

---

## Recommendation

**Use Option 1 (Monorepo)** unless you have a specific reason to separate:
- Different teams managing frontend/backend
- Different deployment schedules
- Different access requirements
- Company policy requiring separation

For most projects, especially solo developers or small teams, **one repository is simpler and better**.

---

## Current Configuration

The current setup is configured for **Option 1 (Monorepo)**:

- ✅ `vercel.json` points to `public/` folder
- ✅ `render.yaml` uses `cd server &&` commands
- ✅ `build-frontend.js` is in root (accessible to Vercel)
- ✅ All files are in one repository

**You're ready to deploy with one repository!** Just follow the steps in `DEPLOYMENT.md`.

