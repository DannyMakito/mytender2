-- Run this in your Supabase SQL Editor to update the allowed categories
ALTER TABLE public.tenders DROP CONSTRAINT IF EXISTS tenders_category_check;
ALTER TABLE public.tenders ADD CONSTRAINT tenders_category_check CHECK (category IN (
    'Housing Development', 
    'Office Spaces', 
    'Professional Services', 
    'Others', 
    'General Supplier', 
    'Catering', 
    'Supplier', 
    'General'
));
