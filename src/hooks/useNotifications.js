// src/hooks/useNotifications.js
import { useNotifications as useGlobalNotifications } from '@/context/NotificationContext'

// Re-export the hook from context so we don't break existing imports
// that use: import { useNotifications } from '@/hooks/useNotifications'
export const useNotifications = useGlobalNotifications
