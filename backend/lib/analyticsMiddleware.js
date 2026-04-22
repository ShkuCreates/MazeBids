const prisma = require('./prisma');
const {
  ensureVisitorId,
  normalizeDay,
  markVisitorActive,
  shouldPersistVisit
} = require('./analytics');

const VISITOR_COOKIE = 'mb_visitor';

module.exports = async function analyticsMiddleware(req, res, next) {
  try {
    if (!req.path.startsWith('/api') || req.path.startsWith('/api/health')) {
      return next();
    }

    const visitorId = ensureVisitorId(req.cookies?.[VISITOR_COOKIE]);
    const userId = req.user?.id || null;

    if (!req.cookies?.[VISITOR_COOKIE]) {
      res.cookie(VISITOR_COOKIE, visitorId, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000
      });
    }

    markVisitorActive(visitorId, userId);

    if (!shouldPersistVisit(visitorId)) {
      return next();
    }

    const visitedOn = normalizeDay();
    await prisma.siteVisit.upsert({
      where: {
        visitorId_visitedOn: {
          visitorId,
          visitedOn
        }
      },
      update: {
        lastSeenAt: new Date(),
        visitCount: { increment: 1 },
        ...(userId ? { userId } : {})
      },
      create: {
        visitorId,
        userId,
        visitedOn,
        lastSeenAt: new Date()
      }
    });
  } catch (err) {
    console.error('[ANALYTICS] Tracking error:', err.message);
  }

  next();
};
