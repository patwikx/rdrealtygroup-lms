"use client"


import { getLeaveTypes } from "@/lib/actions/leave-actions"
import { getDepartmentsWithManagers, getEmployeeLeaveBalances, getLeaveBalancesSummary } from "@/lib/actions/leave-balance-actions"
import { EmployeeLeaveBalance, LeaveBalancesSummary, DepartmentWithManagers } from "@/lib/types"
import { type LeaveType } from "@prisma/client"
import { useState, useEffect, useCallback } from "react"

/**
 * Custom hook to fetch and manage all data related to leave balances for the admin/settings page.
 */
export function useLeaveBalanceData(year: number) {
  const [summary, setSummary] = useState<LeaveBalancesSummary>({
    totalEmployees: 0,
    totalAllocated: 0,
    totalUsed: 0,
    byType: {},
  })
  const [employeeBalances, setEmployeeBalances] = useState<EmployeeLeaveBalance[]>([])
  // A simplified list of departments for the filter dropdown
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch all required data in parallel
      const [summaryResult, balancesResult, deptsResult, leaveTypesResult] = await Promise.all([
        getLeaveBalancesSummary(year),
        getEmployeeLeaveBalances(year),
        getDepartmentsWithManagers(),
        getLeaveTypes(),
      ])

      setSummary(summaryResult)
      setEmployeeBalances(balancesResult)
      // Extract just the id and name for the department filter dropdown
      setDepartments(deptsResult.map(d => ({ id: d.id, name: d.name })))

      if (leaveTypesResult.success) {
        setLeaveTypes(leaveTypesResult.data)
      } else {
        throw new Error(leaveTypesResult.error || "Failed to fetch leave types")
      }
    } catch (err) {
      console.error("Error fetching leave balance data:", err)
      setError("Failed to load data.")
    } finally {
      setIsLoading(false)
    }
  }, [year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    balancesSummary: summary,
    employeeBalances,
    departments,
    leaveTypes,
    isLoading,
    error,
    refreshData: fetchData,
  }
}
