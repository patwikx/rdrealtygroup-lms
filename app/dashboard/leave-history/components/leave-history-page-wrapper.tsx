"use client"

import { useState, useEffect, useCallback } from "react"

import { getLeaveHistory, getLeaveHistoryStats, getLeaveTypes } from "@/lib/actions/leave-history"
import { LeaveHistoryFilters, LeaveRequestWithDetails, LeaveHistoryStats } from "@/lib/types/leave-history-types"
import { LeaveType } from "@prisma/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { History, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LeaveHistoryStatsComponent } from "./leave-history-stats"
import { LeaveHistoryFiltersComponent } from "./leave-history-filters"
import { LeaveHistoryTable } from "./leave-history-table"

export default function LeaveHistoryPageWrapper() {
  const [requests, setRequests] = useState<LeaveRequestWithDetails[]>([])
  const [stats, setStats] = useState<LeaveHistoryStats | null>(null)
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [filters, setFilters] = useState<LeaveHistoryFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (page: number = 1, newFilters?: LeaveHistoryFilters) => {
    try {
      setLoading(page === 1)
      setRefreshing(page !== 1)

      const filtersToUse = newFilters ?? filters
      
      const [historyData, statsData, leaveTypesData] = await Promise.all([
        getLeaveHistory(filtersToUse, page, 10),
        getLeaveHistoryStats(),
        getLeaveTypes()
      ])

      setRequests(historyData.requests)
      setTotalPages(historyData.totalPages)
      setTotalCount(historyData.totalCount)
      setCurrentPage(historyData.currentPage)
      setStats(statsData)
      setLeaveTypes(leaveTypesData)
    } catch (error) {
      console.error("Error fetching leave history:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  const handleFiltersChange = (newFilters: LeaveHistoryFilters) => {
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
      <div className="container mx-auto py-8 px-4 max-w-7xl">
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
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-[200px]" />
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leave History</h1>
              <p className="text-muted-foreground mt-1">
                View and manage your leave request history
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
      {stats && <LeaveHistoryStatsComponent stats={stats} />}

      {/* Filters */}
      <LeaveHistoryFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        leaveTypes={leaveTypes}
        onReset={handleReset}
      />

      {/* Table */}
      <LeaveHistoryTable
        requests={requests}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />
    </div>
  )
}