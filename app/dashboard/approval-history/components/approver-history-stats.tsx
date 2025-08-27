"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, XCircle, FileText } from "lucide-react"
import { LeaveApprovalStats } from "@/lib/types/approval-history"

interface LeaveApprovalStatsComponentProps {
  stats: LeaveApprovalStats
}

export function LeaveApprovalStatsComponent({ stats }: LeaveApprovalStatsComponentProps) {
  const statsCards = [
    {
      title: "Total Requests",
      value: stats.totalRequests,
      description: "All leave requests",
      icon: FileText,
      color: "bg-blue-100 text-blue-800",
      bgColor: "bg-blue-50"
    },
    {
      title: "Pending Approval",
      value: stats.pendingRequests,
      description: "Awaiting your action",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Approved",
      value: stats.approvedRequests,
      description: "Successfully approved",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800",
      bgColor: "bg-green-50"
    },
    {
      title: "Rejected",
      value: stats.rejectedRequests,
      description: "Declined requests",
      icon: XCircle,
      color: "bg-red-100 text-red-800",
      bgColor: "bg-red-50"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="relative overflow-hidden">
            <div className={`absolute inset-0 ${stat.bgColor} opacity-50`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}