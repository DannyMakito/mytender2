import * as React from "react"
import {
    IconBell,
    IconDashboard,
    IconFolder,
    IconListDetails,
    IconUsers,
    IconInnerShadowTop,
    IconReport,
    IconSettings,
    IconHelp,
    IconSearch,
    IconFileCheck
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/context/AuthContext"
import { useNotifications } from "@/hooks/useNotifications"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

const getNavData = (unreadCount = 0) => ({
    navMain: [
        {
            title: "Dashboard",
            url: "/sdashboard",
            icon: IconDashboard,
        },
        {
            title: "Quotation Tenders",
            url: "/stenders",
            icon: IconListDetails,
        },
        {
            title: "Contracts",
            url: "/scontracts",
            icon: IconFileCheck,
        },
        {
            title: "Notifications",
            url: "/bnotifications",
            icon: IconBell,
            badge: unreadCount,
        },
        {
            title: "Teams",
            url: "/teams",
            icon: IconUsers,
        },
    ],
    navSecondary: [
        {
            title: "Settings",
            url: "#",
            icon: IconSettings,
        },
        {
            title: "Get Help",
            url: "#",
            icon: IconHelp,
        },
        {
            title: "Search",
            url: "#",
            icon: IconSearch,
        },
    ],
    documents: [
        {
            name: "My Documents",
            url: "/bdocuments",
            icon: IconReport,
        },
    ],
})

export function SupplierSidebar({ ...props }) {
    const { user } = useAuth()
    const { unreadCount } = useNotifications()

    const getUserName = () => {
        if (user?.email) {
            return user.email.split('@')[0] || 'User'
        }
        return 'User'
    }

    const userData = {
        name: getUserName(),
        email: user?.email || '',
        avatar: `https://avatar.vercel.sh/${user?.email}`,
    }

    const data = getNavData(unreadCount)

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
                            <a href="#">
                                <IconInnerShadowTop className="!size-5" />
                                <span className="text-base font-semibold">Supplier Portal</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavDocuments items={data.documents} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
        </Sidebar>
    );
}
