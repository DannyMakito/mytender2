import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import supabase from "../../../supabase-client"
import {
    IconListDetails,
    IconUsers,
    IconClock,
    IconChecklist
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"

export default function SDashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        availableTenders: 0,
        activeBids: 0,
        wonTeams: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchStats()
        }
    }, [user])

    const fetchStats = async () => {
        try {
            setLoading(true)

            // 1. Available Supplier Tenders
            const { count: tenderCount } = await supabase
                .from('tenders')
                .select('*', { count: 'exact', head: true })
                .eq('tender_type', 'supplier')
                .eq('status', 'open')

            // 2. Active Bids by this user
            const { count: bidCount } = await supabase
                .from('bids')
                .select('*', { count: 'exact', head: true })
                .eq('bidder', user.email)

            // 3. Teams (Projects) where user is winner
            const { count: teamCount } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .contains('winner_emails', [user.email])

            setStats({
                availableTenders: tenderCount || 0,
                activeBids: bidCount || 0,
                wonTeams: teamCount || 0,
            })
        } catch (error) {
            console.error("Error fetching stats:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Supplier Dashboard</h1>
                <p className="text-muted-foreground">Welcome back! Here is an overview of your quotations and teams.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <Link to="/stenders" className="group">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 shadow-md ring-1 ring-blue-400/30 flex flex-col justify-between min-h-[130px] transition-transform group-hover:scale-[1.02]">
                        <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/10 blur-sm" />
                        <div className="absolute -bottom-6 -left-6 size-20 rounded-full bg-white/5" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">Available Tenders</p>
                                <IconListDetails className="size-4 text-white/60" />
                            </div>
                            <p className="text-3xl font-bold text-white mt-1 tabular-nums">{loading ? "..." : stats.availableTenders}</p>
                        </div>
                        <p className="relative z-10 text-xs text-white/60 mt-2">Open for bids</p>
                    </div>
                </Link>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 shadow-md ring-1 ring-emerald-300/30 flex flex-col justify-between min-h-[130px]">
                    <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/10 blur-sm" />
                    <div className="absolute -bottom-6 -left-6 size-20 rounded-full bg-white/5" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-white/70 uppercase tracking-wide">Active Bids</p>
                            <IconClock className="size-4 text-white/60" />
                        </div>
                        <p className="text-3xl font-bold text-white mt-1 tabular-nums">{loading ? "..." : stats.activeBids}</p>
                    </div>
                    <p className="relative z-10 text-xs text-white/60 mt-2">Quotations submitted</p>
                </div>

                <Link to="/teams" className="group">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-4 shadow-md ring-1 ring-violet-400/30 flex flex-col justify-between min-h-[130px] transition-transform group-hover:scale-[1.02]">
                        <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/10 blur-sm" />
                        <div className="absolute -bottom-6 -left-6 size-20 rounded-full bg-white/5" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">Your Teams</p>
                                <IconUsers className="size-4 text-white/60" />
                            </div>
                            <p className="text-3xl font-bold text-white mt-1 tabular-nums">{loading ? "..." : stats.wonTeams}</p>
                        </div>
                        <p className="relative z-10 text-xs text-white/60 mt-2">Successful bids</p>
                    </div>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <IconChecklist className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                            <p className="text-muted-foreground">No recent activity to show.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
