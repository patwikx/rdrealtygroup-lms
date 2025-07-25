'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
// --- MODIFIED ---: Assuming your types file is updated for the new schema
import { differenceInDays } from 'date-fns'
import { ApprovalAction, LeaveRequestWithDetails, OvertimeRequestWithUser } from '../types/requests'
import { Prisma, RequestStatus } from '@prisma/client'

// --- MODIFIED ---: This function now uses the direct 'reports' relationship for managers.
export async function getPendingRequests() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        // Include reports to find users who report to this manager
        reports: {
          select: { id: true }
        },
        managedDepartments: {
          include: {
            department: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const isHR = user.role === 'HR' || user.role === 'ADMIN'
    const isManager = user.role === 'MANAGER' || user.role === 'ADMIN'

    const leaveRequests: LeaveRequestWithDetails[] = []
    const overtimeRequests: OvertimeRequestWithUser[] = []

    // HR/Admin gets all requests pending HR approval
    if (isHR) {
      const [hrLeaveRequests, hrOvertimeRequests] = await Promise.all([
        prisma.leaveRequest.findMany({
          where: { status: 'PENDING_HR' },
          include: {
            user: { include: { department: true } },
            leaveType: true, // Include leave type details
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.overtimeRequest.findMany({
          where: { status: 'PENDING_HR' },
          include: {
            user: { include: { department: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ])
      leaveRequests.push(...(hrLeaveRequests as LeaveRequestWithDetails[]))
      overtimeRequests.push(...(hrOvertimeRequests as OvertimeRequestWithUser[]))
    }

    // Manager/Admin gets requests from their direct reports pending manager approval
    if (isManager && user.reports.length > 0) {
      const reportIds = user.reports.map(report => report.id);
      const [managerLeaveRequests, managerOvertimeRequests] = await Promise.all([
        prisma.leaveRequest.findMany({
          where: {
            status: 'PENDING_MANAGER',
            userId: { in: reportIds },
          },
          include: {
            user: { include: { department: true } },
            leaveType: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.overtimeRequest.findMany({
          where: {
            status: 'PENDING_MANAGER',
            userId: { in: reportIds },
          },
          include: {
            user: { include: { department: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ])
      
      // Avoid duplicates if user is both HR and Manager (as an Admin)
      const existingLeaveIds = new Set(leaveRequests.map(r => r.id));
      const existingOvertimeIds = new Set(overtimeRequests.map(r => r.id));

      leaveRequests.push(...(managerLeaveRequests.filter(r => !existingLeaveIds.has(r.id)) as LeaveRequestWithDetails[]));
      overtimeRequests.push(...(managerOvertimeRequests.filter(r => !existingOvertimeIds.has(r.id)) as OvertimeRequestWithUser[]));
    }

    return {
      leaveRequests,
      overtimeRequests,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        managedDepartments: user.managedDepartments,
        reports: user.reports, // Pass reports to the client if needed
      },
    }
  } catch (error) {
    console.error('Error fetching pending requests:', error)
    // Return empty arrays on error to prevent crashes on the client
    return { leaveRequests: [], overtimeRequests: [], user: null, error: 'Failed to fetch pending requests' };
  }
}

// --- MODIFIED ---: This function now uses the direct 'approverId' for authorization.
export async function processLeaveRequest({
  action,
  comments,
  requestId,
}: Omit<ApprovalAction, 'requestType'>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!currentUser) {
      return { success: false, error: 'User not found' }
    }

    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { user: true, leaveType: true }, // leaveType is crucial
    })

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    const isHR = currentUser.role === 'HR' || currentUser.role === 'ADMIN'
    const isManagerOfUser = request.user.approverId === currentUser.id

    let updateData: Prisma.LeaveRequestUpdateInput = {}
    let finalStatus: RequestStatus = request.status

    if (request.status === 'PENDING_MANAGER' && (isManagerOfUser || isHR)) { // Allow admin/hr to override
      finalStatus = action === 'approve' ? 'PENDING_HR' : 'REJECTED'
      updateData = {
        status: finalStatus,
        managerActionBy: currentUser.id,
        managerActionAt: new Date(),
        managerComments: comments,
      }
    } else if (request.status === 'PENDING_HR' && isHR) {
      finalStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
      updateData = {
        status: finalStatus,
        hrActionBy: currentUser.id,
        hrActionAt: new Date(),
        hrComments: comments,
      }
    } else {
      return { success: false, error: 'You are not authorized to process this request.' }
    }
    
    // --- START: MODIFIED LOGIC BLOCK ---
    // If the final action is HR approval for a paid leave, run a transaction.
    if (finalStatus === 'APPROVED' && request.leaveType.name !== 'UNPAID') {
        
      await prisma.$transaction(async (tx) => {
        // 1. Calculate the number of days to deduct
        const daysToDeduct = differenceInDays(request.endDate, request.startDate) + 1 - (request.session !== 'FULL_DAY' ? 0.5 : 0)

        // 2. Determine which leave balance to use
        let balanceLeaveTypeId = request.leaveTypeId;
        if (request.leaveType.name === 'EMERGENCY') {
          const vacationLeaveType = await tx.leaveType.findUnique({ where: { name: 'VACATION' }, select: { id: true }});
          if (!vacationLeaveType) {
            throw new Error('System configuration error: Vacation Leave type not found.');
          }
          balanceLeaveTypeId = vacationLeaveType.id;
        }

        // 3. Find the correct leave balance record
        const leaveBalance = await tx.leaveBalance.findUnique({
          where: {
            userId_leaveTypeId_year: {
              userId: request.userId,
              leaveTypeId: balanceLeaveTypeId,
              year: request.startDate.getFullYear()
            }
          }
        });

        // 4. Validate the balance
        if (!leaveBalance || leaveBalance.usedDays + daysToDeduct > leaveBalance.allocatedDays) {
          const errorMsg = request.leaveType.name === 'EMERGENCY'
            ? 'Insufficient Vacation Leave balance for this Emergency Leave.'
            : 'Insufficient leave balance.';
          throw new Error(errorMsg); // This will cancel the transaction
        }

        // 5. Update the balance
        await tx.leaveBalance.update({
          where: {
            userId_leaveTypeId_year: {
              userId: request.userId,
              leaveTypeId: balanceLeaveTypeId,
              year: request.startDate.getFullYear()
            }
          },
          data: {
            usedDays: { increment: daysToDeduct }
          }
        });
        
        // 6. Update the request itself
        await tx.leaveRequest.update({
          where: { id: requestId },
          data: updateData,
        });
      });

    } else {
      // For rejections, unpaid leave, or manager approvals, just update the request
      await prisma.leaveRequest.update({
        where: { id: requestId },
        data: updateData,
      });
    }
    // --- END: MODIFIED LOGIC BLOCK ---

    revalidatePath('/approvals')
    revalidatePath('/dashboard') // Revalidate for the user who made the request
    return { success: true }

  } catch (error) {
    console.error('Error processing leave request:', error)
    if (error instanceof Error) {
        // Catches errors from the transaction (e.g., "Insufficient balance")
        return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to process leave request' }
  }
}
// --- MODIFIED ---: This function also uses the direct 'approverId' for authorization.
export async function processOvertimeRequest({
  action,
  comments,
  requestId,
}: Omit<ApprovalAction, 'requestType'>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!currentUser) {
      return { success: false, error: 'User not found' }
    }

    const request = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    })

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    const isHR = currentUser.role === 'HR' || currentUser.role === 'ADMIN'
    const isManagerOfUser = request.user.approverId === currentUser.id

    let updateData: Prisma.OvertimeRequestUpdateInput = {}

    if (request.status === 'PENDING_MANAGER' && (isManagerOfUser || currentUser.role === 'ADMIN')) {
      updateData = {
        status: action === 'approve' ? 'PENDING_HR' : 'REJECTED',
        managerActionBy: currentUser.id,
        managerActionAt: new Date(),
        managerComments: comments,
      }
    } else if (request.status === 'PENDING_HR' && isHR) {
      updateData = {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        hrActionBy: currentUser.id,
        hrActionAt: new Date(),
        hrComments: comments,
      }
    } else {
      return { success: false, error: 'You are not authorized to process this request.' }
    }

    await prisma.overtimeRequest.update({
      where: { id: requestId },
      data: updateData,
    })

    revalidatePath('/approvals')
    return { success: true }
  } catch (error) {
    console.error('Error processing overtime request:', error)
    return { success: false, error: 'Failed to process overtime request' }
  }
}
