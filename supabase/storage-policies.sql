-- ═══════════════════════════════════════════════════════════
--  EduLib — Supabase Storage Policies
--  Run this in: Supabase Dashboard → SQL Editor → New Query
--  Run AFTER schema.sql
-- ═══════════════════════════════════════════════════════════

-- The "ebooks" bucket must already exist (created manually in the
-- Supabase dashboard as a PRIVATE bucket).

-- Allow the service-role (our backend) to do everything.
-- The backend never calls these policies directly — the service-role
-- key bypasses RLS — but these policies block any accidental
-- direct client-side access.

-- Block all direct public reads (files are private; backend serves signed URLs)
CREATE POLICY "No public read on ebooks"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ebooks' AND false);

-- Block all direct public writes
CREATE POLICY "No public write on ebooks"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ebooks' AND false);

CREATE POLICY "No public delete on ebooks"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ebooks' AND false);

-- ═══════════════════════════════════════════════════════════
--  Supabase Storage — Manual Steps (do in the Dashboard UI)
-- ═══════════════════════════════════════════════════════════
--
--  1. Go to Storage → New Bucket
--     Name:              ebooks
--     Public:            OFF  (private)
--     File size limit:   52428800  (50 MB)
--     Allowed MIME types: application/pdf, application/epub+zip
--
--  2. The backend uses the service-role key to upload and create
--     signed URLs — it never needs a public URL.
--
-- ═══════════════════════════════════════════════════════════
