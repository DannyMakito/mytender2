import * as React from "react"
import {
    IconBell,
    IconDashboard,
    IconDatabase,
    IconFileAi,
    IconFileDescription,
    IconFileWord,
    IconFolder,
    IconHelp,
    IconInnerShadowTop,
    IconListDetails,
    IconReport,
    IconSearch,
    IconSettings,
    IconUsers,
    IconShieldLock,
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
            title: "Admin Dashboard",
            url: "/adashboard",
            icon: IconDashboard,
        },
        {
            title: "User Management",
            url: "/admin/users",
            icon: IconUsers,
        },
        {
            title: "Tender Management",
            url: "/admin/tenders",
            icon: IconListDetails,
        },
        {
            title: "System Logs",
            url: "/admin/logs",
            icon: IconDatabase,
        },
        {
            title: "Security",
            url: "/admin/security",
            icon: IconShieldLock,
        },
        {
            title: "Notifications",
            url: "/notifications",
            icon: IconBell,
            badge: unreadCount,
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
            name: "System Reports",
            url: "#",
            icon: IconReport,
        },
        {
            name: "Audit Logs",
            url: "#",
            icon: IconFileWord,
        },
    ],
})

export function AdminSidebar({
    ...props
}) {
    const { user } = useAuth()
    const { unreadCount } = useNotifications()

    const getUserName = () => {
        if (user?.email) {
            return user.email.split('@')[0] || 'Admin'
        }
        return 'Admin'
    }

    const userData = {
        name: getUserName(),
        email: user?.email || 'admin2@mytender.com',
        avatar: "/avatars/admin.jpg",
    }

    const data = getNavData(unreadCount)

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
                            <a href="#">
                                <IconInnerShadowTop className="!size-5 text-orange-600" />
                                <span className="text-base font-semibold">MyTender Admin</span>
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
