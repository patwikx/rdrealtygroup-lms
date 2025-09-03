"use client"

import { useState, useEffect, useCallback } from "react"

import { 
  getLeaveApprovalHistory, 
  getLeaveApprovalStats, 
  getLeaveTypes,
  getEmployeesForApproval,
  getDepartmentsForApproval
} from "@/lib/actions/approval-history"
import { 
  LeaveApprovalFilters, 
  LeaveRequestWithApprovalDetails, 
  LeaveApprovalStats 
} from "@/lib/types/approval-history"
import { LeaveType } from "@prisma/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ClipboardCheck, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LeaveApprovalStatsComponent } from "./approver-history-stats"
import { LeaveApprovalFiltersComponent } from "./approver-history-filters"
import { LeaveApprovalTable } from "./approval-history-table"

interface EmployeeOption {
  id: string
  name: string
  employeeId: string
  department: {
    id: string
    name: string
  } | null
}

interface DepartmentOption {
  id: string
  name: string
}

export default function LeaveApprovalPageWrapper() {
  const [requests, setRequests] = useState<LeaveRequestWithApprovalDetails[]>([])
  const [stats, setStats] = useState<LeaveApprovalStats | null>(null)
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [filters, setFilters] = useState<LeaveApprovalFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (page: number = 1, newFilters?: LeaveApprovalFilters) => {
    try {
      setLoading(page === 1)
      setRefreshing(page !== 1)

      const filtersToUse = newFilters ?? filters
      
      const [
        historyData, 
        statsData, 
        leaveTypesData, 
        employeesData, 
        departmentsData
      ] = await Promise.all([
        getLeaveApprovalHistory(filtersToUse, page, 10),
        getLeaveApprovalStats(),
        getLeaveTypes(),
        getEmployeesForApproval(),
        getDepartmentsForApproval()
      ])

      setRequests(historyData.requests)
      setTotalPages(historyData.totalPages)
      setTotalCount(historyData.totalCount)
      setCurrentPage(historyData.currentPage)
      setStats(statsData)
      setLeaveTypes(leaveTypesData)
      setEmployees(employeesData)
      setDepartments(departmentsData)
    } catch (error) {
      console.error("Error fetching leave approval data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  const handleFiltersChange = (newFilters: LeaveApprovalFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    fetchData(1, newFilters)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchData(page)
  }

  const handleReset = () => {
    const emptyFilters = {}
    setFilters(emptyFilters)
    setCurrentPage(1)
    fetchData(1, emptyFilters)
  }

  const handleRefresh = () => {
    fetchData(currentPage)
  }

  if (loading) {
    return (
      <div className="w-full">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leave Approval</h1>
              <p className="text-muted-foreground mt-1">
                Review and approve leave requests from your team
              </p>
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && <LeaveApprovalStatsComponent stats={stats} />}

      {/* Filters */}
      <LeaveApprovalFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        leaveTypes={leaveTypes}
        employees={employees}
        departments={departments}
        onReset={handleReset}
      />

      {/* Table */}
      <LeaveApprovalTable
        requests={requests}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
      />
    </div>
  )
}