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

            <div className="grid gap-4 md:grid-cols-3">
                <Link to="/stenders">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Available Tenders</CardTitle>
                            <IconListDetails className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? "..." : stats.availableTenders}</div>
                            <p className="text-xs text-muted-foreground">Quotation tenders open for bids</p>
                        </CardContent>
                    </Card>
                </Link>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : stats.activeBids}</div>
                        <p className="text-xs text-muted-foreground">Quotations you have submitted</p>
                    </CardContent>
                </Card>

                <Link to="/teams">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Your Teams</CardTitle>
                            <IconUsers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? "..." : stats.wonTeams}</div>
                            <p className="text-xs text-muted-foreground">Successful bids turned into teams</p>
                        </CardContent>
                    </Card>
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
