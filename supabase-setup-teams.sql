-- SQL script to set up Teams functionality (channels and messages)
-- Run this in your Supabase SQL Editor

-- 1. Create team_channels table
CREATE TABLE IF NOT EXISTS public.team_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice', 'announcement')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by TEXT -- email of creator
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_channels_project_id ON public.team_channels(project_id);

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.team_channels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT, -- Optional display name cache
  attachments JSONB, -- For file uploads
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- 3. Enable RLS
ALTER TABLE public.team_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for team_channels

-- Policy: Project members can view channels
CREATE POLICY "Project members can view channels"
ON public.team_channels
FOR SELECT
TO authenticated
USING (
  public.is_project_member(project_id)
);

-- Policy: Project members can create channels
CREATE POLICY "Project members can create channels"
ON public.team_channels
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_project_member(project_id)
);

-- Policy: Project members can update channels
CREATE POLICY "Project members can update channels"
ON public.team_channels
FOR UPDATE
TO authenticated
USING (
  public.is_project_member(project_id)
)
WITH CHECK (
  public.is_project_member(project_id)
);

-- Policy: Project members can delete channels
CREATE POLICY "Project members can delete channels"
ON public.team_channels
FOR DELETE
TO authenticated
USING (
  public.is_project_member(project_id)
);

-- 5. RLS Policies for messages

-- Helper function to check if user is member of project via channel
CREATE OR REPLACE FUNCTION public.is_channel_member(p_channel_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  SELECT project_id INTO v_project_id
  FROM public.team_channels
  WHERE id = p_channel_id;
  
  IF v_project_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN public.is_project_member(v_project_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_channel_member TO authenticated;

-- Policy: Channel members can view messages
CREATE POLICY "Channel members can view messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.is_channel_member(channel_id)
);

-- Policy: Channel members can send messages
CREATE POLICY "Channel members can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_channel_member(channel_id)
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

-- 6. Default channels trigger
-- When a project is created, automatically create a 'General' channel
CREATE OR REPLACE FUNCTION public.create_default_channels()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_channels (project_id, name, type, created_by)
  VALUES (NEW.id, 'General', 'text', 'system');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_default_channels ON public.projects;
CREATE TRIGGER trigger_create_default_channels
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_channels();
