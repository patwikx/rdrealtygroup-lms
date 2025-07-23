import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LeaveReportSummary } from "@/lib/types/reports"
import { CalendarDays, Clock, CheckCircle, XCircle, FileText, Calendar } from "lucide-react"

interface ReportSummaryProps {
  summary: LeaveReportSummary
}

export function ReportSummary({ summary }: ReportSummaryProps) {
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
      title: "Total Days Requested",
      value: summary.totalDaysRequested,
      icon: CalendarDays,
      color: "text-purple-600",
    },
    {
      title: "Total Days Approved",
      value: summary.totalDaysApproved,
      icon: Calendar,
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
