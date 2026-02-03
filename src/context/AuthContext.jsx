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

      // Also create an initial profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          role: selectedRole,
          onboarding_completed: false
        })

      if (profileError) {
        console.warn('Error creating profile entry:', profileError.message)
        // We don't throw here to avoid blocking sign up if profile insert fails (maybe it already exists)
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
      if (email === 'admin2@mytender.com' && password === 'adminpassword123') {
        const adminUser = {
          id: 'admin-dummy-id',
          email: 'admin2@mytender.com',
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

  // Admin: Create a new user with admin role
  const createAdmin = async (email, password) => {
    try {
      if (role !== 'admin') throw new Error('Unauthorized')

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      const { error: roleError } = await supabase.rpc('insert_user_role', {
        p_user_email: email,
        p_role: 'admin',
        p_user_id: authData.user.id,
      })

      if (roleError) throw roleError

      // Also create a profile entry for the new admin
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          role: 'admin',
          onboarding_completed: true
        })

      if (profileError) throw profileError

      return { success: true }
    } catch (error) {
      console.error('Error creating admin:', error)
      return { success: false, error: error.message }
    }
  }

  // Admin: Update a user's role
  const updateUserRole = async (userEmail, newRole, userId) => {
    try {
      if (role !== 'admin') throw new Error('Unauthorized')

      // Update in user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_email', userEmail)

      if (roleError) throw roleError

      // Update in profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (profileError) throw profileError

      return { success: true }
    } catch (error) {
      console.error('Error updating role:', error)
      return { success: false, error: error.message }
    }
  }

  // Admin: Fetch all users and their roles using RPC (bypasses RLS issues)
  const getAllUsers = async () => {
    try {
      if (role !== 'admin') throw new Error('Unauthorized')

      const { data, error } = await supabase.rpc('get_admin_users_list')

      if (error) throw error

      // Map the renamed columns from RPC to frontend expected format
      const users = data.map(row => ({
        id: row.profile_id,
        email: row.profile_email,
        role: row.user_role,
        created_at: row.profile_created_at,
        onboarding_completed: row.profile_onboarding_completed,
        first_name: row.profile_first_name,
        last_name: row.profile_last_name,
        account_status: row.profile_account_status,
        business_document_url: row.profile_business_document_url,
        rejection_reason: row.profile_rejection_reason
      }))

      return { success: true, users }
    } catch (error) {
      console.error('Error fetching users:', error)
      return { success: false, error: error.message }
    }
  }

  // Admin: Fetch single user profile
  const getUserProfile = async (userId) => {
    try {
      if (role !== 'admin') throw new Error('Unauthorized')

      // 1. Fetch the profile directly
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (pError) throw pError

      // 2. Fetch email from user_roles (optional, don't crash if missing)
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('user_email')
        .eq('user_id', userId)
        .maybeSingle()

      return {
        success: true,
        profile: {
          ...profile,
          email: roleData?.user_email || 'N/A'
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Admin: Delete user (Note: This usually needs a custom edge function or direct auth call if possible)
  const deleteUserProfile = async (userId) => {
    try {
      if (role !== 'admin') throw new Error('Unauthorized')

      // First delete from profiles and user_roles (handled by cascade if set up, or manual)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      return { success: true }
    } catch (error) {
      console.error('Error deleting profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Admin: Approve a user's account
  const approveAccount = async (userId) => {
    try {
      if (role !== 'admin') throw new Error('Unauthorized')

      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'approved',
          onboarding_completed: true,
          rejection_reason: null
        })
        .eq('id', userId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error approving account:', error)
      return { success: false, error: error.message }
    }
  }

  // Admin: Reject a user's account
  const rejectAccount = async (userId, reason) => {
    try {
      if (role !== 'admin') throw new Error('Unauthorized')

      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'rejected',
          onboarding_completed: false,
          rejection_reason: reason || 'Your account verification was not approved.'
        })
        .eq('id', userId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error rejecting account:', error)
      return { success: false, error: error.message }
    }
  }

  // User: Get my own profile
  const getMyProfile = async () => {
    try {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return { success: true, profile: data }
    } catch (error) {
      console.error('Error fetching my profile:', error)
      return { success: false, error: error.message }
    }
  }

  // User: Upload business document
  const uploadBusinessDocument = async (file) => {
    try {
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/business_doc_${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-documents')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('business-documents')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      // Update profile with document URL and reset status to pending for re-review
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          business_document_url: publicUrl,
          account_status: 'pending',
          rejection_reason: null
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Error uploading document:', error)
      return { success: false, error: error.message }
    }
  }

  // User: Update my profile
  const updateMyProfile = async (updates) => {
    try {
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', user.id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: error.message }
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
    createAdmin,
    updateUserRole,
    getAllUsers,
    getUserProfile,
    deleteUserProfile,
    approveAccount,
    rejectAccount,
    getMyProfile,
    uploadBusinessDocument,
    updateMyProfile,
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