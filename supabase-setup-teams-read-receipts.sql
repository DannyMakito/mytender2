-- SQL script to add Read Receipts and Unread Counts
-- Run this in Supabase SQL Editor

-- 1. Add read_by column to messages
-- read_by will store an array of emails who have read the message
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '[]'::jsonb;

-- 2. Function to mark messages as read for a project
-- When a user opens a project, we mark all unread messages (where user is not in read_by) as read.
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_project_id UUID, p_user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update messages in the project where the user is NOT the sender
  -- AND the user's email is NOT already in the read_by array
  UPDATE public.messages
  SET read_by = (
    CASE 
      WHEN read_by IS NULL THEN jsonb_build_array(p_user_email)
      WHEN NOT (read_by @> to_jsonb(p_user_email)) THEN read_by || to_jsonb(p_user_email)
      ELSE read_by
    END
  )
  WHERE project_id = p_project_id
    AND sender_email != p_user_email
    AND (read_by IS NULL OR NOT (read_by @> to_jsonb(p_user_email)));
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_messages_read TO authenticated;

-- 3. Function to get unread counts for all projects for a user
-- Returns a list of { project_id, count }
CREATE OR REPLACE FUNCTION public.get_unread_counts(p_user_email TEXT)
RETURNS TABLE (project_id UUID, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT m.project_id, COUNT(*)
  FROM public.messages m
  WHERE m.sender_email != p_user_email -- Don't count my own messages
    AND (m.read_by IS NULL OR NOT (m.read_by @> to_jsonb(p_user_email))) -- Not read by me
    -- Ensure the user is actually a member of the project (via RLS or explicit join)
    -- Since this is Security Definer, we should manually check membership or trust the input context.
    -- For safety/efficiency, we can join with 'projects' and check membership logic, 
    -- but usually 'is_project_member' check might be slow for all rows. 
    -- We'll assume the client filters projects they don't have access to, 
    -- BUT purely relying on sender_email != me is a bit loose if they aren't in the project.
    -- Let's add a condition that the project must be one where user is owner or winner.
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = m.project_id
      AND (p.owner_email = p_user_email OR p_user_email = ANY(p.winner_emails))
    )
  GROUP BY m.project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_counts TO authenticated;
