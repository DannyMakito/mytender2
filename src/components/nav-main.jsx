import { IconCirclePlusFilled, IconMail } from "@tabler/icons-react";

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear">
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline">
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                {item.url && item.url.startsWith("/") ? (
                  <Link to={item.url} className="relative w-full">
                    <div className="flex items-center gap-2 flex-1">
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute right-2 h-5 min-w-5 flex items-center justify-center px-1.5 text-xs"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </Link>
                ) : (
                  <a href={item.url} className="relative w-full">
                    <div className="flex items-center gap-2 flex-1">
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute right-2 h-5 min-w-5 flex items-center justify-center px-1.5 text-xs"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </a>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
