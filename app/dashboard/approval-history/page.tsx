import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SiteHeader } from "../components/site-header"
import { AppSidebar } from "@/components/sidebar/app-sidebar-2"
import LeaveApprovalPageWrapper from "./components/approver-page-wrapper"


export default async function LeaveApprovalPage() {
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
          {/*
            This div is now the full width of the available space.
            The 'container mx-auto max-w-7xl px-4' classes have been removed
            to maximize horizontal space. The px-4 class is added to the
            inner div to provide padding.
          */}
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
            <LeaveApprovalPageWrapper />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}