-- SQL script to create bids table with proper permissions
-- Run this in your Supabase SQL Editor

-- Create bids table
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  bidder TEXT NOT NULL,
  bid_amount NUMERIC(15, 2) NOT NULL CHECK (bid_amount > 0),
  proposal_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bids_tender_id ON public.bids(tender_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON public.bids(bidder);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_submitted_at ON public.bids(submitted_at);

-- Create unique constraint to prevent duplicate bids from same bidder on same tender
CREATE UNIQUE INDEX IF NOT EXISTS idx_bids_unique_bidder_tender 
ON public.bids(tender_id, bidder);

-- Enable Row Level Security
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Create helper function to check user role (uses SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.check_user_role(p_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email text;
  v_user_id uuid;
  v_has_role boolean;
BEGIN
  -- Get current user's email and ID from JWT
  v_user_email := auth.jwt() ->> 'email';
  v_user_id := auth.uid();
  
  -- Check if user has the specified role
  -- Cast text parameter to app_role enum type for comparison
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_email = v_user_email
    AND user_roles.role = p_role::app_role
    AND user_roles.user_id = v_user_id
  ) INTO v_has_role;
  
  RETURN COALESCE(v_has_role, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_user_role TO authenticated;

-- Drop existing policies if they exist (to allow re-running the script)
DROP POLICY IF EXISTS "Bidders can view their own bids" ON public.bids;
DROP POLICY IF EXISTS "Bidders can create their own bids" ON public.bids;
DROP POLICY IF EXISTS "Bidders can update their own bids" ON public.bids;
DROP POLICY IF EXISTS "Clients can view bids on their tenders" ON public.bids;
DROP POLICY IF EXISTS "Clients can update bid status on their tenders" ON public.bids;

-- Policy: Bidders (users with 'pro' role) can SELECT their own bids
CREATE POLICY "Bidders can view their own bids"
ON public.bids
FOR SELECT
TO authenticated
USING (
  public.check_user_role('pro')
  AND bidder = (auth.jwt() ->> 'email')
);

-- Policy: Bidders can INSERT their own bids
CREATE POLICY "Bidders can create their own bids"
ON public.bids
FOR INSERT
TO authenticated
WITH CHECK (
  public.check_user_role('pro')
  AND bidder = (auth.jwt() ->> 'email')
);

-- Policy: Bidders can UPDATE their own bids (only if status is 'submitted')
-- This prevents bidders from changing bids that have been reviewed
CREATE POLICY "Bidders can update their own bids"
ON public.bids
FOR UPDATE
TO authenticated
USING (
  public.check_user_role('pro')
  AND bidder = (auth.jwt() ->> 'email')
  AND status = 'submitted'
)
WITH CHECK (
  public.check_user_role('pro')
  AND bidder = (auth.jwt() ->> 'email')
  AND status = 'submitted'
);

-- Policy: Clients (users with 'client' role) can SELECT bids on their own tenders
CREATE POLICY "Clients can view bids on their tenders"
ON public.bids
FOR SELECT
TO authenticated
USING (
  public.check_user_role('client')
  AND EXISTS (
    SELECT 1 FROM public.tenders
    WHERE tenders.id = bids.tender_id
    AND tenders.posted_by = (auth.jwt() ->> 'email')
  )
);

-- Policy: Clients can UPDATE bid status on their own tenders
CREATE POLICY "Clients can update bid status on their tenders"
ON public.bids
FOR UPDATE
TO authenticated
USING (
  public.check_user_role('client')
  AND EXISTS (
    SELECT 1 FROM public.tenders
    WHERE tenders.id = bids.tender_id
    AND tenders.posted_by = (auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  public.check_user_role('client')
  AND EXISTS (
    SELECT 1 FROM public.tenders
    WHERE tenders.id = bids.tender_id
    AND tenders.posted_by = (auth.jwt() ->> 'email')
  )
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_bids_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
DROP TRIGGER IF EXISTS trigger_update_bids_updated_at ON public.bids;
CREATE TRIGGER trigger_update_bids_updated_at
  BEFORE UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bids_updated_at();

-- Create function to automatically reject other bids when one is approved
CREATE OR REPLACE FUNCTION public.reject_other_bids_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the status is being changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Update all other bids for the same tender to 'rejected'
    -- Exclude the current bid being approved
    UPDATE public.bids
    SET 
      status = 'rejected',
      updated_at = NOW()
    WHERE 
      tender_id = NEW.tender_id
      AND id != NEW.id
      AND status != 'rejected'; -- Only update bids that aren't already rejected
    
    -- Log the action (optional, for debugging)
    RAISE NOTICE 'Bid % approved for tender %. Other bids automatically rejected.', NEW.id, NEW.tender_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically reject other bids when one is approved
DROP TRIGGER IF EXISTS trigger_reject_other_bids_on_approval ON public.bids;
CREATE TRIGGER trigger_reject_other_bids_on_approval
  AFTER UPDATE OF status ON public.bids
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
  EXECUTE FUNCTION public.reject_other_bids_on_approval();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.bids TO authenticated;

