-- ═══════════════════════════════════════════════════════════
--  EduLib — Supabase Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- ── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  class_name    TEXT NOT NULL,
  school_name   TEXT NOT NULL,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('primary','secondary','tertiary')),
  role          TEXT NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_username_idx ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS users_category_idx ON users (category);

-- ── Books ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title              TEXT NOT NULL,
  author             TEXT NOT NULL,
  subject            TEXT NOT NULL,
  category           TEXT NOT NULL CHECK (category IN ('primary','secondary','tertiary')),
  description        TEXT DEFAULT '',
  emoji              TEXT DEFAULT '📗',
  cover_color        TEXT DEFAULT '#f0f0f0',
  file_path          TEXT NOT NULL,          -- path inside "ebooks" Storage bucket
  uploaded_by_admin  BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS books_category_idx ON books (category);

-- ── Activity Log ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  book_id     UUID REFERENCES books(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,   -- login | signup | book_open | book_upload
  meta        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_user_idx    ON activity_log (user_id);
CREATE INDEX IF NOT EXISTS activity_action_idx  ON activity_log (action);
CREATE INDEX IF NOT EXISTS activity_created_idx ON activity_log (created_at DESC);

-- ── Row Level Security ────────────────────────────────────────
-- We use service-role key server-side, so RLS is a safety net only.
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE books        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically — no policies needed
-- for server-to-server calls. These policies restrict direct
-- client-side access if someone tries to call Supabase directly.

-- No direct client access to users table (passwords are there)
CREATE POLICY "No direct client access" ON users FOR ALL USING (false);

-- Books: block direct client access entirely — all reads go through the
-- backend API which uses the service-role key (bypasses RLS).
-- This prevents anyone with the anon key from reading the books table directly.
CREATE POLICY "No direct client read books"   ON books FOR SELECT USING (false);
CREATE POLICY "No direct client write books"  ON books FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct client update books" ON books FOR UPDATE USING (false);
CREATE POLICY "No direct client delete books" ON books FOR DELETE USING (false);

-- Activity log: block all direct client access
CREATE POLICY "No direct client access to activity" ON activity_log FOR ALL USING (false);

-- ═══════════════════════════════════════════════════════════
--  Supabase Storage
--  After running this SQL, also do these steps in the
--  Supabase Dashboard → Storage:
--
--  1. Create a bucket called: ebooks
--  2. Set it to PRIVATE (not public)
--  3. Set file size limit to 50MB
--  4. Allowed MIME types: application/pdf, application/epub+zip
-- ═══════════════════════════════════════════════════════════
