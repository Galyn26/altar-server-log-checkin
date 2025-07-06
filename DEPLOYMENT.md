# Deployment Guide for Altar Server Check-In System

## Overview

This guide will help you deploy the Altar Server Check-In System to Render from GitHub.

## Prerequisites

- GitHub account
- Render account (free tier works)
- Access to configure OAuth settings

## Step 1: Prepare for GitHub

### 1.1 Create Repository Structure

Your project should have this structure:
```
altar-server-checkin/
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types and schemas
├── components.json   # UI components config
├── drizzle.config.ts # Database configuration
├── package.json      # Dependencies and scripts
├── README.md         # Project documentation
├── render.yaml       # Render deployment config
├── .env.example      # Environment variables template
├── DEPLOYMENT.md     # This file
├── MODERATOR_SETUP.md # Moderator setup instructions
└── replit.md         # Technical documentation
```

### 1.2 Update .gitignore

Make sure your `.gitignore` includes:
```
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
```

## Step 2: GitHub Setup

### 2.1 Create Repository
1. Go to GitHub and create a new repository
2. Name it `altar-server-checkin` (or your preferred name)
3. Make it public or private as needed
4. Don't initialize with README (you already have one)

### 2.2 Upload Code
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Altar Server Check-In System"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/altar-server-checkin.git

# Push to GitHub
git push -u origin main
```

## Step 3: Render Deployment

### 3.1 Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your `altar-server-checkin` repository

### 3.2 Configure Service
**Basic Settings:**
- **Name**: `altar-server-checkin`
- **Region**: Ohio (US East)
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `npm install && node build.js`
- **Start Command**: `npm start`

**Alternative Build Commands (if build.js fails):**
- Option 1: `npm install --include=dev && npm run build`
- Option 2: `npm ci && npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`

**Advanced Settings:**
- **Auto-Deploy**: Yes
- **Health Check Path**: `/`

### 3.3 Environment Variables
Add these environment variables in Render:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Fixed value |
| `DATABASE_URL` | *Auto-generated* | Created with database |
| `SESSION_SECRET` | *Random string* | Generate a secure random string |
| `REPLIT_DOMAINS` | `your-app.onrender.com` | Your Render domain |
| `ISSUER_URL` | `https://replit.com/oidc` | Fixed value |
| `REPL_ID` | *Your Replit App ID* | From Replit dashboard |

### 3.4 Create Database
1. In Render, go to "New +" → "PostgreSQL"
2. **Name**: `altar-server-db`
3. **Database**: `altar_server_checkin`
4. **User**: `altar_server_user`
5. **Region**: Ohio (same as web service)
6. **Plan**: Free

The `DATABASE_URL` will be automatically available to your web service.

## Step 4: OAuth Configuration

### 4.1 Get Your Render Domain
After deployment, your app will be available at:
`https://your-app-name.onrender.com`

### 4.2 Configure Replit OAuth
1. Go to your Replit project
2. Update the OAuth settings:
   - **Authorized Domains**: Add your Render domain
   - **Redirect URLs**: Add `https://your-app.onrender.com/api/callback`

### 4.3 Update Environment Variables
In Render dashboard, update:
- `REPLIT_DOMAINS` = `your-app.onrender.com`
- `REPL_ID` = Your actual Replit app ID

## Step 5: Database Setup

### 5.1 Push Database Schema
After successful deployment, your database schema will be automatically created. If you need to manually push changes:

```bash
# From your local development environment
npm run db:push
```

### 5.2 Create First Moderator
1. Both you and your mother need to log in once to create user accounts
2. Access your PostgreSQL database in Render
3. Run this SQL query:

```sql
-- View all users
SELECT id, email, role FROM users;

-- Make your mother a moderator (replace with her actual user ID)
UPDATE users SET role = 'moderator' WHERE id = 'HER_USER_ID';
```

## Step 6: Verify Deployment

### 6.1 Check Application
1. Visit your Render URL
2. Test login functionality
3. Verify clock-in/out works
4. Test location verification (should work at church)

### 6.2 Test Moderator Features
1. Log in as moderator
2. Check user management
3. Test CSV export
4. Verify service session oversight

## Step 7: Custom Domain (Optional)

If you want a custom domain:
1. In Render, go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Update DNS records as instructed
5. Update `REPLIT_DOMAINS` environment variable

## Troubleshooting

### Common Issues

**OAuth not working:**
- Check `REPLIT_DOMAINS` matches your actual domain
- Verify OAuth redirect URL is correct
- Ensure `REPL_ID` is accurate

**Database connection failed:**
- Verify `DATABASE_URL` is set correctly
- Check if database service is running
- Ensure web service and database are in same region

**Location verification not working:**
- Check browser permissions for location access
- Verify church coordinates in code
- Test with mobile device at church location

**Build failures:**
- **"vite: not found" error**: Try alternative build command: `npm install --include=dev && npm run build`
- **Missing devDependencies**: Use: `npm ci && npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
- Check all dependencies are in `package.json`
- Verify build command is correct
- Review build logs for specific errors
- Try the custom build script: `node build.js`

### Getting Help

1. Check Render logs for error messages
2. Review browser console for frontend errors
3. Verify all environment variables are set
4. Test locally first with production environment variables

## Security Notes

- Never commit `.env` files to GitHub
- Use strong, unique values for `SESSION_SECRET`
- Regularly rotate OAuth secrets
- Monitor access logs for unusual activity
- Keep dependencies updated

## Maintenance

### Regular Updates
- Update dependencies monthly
- Monitor performance metrics
- Review user feedback
- Backup database regularly

### Scaling
- Render free tier handles moderate traffic
- Upgrade to paid plan for higher usage
- Monitor resource usage in Render dashboard

Your Altar Server Check-In System is now ready for production use!