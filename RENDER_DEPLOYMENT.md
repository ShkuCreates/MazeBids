# Render Deployment Guide

This project is configured to deploy on Render with the following architecture:
- **Backend**: Express.js server (Node.js)
- **Frontend**: Next.js application
- **Database**: PostgreSQL

## Deployment Steps

### 1. Connect Your GitHub Repository to Render

1. Go to [render.com](https://render.com)
2. Create a new account or login
3. Click "New" → "Blueprint" or "Web Service"
4. Select your GitHub repository
5. Choose "Use this repository"

### 2. Environment Variables to Configure in Render Dashboard

In the Render dashboard, set the following environment variables:

**For Backend Service:**
- `DISCORD_CLIENT_ID` - Your Discord app's client ID
- `DISCORD_CLIENT_SECRET` - Your Discord app's client secret
- `SESSION_SECRET` - A strong random string (generate: `openssl rand -base64 32`)
- `DATABASE_URL` - Will be auto-populated from PostgreSQL database
- `DISCORD_REDIRECT_URI` - `https://mazebids-backend.onrender.com/auth/discord/callback`
- `FRONTEND_URL` - `https://mazebids-frontend.onrender.com`
- `NODE_ENV` - `production`

**For Frontend Service:**
- `NODE_ENV` - `production`

### 3. Set Up PostgreSQL Database

1. In Render dashboard, click "New" → "PostgreSQL"
2. Choose a name: `mazebids-db`
3. Set region (same as your services)
4. Choose free plan
5. Create database

The `DATABASE_URL` will be automatically provided to your backend service.

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
- Use strong session secrets in production
- Ensure all environment variables are set before deploying

## Troubleshooting

**Port issues**: Backend uses port 5000, ensure `NODE_ENV` is set to production
**Database connection**: Verify `DATABASE_URL` is correctly set in environment
**CORS errors**: Make sure `FRONTEND_URL` and backend URL are properly configured
**Discord auth failing**: Check redirect URI matches exactly in both Render and Discord dashboard
