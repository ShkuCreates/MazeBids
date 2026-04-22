-- Create Session table for persistent sessions (fixes login persistence on Render)

CREATE TABLE IF NOT EXISTS "Session" (
  "sid" VARCHAR(255) PRIMARY KEY,
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "Session"("expire");
