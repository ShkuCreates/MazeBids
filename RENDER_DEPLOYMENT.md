# Render Deployment Guide

This project is configured to deploy on Render with the following architecture:
- **Backend**: Express.js server (Node.js)
- **Frontend**: Next.js application
- **Database**: Supabase PostgreSQL

## Deployment Steps

### 1. Connect Your GitHub Repository to Render

1. Go to [render.com](https://render.com)
2. Create a new account or login
3. Click "New" → "Blueprint"
4. Select your GitHub repository
5. Choose "Use this repository"

### 2. Environment Variables to Configure in Render Dashboard

In the Render dashboard, set the following environment variables:

**For Backend Service:**
- `DISCORD_CLIENT_ID` - Your Discord app's client ID
- `DISCORD_CLIENT_SECRET` - Your Discord app's client secret
- `DISCORD_TOKEN` - Your Discord bot token (from Discord Developer Portal)
- `SESSION_SECRET` - A strong random string (generate: `openssl rand -base64 32`)
- `DATABASE_URL` - Your Supabase connection string (Transaction Pooler):
  ```
  postgresql://postgres.jpynflcrwrfnfpbytwdg:YOUR_NEW_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
  ```
- `DISCORD_REDIRECT_URI` - `https://mazebids-backend.onrender.com/auth/discord/callback`
- `FRONTEND_URL` - `https://mazebids-frontend.onrender.com`
- `NODE_ENV` - `production`

**For Frontend Service:**
- `NODE_ENV` - `production`

### 3. Get Your Supabase Connection String

1. Go to [supabase.com](https://supabase.com) → Your Project
2. Click **"Database"** (left sidebar)
3. Click **"Connection Pooler"** tab
4. Copy the **Transaction mode** connection string
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 4. Deploy

1. Render will auto-deploy when you push to GitHub (if using Blueprint)
2. Or manually trigger deploy in Render dashboard
3. Monitor logs in the Render dashboard

### 5. Update Discord OAuth Redirect URI

In your Discord Developer Portal:
1. Go to OAuth2 → General
2. Update redirect URI to: `https://mazebids-backend.onrender.com/auth/discord/callback`

## Important Notes

- Free tier services on Render spin down after 15 minutes of inactivity
- For production, upgrade to paid plans
- Keep your `.env` file in `.gitignore` (already configured)
- **NEVER commit DATABASE_URL with password to git** - use environment variables only
- Use strong session secrets in production
- Supabase free tier includes 500MB database

## Troubleshooting

**Authentication errors**: Use the Transaction Pooler connection string (port 6543)
**Port issues**: Backend uses port 5000, ensure `NODE_ENV` is set to production
**Database connection**: Verify `DATABASE_URL` is correctly set with your Supabase credentials
**CORS errors**: Make sure `FRONTEND_URL` and backend URL are properly configured
**Discord auth failing**: Check redirect URI matches exactly in both Render and Discord dashboard
