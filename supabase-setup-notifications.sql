-- SQL script to set up notifications table with RLS
-- Run this in your Supabase SQL Editor

-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'NEW_TENDER',
  'AWARDED_TENDER',
  'REJECTED_BID',
  'PROJECT_TASK',
  'NEW_BID'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL, -- Changed from user_id UUID to match frontend and fix schema mismatch
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  tender_id UUID REFERENCES public.tenders(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON public.notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_email, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own notifications
-- Exception: NEW_TENDER notifications are public (visible to all authenticated users)
CREATE POLICY "Users can read their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  user_email = auth.jwt() ->> 'email' OR 
  (type = 'NEW_TENDER' AND auth.uid() IS NOT NULL)
);

-- RLS Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_email = auth.jwt() ->> 'email')
WITH CHECK (user_email = auth.jwt() ->> 'email');

-- RLS Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_email = auth.jwt() ->> 'email');

-- SECURITY DEFINER function to create notifications (for system-generated notifications)
-- This allows the system to create notifications on behalf of users
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_email TEXT,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_tender_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_email,
    type,
    title,
    message,
    tender_id,
    project_id
  )
  VALUES (
    p_user_email,
    p_type,
    p_title,
    p_message,
    p_tender_id,
    p_project_id
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;

-- Function to create notification for all users (for NEW_TENDER)
CREATE OR REPLACE FUNCTION public.create_notification_for_all(
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_tender_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insert notification for all authenticated users (using email from user_roles or auth.users)
  INSERT INTO public.notifications (
    user_email,
    type,
    title,
    message,
    tender_id
  )
  SELECT 
    email,
    p_type,
    p_title,
    p_message,
    p_tender_id
  FROM auth.users;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_notification_for_all TO authenticated;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE
  WHERE id = p_notification_id
    AND user_email = auth.jwt() ->> 'email';
  
  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.mark_notification_read TO authenticated;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE
  WHERE user_email = auth.jwt() ->> 'email'
    AND is_read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read TO authenticated;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.notifications
  WHERE user_email = auth.jwt() ->> 'email'
    AND is_read = FALSE;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count TO authenticated;



