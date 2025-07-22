"use client"

import { getDepartmentsWithManagers, getEmployeesWithDepartments } from "@/lib/actions/leave-balance-actions"
import { DepartmentWithManagers, EmployeeWithDepartment } from "@/lib/types"
import { useState, useEffect } from "react"


export function useEmployeeData() {
  const [employees, setEmployees] = useState<EmployeeWithDepartment[]>([])
  const [departments, setDepartments] = useState<DepartmentWithManagers[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [employeeData, deptData] = await Promise.all([getEmployeesWithDepartments(), getDepartmentsWithManagers()])
      setEmployees(employeeData)
      setDepartments(deptData)
    } catch (error) {
      console.error("Error fetching employee data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    employees,
    departments,
    isLoading,
    refreshData: fetchData,
  }
}
