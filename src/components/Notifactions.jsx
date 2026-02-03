// src/pages/NotificationsPage.jsx
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  IconBell,
  IconCheck,
  IconTrash,
  IconFileDescription,
  IconTrophy,
  IconX,
  IconClipboard,
  IconGift
} from '@tabler/icons-react'
import supabase from '../../supabase-client.js'

const NOTIFICATION_TYPES = {
  NEW_TENDER: { label: 'New Tender', icon: IconFileDescription, color: 'bg-blue-100 text-blue-800' },
  AWARDED_TENDER: { label: 'Awarded Tender', icon: IconTrophy, color: 'bg-green-100 text-green-800' },
  REJECTED_BID: { label: 'Rejected Bid', icon: IconX, color: 'bg-red-100 text-red-800' },
  PROJECT_TASK: { label: 'Project Task', icon: IconClipboard, color: 'bg-purple-100 text-purple-800' },
  NEW_BID: { label: 'New Bid', icon: IconGift, color: 'bg-orange-100 text-orange-800' },
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

  const grouped = useMemo(() => {
    const groups = {}
    notifications.forEach(n => {
      if (!groups[n.type]) groups[n.type] = []
      groups[n.type].push(n)
    })
    return groups
  }, [notifications])

  if (loading) {
    return (
      <div className="container p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full mt-4" />
      </div>
    )
  }

  function formatNotificationDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    })
  }


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && <Button onClick={() => { markAllAsRead(); toast.success('All marked as read') }}><IconCheck />Mark all</Button>}
      </div>

      <Separator />

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <IconBell className="mx-auto mb-2" />
            <p>No notifications</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([type, items]) => {
          const cfg = NOTIFICATION_TYPES[type] || { label: type, icon: IconBell, color: 'bg-gray-100' }
          const Icon = cfg.icon
          return (
            <div key={type}>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <h2 className="font-semibold">{cfg.label}</h2>
                <Badge>{items.length}</Badge>
              </div>

              <div className="space-y-3 mt-3">
                {items.map(n => (
                  <Card
                    key={n.id}
                    className={`transition-colors cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'border-l-4 border-l-primary bg-blue-50/30' : 'opacity-80'}`}
                    onClick={() => {
                      if (!n.is_read) {
                        markAsRead(n.id)
                      }
                    }}
                  >
                    <CardHeader className="flex justify-between items-start p-4">

                      {/* LEFT SIDE — Icon + Title + Message */}
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded ${cfg.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>

                        <div>
                          <CardTitle className={`text-base ${!n.is_read ? 'font-bold' : 'font-medium'}`}>
                            {n.title}
                          </CardTitle>
                          <CardDescription className={!n.is_read ? 'text-gray-900 font-medium' : ''}>
                            {n.message}
                          </CardDescription>

                          {/* ⏱️ “5 minutes ago” */}
                          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                            <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                            {!n.is_read && <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT SIDE — DATE & DELETE */}
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatNotificationDate(n.created_at)}
                        </span>

                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering markAsRead
                              deleteNotification(n.id);
                              toast.success('Deleted')
                            }}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
