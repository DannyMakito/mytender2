import React from 'react'
import {
    IconUsers,
    IconListDetails,
    IconCurrencyDollar,
    IconTrophy,
    IconChartBar,
    IconClock
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ADashboard = () => {
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
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                                        <IconUsers className="size-4 text-gray-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">User {i}</p>
                                        <p className="text-xs text-muted-foreground">user{i}@example.com</p>
                                    </div>
                                    <div className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                        {i % 2 === 0 ? 'Client' : 'Pro'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ADashboard
