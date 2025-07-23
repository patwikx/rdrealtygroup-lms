import { LeaveRequest, LeaveType, User, RequestStatus, LeaveSession } from "@prisma/client"

export type LeaveRequestWithDetails = LeaveRequest & {
  leaveType: LeaveType
  user: Pick<User, 'id' | 'name' | 'employeeId'>
}

export interface LeaveHistoryFilters {
  status?: RequestStatus[]
  leaveTypeId?: string[]
  startDate?: string
  endDate?: string
  session?: LeaveSession[]
}

export interface LeaveHistoryStats {
  totalRequests: number
  approvedRequests: number
  pendingRequests: number
  rejectedRequests: number
}