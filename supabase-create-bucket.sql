-- =====================================================
-- CREATE STORAGE BUCKET MIGRATION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Attempt to create the bucket directly via SQL
-- Note: This requires permissions on the storage schema
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-documents', 'business-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "authenticated_uploads" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "admin_select" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;

-- 1. Allow authenticated users to upload their own documents
-- We check that the file path starts with their user ID: user_id/filename
CREATE POLICY "authenticated_uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'business-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Allow users to view their own documents
CREATE POLICY "authenticated_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'business-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Allow admins to view all documents
CREATE POLICY "admin_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'business-documents' AND public.is_admin());

-- 4. Allow users to update/replace their documents
CREATE POLICY "authenticated_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'business-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
