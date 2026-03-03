-- SQL script to repair RLS policies and fix "permission denied for table users"
-- Run this in your Supabase SQL Editor

-- 1. Fix user_roles policies to avoid querying auth.users (which causes permission errors)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Allow users to insert/read their own role using JWT info (safe)
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR user_email = (auth.jwt() ->> 'email')
);

CREATE POLICY "Users can read their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR user_email = (auth.jwt() ->> 'email')
);

-- Admin policy (safe check)
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'admin2@mytender.com' OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 2. Repair Tenders policies to be robust and performant
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- Drop all possible tender policies to start fresh and clean
DROP POLICY IF EXISTS "Clients can view their own tenders" ON public.tenders;
DROP POLICY IF EXISTS "Clients can create their own tenders" ON public.tenders;
DROP POLICY IF EXISTS "Clients can update their own tenders" ON public.tenders;
DROP POLICY IF EXISTS "Clients can delete their own tenders" ON public.tenders;
DROP POLICY IF EXISTS "Bidders can view open pro tenders" ON public.tenders;
DROP POLICY IF EXISTS "Suppliers can view open supplier tenders" ON public.tenders;
DROP POLICY IF EXISTS "Admins can view all tenders" ON public.tenders;
DROP POLICY IF EXISTS "Users can view tenders they bid on" ON public.tenders;

-- POLICY: Clients can manage their OWN tenders
CREATE POLICY "Clients manage own tenders"
ON public.tenders
FOR ALL
TO authenticated
USING (posted_by = (auth.jwt() ->> 'email'))
WITH CHECK (posted_by = (auth.jwt() ->> 'email'));

-- POLICY: Bidders can view open Pro tenders
CREATE POLICY "Bidders view pro tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (tender_type = 'pro' AND status = 'open');

-- POLICY: Suppliers can view open Supplier tenders
CREATE POLICY "Suppliers view supplier tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (tender_type = 'supplier' AND status = 'open');

-- POLICY: Bidders/Suppliers can view tenders they have already bid on (even if closed)
CREATE POLICY "View bidded tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bids
    WHERE bids.tender_id = public.tenders.id
    AND bids.bidder = (auth.jwt() ->> 'email')
  )
);

-- POLICY: Admins can see everything
CREATE POLICY "Admins see all"
ON public.tenders
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'admin2@mytender.com' OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);
