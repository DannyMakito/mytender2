import React, { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../../supabase-client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  // Initialize auth state
  useEffect(() => {
    // Check for dummy admin in localStorage first
    const dummyAdmin = localStorage.getItem('dummyAdmin')
    if (dummyAdmin) {
      const adminUser = JSON.parse(dummyAdmin)
      setUser(adminUser)
      setRole('admin')
      setSession({ user: adminUser })
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.email)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user.email)
      } else {
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user role from user_roles table
  const fetchUserRole = async (userEmail) => {
    try {
      // Try using the database function first (recommended approach)
      const { data: functionData, error: functionError } = await supabase.rpc('get_user_role', {
        p_user_email: userEmail,
      })

      let fetchedRole = null

      if (functionError) {
        // If function doesn't exist or fails, try direct select
        console.warn('Function get_user_role not available, trying direct select:', functionError.message)

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_email', userEmail)
          .single()

        if (error) {
          console.error('Error fetching role:', error)
          setRole(null)
          fetchedRole = null
        } else {
          fetchedRole = data?.role || null
          setRole(fetchedRole)
        }
      } else {
        // Function succeeded, use the returned role
        fetchedRole = functionData || null
        setRole(fetchedRole)
      }

      return fetchedRole
    } catch (err) {
      console.error('Error fetching role:', err)
      setRole(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Sign up function
  const signUp = async (email, password, selectedRole) => {
    try {
      // Validate role - only 'client' and 'pro' are allowed
      if (!selectedRole || !['client', 'pro'].includes(selectedRole)) {
        throw new Error('Please select a valid role (Client or Professional)')
      }

      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      // Add role to user_roles table
      // Try using the database function first (if it exists), otherwise try direct insert
      let roleError = null

      // First, try using the database function (recommended approach)
      const { error: functionError } = await supabase.rpc('insert_user_role', {
        p_user_email: email,
        p_role: selectedRole,
        p_user_id: authData.user.id,
      })

      if (functionError) {
        // If function doesn't exist or fails, try direct insert
        console.warn('Function insert_user_role not available, trying direct insert:', functionError.message)

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_email: email,
            role: selectedRole,
            user_id: authData.user.id,
          })

        roleError = insertError
      }

      if (roleError) {
        console.error('Error adding role - Full error details:', {
          message: roleError.message,
          code: roleError.code,
          details: roleError.details,
          hint: roleError.hint
        })

        // If it's an RLS error, provide helpful message
        if (roleError.code === '42501' || roleError.message?.includes('policy') || roleError.message?.includes('permission')) {
          throw new Error('Database permissions issue. Please run the SQL setup script (supabase-setup-user-roles.sql) in your Supabase SQL Editor to configure proper permissions.')
        }

        // Return the actual error message for debugging
        const errorMessage = roleError.message || roleError.details || 'Failed to assign role. Please try again.'
        throw new Error(errorMessage)
      }

      // Update local state
      setUser(authData.user)
      setRole(selectedRole)
      setSession(authData.session)

      return { success: true, user: authData.user, role: selectedRole }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: error.message }
    }
  }

  // Sign in function
  const signIn = async (email, password) => {
    try {
      // Dummy Admin check
      if (email === 'admin@mytender.com' && password === 'adminpassword123') {
        const adminUser = {
          id: 'admin-dummy-id',
          email: 'admin@mytender.com',
          role: 'admin'
        }
        localStorage.setItem('dummyAdmin', JSON.stringify(adminUser))
        setUser(adminUser)
        setRole('admin')
        setSession({ user: adminUser })
        return { success: true, user: adminUser, role: 'admin' }
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to sign in')
      }

      // Fetch user role and wait for it
      const userRole = await fetchUserRole(email)

      setUser(authData.user)
      setSession(authData.session)

      return { success: true, user: authData.user, role: userRole }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      if (user?.id === 'admin-dummy-id') {
        localStorage.removeItem('dummyAdmin')
        setUser(null)
        setRole(null)
        setSession(null)
        return
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setRole(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Navigate based on role
  const navigateByRole = (navigate, roleToUse = null) => {
    const roleForNavigation = roleToUse !== null ? roleToUse : role
    if (roleForNavigation === 'client') {
      navigate('/cdashboard')
    } else if (roleForNavigation === 'pro') {
      navigate('/bdashboard')
    } else if (roleForNavigation === 'admin') {
      navigate('/adashboard')
    } else {
      navigate('/')
    }
  }

  const value = {
    user,
    role,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    fetchUserRole,
    navigateByRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}