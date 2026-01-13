import * as React from "react"
import {
  IconCamera,
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

const getNavData = (userEmail, unreadCount = 0) => ({
  navMain: [
    {
      title: "Dashboard",
      url: "/bdashboard",
      icon: IconDashboard,
    },
    {
      title: "Tenders",
      url: "/tenders",
      icon: IconListDetails,
    },
    {
      title: "Notifications",
      url: "/bnotifications",
      icon: IconBell,
      badge: unreadCount,
    },
    {
      title: "Projects",
      url: "/bidder-projects",
      icon: IconFolder,
    },
    {
      title: "Team",
      url: "/teams",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
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
      name: "Documents",
      url: "/bdocuments",
      icon: IconReport,
    },
    {
      name: "AI Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
})

export function BidSidebar({
  ...props
}) {
  const { user } = useAuth()
  const { unreadCount } = useNotifications()

  // Get user name from email or use default
  const getUserName = () => {
    if (user?.email) {
      return user.email.split('@')[0] || 'User'
    }
    return 'User'
  }

  // Create user object with live data
  const userData = {
    name: getUserName(),
    email: user?.email || '',
    avatar: "/avatars/shadcn.jpg",
  }

  const data = getNavData(user?.email, unreadCount)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">My Tender Pro</span>
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
