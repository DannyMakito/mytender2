-- NUCLEAR CLEANUP: Remove all triggers and functions that could be interfering
-- This will drop EVERYTHING related to notifications and tasks to start fresh

-- Step 1: Drop ALL triggers that touch tasks table
DROP TRIGGER IF EXISTS trigger_create_notification_on_task ON public.tasks CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_task_creation ON public.tasks CASCADE;
DROP TRIGGER IF EXISTS trigger_update_tasks_updated_at ON public.tasks CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_on_task_insert ON public.tasks CASCADE;
DROP TRIGGER IF EXISTS trigger_task_notification ON public.tasks CASCADE;

-- Step 2: Drop ALL triggers on projects table
DROP TRIGGER IF EXISTS trigger_create_project_notification ON public.projects CASCADE;
DROP TRIGGER IF EXISTS trigger_project_notification ON public.projects CASCADE;

-- Step 3: Drop ALL notification-related functions
DROP FUNCTION IF EXISTS public.create_notification_on_task_insert() CASCADE;
DROP FUNCTION IF EXISTS public.notify_task_creation() CASCADE;
DROP FUNCTION IF EXISTS public.create_project_notification_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.notify_project_creation() CASCADE;

-- Step 4: Drop ALL versions of create_notification EXCEPT the correct one
-- First, list all overloads
DROP FUNCTION IF EXISTS public.create_notification(UUID, notification_type, TEXT, TEXT, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(UUID, notification_type, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT, UUID, UUID) CASCADE;

-- Step 5: Now recreate ONLY the correct version
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
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.create_notification(TEXT, notification_type, TEXT, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(TEXT, notification_type, TEXT, TEXT, UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.create_notification(TEXT, notification_type, TEXT, TEXT, UUID, UUID) TO service_role;

-- Step 6: Ensure tasks table can be inserted without any triggers interfering
-- Recreate the only legitimate trigger: update updated_at timestamp
DROP TRIGGER IF EXISTS trigger_update_tasks_updated_at ON public.tasks CASCADE;

CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tasks_updated_at();

-- Done! This should resolve the issue
-- Tasks can now be inserted freely without triggering notification creation
