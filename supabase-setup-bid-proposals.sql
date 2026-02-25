-- ============================================
-- Bid Proposals Table Setup
-- ============================================

-- Create the bid_proposals table
CREATE TABLE IF NOT EXISTS bid_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,  -- Optional link to a specific tender
  title TEXT NOT NULL DEFAULT 'Untitled Proposal',
  template_type TEXT DEFAULT 'full',
  bidder_type TEXT DEFAULT 'company' CHECK (bidder_type IN ('freelancer', 'company')),
  sections JSONB NOT NULL DEFAULT '{}',
  attached_documents JSONB DEFAULT '[]',   -- [{name, url, type, size}]
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE bid_proposals ENABLE ROW LEVEL SECURITY;

-- Users can view their own proposals
CREATE POLICY "Users can view own proposals"
  ON bid_proposals FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

-- Users can insert their own proposals
CREATE POLICY "Users can insert own proposals"
  ON bid_proposals FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Users can update their own proposals
CREATE POLICY "Users can update own proposals"
  ON bid_proposals FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email);

-- Users can delete their own proposals
CREATE POLICY "Users can delete own proposals"
  ON bid_proposals FOR DELETE
  USING (auth.jwt() ->> 'email' = user_email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_bid_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bid_proposals_updated_at ON bid_proposals;
CREATE TRIGGER trigger_update_bid_proposals_updated_at
  BEFORE UPDATE ON bid_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_bid_proposals_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bid_proposals_user_email
  ON bid_proposals(user_email);

CREATE INDEX IF NOT EXISTS idx_bid_proposals_status
  ON bid_proposals(status);
