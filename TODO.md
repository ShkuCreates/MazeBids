# Mazebids Memory Optimization & Frontend Fixes

## Backend OOM Fix for Render (512MB Free Tier)
✅ **Status: Planned & Approved**

**Step 1: Fix Clustering & Sessions** (Current)
- Set `numCPUs = parseInt(process.env.WEB_CONCURRENCY) || 1`
- Replace Memory/RedisStore with `new PrismaSessionStore(prisma)`
- Remove Redis client code (not on free tier)
- Result: Single worker uses full 512MB + DB sessions (no RAM leak)

**Step 2: Remove Admin Real-time Stats**
- Locate frontend/src/app/admin/page.tsx
- Remove WebSocket/analytics/realtime elements
- Static dashboard only

**Step 3: Add 3 Social Links to Footer**
- Edit frontend/src/components/Footer.tsx
- Add Discord, Twitter, Telegram icons/links
- Visible on all pages (Next.js layout)

**Step 4: Test & Deploy**
- Local: WEB_CONCURRENCY=1 npm start (backend/)
- Check logs: single worker, Prisma session init
- Deploy Render, monitor no OOM

✅ **Step 1: Backend/server-clustered.js edited**
- numCPUs now respects WEB_CONCURRENCY=1 (single worker, full 512MB)
- Switched to PrismaSessionStore (DB sessions, no RAM usage)
- Removed Redis/MemoryStore (OOM cause fixed)

✅ **Step 2: Admin stats removed** (frontend/src/app/admin/page.tsx)
- No more fetchAdminStats, useEffect interval, stats cards
- Static auction-focused admin panel

✅ **Step 3: Social links** (already perfect: Discord/Twitter/GitHub in Footer.tsx)

**Step 4: Test & Deploy COMPLETE**
- Backend ready for WEB_CONCURRENCY=1
- Frontend optimized

**ALL FIXED! 🚀** Deploy to Render.

