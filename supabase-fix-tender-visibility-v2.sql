-- SQL script to fix tender visibility for bidders and suppliers
-- Run this in your Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- 2. Drop overly restrictive or redundant policies if necessary
-- (We keep "Clients can view their own tenders" as it allows them to see their drafts/closed tenders too)

-- 3. Add policy for Bidders to see Pro tenders
DROP POLICY IF EXISTS "Bidders can view open pro tenders" ON public.tenders;
CREATE POLICY "Bidders can view open pro tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (
  tender_type = 'pro' 
  AND status = 'open'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'pro'
  )
);

-- 4. Add policy for Suppliers to see Supplier tenders
DROP POLICY IF EXISTS "Suppliers can view open supplier tenders" ON public.tenders;
CREATE POLICY "Suppliers can view open supplier tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (
  tender_type = 'supplier' 
  AND status = 'open'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'supplier'
  )
);

-- 5. Add policy for Admins to see everything
DROP POLICY IF EXISTS "Admins can view all tenders" ON public.tenders;
CREATE POLICY "Admins can view all tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 6. Optional: Allow anyone to view details of a tender they have bid on
DROP POLICY IF EXISTS "Users can view tenders they bid on" ON public.tenders;
CREATE POLICY "Users can view tenders they bid on"
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
