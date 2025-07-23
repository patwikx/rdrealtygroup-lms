import type { EmployeeClassification, RequestStatus } from "@prisma/client"

export interface OvertimeReportFilters {
  startDate?: string
  endDate?: string
  departmentIds?: string[]
  statuses?: RequestStatus[]
  employeeIds?: string[]
  classifications?: EmployeeClassification[]
}

export interface OvertimeReportItem {
  id: string
  employeeId: string
  employeeName: string
  email: string
  department: string | null
  classification: EmployeeClassification | null
  startTime: string
  endTime: string
  duration: number // in hours
  reason: string
  status: RequestStatus
  managerActionBy: string | null
  managerActionAt: string | null
  managerComments: string | null
  hrActionBy: string | null
  hrActionAt: string | null
  hrComments: string | null
  createdAt: string
}

export interface OvertimeReportSummary {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  totalHoursRequested: number
  totalHoursApproved: number
}

export interface OvertimeReportData {
  items: OvertimeReportItem[]
  summary: OvertimeReportSummary
  totalCount: number
}

export interface OvertimeFilterOptions {
  departments: { id: string; name: string }[]
  employees: { id: string; name: string; employeeId: string }[]
}
