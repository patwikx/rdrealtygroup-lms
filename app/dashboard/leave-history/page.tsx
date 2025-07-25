import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SiteHeader } from "../components/site-header"
import { AppSidebar } from "@/components/sidebar/app-sidebar-2"
import LeaveHistoryPageWrapper from "./components/leave-history-page-wrapper"




export default async function LeaveHistoryPage() {

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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <LeaveHistoryPageWrapper />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
