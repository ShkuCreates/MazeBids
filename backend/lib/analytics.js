const crypto = require('crypto');

const LIVE_WINDOW_MS = 5 * 60 * 1000;
const PERSIST_WINDOW_MS = 5 * 60 * 1000;

const activeVisitors = new Map();
const lastPersistedAt = new Map();

function prune(map, now, maxAgeMs) {
  for (const [key, value] of map.entries()) {
    if (now - value.lastSeenAt > maxAgeMs) {
      map.delete(key);
    }
  }
}

function normalizeDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function ensureVisitorId(existingId) {
  return existingId || crypto.randomUUID();
}

function markVisitorActive(visitorId, userId) {
  const now = Date.now();
  activeVisitors.set(visitorId, {
    lastSeenAt: now,
    userId: userId || activeVisitors.get(visitorId)?.userId || null
  });
  prune(activeVisitors, now, LIVE_WINDOW_MS);
}

function getLiveVisitorCount() {
  const now = Date.now();
  prune(activeVisitors, now, LIVE_WINDOW_MS);
  return activeVisitors.size;
}

function getLiveSignedInUserCount() {
  const now = Date.now();
  prune(activeVisitors, now, LIVE_WINDOW_MS);
  const uniqueUsers = new Set();
  for (const visitor of activeVisitors.values()) {
    if (visitor.userId) uniqueUsers.add(visitor.userId);
  }
  return uniqueUsers.size;
}

function shouldPersistVisit(visitorId) {
  const now = Date.now();
  const previous = lastPersistedAt.get(visitorId);
  if (previous && now - previous.lastSeenAt < PERSIST_WINDOW_MS) {
    return false;
  }
  lastPersistedAt.set(visitorId, { lastSeenAt: now });
  prune(lastPersistedAt, now, PERSIST_WINDOW_MS);
  return true;
}

module.exports = {
  ensureVisitorId,
  normalizeDay,
  markVisitorActive,
  getLiveVisitorCount,
  getLiveSignedInUserCount,
  shouldPersistVisit
};
