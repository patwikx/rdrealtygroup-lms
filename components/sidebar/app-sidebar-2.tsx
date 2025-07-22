"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Building,
  CalendarCheck,
  CalendarClock,
  CalendarPlusIcon,
  ChartAreaIcon,
  Command,
  Frame,
  GalleryVerticalEnd,
  Home,
  LayoutDashboard,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Users2,
} from "lucide-react"


import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "./team-switcher"
import { NavMain } from "./nav-main-2"
import { NavProjects } from "./nav-projects"
import { NavUser } from "@/app/dashboard/components/nav-user"
import { useSessionState } from "@/lib/use-current-user"
import { Skeleton } from "../ui/skeleton"

// This is sample data.
const data = {
  teams: [
    {
      name: "RD Realty Group - PMS",
      logo: GalleryVerticalEnd,
    },
  ],
  navMain: [
    {
      title: "Leave Management",
      url: "#",
      icon: CalendarClock,
      isActive: true,
      items: [
        {
          title: "Leave Balances",
          icon: Home,
          url: "/dashboard/leave-balances",
        },
        {
          title: "Leave Types",
          url: "/dashboard/leave-types",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: ChartAreaIcon,
      items: [
        {
          title: "Leave Reports",
          url: "/dashboard/reports/leave",
        },
        {
          title: "Overtime Reports",
          url: "/dashboard/reports/overtime",
        },
      ],
    },
    {
      title: "System Settings",
      url: "/dashboard/departments",
      icon: Settings2,
        items: [

        {
          title: "System Health",
          url: "#",
        },
         {
          title: "Users & Department",
          url: "/dashboard/user-management",
        },
      ],
    },
  ],
  projects: [
  
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Leave Processing",
      url: "/dashboard/approver",
      icon: CalendarCheck,
    },
    {
      name: "Leave History",
      url: "/dashboard/leave-history",
      icon: BookOpen,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
      const { user, isLoading } = useSessionState()


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.projects} />
        <NavMain items={data.navMain} />

      </SidebarContent>
        {isLoading ? (
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          user && <NavUser user={user} />
        )}
      <SidebarRail />
    </Sidebar>
  )
}
