-- SQL Migration: Allow suppliers and professionals to view open tenders
-- Run this in your Supabase SQL Editor

-- ==========================================
-- ADD RLS POLICIES FOR BIDDERS (SUPPLIERS & PROFESSIONALS)
-- ==========================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Authenticated users can view open tenders" ON public.tenders;

-- Policy: All authenticated users (suppliers, professionals, clients, etc.) can view open tenders
-- This allows bidders to see available tenders in the tender directory
CREATE POLICY "Authenticated users can view open tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (status = 'open');

-- Existing policies still allow clients to see their own tenders (including drafts)
-- The above policy is additive and allows broader viewing of open tenders
