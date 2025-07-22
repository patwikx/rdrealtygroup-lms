"use client"

import { getAvailableManagers, getDepartmentsWithManagers } from "@/lib/actions/leave-balance-actions"
import { AvailableManager, DepartmentWithManagers } from "@/lib/types"
import { useState, useEffect } from "react"


export function useDepartmentData() {
  const [departments, setDepartments] = useState<DepartmentWithManagers[]>([])
  const [availableManagers, setAvailableManagers] = useState<AvailableManager[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [deptData, managerData] = await Promise.all([getDepartmentsWithManagers(), getAvailableManagers()])
      setDepartments(deptData)
      setAvailableManagers(managerData)
    } catch (error) {
      console.error("Error fetching department data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    departments,
    availableManagers,
    isLoading,
    refreshData: fetchData,
  }
}
