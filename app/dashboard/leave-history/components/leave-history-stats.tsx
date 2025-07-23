"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, FileText } from "lucide-react"
import { LeaveHistoryStats } from "@/lib/types/leave-history-types"

interface LeaveHistoryStatsProps {
  stats: LeaveHistoryStats
}

export function LeaveHistoryStatsComponent({ stats }: LeaveHistoryStatsProps) {
  const statsData = [
    {
      title: "Total Requests",
      value: stats.totalRequests,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Approved",
      value: stats.approvedRequests,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Pending",
      value: stats.pendingRequests,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      title: "Rejected",
      value: stats.rejectedRequests,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className={`transition-all duration-200 hover:shadow-md border-2 ${stat.borderColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.title === "Total Requests" && stats.totalRequests > 0 && (
                <div className="flex gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {Math.round((stats.approvedRequests / stats.totalRequests) * 100)}% approved
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}