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

-- Function to check if current user is an admin (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- Option 2: Create RLS policy that allows users to insert their own role
-- Enable RLS on the table (if not already enabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- CLEANUP: Drop existing policies to avoid conflicts or recursion errors
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin check" ON public.user_roles;

-- Create policy that allows authenticated users to insert their own role
CREATE POLICY "Users can insert their own role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create policy that allows users to read their own role (Simple, no recursion)
CREATE POLICY "Users can read their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create policy that allows admins to manage all roles (Safe check)
-- We use a simple check for a hardcoded dummy admin or the result of is_admin()
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin2@mytender.com' OR
    public.is_admin()
  );

-- RPC Function to fetch all users with emails directly (Recommended for Admin UI)
-- Drop first to allow changing return type
DROP FUNCTION IF EXISTS public.get_admin_users_list();
CREATE OR REPLACE FUNCTION public.get_admin_users_list()
RETURNS TABLE (
    user_id uuid,
    user_email text,
    user_role text,
    user_created_at timestamptz,
    user_onboarding_completed boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Authorization check
    IF NOT public.is_admin() AND (SELECT auth.users.email FROM auth.users WHERE auth.users.id = auth.uid()) != 'admin2@mytender.com' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        ur.user_email,
        p.role,
        p.created_at,
        p.onboarding_completed
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_list TO authenticated;

