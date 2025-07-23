import type React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SessionSync } from "@/components/session-sync"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <SessionSync />
      <SidebarInset>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
