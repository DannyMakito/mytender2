-- =====================================================
-- ACCOUNT VERIFICATION MIGRATION
-- Run this in your Supabase SQL Editor to add
-- the account verification columns to the existing profiles table
-- =====================================================

-- Add new columns for account verification (if they don't exist)
DO $$
BEGIN
    -- Add account_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'account_status') THEN
        ALTER TABLE public.profiles ADD COLUMN account_status text DEFAULT 'pending' 
            CHECK (account_status IN ('pending', 'approved', 'rejected'));
    END IF;

    -- Add business_document_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'business_document_url') THEN
        ALTER TABLE public.profiles ADD COLUMN business_document_url text;
    END IF;

    -- Add rejection_reason column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.profiles ADD COLUMN rejection_reason text;
    END IF;
END $$;

-- Update existing approved users (those with onboarding_completed = true) to have approved status
UPDATE public.profiles 
SET account_status = 'approved' 
WHERE onboarding_completed = true AND account_status IS NULL;

-- Update existing pending users to have pending status
UPDATE public.profiles 
SET account_status = 'pending' 
WHERE onboarding_completed = false AND account_status IS NULL;

-- =====================================================
-- STORAGE BUCKET SETUP
-- Note: You need to create the storage bucket manually 
-- in Supabase Dashboard (Storage > Create Bucket)
-- or run the following if using Supabase CLI
-- =====================================================

-- Create storage bucket for business documents (run via Supabase Dashboard or CLI)
-- Bucket name: business-documents
-- Public: Yes (so admins can view documents)

-- Storage policies for the business-documents bucket
-- Run these AFTER creating the bucket in Supabase Dashboard

-- Policy: Users can upload their own documents
-- CREATE POLICY "Users can upload their own documents"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'business-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Users can view their own documents
-- CREATE POLICY "Users can view their own documents"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (bucket_id = 'business-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Admins can view all documents
-- CREATE POLICY "Admins can view all documents"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (bucket_id = 'business-documents' AND public.is_admin());

-- Policy: Users can update their own documents
-- CREATE POLICY "Users can update their own documents"
-- ON storage.objects FOR UPDATE TO authenticated
-- USING (bucket_id = 'business-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- Update RPC function to include new columns
-- =====================================================

DROP FUNCTION IF EXISTS public.get_admin_users_list();

CREATE OR REPLACE FUNCTION public.get_admin_users_list()
RETURNS TABLE (
    profile_id uuid,
    profile_email text,
    user_role text,
    profile_created_at timestamptz,
    profile_onboarding_completed boolean,
    profile_first_name text,
    profile_last_name text,
    profile_account_status text,
    profile_business_document_url text,
    profile_rejection_reason text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        p.id as profile_id,
        ur.user_email as profile_email,
        ur.role as user_role,
        p.created_at as profile_created_at,
        p.onboarding_completed as profile_onboarding_completed,
        p.first_name as profile_first_name,
        p.last_name as profile_last_name,
        p.account_status as profile_account_status,
        p.business_document_url as profile_business_document_url,
        p.rejection_reason as profile_rejection_reason
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    ORDER BY p.created_at DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_users_list() TO authenticated;
