'use server'

import { prisma } from '@/lib/prisma'
// --- MODIFIED ---: Imported LeaveType
import {
  RequestStatus,
  UserRole,
  LeaveRequest,
  OvertimeRequest,
  User,
  LeaveType,
} from '@prisma/client'

// --- MODIFIED ---: Updated type to include the related leaveType name
type LeaveRequestWithDetails = LeaveRequest & {
  user: Pick<User, 'name' | 'employeeId' | 'email'>
  leaveType: Pick<LeaveType, 'name'>
}

type OvertimeRequestWithUser = OvertimeRequest & {
  user: Pick<User, 'name' | 'employeeId' | 'email'>
}

export async function getPendingApprovals(userId: string, userRole: UserRole) {
  try {
    let leaveRequests: LeaveRequestWithDetails[] = []
    let overtimeRequests: OvertimeRequestWithUser[] = []

    if (userRole === UserRole.MANAGER) {
      // --- MODIFIED ---: Switched from department logic to direct reports logic
      // This is more accurate based on the new schema's approver field.
      const manager = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          reports: {
            select: { id: true }, // Select only the IDs of the direct reports
          },
        },
      })

      if (manager && manager.reports.length > 0) {
        const reportIds = manager.reports.map((report) => report.id)

        leaveRequests = await prisma.leaveRequest.findMany({
          where: {
            userId: { in: reportIds },
            status: RequestStatus.PENDING_MANAGER,
          },
          // --- MODIFIED ---: Included leaveType name in the query
          include: {
            user: {
              select: { name: true, employeeId: true, email: true },
            },
            leaveType: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        overtimeRequests = await prisma.overtimeRequest.findMany({
          where: {
            userId: { in: reportIds },
            status: RequestStatus.PENDING_MANAGER,
          },
          include: {
            user: {
              select: { name: true, employeeId: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      }
    } else if (userRole === UserRole.HR || userRole === UserRole.ADMIN) {
      leaveRequests = await prisma.leaveRequest.findMany({
        where: {
          status: RequestStatus.PENDING_HR,
        },
        // --- MODIFIED ---: Included leaveType name in the query
        include: {
          user: {
            select: { name: true, employeeId: true, email: true },
          },
          leaveType: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      overtimeRequests = await prisma.overtimeRequest.findMany({
        where: {
          status: RequestStatus.PENDING_HR,
        },
        include: {
          user: {
            select: { name: true, employeeId: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return { success: true, data: { leaveRequests, overtimeRequests } }
  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    return { error: 'Failed to fetch pending approvals' }
  }
}