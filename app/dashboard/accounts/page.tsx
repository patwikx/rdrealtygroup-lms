import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SiteHeader } from "../components/site-header"
import { AppSidebar } from "@/components/sidebar/app-sidebar-2"
import AccountPageWrapper from "./components/profile-page-wrapper"





export default async function AccountsPage() {

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
              <AccountPageWrapper />
                 {/* Stats */}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
