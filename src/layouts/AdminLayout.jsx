import React from "react"
import { Outlet, useLocation } from "react-router-dom"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SiteHeader } from "@/components/site-header"
import { useAuth } from "@/context/AuthContext"

const ADMIN_ROUTES = [
    '/adashboard',
    '/admin/users',
    '/admin/tenders',
    '/admin/logs',
    '/admin/security',
    '/notifications',
    '/teams'
]

export default function AdminLayout() {
    const location = useLocation()
    const { role, loading, user } = useAuth()

    // Only render if user is definitely an admin
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    if (!user || role !== 'admin') {
        return null
    }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                }
            }
        >
            <AdminSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            {/* Child routes render here */}
                            <Outlet />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
