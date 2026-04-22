# Session Cookie Fix - Implementation Plan

Status: ✅ Plan approved, implementing...

## Steps:

### [x] 1. Create this TODO.md ✅

### [x] 2. Edit backend/server.js ✅\n\n### [x] 3. Edit backend/routes/auth.js ✅ 
**In /verify-token, after `req.session.save((err) => { ... }`:**

Add:
```js
req.session.user = { id: user.id };

// Force set session cookie
res.cookie('connect.sid', req.sessionID, {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000
});
```

**Update /me endpoint:**
```js
// Before if (req.user)
const userId = req.user?.id || req.session.user?.id;
if (userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    res.json(user);
    return;
  }
}
```

### [x] 4. Restart server & test ✅\nServer restarted manually\n\n### [ ] 5. Push to GitHub
