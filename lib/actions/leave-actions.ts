'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
// --- MODIFIED ---: Removed LeaveType enum import, added Prisma for type hints
import { RequestStatus, LeaveSession } from '@prisma/client'
import { differenceInDays } from 'date-fns'

// --- NEW ---: Action to fetch all available leave types from the database.
// This is needed for the LeaveRequestDialog component.
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

// --- MODIFIED ---: The data parameter now uses leaveTypeId (string) instead of leaveType (enum).
// Dates are now expected as Date objects.
export async function createLeaveRequest(data: {
  userId: string
  leaveTypeId: string
  startDate: Date
  endDate: Date
  session: LeaveSession
  reason: string
}) {
  try {
    // Calculate days (no changes here)
    let days = differenceInDays(data.endDate, data.startDate) + 1
    if (data.session !== LeaveSession.FULL_DAY) {
      days = days === 1 ? 0.5 : days - 0.5
    }

    const leaveType = await prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } });
    if (!leaveType) {
        return { error: 'Invalid leave type specified.'}
    }

    // Check leave balance only for leave types that are not 'UNPAID'
    if (leaveType.name !== 'UNPAID') {
      const currentYear = new Date().getFullYear()

      // --- START: MODIFIED LOGIC ---
      // Determine which leave balance to check. Default to the requested leave type.
      let balanceCheckLeaveTypeId = data.leaveTypeId;

      // If the request is for Emergency Leave, we need to check the Vacation Leave balance instead.
      if (leaveType.name === 'EMERGENCY') {
        const vacationLeaveType = await prisma.leaveType.findUnique({
          where: { name: 'VACATION' },
          select: { id: true } // We only need the ID
        });

        if (!vacationLeaveType) {
          // This is a safeguard in case 'VACATION' leave type doesn't exist.
          return { error: 'Cannot process Emergency Leave: Vacation Leave type not found.' };
        }
        
        balanceCheckLeaveTypeId = vacationLeaveType.id;
      }
      // --- END: MODIFIED LOGIC ---

      const leaveBalance = await prisma.leaveBalance.findUnique({
        where: {
          // --- MODIFICATION ---: Use the dynamically determined leave type ID for the balance check
          userId_leaveTypeId_year: {
            userId: data.userId,
            leaveTypeId: balanceCheckLeaveTypeId, // Use the potentially swapped ID
            year: currentYear,
          },
        },
      })

      if (!leaveBalance || leaveBalance.usedDays + days > leaveBalance.allocatedDays) {
        // --- MODIFICATION ---: Adjust error message for clarity
        const errorMessage = leaveType.name === 'EMERGENCY' 
            ? 'Insufficient Vacation Leave balance for Emergency Leave.' 
            : 'Insufficient leave balance for the selected leave type.';
        return { error: errorMessage }
      }
    }

    // Create the leave request (no changes here).
    // It's important to still use the original `data.leaveTypeId` to correctly record
    // the request as an "Emergency Leave".
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: data.userId,
        leaveTypeId: data.leaveTypeId, // Use the original ID here
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

// --- MODIFIED ---: This function now includes the related leaveType data.
export async function getUserLeaveRequests(userId: string) {
  try {
    const requests = await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        leaveType: true,
        user: { // This block was missing
          select: {
            name: true,
            employeeId: true,
          }
        }
      },
    })
    return { success: true, data: requests }
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    return { error: 'Failed to fetch leave requests' }
  }
}

// --- MODIFIED ---: This function now includes the related leaveType data.
export async function getLeaveBalances(userId: string) {
  try {
    const currentYear = new Date().getFullYear()
    const balances = await prisma.leaveBalance.findMany({
      where: {
        userId,
        year: currentYear,
      },
      include: {
        leaveType: true, // Include the full LeaveType object
      },
    })
    return { success: true, data: balances }
  } catch (error) {
    console.error('Error fetching leave balances:', error)
    return { error: 'Failed to fetch leave balances' }
  }
}

// --- MODIFIED ---: This function now accepts leaveTypeId.
export async function updateLeaveRequest(data: {
  requestId: string
  leaveTypeId: string
  startDate: Date
  endDate: Date
  session: LeaveSession
  reason: string
}) {
  try {
    // Only allow updates if request is still pending manager approval
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

// --- MODIFIED ---: This function is updated to handle the new schema.
export async function cancelRequest(requestId: string, requestType: 'leave' | 'overtime') {
  try {
    if (requestType === 'leave') {
      const request = await prisma.leaveRequest.findUnique({
        where: { id: requestId },
        include: { leaveType: true }, // Include leave type details
      })

      if (!request) {
        return { error: 'Request not found' }
      }
      
      // If the request was approved and not UNPAID, return the days to the user's balance
      if (request.status === RequestStatus.APPROVED && request.leaveType.name !== 'UNPAID') {
        let daysToReturn =
          differenceInDays(request.endDate, request.startDate) + 1
        if (request.session !== LeaveSession.FULL_DAY && daysToReturn === 1) {
          daysToReturn = 0.5
        }

        await prisma.$transaction([
          prisma.leaveBalance.update({
            where: {
              userId_leaveTypeId_year: {
                userId: request.userId,
                leaveTypeId: request.leaveTypeId,
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
        // If request was not approved or was unpaid, just update the status
        await prisma.leaveRequest.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.CANCELLED,
            updatedAt: new Date(),
          },
        })
      }
    } else {
      // Logic for overtime cancellation (no balance to adjust)
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
