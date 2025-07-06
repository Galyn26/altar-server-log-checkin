# OAuth SSL/TLS Error Fix

## The Problem
"SSL/TLS required" error means Replit OAuth doesn't recognize your Render domain as authorized.

## The Solution

### Step 1: Find Your Render Domain
Your app is now running at something like: `https://your-app-name.onrender.com`

### Step 2: Configure Replit OAuth
1. Go to your Replit project settings
2. Look for "OAuth" or "Authentication" settings
3. Add your Render domain to the allowed domains:
   - **Authorized Domain**: `your-app-name.onrender.com`
   - **Callback URL**: `https://your-app-name.onrender.com/api/callback`

### Step 3: Update Environment Variables
In Render, make sure `REPLIT_DOMAINS` matches your actual domain:
- Go to Render dashboard
- Environment tab
- Update `REPLIT_DOMAINS` to your exact Render URL (without https://)
- Example: `my-altar-server.onrender.com`

### Step 4: Test the Fix
1. Save the OAuth settings in Replit
2. Update the environment variable in Render
3. Wait for automatic redeploy
4. Try logging in again

## Common Issues

**If you can't find OAuth settings in Replit:**
- Look for "Secrets" or "Environment Variables"
- Check if there's a "Deployment" or "Web" configuration section
- The OAuth settings might be under "App Settings" or "Project Settings"

**If the error persists:**
- Double-check the domain exactly matches (no trailing slashes)
- Ensure you're using HTTPS in the callback URL
- Verify the REPL_ID is correct

## Quick Test
After making changes, try accessing:
`https://your-render-domain.onrender.com/api/login`

If configured correctly, it should redirect to Replit's login page instead of showing the SSL/TLS error.