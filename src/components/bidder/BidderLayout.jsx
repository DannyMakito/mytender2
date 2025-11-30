import { BidSidebar } from "@/components/bid-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { Outlet, useLocation } from "react-router-dom"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"

// Define bidder-specific routes
const BIDDER_ROUTES = [
  '/bdashboard',
  '/tenders',
  '/bidder-projects',
  '/bdocuments',
  '/bnotifications'
]

// Note: /bnotifications is bidder-specific, /notifications is shared (handled separately)

// Shared routes that both user types can access (need role-based check)
const SHARED_ROUTES = ['/notifications']

// Helper to check if a path is a bidder route
const isBidderRoute = (pathname, userRole) => {
  // Check exact matches
  if (BIDDER_ROUTES.includes(pathname)) {
    // For shared routes, check user role - only render if user is a pro
    if (SHARED_ROUTES.includes(pathname)) {
      return userRole === 'pro'
    }
    return true
  }
  // Check if path starts with /tenders/ (for dynamic routes like /tenders/:id)
  if (pathname.startsWith('/tenders/')) {
    return true
  }
  return false
}

export default function BidderLayout() {
  const location = useLocation()
  const { role, loading, user } = useAuth()
  
  const isSharedRoute = SHARED_ROUTES.includes(location.pathname)
  const shouldRender = isBidderRoute(location.pathname, role)
  
  // For shared routes like /notifications
  if (isSharedRoute) {
    // If still loading role and user is authenticated, show loading state
    if (loading && user) {
      return (
        <SidebarProvider
          style={{
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          }}
        >
          <BidSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col items-center justify-center p-8">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      )
    }
    
    // If user is authenticated and role is 'client', don't render (let ContractorLayout handle it)
    if (user && role === 'client') {
      alert('user is authenticated and role is client')
      console.log(role);
      console.log(user);
      return null
    }
    
    // If user is authenticated, always render to prevent blank page
    // This is a fallback to ensure we never show blank page when user clicks from bid-sidebar
    if (user) {
      // Continue to render below - user is authenticated
    } else {
      console.log(user);
      return null
    }
  } else {
    // For non-shared routes, check shouldRender
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
      <BidSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* <SectionCards /> */}
              {/* <DataTable data={data} /> */}
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
