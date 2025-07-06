# Quick Render Setup Fix

## Missing REPL_ID Error

If you're getting this error:
```
TypeError: "clientId" must be a non-empty string
```

You need to add the `REPL_ID` environment variable to Render.

## Your REPL_ID

Your Replit app ID is: `89e98bf1-3696-46f3-b65c-7d526a61f3f7`

## How to Fix in Render

1. Go to your Render service dashboard
2. Click on "Environment"
3. Add this environment variable:
   - **Key**: `REPL_ID`
   - **Value**: `89e98bf1-3696-46f3-b65c-7d526a61f3f7`

4. Click "Save Changes"
5. Your service will automatically redeploy

## Complete Environment Variables List

Make sure you have ALL of these set in Render:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Fixed value |
| `DATABASE_URL` | *Auto-generated* | Created with PostgreSQL service |
| `SESSION_SECRET` | *Random string* | Generate any secure random string |
| `REPLIT_DOMAINS` | `your-app.onrender.com` | Your actual Render domain |
| `ISSUER_URL` | `https://replit.com/oidc` | Fixed value |
| `REPL_ID` | `89e98bf1-3696-46f3-b65c-7d526a61f3f7` | **Your app ID from above** |

## After Setting Variables

1. Save the environment variables
2. Wait for automatic redeploy
3. Check the logs to confirm the app starts successfully
4. Test the login functionality

Your app should work after adding the missing `REPL_ID` variable!