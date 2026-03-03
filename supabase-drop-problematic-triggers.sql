-- Drop the problematic triggers that are calling create_notification with wrong parameters
DROP TRIGGER IF EXISTS trigger_on_task_insert ON public.tasks CASCADE;
DROP TRIGGER IF EXISTS trigger_task_activity ON public.tasks CASCADE;
DROP TRIGGER IF EXISTS trigger_project_completion_change ON public.projects CASCADE;

-- Drop their associated functions
DROP FUNCTION IF EXISTS public.on_task_insert() CASCADE;
DROP FUNCTION IF EXISTS public.task_activity() CASCADE;
DROP FUNCTION IF EXISTS public.project_completion_change() CASCADE;

-- Verify the triggers are gone
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('tasks', 'projects')
ORDER BY event_object_table, trigger_name;
