import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { OvertimeReportSummary as Summary } from "@/lib/types/overtime-reports-types"
import { Clock, CheckCircle, XCircle, FileText, Timer, CalendarClock } from "lucide-react"

interface OvertimeReportSummaryProps {
  summary: Summary
}

export function OvertimeReportSummary({ summary }: OvertimeReportSummaryProps) {
  const summaryCards = [
    {
      title: "Total Requests",
      value: summary.totalRequests,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Pending Requests",
      value: summary.pendingRequests,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Approved Requests",
      value: summary.approvedRequests,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Rejected Requests",
      value: summary.rejectedRequests,
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "Total Hours Requested",
      value: `${summary.totalHoursRequested.toFixed(1)}h`,
      icon: Timer,
      color: "text-purple-600",
    },
    {
      title: "Total Hours Approved",
      value: `${summary.totalHoursApproved.toFixed(1)}h`,
      icon: CalendarClock,
      color: "text-indigo-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {summaryCards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
