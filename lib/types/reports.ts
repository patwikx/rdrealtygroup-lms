import { EmployeeClassification, RequestStatus, LeaveSession } from '@prisma/client'

export interface LeaveReportFilters {
  startDate?: string
  endDate?: string
  departmentIds?: string[]
  leaveTypeIds?: string[]
  statuses?: RequestStatus[]
  employeeIds?: string[]
  classifications?: EmployeeClassification[]
  sessions?: LeaveSession[]
}

export interface LeaveReportItem {
  id: string
  employeeId: string
  employeeName: string
    email: string | null
  department: string | null
  classification: EmployeeClassification | null
  leaveType: string
  startDate: string
  endDate: string
  session: LeaveSession
  reason: string
  status: RequestStatus
  managerActionBy: string | null
  managerActionAt: string | null
  managerComments: string | null
  hrActionBy: string | null
  hrActionAt: string | null
  hrComments: string | null
  createdAt: string
  dayCount: number
}

export interface LeaveReportSummary {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  totalDaysRequested: number
  totalDaysApproved: number
}

export interface ReportData {
  items: LeaveReportItem[]
  summary: LeaveReportSummary
  totalCount: number
}

export interface FilterOptions {
  departments: { id: string; name: string }[]
  leaveTypes: { id: string; name: string }[]
  employees: { id: string; name: string; employeeId: string }[]
}
