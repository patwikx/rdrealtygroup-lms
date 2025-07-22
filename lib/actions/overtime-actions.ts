'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma, RequestStatus } from '@prisma/client'

export async function createOvertimeRequest(data: {
  userId: string
  startTime: string
  endTime: string
  reason: string
}) {
  try {
    const overtimeRequest = await prisma.overtimeRequest.create({
      data: {
        userId: data.userId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        reason: data.reason,
        status: RequestStatus.PENDING_MANAGER
      }
    })

    revalidatePath('/dashboard')
    return { success: true, data: overtimeRequest }
  } catch (error) {
    console.error('Error creating overtime request:', error)
    return { error: 'Failed to create overtime request' }
  }
}

export async function updateOvertimeRequestStatus(
  requestId: string,
  status: RequestStatus,
  actionBy: string,
  comments?: string,
  role?: 'MANAGER' | 'HR'
) {
  try {
    const updateData: Prisma.OvertimeRequestUpdateInput = {
      status,
      updatedAt: new Date()
    }

    if (role === 'MANAGER') {
      updateData.managerActionBy = actionBy
      updateData.managerActionAt = new Date()
      updateData.managerComments = comments
      
      // If manager approves, move to HR approval
      if (status === RequestStatus.APPROVED) {
        updateData.status = RequestStatus.PENDING_HR
      }
    } else if (role === 'HR') {
      updateData.hrActionBy = actionBy
      updateData.hrActionAt = new Date()
      updateData.hrComments = comments
    }

    const updatedRequest = await prisma.overtimeRequest.update({
      where: { id: requestId },
      data: updateData
    })

    revalidatePath('/dashboard')
    revalidatePath('/approvals')
    return { success: true, data: updatedRequest }
  } catch (error) {
    console.error('Error updating overtime request:', error)
    return { error: 'Failed to update overtime request' }
  }
}

export async function getUserOvertimeRequests(userId: string) {
  try {
    const requests = await prisma.overtimeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, employeeId: true }
        }
      }
    })

    return { success: true, data: requests }
  } catch (error) {
    console.error('Error fetching overtime requests:', error)
    return { error: 'Failed to fetch overtime requests' }
  }
}