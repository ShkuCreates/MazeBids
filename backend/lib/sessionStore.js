const session = require('express-session');

class PrismaSessionStore extends session.Store {
  constructor(prisma) {
    super();
    this.prisma = prisma;
    console.log('[SESSION STORE] Initialized with Prisma');
  }

  async get(sid, callback) {
    try {
      console.log('[SESSION STORE] GET:', sid);
      const result = await this.prisma.$queryRaw`
        SELECT sess FROM "Session" WHERE sid = ${sid} AND expire > NOW()
      `;
      
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
      console.error('[SESSION STORE] GET ERROR:', err.message);
      callback(err);
    }
  }

  async set(sid, sess, callback) {
    try {
      console.log('[SESSION STORE] SET:', sid, 'with user:', sess.passport?.user);
      const expire = new Date(Date.now() + (sess.cookie?.maxAge || 30 * 24 * 60 * 60 * 1000));
      const sessJson = JSON.stringify(sess);
      
      console.log('[SESSION STORE] Inserting session, expires:', expire);
      // Upsert: insert or update
      const result = await this.prisma.$executeRaw`
        INSERT INTO "Session" (sid, sess, expire) 
        VALUES (${sid}, ${sessJson}::jsonb, ${expire})
        ON CONFLICT (sid) 
        DO UPDATE SET sess = ${sessJson}::jsonb, expire = ${expire}
      `;
      console.log('[SESSION STORE] SET SUCCESS: Session saved to database');
      callback();
    } catch (err) {
      console.error('[SESSION STORE] SET ERROR:', err.message, err);
      callback(err);
    }
  }

  async destroy(sid, callback) {
    try {
      console.log('[SESSION STORE] DESTROY:', sid);
      await this.prisma.$executeRaw`
        DELETE FROM "Session" WHERE sid = ${sid}
      `;
      console.log('[SESSION STORE] DESTROY: Session deleted');
      callback();
    } catch (err) {
      console.error('[SESSION STORE] DESTROY ERROR:', err.message);
      callback(err);
    }
  }

  async touch(sid, sess, callback) {
    try {
      console.log('[SESSION STORE] TOUCH:', sid);
      const expire = new Date(Date.now() + (sess.cookie?.maxAge || 30 * 24 * 60 * 60 * 1000));
      await this.prisma.$executeRaw`
        UPDATE "Session" SET expire = ${expire} WHERE sid = ${sid}
      `;
      console.log('[SESSION STORE] TOUCH: Session updated');
      callback();
    } catch (err) {
      console.error('[SESSION STORE] TOUCH ERROR:', err.message);
      callback(err);
    }
  }
}

module.exports = PrismaSessionStore;
