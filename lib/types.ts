// --- MODIFIED ---: Imported the model type for LeaveType
import type { UserRole, LeaveType as LeaveTypeModel } from "@prisma/client"

export interface DepartmentWithManagers {
  id: string
  name: string
  managers: {
    id: string
    name: string
    employeeId: string
    email: string
    role: UserRole
  }[]
  members: {
    id: string
    name: string
    employeeId: string
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface AvailableManager {
  id: string
  name: string
  employeeId: string
  email: string
  role: UserRole
}

export interface EmployeeWithDepartment {
  id: string
  name: string
  email: string
  employeeId: string
  role: UserRole
  department: {
    id: string
    name: string
  } | null
  createdAt: Date
  updatedAt: Date
}

export interface EmployeeLeaveBalance {
  id: string
  // --- MODIFIED ---: The leaveType is now the full model object
  leaveType: LeaveTypeModel
  allocatedDays: number
  usedDays: number
  year: number
  employee: {
    id: string
    name: string
    employeeId: string
    email: string
    department: {
      id: string
      name: string
    } | null
  }
}

export interface LeaveBalancesSummary {
  totalEmployees: number
  totalAllocated: number
  totalUsed: number
  // --- MODIFIED ---: The record is now keyed by a string (the leave type's name)
  byType: Record<
    string,
    {
      allocated: number
      used: number
      remaining: number
    }
  >
}

export interface LeaveBalanceRenewalResult {
  renewed: number
  rollover: number
}
