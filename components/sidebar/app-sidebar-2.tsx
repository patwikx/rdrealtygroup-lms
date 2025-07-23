"use client"

import * as React from "react"
import {

  BookOpen,
  CalendarCheck,
  CalendarClock,
  ChartAreaIcon,
  GalleryVerticalEnd,
  Home,
  LayoutDashboard,
  Settings2,
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

// Define roles for better readability and maintenance
const ROLES = {
  STAFF: "STAFF",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
  HR: "HR"
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useSessionState()

  // Filter the navigation links based on the user's role.
  // useMemo prevents re-calculating this on every render.
  const filteredProjects = React.useMemo(() => {
    if (!user?.role) return [] // If no user or role, show nothing

    return data.projects.filter((project) => {
      switch (project.name) {
        case "Leave Processing":
          // Only show to MANAGER and ADMIN
          return user.role === ROLES.MANAGER || user.role === ROLES.ADMIN || user.role === ROLES.HR
        case "Dashboard":
        case "Leave History":
          // Show to everyone
          return true
        default:
          // Hide any other links by default
          return false
      }
    })
  }, [user])

  // Filter the main settings navigation based on role
  const filteredNavMain = React.useMemo(() => {
    if (!user?.role) return []

    // ADMIN sees everything
    if (user.role === ROLES.ADMIN) {
      return data.navMain
    }

    // MANAGER sees Leave Management and Reports
    if (user.role === ROLES.ADMIN || user.role === ROLES.HR) {
        return data.navMain.filter(item => item.title !== "System Settings")
    }

    // STAFF only sees Leave Management
    if (user.role === ROLES.STAFF) {
        return data.navMain.filter(item => item.title === "Leave Management")
    }

    return []
  }, [user])


 return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
<SidebarContent>
  <NavProjects projects={filteredProjects} />
  <NavMain items={filteredNavMain} userRole={user?.role} />
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