import React from "react"
import { Outlet, useLocation } from "react-router-dom"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { useAuth } from "@/context/AuthContext"

// Define contractor-specific routes
const CONTRACTOR_ROUTES = [
  '/cdashboard',
  '/projects',
  '/tender',
  '/teams',
  '/cdocuments',
  '/notifications'
]

// Note: /notifications is shared but ContractorLayout handles it for 'client' role

// Shared routes that both user types can access (need role-based check)
const SHARED_ROUTES = ['/notifications', '/teams']

// Helper to check if a path is a contractor route
const isContractorRoute = (pathname, userRole) => {
  // Check exact matches
  if (CONTRACTOR_ROUTES.includes(pathname)) {
    // For shared routes, check user role - only render if user is a client
    if (SHARED_ROUTES.includes(pathname)) {
      return userRole === 'client'
    }
    return true
  }
  // Check if path starts with /tender/ (for dynamic routes like /tender/:id/bids)
  if (pathname.startsWith('/tender/')) {
    return true
  }
  return false
}

export default function ContractorLayout() {
  const location = useLocation()
  const { role, loading, user } = useAuth()

  const isSharedRoute = SHARED_ROUTES.includes(location.pathname)
  const shouldRender = isContractorRoute(location.pathname, role)

  // For shared routes like /notifications
  if (isSharedRoute) {
    // If loading, return null to let BidderLayout handle the loading state
    // This prevents both layouts from showing loading simultaneously
    if (loading) {
      return null
    }

    // Only render if user is definitely a client
    // If role is null/undefined or not 'client', let BidderLayout handle it
    if (!role || role !== 'client') {
      return null
    }
  }

  // For non-shared routes, check shouldRender
  if (!isSharedRoute && !shouldRender) {
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
      <AppSidebar variant="inset" />
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
