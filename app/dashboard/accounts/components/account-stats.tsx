"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
} from "lucide-react"
import { UserStats } from "@/lib/types/account-profile"

interface AccountStatsProps {
  stats: UserStats
}

export function AccountStats({ stats }: AccountStatsProps) {
  const leaveUsagePercentage = stats.currentYearLeaveAllocated > 0 
    ? (stats.currentYearLeaveUsed / stats.currentYearLeaveAllocated) * 100 
    : 0

  const statsData = [
    {
      title: "Leave Requests",
      value: stats.totalLeaveRequests,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Total submitted"
    },
    {
      title: "Overtime Requests",
      value: stats.totalOvertimeRequests,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Total submitted"
    },
    {
      title: "Approved Requests",
      value: stats.approvedRequests,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "All time approved"
    },
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      description: "Awaiting approval"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Leave Usage Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <span>Leave Usage - {new Date().getFullYear()}</span>
            <Badge variant="outline" className="ml-auto">
              {stats.currentYearLeaveUsed} / {stats.currentYearLeaveAllocated} days
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span className="font-medium">
                {stats.currentYearLeaveUsed} days ({leaveUsagePercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress 
              value={leaveUsagePercentage} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 days</span>
              <span>{stats.currentYearLeaveAllocated} days allocated</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.currentYearLeaveAllocated - stats.currentYearLeaveUsed}
              </div>
              <div className="text-sm text-muted-foreground">Days Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.currentYearLeaveUsed}
              </div>
              <div className="text-sm text-muted-foreground">Days Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {stats.currentYearLeaveAllocated}
              </div>
              <div className="text-sm text-muted-foreground">Total Allocated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}