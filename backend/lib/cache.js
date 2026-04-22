const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // 60s TTL, check every 2min

module.exports = {
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl),
  del: (key) => cache.del(key),
  keys: () => cache.keys(),
  stats: () => cache.getStats()
};

