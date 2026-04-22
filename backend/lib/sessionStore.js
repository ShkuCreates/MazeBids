const session = require('express-session');

class PrismaSessionStore extends session.Store {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async get(sid, callback) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT sess FROM "Session" WHERE sid = ${sid} AND expire > NOW()
      `;
      
      if (result && result.length > 0) {
        const sessionData = typeof result[0].sess === 'string' 
          ? JSON.parse(result[0].sess) 
          : result[0].sess;
        callback(null, sessionData);
      } else {
        callback(null, null);
      }
    } catch (err) {
      console.error('[SESSION STORE] Get error:', err);
      callback(err);
    }
  }

  async set(sid, sess, callback) {
    try {
      const expire = new Date(Date.now() + (sess.cookie?.maxAge || 30 * 24 * 60 * 60 * 1000));
      const sessJson = JSON.stringify(sess);
      
      // Upsert: insert or update
      await this.prisma.$executeRaw`
        INSERT INTO "Session" (sid, sess, expire) 
        VALUES (${sid}, ${sessJson}::jsonb, ${expire})
        ON CONFLICT (sid) 
        DO UPDATE SET sess = ${sessJson}::jsonb, expire = ${expire}
      `;
      callback();
    } catch (err) {
      console.error('[SESSION STORE] Set error:', err);
      callback(err);
    }
  }

  async destroy(sid, callback) {
    try {
      await this.prisma.$executeRaw`
        DELETE FROM "Session" WHERE sid = ${sid}
      `;
      callback();
    } catch (err) {
      console.error('[SESSION STORE] Destroy error:', err);
      callback(err);
    }
  }

  async touch(sid, sess, callback) {
    try {
      const expire = new Date(Date.now() + (sess.cookie?.maxAge || 30 * 24 * 60 * 60 * 1000));
      await this.prisma.$executeRaw`
        UPDATE "Session" SET expire = ${expire} WHERE sid = ${sid}
      `;
      callback();
    } catch (err) {
      console.error('[SESSION STORE] Touch error:', err);
      callback(err);
    }
  }
}

module.exports = PrismaSessionStore;
