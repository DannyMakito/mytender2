import React, { useEffect, useState } from 'react'
import { IconTrendingUp, IconLoader2 } from "@tabler/icons-react"
import { useAuth } from "@/context/AuthContext"
import supabase from "../../supabase-client.js"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const { user, role } = useAuth()
  const [stats, setStats] = useState({
    total: 0,
    awarded: 0,
    rejected: 0,
    closed: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.email) {
      fetchStats()
    }
  }, [user?.email, role])

  async function fetchStats() {
    try {
      setLoading(true)

      if (role === 'client') {
        // Stats for Tender Owner
        const { data: tenders, error } = await supabase
          .from('tenders')
          .select('status, closing_date')
          .eq('posted_by', user.email)

        if (error) throw error

        const now = new Date()
        setStats({
          total: tenders.length,
          awarded: tenders.filter(t => t.status === 'awarded').length,
          rejected: tenders.filter(t => t.status === 'rejected').length,
          closed: tenders.filter(t => t.status === 'closed' || (t.closing_date && new Date(t.closing_date) < now)).length
        })
      } else if (role === 'pro') {
        // Stats for Bidder
        const { data: bids, error } = await supabase
          .from('bids')
          .select('status')
          .eq('bidder', user.email)

        if (error) throw error

        setStats({
          total: bids.length,
          awarded: bids.filter(b => b.status === 'awarded' || b.status === 'approved').length,
          rejected: bids.filter(b => b.status === 'rejected').length,
          closed: bids.filter(b => b.status === 'withdrawn').length
        })
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      label: role === 'pro' ? 'Total Bids' : 'Total Tenders',
      value: stats.total,
      description: role === 'pro' ? 'Bids you have submitted' : 'Tenders you have posted'
    },
    {
      label: 'Awarded',
      value: stats.awarded,
      description: role === 'pro' ? 'Bids approved' : 'Tenders awarded'
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      description: role === 'pro' ? 'Bids unsuccessful' : 'Tenders rejected'
    },
    {
      label: role === 'pro' ? 'Withdrawn' : 'Closed',
      value: stats.closed,
      description: role === 'pro' ? 'Bids removed' : 'Expired/Closed tenders'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 min-h-[140px] items-center justify-center">
        <IconLoader2 className="animate-spin size-8 text-primary mx-auto col-span-full" />
      </div>
    )
  }

  return (
    <div
      className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card, i) => (
        <Card key={i} className="@container/card">
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.description}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
