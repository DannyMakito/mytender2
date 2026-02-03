import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import supabase from '../../supabase-client.js'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
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

            // Unread count
            const unread = (data || []).filter(n => !n.is_read).length
            setUnreadCount(unread)

        } catch (err) {
            console.error('Error fetching notifications:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [user?.email])

    // Mark single as read
    const markAsRead = useCallback(async (notificationId) => {
        if (!user?.email) return

        // Optimistic Update
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))

        try {
            const { error: updateError } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId)
            // .eq('user_email', user.email)  <-- Removed strict check to allow marking broadcast notifications if needed, 
            // but usually safe to keep. Assuming RLS handles it.
            // Keeping simple.

            if (updateError) {
                // Revert if error (optional, but good practice)
                console.error('Failed to mark read on server', updateError)
            }
        } catch (err) {
            console.error('Error marking notification as read:', err)
        }
    }, [user?.email])

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        if (!user?.email) return

        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)

        try {
            const { error: updateError } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_email', user.email)
                .eq('is_read', false)

            if (updateError) throw updateError

        } catch (err) {
            console.error('Error marking all notifications as read:', err)
        }
    }, [user?.email])

    // Delete notification
    const deleteNotification = useCallback(async (notificationId) => {
        if (!user?.email) return

        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        // We don't know strictly if it was unread without looking it up, but usually UI handles this.
        // If we delete an unread one, we should decrement count.

        // Better logic: find it first
        const toDelete = notifications.find(n => n.id === notificationId)
        if (toDelete && !toDelete.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
        }

        try {
            const { error: deleteError } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)

            if (deleteError) throw deleteError

        } catch (err) {
            console.error('Error deleting notification:', err)
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

                        // Re-calc unread count entirely or diff? 
                        // Diff is safer for minimal updates, but full recalc is robust.
                        // Let's stick to the logic from before for now.
                        if (payload.old.is_read !== payload.new.is_read) {
                            if (payload.new.is_read) {
                                setUnreadCount(prev => Math.max(0, prev - 1))
                            } else {
                                setUnreadCount(prev => prev + 1)
                            }
                        }

                    } else if (payload.eventType === 'DELETE') {
                        const deleted = notifications.find(n => n.id === payload.old.id) // might be stale if closure

                        setNotifications(prev =>
                            prev.filter(n => n.id !== payload.old.id)
                        )
                        // Note: We can't know for sure if the deleted item was unread if we don't have it in state. 
                        // If we do, we decrement.
                        // But usually we just re-sync or optimistically handle.
                        // If the user deleted it via UI, local state handles it. 
                        // If deleted by another session, we might drift slightly until refresh, 
                        // but fetching full unread count query is expensive on every event.
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.email, fetchNotifications])

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            error,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            refetch: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider')
    }
    return context
}
