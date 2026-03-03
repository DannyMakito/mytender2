-- SQL Migration: Fix Supplier Tender Visibility
-- Allows suppliers and all authenticated users to view open tenders
-- Run this after other tender RLS migrations to restore supplier access

-- 1. Ensure RLS is enabled on tenders table
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- 2. Drop the restrictive tender_type-based policies
DROP POLICY IF EXISTS "Bidders view pro tenders" ON public.tenders;
DROP POLICY IF EXISTS "Suppliers view supplier tenders" ON public.tenders;

-- 3. Add simple policy: All authenticated users can view open tenders
-- This is the most important one - it ensures suppliers see new tenders
DROP POLICY IF EXISTS "Authenticated users can view open tenders" ON public.tenders;
CREATE POLICY "Authenticated users can view open tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (status = 'open');

-- 4. Keep other policies intact:
-- - Clients can manage their own tenders
-- - Users can view tenders they've bid on
-- - Admins can see everything
-- These remain unchanged
