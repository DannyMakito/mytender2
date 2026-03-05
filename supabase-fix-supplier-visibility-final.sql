-- SQL Fix: Ensure Suppliers can see open quotation tenders
-- Please run this in your Supabase SQL Editor.

-- Drop conflicting policies that might prevent bidders/suppliers from seeing tenders
DROP POLICY IF EXISTS "Authenticated users can view open tenders" ON public.tenders;
DROP POLICY IF EXISTS "Bidders view pro tenders" ON public.tenders;
DROP POLICY IF EXISTS "Suppliers view supplier tenders" ON public.tenders;
DROP POLICY IF EXISTS "Suppliers can view open supplier tenders" ON public.tenders;
DROP POLICY IF EXISTS "Bidders can view open pro tenders" ON public.tenders;

-- The ultimate policy: If a tender is 'open', ANY authenticated user should be able to see it in the list.
-- This ensures Suppliers can see Quotation Tenders, and Contractors can see Project Tenders.
CREATE POLICY "All Authenticated users can view open tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (status = 'open');
