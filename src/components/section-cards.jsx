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
      description: role === 'pro' ? 'Bids submitted' : 'Tenders posted',
      gradient: 'from-blue-500 to-blue-600',
      ring: 'ring-blue-400/30'
    },
    {
      label: 'Awarded',
      value: stats.awarded,
      description: role === 'pro' ? 'Bids approved' : 'Tenders won',
      gradient: 'from-emerald-400 to-emerald-600',
      ring: 'ring-emerald-300/30'
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      description: role === 'pro' ? 'Unsuccessful' : 'Tenders rejected',
      gradient: 'from-rose-400 to-rose-600',
      ring: 'ring-rose-300/30'
    },
    {
      label: role === 'pro' ? 'Withdrawn' : 'Closed',
      value: stats.closed,
      description: role === 'pro' ? 'Removed bids' : 'Expired tenders',
      gradient: 'from-violet-500 to-purple-600',
      ring: 'ring-violet-400/30'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 min-h-[140px] items-center justify-center">
        <IconLoader2 className="animate-spin size-8 text-primary mx-auto col-span-full" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-4 shadow-md ring-1 ${card.ring} flex flex-col justify-between min-h-[130px]`}
        >
          <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/10 blur-sm" />
          <div className="absolute -bottom-6 -left-6 size-20 rounded-full bg-white/5" />
          <div className="relative z-10">
            <p className="text-xs font-medium text-white/70 uppercase tracking-wide">{card.label}</p>
            <p className="text-3xl font-bold text-white mt-1 tabular-nums">{card.value}</p>
          </div>
          <p className="relative z-10 text-xs text-white/60 mt-2">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
