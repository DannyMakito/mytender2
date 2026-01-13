-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  province text,
  business_name text,
  business_type text,
  industry text,
  business_desc text,
  business_address text,
  operating_regions text[], -- Array of strings
  tender_categories text[], -- Array of strings
  budget_range text,
  notifications jsonb DEFAULT '{"email": true, "sms": false, "digest": false}'::jsonb,
  onboarding_completed boolean DEFAULT false,
  role text, -- 'client' or 'pro'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add category column to tenders table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'category') THEN
        ALTER TABLE public.tenders ADD COLUMN category text;
    END IF;
END $$;

-- Create Enum for Tender Categories (optional, but good for validation)
-- Note: Supabase UI might handle enums differently, but we can check constraint
-- construction,transportation,professional Services,others,suplier,Catering

ALTER TABLE public.tenders DROP CONSTRAINT IF EXISTS tenders_category_check;
ALTER TABLE public.tenders ADD CONSTRAINT tenders_category_check 
  CHECK (category IN ('Construction', 'Transportation', 'Professional Services', 'Others', 'Supplier', 'Catering'));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
