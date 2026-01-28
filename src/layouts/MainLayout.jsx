import React from "react"
import { useAuth } from "@/context/AuthContext"
import ContractorLayout from "./ContractorLayout"
import BidderLayout from "@/components/bidder/BidderLayout"
import AdminLayout from "./AdminLayout"
import { Outlet } from "react-router-dom"

export default function MainLayout() {
    const { role, loading, user } = useAuth()

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    // If not logged in, we might want to let the child routes handle redirect, 
    // or Outlet might be adequate if we have public pages. 
    // But typically this layout is for authenticated pages.
    if (!user) {
        // If we have protected routes, they should likely redirect to login.
        // For now, let's just render Outlet or return null. 
        // Assuming HomePage handles the "/" route unauthenticated.
        // But since this is path="/", it wraps everything?
        // Be careful not to wrap public routes if they conflict.
        return <Outlet />
    }

    if (role === 'client') {
        return <ContractorLayout />
    } else if (role === 'pro') {
        return <BidderLayout />
    } else if (role === 'admin') {
        return <AdminLayout />
    }

    // Fallback if role is not set yet or invalid
    return <Outlet />
}
