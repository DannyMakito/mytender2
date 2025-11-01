-- SQL script to set up user_roles table with proper permissions
-- Run this in your Supabase SQL Editor

-- Option 1: Create a function that inserts the role (recommended)
-- This function runs with SECURITY DEFINER, bypassing RLS
CREATE OR REPLACE FUNCTION public.insert_user_role(
  p_user_email text,
  p_role app_role,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_email, role, user_id)
  VALUES (p_user_email, p_role, p_user_id)
  ON CONFLICT (user_email) DO UPDATE SET
    role = EXCLUDED.role,
    user_id = EXCLUDED.user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_user_role TO authenticated;

-- Create a function that gets the user role (recommended)
-- This function runs with SECURITY DEFINER, bypassing RLS
CREATE OR REPLACE FUNCTION public.get_user_role(
  p_user_email text
)
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role app_role;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_email = p_user_email
  LIMIT 1;
  
  -- Return NULL if no role found (this is valid)
  RETURN v_role;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;

-- Option 2: Create RLS policy that allows users to insert their own role
-- Enable RLS on the table (if not already enabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy that allows authenticated users to insert their own role
CREATE POLICY "Users can insert their own role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create policy that allows users to read their own role
CREATE POLICY "Users can read their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

