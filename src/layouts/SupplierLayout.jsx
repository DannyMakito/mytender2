import { SupplierSidebar } from "@/components/supplier/SupplierSidebar"
import { SiteHeader } from "@/components/site-header"
import { Outlet, useLocation } from "react-router-dom"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"

const SUPPLIER_ROUTES = [
    '/sdashboard',
    '/stenders',
    '/scontracts',
    '/teams',
    '/bdocuments',
    '/bnotifications',
    '/profile'
]

const SHARED_ROUTES = ['/notifications', '/teams', '/profile']

const isSupplierRoute = (pathname, userRole) => {
    if (SUPPLIER_ROUTES.includes(pathname)) {
        if (SHARED_ROUTES.includes(pathname)) {
            return userRole === 'supplier'
        }
        return true
    }
    if (pathname.startsWith('/stenders/') || pathname.startsWith('/scontracts/')) {
        return true
    }
    return false
}

export default function SupplierLayout() {
    const location = useLocation()
    const { role, loading, user } = useAuth()

    const isSharedRoute = SHARED_ROUTES.includes(location.pathname)
    const shouldRender = isSupplierRoute(location.pathname, role)

    if (isSharedRoute) {
        if (loading && user) {
            return (
                <SidebarProvider
                    style={{
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    }}
                >
                    <SupplierSidebar variant="inset" />
                    <SidebarInset>
                        <SiteHeader />
                        <div className="flex flex-1 flex-col items-center justify-center p-8">
                            <div className="text-muted-foreground">Loading...</div>
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            )
        }

        if (user && role !== 'supplier' && (role === 'client' || role === 'pro')) {
            return null
        }
    } else {
        if (!shouldRender) {
            return null
        }
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
            <SupplierSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
