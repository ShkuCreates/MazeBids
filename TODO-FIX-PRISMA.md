# Fix Render Prisma Deployment - DATABASE_URL Pooler Issue

Status: Started

## Steps

### 1. Get Supabase Connection Pooler URL [COMPLETE]
- Current direct URL: `postgresql://postgres.jpynflcrwrfnfpbytwdg:Shourya1234590@db.jpynflcrwrfnfpbytwdg.supabase.co:5432/postgres`
- Region: Singapore (ap-southeast-1)
**LATEST POOLER URL** (new password): `postgresql://postgres.jpynflcrwrfnfpbytwdg:PD27HewSfQ3zru7S@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`
**Previous**: `aws-0...Shourya1234590` (caused "Tenant not found")

- Supabase → Project → Database → Connection Pooler
- Transaction mode (port 6543)
- Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### 2. Update Render DATABASE_URL [UPDATED - NEW PASSWORD]
- Service ID: `srv-d7jrved8nd3s73cjgi20`
- **NEW URL**: `postgresql://postgres.jpynflcrwrfnfpbytwdg:PD27HewSfQ3zru7S@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`

- Backend Service ID: `srv-d7jrved8nd3s73cjgi20`
- Set: `postgresql://postgres.jpynflcrwrfnfpbytwdg:Shourya1234590@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

- Render Dashboard → Backend Service → Environment
- Set correct pooler URL

### 3. Redeploy & Verify Logs [FAILED - AUTH FAILED]
**Current Error**: "Authentication failed... credentials for `postgres` are not valid"
- Pooler reaches but password `PD27HewSfQ3zru7S` invalid for `postgres.jpynflcrwrfnfpbytwdg`

- Manual deploy
- Check for successful Prisma init

### 4. Test Discord Auth [READY - RUN MIGRATIONS]
**Current Error**: "table `public.User` does not exist" P2021
**Fix Commands** (run in backend/):
```
set DATABASE_URL="postgresql://postgres.jpynflcrwrfnfpbytwdg:PD27HewSfQ3zru7S@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
npx prisma migrate deploy
npx prisma generate
```
**Status**: Pooler ✅ | Tables ❌ → ✅ after migrate

User error ref: `db.jpynflcrwrfnfpbytwdg.supabase.co:5432` → Must be pooler `[region].pooler.supabase.com:6543`

Last update: Plan confirmed, TODO created

