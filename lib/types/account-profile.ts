export interface UserProfile {
  id: string
  employeeId: string
    email: string | null
  name: string
  role: UserRole
  classification: EmployeeClassification | null
  department: {
    id: string
    name: string
  } | null
  approver: {
    id: string
    name: string
    employeeId: string
  } | null
  createdAt: Date
  updatedAt: Date
}

export interface UserStats {
  totalLeaveRequests: number
  totalOvertimeRequests: number
  pendingRequests: number
  approvedRequests: number
  currentYearLeaveUsed: number
  currentYearLeaveAllocated: number
}

export interface UpdateProfileData {
  name: string
    email: string | null
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Import enums from Prisma
import { UserRole, EmployeeClassification } from "@prisma/client"