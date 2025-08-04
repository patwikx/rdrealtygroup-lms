'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { RequestStatus, LeaveSession } from '@prisma/client'
import { differenceInDays } from 'date-fns'

// Fetch all available leave types
export async function getLeaveTypes() {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: { name: 'asc' },
    })
    return { success: true, data: leaveTypes }
  } catch (error) {
    console.error('Error fetching leave types:', error)
    return { error: 'Failed to fetch leave types' }
  }
}

// Create a leave request
export async function createLeaveRequest(data: {
  userId: string
  leaveTypeId: string
  startDate: Date
  endDate: Date
  session: LeaveSession
  reason: string
}) {
  try {
    // Calculate days
    let days = differenceInDays(data.endDate, data.startDate) + 1
    if (data.session !== LeaveSession.FULL_DAY) {
      days = days === 1 ? 0.5 : days - 0.5
    }

    const leaveType = await prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } })
    if (!leaveType) {
      return { error: 'Invalid leave type specified.' }
    }

    // Check balance if not UNPAID
    if (leaveType.name !== 'UNPAID') {
      const currentYear = new Date().getFullYear()
      let balanceCheckLeaveTypeId = data.leaveTypeId

      // Emergency Leave uses Vacation Leave balance
      if (leaveType.name === 'EMERGENCY') {
        const vacationLeaveType = await prisma.leaveType.findUnique({
          where: { name: 'VACATION' },
          select: { id: true },
        })
        if (!vacationLeaveType) {
          return { error: 'Cannot process Emergency Leave: Vacation Leave type not found.' }
        }
        balanceCheckLeaveTypeId = vacationLeaveType.id
      }

      const leaveBalance = await prisma.leaveBalance.findUnique({
        where: {
          userId_leaveTypeId_year: {
            userId: data.userId,
            leaveTypeId: balanceCheckLeaveTypeId,
            year: currentYear,
          },
        },
      })

      if (!leaveBalance || leaveBalance.usedDays + days > leaveBalance.allocatedDays) {
        return {
          error:
            leaveType.name === 'EMERGENCY'
              ? 'Insufficient Vacation Leave balance for Emergency Leave.'
              : 'Insufficient leave balance for the selected leave type.',
        }
      }
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: data.userId,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        session: data.session,
        reason: data.reason,
        status: RequestStatus.PENDING_MANAGER,
      },
    })

    revalidatePath('/dashboard')
    return { success: true, data: leaveRequest }
  } catch (error) {
    console.error('Error creating leave request:', error)
    return { error: 'Failed to create leave request' }
  }
}

// Get leave requests for a user
export async function getUserLeaveRequests(userId: string) {
  try {
    const requests = await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        leaveType: true,
        user: {
          select: {
            name: true,
            employeeId: true,
          },
        },
      },
    })
    return { success: true, data: requests }
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    return { error: 'Failed to fetch leave requests' }
  }
}

// Get leave balances for a user
export async function getLeaveBalances(userId: string) {
  try {
    const currentYear = new Date().getFullYear()
    const balances = await prisma.leaveBalance.findMany({
      where: {
        userId,
        year: currentYear,
      },
      include: {
        leaveType: true,
      },
    })
    return { success: true, data: balances }
  } catch (error) {
    console.error('Error fetching leave balances:', error)
    return { error: 'Failed to fetch leave balances' }
  }
}

// Update a leave request
export async function updateLeaveRequest(data: {
  requestId: string
  leaveTypeId: string
  startDate: Date
  endDate: Date
  session: LeaveSession
  reason: string
}) {
  try {
    const existingRequest = await prisma.leaveRequest.findUnique({
      where: { id: data.requestId },
    })

    if (!existingRequest) {
      return { error: 'Request not found' }
    }

    if (existingRequest.status !== RequestStatus.PENDING_MANAGER) {
      return { error: 'Cannot edit request that has already been processed' }
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: data.requestId },
      data: {
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        session: data.session,
        reason: data.reason,
        updatedAt: new Date(),
      },
    })

    revalidatePath('/dashboard')
    return { success: true, data: updatedRequest }
  } catch (error) {
    console.error('Error updating leave request:', error)
    return { error: 'Failed to update leave request' }
  }
}

// Update an overtime request
export async function updateOvertimeRequest(data: {
  requestId: string
  startTime: string
  endTime: string
  reason: string
}) {
  try {
    const existingRequest = await prisma.overtimeRequest.findUnique({
      where: { id: data.requestId },
    })

    if (!existingRequest) {
      return { error: 'Request not found' }
    }

    if (existingRequest.status !== RequestStatus.PENDING_MANAGER) {
      return { error: 'Cannot edit request that has already been processed' }
    }

    const updatedRequest = await prisma.overtimeRequest.update({
      where: { id: data.requestId },
      data: {
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        reason: data.reason,
        updatedAt: new Date(),
      },
    })

    revalidatePath('/dashboard')
    return { success: true, data: updatedRequest }
  } catch (error) {
    console.error('Error updating overtime request:', error)
    return { error: 'Failed to update overtime request' }
  }
}

// Cancel a request
export async function cancelRequest(requestId: string, requestType: 'leave' | 'overtime') {
  try {
    if (requestType === 'leave') {
      const request = await prisma.leaveRequest.findUnique({
        where: { id: requestId },
        include: { leaveType: true },
      })

      if (!request) {
        return { error: 'Request not found' }
      }

      if (request.status === RequestStatus.APPROVED && request.leaveType.name !== 'UNPAID') {
        let daysToReturn = differenceInDays(request.endDate, request.startDate) + 1
        if (request.session !== LeaveSession.FULL_DAY && daysToReturn === 1) {
          daysToReturn = 0.5
        }

        // Handle Emergency Leave return to Vacation balance
        let balanceReturnLeaveTypeId = request.leaveTypeId
        if (request.leaveType.name === 'EMERGENCY') {
          const vacationLeaveType = await prisma.leaveType.findUnique({
            where: { name: 'VACATION' },
            select: { id: true },
          })
          if (vacationLeaveType) {
            balanceReturnLeaveTypeId = vacationLeaveType.id
          }
        }

        await prisma.$transaction([
          prisma.leaveBalance.update({
            where: {
              userId_leaveTypeId_year: {
                userId: request.userId,
                leaveTypeId: balanceReturnLeaveTypeId,
                year: request.startDate.getFullYear(),
              },
            },
            data: {
              usedDays: { decrement: daysToReturn },
            },
          }),
          prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
              status: RequestStatus.CANCELLED,
              updatedAt: new Date(),
            },
          }),
        ])
      } else {
        await prisma.leaveRequest.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.CANCELLED,
            updatedAt: new Date(),
          },
        })
      }
    } else {
      await prisma.overtimeRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.CANCELLED,
          updatedAt: new Date(),
        },
      })
    }

    revalidatePath('/dashboard')
    revalidatePath('/approvals')
    return { success: true }
  } catch (error) {
    console.error('Error cancelling request:', error)
    return { error: 'Failed to cancel request' }
  }
}
