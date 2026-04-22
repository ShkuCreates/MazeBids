const session = require('express-session');

class PrismaSessionStore extends session.Store {
  constructor(prisma) {
    super();
    this.prisma = prisma;
    console.log('[SESSION STORE] Initialized with Prisma');
  }

  async withRetry(operation, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        console.error(`[SESSION STORE] Retry ${attempt}/${maxRetries} failed:`, err.message);
        
        if (attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  async get(sid, callback) {
    try {
      console.log('[SESSION STORE] GET:', sid);
      
      const result = await this.withRetry(async () => {
        return this.prisma.$queryRawUnsafe(
          'SELECT sess FROM "Session" WHERE sid = $1 AND expire > NOW()',
          sid
        );
      });
      
      console.log('[SESSION STORE] GET result:', result?.length, 'rows');
      
      if (result && result.length > 0) {
        console.log('[SESSION STORE] GET: Found session');
        const sessionData = typeof result[0].sess === 'string' 
          ? JSON.parse(result[0].sess) 
          : result[0].sess;
        callback(null, sessionData);
      } else {
        console.log('[SESSION STORE] GET: Session not found or expired');
        callback(null, null);
      }
    } catch (err) {
      console.error('[SESSION STORE] GET final error:', err.message);
      callback(null, null); // Memory fallback
    }
  }

  async set(sid, sess, callback) {
    try {
      console.log('[SESSION STORE] SET:', sid, 'with user:', sess.passport?.user);
      const expire = new Date(Date.now() + (sess.cookie?.maxAge || 30 * 24 * 60 * 60 * 1000));
      const sessJson = JSON.stringify(sess);
      
      await this.withRetry(async () => {
        console.log('[SESSION STORE] Attempting UPSERT...');
        const updated = await this.prisma.$executeRawUnsafe(
          'INSERT INTO "Session" (sid, sess, expire) VALUES ($1, $2::jsonb, $3) ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire',
          sid,
          sessJson,
          expire
        );
        console.log('[SESSION STORE] UPSERT affected rows:', updated);
      });
      
      console.log('[SESSION STORE] SET SUCCESS: Session saved to database');
      callback(null);
    } catch (err) {
      console.error('[SESSION STORE] SET ERROR:', err.message);
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
      console.log('[SESSION STORE] TOUCH:', sid);
      const expire = new Date(Date.now() + (sess.cookie?.maxAge || 30 * 24 * 60 * 60 * 1000));
      await this.withRetry(async () => {
        await this.prisma.$executeRawUnsafe(
          'UPDATE "Session" SET expire = $1 WHERE sid = $2',
          expire,
          sid
        );
      });
      console.log('[SESSION STORE] TOUCH: Session updated');
      callback(null);
    } catch (err) {
      console.error('[SESSION STORE] TOUCH ERROR:', err.message);
      callback(err);
    }
  }
}

module.exports = PrismaSessionStore;
