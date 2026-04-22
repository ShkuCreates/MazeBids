const session = require('express-session');
const { promisify } = require('util');

class PrismaSessionStore extends session.Store {
  constructor(prisma) {
    super();
    this.prisma = prisma;
    console.log('[SESSION STORE] Initialized with Prisma');
  }

  async get(sid, callback) {
    try {
      console.log('[SESSION STORE] GET:', sid);
      
      // Use query directly instead of $queryRaw
      const result = await this.prisma.$queryRawUnsafe(
        'SELECT sess FROM "Session" WHERE sid = $1 AND expire > NOW()',
        sid
      );
      
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
      console.error('[SESSION STORE] GET ERROR:', err.message, 'CODE:', err.code);
      callback(null); // Return null instead of error to allow login
    }
  }

  async set(sid, sess, callback) {
    try {
      console.log('[SESSION STORE] SET:', sid, 'with user:', sess.passport?.user);
      const expire = new Date(Date.now() + (sess.cookie?.maxAge || 30 * 24 * 60 * 60 * 1000));
      const sessJson = JSON.stringify(sess);
      
      console.log('[SESSION STORE] Attempting UPDATE...');
      
      // Simple UPDATE first
      const updated = await this.prisma.$executeRawUnsafe(
        'UPDATE "Session" SET sess = $1::jsonb, expire = $2 WHERE sid = $3',
        sessJson,
        expire,
        sid
      );
      
      console.log('[SESSION STORE] UPDATE affected rows:', updated);
      
      if (updated === 0) {
        // If no rows updated, INSERT
        console.log('[SESSION STORE] Attempting INSERT...');
        const inserted = await this.prisma.$executeRawUnsafe(
          'INSERT INTO "Session" (sid, sess, expire) VALUES ($1, $2::jsonb, $3)',
          sid,
          sessJson,
          expire
        );
        console.log('[SESSION STORE] INSERT affected rows:', inserted);
      }
      
      console.log('[SESSION STORE] SET SUCCESS: Session saved to database');
      callback();
    } catch (err) {
      console.error('[SESSION STORE] SET ERROR:', err.message, 'CODE:', err.code, 'META:', err.meta);
      console.error('[SESSION STORE] Full error:', err);
      callback(); // Don't fail the request, just log
    }
  }

  async destroy(sid, callback) {
    try {
      console.log('[SESSION STORE] DESTROY:', sid);
      await this.prisma.$executeRawUnsafe(
        'DELETE FROM "Session" WHERE sid = $1',
        sid
      );
      console.log('[SESSION STORE] DESTROY: Session deleted');
      callback();
    } catch (err) {
      console.error('[SESSION STORE] DESTROY ERROR:', err.message);
      callback();
    }
  }

  async touch(sid, sess, callback) {
    try {
      console.log('[SESSION STORE] TOUCH:', sid);
      const expire = new Date(Date.now() + (sess.cookie?.maxAge || 30 * 24 * 60 * 60 * 1000));
      await this.prisma.$executeRawUnsafe(
        'UPDATE "Session" SET expire = $1 WHERE sid = $2',
        expire,
        sid
      );
      console.log('[SESSION STORE] TOUCH: Session updated');
      callback();
    } catch (err) {
      console.error('[SESSION STORE] TOUCH ERROR:', err.message);
      callback();
    }
  }
}

module.exports = PrismaSessionStore;
