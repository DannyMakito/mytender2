import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import supabase from '../../supabase-client.js'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.email) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_email.eq.${user.email},type.eq.NEW_TENDER`)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setNotifications(data || [])

      // unread count
      const unread = (data || []).filter(n => !n.is_read).length
      setUnreadCount(unread)

    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.email) return

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_email', user.email)

      if (updateError) throw updateError

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )

      setUnreadCount(prev => Math.max(0, prev - 1))

    } catch (err) {
      console.error('Error marking notification as read:', err)
      throw err
    }
  }, [user?.email])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.email) return

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_email', user.email)
        .eq('is_read', false)

      if (updateError) throw updateError

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)

    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      throw err
    }
  }, [user?.email])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user?.email) return

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_email', user.email)

      if (deleteError) throw deleteError

      const deleted = notifications.find(n => n.id === notificationId)

      setNotifications(prev => prev.filter(n => n.id !== notificationId))

      if (deleted && !deleted.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

    } catch (err) {
      console.error('Error deleting notification:', err)
      throw err
    }
  }, [user?.email, notifications])

  // Realtime subscription
  useEffect(() => {
    if (!user?.email) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    fetchNotifications()

    const channel = supabase
      .channel(`notifications-${user.email}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_email=eq.${user.email}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => {
              const exists = prev.find(n => n.id === payload.new.id)
              if (exists) return prev
              return [payload.new, ...prev]
            })

            if (!payload.new.is_read) {
              setUnreadCount(prev => prev + 1)
            }

          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new : n)
            )

            if (payload.old.is_read !== payload.new.is_read) {
              if (payload.new.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1))
              } else {
                setUnreadCount(prev => prev + 1)
              }
            }

          } else if (payload.eventType === 'DELETE') {
            const deleted = notifications.find(n => n.id === payload.old.id)

            setNotifications(prev =>
              prev.filter(n => n.id !== payload.old.id)
            )

            if (deleted && !deleted.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.email, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  }
}
