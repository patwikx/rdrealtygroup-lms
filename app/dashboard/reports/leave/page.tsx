import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { AppSidebar } from "@/components/sidebar/app-sidebar-2"
import { SiteHeader } from "../../components/site-header"
import LeaveReportsPageWrapper from "./components/leave-reports-wrapper"




export default function LeaveReports() {

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
  <div className="gap-4 space-y-6 px-4 lg:px-6">
            <LeaveReportsPageWrapper />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
