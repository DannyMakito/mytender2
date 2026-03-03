-- Migration script to add 'supplier' role and related changes
-- Run this in your Supabase SQL Editor

-- 1. Update app_role enum to include 'supplier'
-- Note: In Supabase/PostgreSQL, you cannot easily add to an enum if it's used in a table.
-- We check if we need to update the constraint if it was a check constraint or an actual ENUM.
-- Based on previous scripts, it seems 'app_role' is an enum.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('client', 'pro', 'admin', 'supplier');
    ELSE
        -- If it exists, we try to add the value (Postgres 12+ supports this)
        ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supplier';
    END IF;
END $$;

-- 2. Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cipc_number TEXT;

-- Update the account_status check constraint if needed (already covers 'pending', 'approved', 'rejected')
-- Update the role column check if it was a text column with check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- We don't necessarily need a strict check here if we use it in the app, 
-- but for safety:
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('client', 'pro', 'admin', 'supplier'));

-- 3. Update tenders table
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS tender_type TEXT DEFAULT 'pro';

-- 4. Update index for tenders to include tender_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_tenders_tender_type ON public.tenders(tender_type);
