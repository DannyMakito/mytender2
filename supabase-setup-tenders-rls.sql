-- SQL script to set up RLS policies for tenders table
-- Run this in your Supabase SQL Editor

-- IMPORTANT: Before running this script, you must:
-- 1. Create a storage bucket named 'tender-documents' in Supabase Storage UI
--    - Go to Storage in your Supabase dashboard
--    - Click "Create bucket"
--    - Name it: tender-documents
--    - Make it PUBLIC (or set up appropriate policies)
-- 2. Then run this entire script to set up RLS policies

-- Create storage bucket policy
-- Storage bucket name: tender-documents

-- Policy: Allow authenticated users to upload documents
CREATE POLICY "Users can upload tender documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tender-documents' AND
  auth.uid() IS NOT NULL
);

-- Policy: Allow users to read their own documents
CREATE POLICY "Users can read tender documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tender-documents' AND
  auth.uid() IS NOT NULL
);

-- Policy: Allow users to delete their own documents
CREATE POLICY "Users can delete tender documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tender-documents' AND
  auth.uid() IS NOT NULL
);

-- Enable RLS on tenders table
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- Drop existing function if it exists (cleanup)
DROP FUNCTION IF EXISTS public.get_user_email();

-- Drop existing policies if they exist (to allow re-running the script)
DROP POLICY IF EXISTS "Clients can view their own tenders" ON public.tenders;
DROP POLICY IF EXISTS "Clients can create their own tenders" ON public.tenders;
DROP POLICY IF EXISTS "Clients can update their own tenders" ON public.tenders;
DROP POLICY IF EXISTS "Clients can delete their own tenders" ON public.tenders;

-- Policy: Users with 'client' role can SELECT their own tenders
-- Uses JWT email directly from auth.jwt() ->> 'email'
CREATE POLICY "Clients can view their own tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_email = (auth.jwt() ->> 'email')
    AND user_roles.role = 'client'
    AND user_roles.user_id = auth.uid()
  )
  AND posted_by = (auth.jwt() ->> 'email')
);

-- Policy: Users with 'client' role can INSERT their own tenders
CREATE POLICY "Clients can create their own tenders"
ON public.tenders
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_email = (auth.jwt() ->> 'email')
    AND user_roles.role = 'client'
    AND user_roles.user_id = auth.uid()
  )
  AND posted_by = (auth.jwt() ->> 'email')
);

-- Policy: Users with 'client' role can UPDATE their own tenders
CREATE POLICY "Clients can update their own tenders"
ON public.tenders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_email = (auth.jwt() ->> 'email')
    AND user_roles.role = 'client'
    AND user_roles.user_id = auth.uid()
  )
  AND posted_by = (auth.jwt() ->> 'email')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_email = (auth.jwt() ->> 'email')
    AND user_roles.role = 'client'
    AND user_roles.user_id = auth.uid()
  )
  AND posted_by = (auth.jwt() ->> 'email')
);

-- Policy: Users with 'client' role can DELETE their own tenders
CREATE POLICY "Clients can delete their own tenders"
ON public.tenders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_email = (auth.jwt() ->> 'email')
    AND user_roles.role = 'client'
    AND user_roles.user_id = auth.uid()
  )
  AND posted_by = (auth.jwt() ->> 'email')
);

