-- Fix notifications table schema to ensure consistency
-- This migration ensures the notifications table uses user_email consistently

-- Check if user_id column exists and remove it if it does
ALTER TABLE IF EXISTS public.notifications 
  DROP COLUMN IF EXISTS user_id CASCADE;

-- Ensure user_email column exists and is NOT NULL
ALTER TABLE IF EXISTS public.notifications
  ADD COLUMN IF NOT EXISTS user_email TEXT NOT NULL DEFAULT '';

-- Update any NULL user_email values (shouldn't happen, but just in case)
UPDATE public.notifications
SET user_email = COALESCE(user_email, '')
WHERE user_email IS NULL OR user_email = '';

-- Ensure the column is properly constrained
ALTER TABLE public.notifications
  ALTER COLUMN user_email SET NOT NULL;

-- Recreate notification creation functions to ensure they use user_email
-- First, drop all existing versions of the function
DROP FUNCTION IF EXISTS public.create_notification(TEXT, notification_type, TEXT, TEXT, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(TEXT, notification_type, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_notification CASCADE;

-- Now create the correct version
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

GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;

-- Drop and recreate all notification-related RLS policies to ensure they use user_email
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Only service role can insert notifications" ON public.notifications;

-- Recreate RLS policies using user_email
CREATE POLICY "Users can read their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  user_email = auth.jwt() ->> 'email' OR 
  (type = 'NEW_TENDER' AND auth.uid() IS NOT NULL)
);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_email = auth.jwt() ->> 'email')
WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_email = auth.jwt() ->> 'email');

-- Allow authenticated users to insert (for notification creation)
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (user_email IS NOT NULL);

-- Drop any problematic triggers that might reference user_id
DROP TRIGGER IF EXISTS trigger_create_notification_on_task ON public.tasks;
DROP TRIGGER IF EXISTS trigger_create_project_notification ON public.projects;
DROP FUNCTION IF EXISTS public.create_notification_on_task_insert() CASCADE;
DROP FUNCTION IF EXISTS public.create_project_notification_trigger() CASCADE;

-- Verify the schema is correct
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'notifications' 
-- ORDER BY ordinal_position;
