import React, { useState, useEffect } from 'react'
import {
    IconUsers,
    IconListDetails,
    IconCurrencyDollar,
    IconTrophy,
    IconChartBar,
    IconClock,
    IconLoader2
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'

const ADashboard = () => {
    const { getAllUsers } = useAuth()
    const [recentUsers, setRecentUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRecentUsers()
    }, [])

    const fetchRecentUsers = async () => {
        setLoading(true)
        const result = await getAllUsers()
        if (result.success) {
            // Sort by created_at descending and take first 5
            const sorted = [...result.users].sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            ).slice(0, 5)
            setRecentUsers(sorted)
        }
        setLoading(false)
    }

    const stats = [
        {
            title: "Total Users",
            value: "1,248",
            description: "+12% from last month",
            icon: IconUsers,
            color: "text-blue-600",
            bg: "bg-blue-100"
        },
        {
            title: "Active Tenders",
            value: "423",
            description: "24 new today",
            icon: IconListDetails,
            color: "text-orange-600",
            bg: "bg-orange-100"
        },
        {
            title: "Total Volume",
            value: "$4.2M",
            description: "+8% from last month",
            icon: IconCurrencyDollar,
            color: "text-green-600",
            bg: "bg-green-100"
        },
        {
            title: "Success Rate",
            value: "68%",
            description: "Average across platforms",
            icon: IconTrophy,
            color: "text-purple-600",
            bg: "bg-purple-100"
        }
    ]

    return (
        <div className="px-6 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, Admin. Here's what's happening across the platform.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`size-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Placeholder for Recent Activity */}
                <Card className="col-span-4 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconChartBar className="size-5 text-orange-600" />
                            Platform Growth
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg mx-6 mb-6">
                        <p className="text-muted-foreground">Growth analytics visualization will appear here</p>
                    </CardContent>
                </Card>

                {/* Recent Registered Users */}
                <Card className="col-span-3 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconClock className="size-5 text-orange-600" />
                            Recent Signups
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-2">
                                <IconLoader2 className="size-6 text-orange-600 animate-spin" />
                                <p className="text-sm text-muted-foreground">Loading...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentUsers.length > 0 ? (
                                    recentUsers.map((u) => (
                                        <div key={u.id} className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                                {(u.email?.[0] || 'U').toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.email}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                            </div>
                                            <div className={`text-xs font-medium px-2 py-1 rounded ${u.role === 'pro'
                                                ? 'text-blue-600 bg-blue-50'
                                                : u.role === 'admin'
                                                    ? 'text-purple-600 bg-purple-50'
                                                    : 'text-green-600 bg-green-50'
                                                }`}>
                                                {(u.role || 'user').charAt(0).toUpperCase() + (u.role || 'user').slice(1)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center py-4 text-sm text-muted-foreground">No recent signups</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ADashboard
