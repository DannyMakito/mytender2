-- SQL script to fix bids visibility and insertion for both Bidders and Suppliers
-- Run this in your Supabase SQL Editor

-- 1. Ensure RLS is enabled on bids table
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive bidder policies
DROP POLICY IF EXISTS "Bidders can view their own bids" ON public.bids;
DROP POLICY IF EXISTS "Bidders can create their own bids" ON public.bids;
DROP POLICY IF EXISTS "Bidders can update their own bids" ON public.bids;
DROP POLICY IF EXISTS "Suppliers can view their own bids" ON public.bids;
DROP POLICY IF EXISTS "Suppliers can create their own bids" ON public.bids;

-- 3. Create new inclusive policies for both 'pro' and 'supplier' roles

-- Policy: Bidders/Suppliers can SELECT their own bids
CREATE POLICY "Users can view their own bids"
ON public.bids
FOR SELECT
TO authenticated
USING (
  bidder = (auth.jwt() ->> 'email')
);

-- Policy: Bidders/Suppliers can INSERT their own bids
-- We check for either 'pro' or 'supplier' role here
CREATE POLICY "Users can create their own bids"
ON public.bids
FOR INSERT
TO authenticated
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND (user_roles.role = 'pro' OR user_roles.role = 'supplier')
    )
  )
  AND (bidder = (auth.jwt() ->> 'email'))
);

-- Policy: Bidders/Suppliers can UPDATE their own bids (only if status is 'submitted')
CREATE POLICY "Users can update their own bids"
ON public.bids
FOR UPDATE
TO authenticated
USING (
  bidder = (auth.jwt() ->> 'email')
  AND status = 'submitted'
)
WITH CHECK (
  bidder = (auth.jwt() ->> 'email')
  AND status = 'submitted'
);

-- 4. Ensure Clients can still see bids on their tenders
DROP POLICY IF EXISTS "Clients can view bids on their tenders" ON public.bids;
CREATE POLICY "Clients can view bids on their tenders"
ON public.bids
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenders
    WHERE tenders.id = public.bids.tender_id
    AND tenders.posted_by = (auth.jwt() ->> 'email')
  )
);

-- 5. Ensure Admins can see everything
DROP POLICY IF EXISTS "Admins can view all bids" ON public.bids;
CREATE POLICY "Admins can view all bids"
ON public.bids
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
