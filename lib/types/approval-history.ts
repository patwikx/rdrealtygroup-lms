// lib/types/leave-approval-types.ts
import { RequestStatus, LeaveSession, LeaveType, User, LeaveRequest } from "@prisma/client"

export interface LeaveApprovalFilters {
  status?: RequestStatus[]
  leaveTypeId?: string[]
  session?: LeaveSession[]
  startDate?: string
  endDate?: string
  employeeId?: string[] // Filter by specific employees
  departmentId?: string[] // Filter by department
}

export interface LeaveRequestWithApprovalDetails extends LeaveRequest {
  leaveType: LeaveType
  user: {
    id: string
    name: string
    employeeId: string
    department: {
      id: string
      name: string
    } | null
  }
}

export interface LeaveApprovalStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
}