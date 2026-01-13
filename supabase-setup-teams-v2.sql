-- SQL script to migrate Teams functionality to Project-based Chat (v2)
-- Run this in your Supabase SQL Editor

-- FIX: Corrected drop order to handle dependencies (triggers before functions)

-- 1. CLEANUP V1 OBJECTS (Reverse dependency order)

-- Remove trigger first because it depends on the function
DROP TRIGGER IF EXISTS trigger_create_default_channels ON public.projects;
DROP FUNCTION IF EXISTS public.create_default_channels;

-- Remove policies and tables
DROP POLICY IF EXISTS "Channel members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Channel members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Drop dependent functions
DROP FUNCTION IF EXISTS public.is_channel_member;

-- Drop tables (Messages depends on Channels in v1, though we are dropping both)
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.team_channels;

-- 2. CREATE NEW SCHEMA (Project-based messaging)

-- Re-create messages table with project_id directly
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- 3. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for messages

-- Policy: Project members can view messages
CREATE POLICY "Project members can view messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.is_project_member(project_id)
);

-- Policy: Project members can send messages
CREATE POLICY "Project members can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_project_member(project_id)
);

-- Policy: Users can update their own messages
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  sender_email = (auth.jwt() ->> 'email')
)
WITH CHECK (
  sender_email = (auth.jwt() ->> 'email')
);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  sender_email = (auth.jwt() ->> 'email')
);
