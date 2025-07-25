import * as React from "react"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { SiteHeader } from "./components/site-header"
import {
  getLeaveBalances,
  getUserLeaveRequests,
  getLeaveTypes,
} from "@/lib/actions/leave-actions"
import { getUserOvertimeRequests } from "@/lib/actions/overtime-actions"
import { RequestStatus } from "@prisma/client"
import { DashboardStats } from "./components/dashboard-stats"
import { LeaveBalanceCard } from "./components/leave-balance-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LeaveRequestDialog } from "./components/leave/components/leave-request-dialog"
import {
  CalendarPlus,
  ChevronRight,
  Clock,
} from "lucide-react"
import {
  RequestsDataTable,
  RequestData,
} from "./components/request/components/request-table"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/sidebar/app-sidebar-2"
import { OvertimeRequestDialog } from "./components/overtime/overtime-request-dialog"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/")
  }

  const userId = session.user.id

  const [
    leaveRequestsResult,
    overtimeRequestsResult,
    leaveBalancesResult,
    leaveTypesResult,
  ] = await Promise.all([
    getUserLeaveRequests(userId),
    getUserOvertimeRequests(userId),
    getLeaveBalances(userId),
    getLeaveTypes(),
  ])

  const leaveRequests: RequestData[] = (
    leaveRequestsResult.success ? leaveRequestsResult.data : []
  ).map((req) => ({ ...req, type: "leave" }))

  const overtimeRequests: RequestData[] = (
    overtimeRequestsResult.success ? overtimeRequestsResult.data : []
  ).map((req) => ({ ...req, type: "overtime" }))

  const leaveBalances = leaveBalancesResult.success
    ? leaveBalancesResult.data
    : []

  const leaveTypes = leaveTypesResult.success
    ? leaveTypesResult.data
    : []

  const allRequests: RequestData[] = [
    ...leaveRequests,
    ...overtimeRequests,
  ]

  const stats = {
    totalLeaveRequests: leaveRequests.length,
    totalOvertimeRequests: overtimeRequests.length,
    approvedRequests: allRequests.filter(
      (r) => r.status === RequestStatus.APPROVED
    ).length,
    pendingRequests: allRequests.filter(
      (r) =>
        r.status === RequestStatus.PENDING_MANAGER ||
        r.status === RequestStatus.PENDING_HR
    ).length,
    rejectedRequests: allRequests.filter(
      (r) => r.status === RequestStatus.REJECTED
    ).length,
  }

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

              {/* ---- FLEX CONTAINER TO CONTROL ORDER BASED ON SCREEN SIZE ---- */}
              <div className="flex flex-col-reverse md:flex-col gap-4">
                <DashboardStats stats={stats} />

                <div className="grid gap-6 px-6 lg:grid-cols-3">
                  <Card className="w-full max-w-lg">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>
                        Start a new request with a single click.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <LeaveRequestDialog
                          userId={userId}
                          leaveTypes={leaveTypes}
                          trigger={
                            <button className="w-full group flex items-center p-4 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200 border border-gray-200 dark:border-gray-700">
                              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <CalendarPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="ml-4 text-left">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                                  Request Leave
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Submit a new time-off request
                                </p>
                              </div>
                              <ChevronRight className="ml-auto h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </button>
                          }
                        />

                        <OvertimeRequestDialog
                          userId={userId}
                          trigger={
                            <button className="w-full group flex items-center p-4 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200 border border-gray-200 dark:border-gray-700">
                              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="ml-4 text-left">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                                  Request Overtime
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Submit your extra hours
                                </p>
                              </div>
                              <ChevronRight className="ml-auto h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </button>
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <LeaveBalanceCard balances={leaveBalances} />
                </div>
              </div>

              <div className="gap-4 space-y-6 px-4 lg:px-6">
                <RequestsDataTable
                  title="All Recent Requests"
                  description="A summary of your recent leave and overtime submissions."
                  requests={allRequests.slice(0, 20)}
                  leaveTypes={leaveTypes}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}