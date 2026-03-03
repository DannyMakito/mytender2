-- ==============================================================
-- Add created_by column to tasks and PROJECT_TASK notification trigger
-- ==============================================================
-- Run this in your Supabase SQL Editor

-- 1. Add created_by column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. Update existing tasks to set created_by from the project's winner_emails (first winner)
-- This is a best-effort migration for existing data
UPDATE public.tasks t
SET created_by = (
  SELECT winner_emails[1]
  FROM public.projects p
  WHERE p.id = t.project_id
)
WHERE t.created_by IS NULL;

-- 3. Create a trigger function to send PROJECT_TASK notifications
CREATE OR REPLACE FUNCTION public.notify_project_task_change()
RETURNS TRIGGER AS $$
DECLARE
  v_project_name TEXT;
  v_owner_email TEXT;
  v_winner_email TEXT;
  v_message TEXT;
  v_title TEXT;
BEGIN
  -- Get project details
  SELECT name, owner_email INTO v_project_name, v_owner_email
  FROM public.projects
  WHERE id = NEW.project_id;

  IF TG_OP = 'INSERT' THEN
    v_title := 'New Task Created';
    v_message := 'A new task "' || NEW.title || '" has been created in project "' || COALESCE(v_project_name, 'Unknown') || '" by ' || COALESCE(NEW.created_by, 'a team member') || '.';
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    v_title := 'Task Status Updated';
    v_message := 'Task "' || NEW.title || '" in project "' || COALESCE(v_project_name, 'Unknown') || '" has been moved to ' || 
      CASE NEW.status
        WHEN 'todo' THEN 'Yet To Start'
        WHEN 'inprogress' THEN 'In Progress'
        WHEN 'done' THEN 'Completed'
        WHEN 'completed' THEN 'Completed'
        WHEN 'waiting' THEN 'Waiting'
        ELSE NEW.status
      END || '.';
  ELSE
    -- No notification for other updates
    RETURN NEW;
  END IF;

  -- Notify the project owner (if the change was NOT made by the owner)
  IF v_owner_email IS NOT NULL AND v_owner_email != COALESCE(NEW.created_by, '') THEN
    INSERT INTO public.notifications (user_email, type, title, message, project_id, is_read)
    VALUES (v_owner_email, 'PROJECT_TASK', v_title, v_message, NEW.project_id, false);
  END IF;

  -- Notify all project winners (except the person who made the change)
  FOR v_winner_email IN
    SELECT unnest(winner_emails) FROM public.projects WHERE id = NEW.project_id
  LOOP
    IF v_winner_email != COALESCE(NEW.created_by, '') AND v_winner_email != COALESCE(v_owner_email, '') THEN
      INSERT INTO public.notifications (user_email, type, title, message, project_id, is_read)
      VALUES (v_winner_email, 'PROJECT_TASK', v_title, v_message, NEW.project_id, false);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create triggers for task insert and status update
DROP TRIGGER IF EXISTS trigger_notify_task_created ON public.tasks;
CREATE TRIGGER trigger_notify_task_created
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_task_change();

DROP TRIGGER IF EXISTS trigger_notify_task_status_updated ON public.tasks;
CREATE TRIGGER trigger_notify_task_status_updated
  AFTER UPDATE OF status ON public.tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_project_task_change();
