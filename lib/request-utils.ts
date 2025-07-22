"use client"

import { RequestData } from '@/app/dashboard/components/request/components/request-table'
// --- MODIFIED ---: Imported the model type for LeaveType
import { LeaveRequest, OvertimeRequest, User, type LeaveType as LeaveTypeModel } from '@prisma/client'

// --- MODIFIED ---: This type now correctly reflects the data from server actions,
// which includes the full related leaveType object.
type LeaveRequestWithDetails = LeaveRequest & {
  user: Pick<User, 'name' | 'employeeId' | 'email'>
  leaveType: LeaveTypeModel
}

type OvertimeRequestWithUser = OvertimeRequest & {
  user: Pick<User, 'name' | 'employeeId' | 'email'>
}

export function combineRequests(
  leaveRequests: LeaveRequestWithDetails[],
  overtimeRequests: OvertimeRequestWithUser[]
): RequestData[] {
  const combinedRequests: RequestData[] = []

  // Add leave requests
  leaveRequests.forEach((request) => {
    combinedRequests.push({
      id: request.id,
      type: 'leave',
      userId: request.userId,
      user: request.user,
      // This now correctly passes the full LeaveType object
      leaveType: request.leaveType,
      startDate: request.startDate,
      endDate: request.endDate,
      session: request.session,
      reason: request.reason,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      managerActionBy: request.managerActionBy || undefined,
      managerActionAt: request.managerActionAt || undefined,
      managerComments: request.managerComments || undefined,
      hrActionBy: request.hrActionBy || undefined,
      hrActionAt: request.hrActionAt || undefined,
      hrComments: request.hrComments || undefined,
    })
  })

  // Add overtime requests (no changes needed here for this schema update)
  overtimeRequests.forEach((request) => {
    combinedRequests.push({
      id: request.id,
      type: 'overtime',
      userId: request.userId,
      user: request.user,
      startTime: request.startTime,
      endTime: request.endTime,
      reason: request.reason,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      managerActionBy: request.managerActionBy || undefined,
      managerActionAt: request.managerActionAt || undefined,
      managerComments: request.managerComments || undefined,
      hrActionBy: request.hrActionBy || undefined,
      hrActionAt: request.hrActionAt || undefined,
      hrComments: request.hrComments || undefined,
    })
  })

  // Sort by creation date (newest first)
  return combinedRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}
