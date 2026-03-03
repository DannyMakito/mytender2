-- ==============================================================
-- Update Task RLS Policies for ownership-based editing/deletion
-- ==============================================================
-- Run this in your Supabase SQL Editor

-- 0. Ensure is_project_owner helper function exists
CREATE OR REPLACE FUNCTION public.is_project_owner(p_project_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_is_owner BOOLEAN;
BEGIN
  v_user_email := auth.jwt() ->> 'email';
  
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
    AND owner_email = v_user_email
  ) INTO v_is_owner;
  
  RETURN COALESCE(v_is_owner, false);
END;
$$;

-- 1. Drop old permissive policies
DROP POLICY IF EXISTS "Winner can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Winner can delete tasks" ON public.tasks;

-- 2. Create new strict UPDATE policy
-- Users can only update tasks they created OR if they are the project owner
CREATE POLICY "Users can update their own tasks or if owner"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email' = created_by) OR 
  public.is_project_owner(project_id)
)
WITH CHECK (
  (auth.jwt() ->> 'email' = created_by) OR 
  public.is_project_owner(project_id)
);

-- 3. Create new strict DELETE policy
-- Users can only delete tasks they created OR if they are the project owner
CREATE POLICY "Users can delete their own tasks or if owner"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'email' = created_by) OR 
  public.is_project_owner(project_id)
);
