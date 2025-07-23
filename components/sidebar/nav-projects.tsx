"use client"

import { type LucideIcon } from "lucide-react"
import {
 SidebarGroup,
 SidebarGroupLabel,
 SidebarMenu,
 SidebarMenuButton,
 SidebarMenuItem,
 useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavProjects({
 projects,
}: {
 projects: {
  name: string
  url: string
  icon: LucideIcon
 }[]
}) {
 const { isMobile } = useSidebar()

 return (
  <SidebarGroup className={cn(!isMobile && "group-data-[collapsible=icon]:hidden")}>
   <SidebarGroupLabel>Leave Processing</SidebarGroupLabel>

      {/* FIX: Add a class to force the menu to be visible on mobile */}
   <SidebarMenu className={cn(isMobile && "block")}>
    {projects.map((item) => (
     <SidebarMenuItem key={item.name}>
      <SidebarMenuButton asChild>
       <a href={item.url}>
        <item.icon />
        <span>{item.name}</span>
       </a>
      </SidebarMenuButton>
     </SidebarMenuItem>
    ))}
    <SidebarMenuItem>
     {/* This empty item can likely be removed if not needed */}
    </SidebarMenuItem>
   </SidebarMenu>
  </SidebarGroup>
 )
}