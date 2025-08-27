"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  ChartAreaIcon,
  ChevronRight,
  GalleryVerticalEnd,
  Home,
  LayoutDashboard,
  LucideIcon,
  Settings2,
} from "lucide-react"

import { useSessionState } from "@/lib/use-current-user"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "@/app/dashboard/components/nav-user"
import { TeamSwitcher } from "./team-switcher"

// 1. UNIFIED DATA STRUCTURE AND TYPE DEFINITION
// =================================================================
export interface NavItem {
  title: string
  url?: string
  icon: LucideIcon
  children?: NavItem[]
}

const navigationData: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Leave & OT Processing", url: "/dashboard/approver", icon: CalendarCheck },
  { title: "Leave History", url: "/dashboard/leave-history", icon: BookOpen },
{ title: "Leave Approver History", url: "/dashboard/approver-history", icon: BookOpen },
  {
    title: "Leave Management",
    icon: CalendarClock,
    children: [
      { title: "Leave Balances", url: "/dashboard/leave-balances", icon: Home },
      { title: "Leave Types", url: "/dashboard/leave-types", icon: BookOpen },
    ],
  },
  {
    title: "Reports",
    icon: ChartAreaIcon,
    children: [
      { title: "Leave Reports", url: "/dashboard/reports/leave", icon: ChartAreaIcon },
      { title: "Overtime Reports", url: "/dashboard/reports/overtime", icon: ChartAreaIcon },
    ],
  },
  {
    title: "System Settings",
    icon: Settings2,
    children: [
      { title: "Users & Department", url: "/dashboard/user-management", icon: Settings2 },
      { title: "System Health", url: "#", icon: Settings2 },
    ],
  },
]

// Sample team data from your original component
const teamsData = [{ name: "RD Realty Group - PMS", logo: GalleryVerticalEnd }]

// 2. ROLE DEFINITIONS
// =================================================================
const ROLES = {
  STAFF: "STAFF",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
  HR: "HR",
}

// 3. SIDEBAR LINK SUB-COMPONENT (FROM REFERENCE UX)
// =================================================================
function SidebarLink({ item }: { item: NavItem }) {
  const pathname = usePathname()

  if (item.children && item.children.length > 0) {
    const isAnyChildActive = item.children.some(child => pathname === child.url)

    return (
      <Collapsible defaultOpen={isAnyChildActive}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start font-normal">
            <item.icon className="mr-2 h-4 w-4" />
            <span className="sidebar-link-text">{item.title}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform ui-open:rotate-90 sidebar-link-text" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="sidebar-link-text">
          <div className="ml-4 mt-2 flex flex-col space-y-1 border-l pl-4">
            {item.children.map(child => (
              <SidebarLink key={child.title} item={child} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  const isActive = pathname === item.url
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start font-normal"
      asChild
    >
      <Link href={item.url || "#"}>
        <item.icon className="mr-2 h-4 w-4" />
        <span className="sidebar-link-text">{item.title}</span>
      </Link>
    </Button>
  )
}

// 4. MAIN SIDEBAR COMPONENT (HYBRID)
// =================================================================
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useSessionState()

  // Filter the unified navigation list based on the user's role.
const filteredNavigation = React.useMemo(() => {
  if (!user?.role) return []
  const userRole = user.role

  return navigationData.filter(item => {
    switch (item.title) {
      case "Dashboard":
      case "Leave History":
        return true
      case "Leave & OT Processing":
        return [ROLES.MANAGER, ROLES.ADMIN, ROLES.HR].includes(userRole)
      case "Leave Management":
        return [ROLES.ADMIN, ROLES.HR, ROLES.STAFF].includes(userRole)
      case "Leave Approver History":
        return [ROLES.MANAGER, ROLES.ADMIN].includes(userRole)  // Allow for MANAGER and ADMIN
      case "Reports":
      case "System Settings":
        return [ROLES.ADMIN, ROLES.HR].includes(userRole)
      default:
        return false
    }
  })
}, [user])
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teamsData} />
      </SidebarHeader>
      
      <SidebarContent>
        <div className="flex flex-col space-y-1 p-2">
          {filteredNavigation.map(item => (
            <SidebarLink key={item.title} item={item} />
          ))}
        </div>
      </SidebarContent>

      {isLoading ? (
        <div className="flex items-center gap-2 p-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 sidebar-link-text">
            <Skeleton className="mb-1 h-4 w-24" />
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