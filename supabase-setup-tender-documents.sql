-- ============================================
-- Tender Documents Table Setup
-- ============================================

-- Create the tender_documents table
CREATE TABLE IF NOT EXISTS tender_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  template_type TEXT DEFAULT 'standard',
  sections JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE tender_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
  ON tender_documents FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

-- Users can insert their own documents
CREATE POLICY "Users can insert own documents"
  ON tender_documents FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
  ON tender_documents FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON tender_documents FOR DELETE
  USING (auth.jwt() ->> 'email' = user_email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tender_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tender_documents_updated_at
  BEFORE UPDATE ON tender_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_tender_documents_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tender_documents_user_email
  ON tender_documents(user_email);

CREATE INDEX IF NOT EXISTS idx_tender_documents_status
  ON tender_documents(status);
