const session = require('express-session');

class PrismaSessionStore extends session.Store {
  constructor(prisma) {
    super();
    this.prisma = prisma;
    console.log('[SESSION STORE] Initialized with Prisma');
  }

  async withRetry(operation, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        console.error(`[SESSION STORE] Retry ${attempt}/${maxRetries} failed:`, err.message);
        
        if (attempt < maxRetries) {
          const delay = 500 * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  async get(sid, callback) {
    try {
      const result = await this.withRetry(async () => {
        return this.prisma.$queryRawUnsafe(
          'SELECT sess FROM "Session" WHERE sid = $1 AND expire > NOW()',
          sid
        );
      });
      
      if (result && result.length > 0) {
        const sessionData = typeof result[0].sess === 'string' 
          ? JSON.parse(result[0].sess) 
          : result[0].sess;
        callback(null, sessionData);
      } else {
        callback(null, null);
      }
    } catch (err) {
      console.error('[SESSION STORE] GET error:', err.message);
      callback(null, null); // Memory fallback
    }
  }

  async set(sid, sess, callback) {
    try {
      const expire = new Date(Date.now() + (sess.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000));
      const sessJson = JSON.stringify(sess);
      
      await this.withRetry(async () => {
        await this.prisma.$executeRawUnsafe(
          'INSERT INTO "Session" (sid, sess, expire) VALUES ($1, $2::jsonb, $3) ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire',
          sid,
          sessJson,
          expire
        );
      });
      
      callback(null);
    } catch (err) {
      console.error('[SESSION STORE] SET error:', err.message);
      callback(err);
    }
  }

  async destroy(sid, callback) {
    try {
      console.log('[SESSION STORE] DESTROY:', sid);
      await this.withRetry(async () => {
        await this.prisma.$executeRawUnsafe(
          'DELETE FROM "Session" WHERE sid = $1',
          sid
        );
      });
      console.log('[SESSION STORE] DESTROY: Session deleted');
      callback(null);
    } catch (err) {
      console.error('[SESSION STORE] DESTROY ERROR:', err.message);
      callback(err);
    }
  }

  async touch(sid, sess, callback) {
    try {
      const currentExpire = new Date(Date.now() + (sess.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000));
      
      // Skip DB write if session has more than 24 hours left
      const session = await this.withRetry(async () => {
        const result = await this.prisma.$queryRawUnsafe(
          'SELECT expire FROM "Session" WHERE sid = $1',
          sid
        );
        return result?.[0];
      });
      
      if (session && session.expire) {
        const hoursRemaining = (new Date(session.expire) - new Date()) / (1000 * 60 * 60);
        if (hoursRemaining > 24) {
          callback(null);
          return;
        }
      }
      
      await this.withRetry(async () => {
        await this.prisma.$executeRawUnsafe(
          'UPDATE "Session" SET expire = $1 WHERE sid = $2',
          currentExpire,
          sid
        );
      });
      
      callback(null);
    } catch (err) {
      console.error('[SESSION STORE] TOUCH error:', err.message);
      callback(err);
    }
  }
}

module.exports = PrismaSessionStore;
