import { useState, useEffect } from "react"
import { getLeaveTypes, type LeaveType } from "@/lib/actions/leave-type-actions"

export function useLeaveTypesData() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const types = await getLeaveTypes()
      setLeaveTypes(types)
    } catch (error) {
      console.error("Failed to fetch leave types:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const refreshData = () => {
    fetchData()
  }

  // Calculate summary statistics
  const summary = {
    totalLeaveTypes: leaveTypes.length,
    totalDefaultDays: leaveTypes.reduce((sum, type) => sum + type.defaultAllocatedDays, 0),
    averageAllocation: leaveTypes.length > 0 
      ? leaveTypes.reduce((sum, type) => sum + type.defaultAllocatedDays, 0) / leaveTypes.length 
      : 0,
    mostUsedType: leaveTypes.reduce((prev, current) => 
      (current._count?.leaveRequests || 0) > (prev._count?.leaveRequests || 0) ? current : prev
    , leaveTypes[0]),
  }

  return {
    leaveTypes,
    summary,
    isLoading,
    refreshData,
  }
}