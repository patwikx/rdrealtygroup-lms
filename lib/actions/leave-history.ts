"use server"

import auth from "@/auth"
import { prisma } from "@/lib/prisma"
import { LeaveHistoryFilters, LeaveRequestWithDetails, LeaveHistoryStats } from "@/lib/types/leave-history-types"
import { RequestStatus } from "@prisma/client"
import { redirect } from "next/navigation"

export async function getLeaveHistory(
  filters: LeaveHistoryFilters = {},
  page: number = 1,
  limit: number = 10
): Promise<{
  requests: LeaveRequestWithDetails[]
  totalCount: number
  totalPages: number
  currentPage: number
}> {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const where = {
    userId: session.user.id,
    ...(filters.status?.length && { status: { in: filters.status } }),
    ...(filters.leaveTypeId?.length && { leaveTypeId: { in: filters.leaveTypeId } }),
    ...(filters.session?.length && { session: { in: filters.session } }),
    ...(filters.startDate && filters.endDate && {
      AND: [
        { startDate: { gte: new Date(filters.startDate) } },
        { endDate: { lte: new Date(filters.endDate) } }
      ]
    })
  }

  const [requests, totalCount] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        user: {
          select: {
            id: true,
            name: true,
            employeeId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.leaveRequest.count({ where })
  ])

  return {
    requests,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page
  }
}

export async function getLeaveHistoryStats(): Promise<LeaveHistoryStats> {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [totalRequests, approvedRequests, pendingRequests, rejectedRequests] = await Promise.all([
    prisma.leaveRequest.count({
      where: { userId: session.user.id }
    }),
    prisma.leaveRequest.count({
      where: { 
        userId: session.user.id,
        status: RequestStatus.APPROVED 
      }
    }),
    prisma.leaveRequest.count({
      where: { 
        userId: session.user.id,
        status: { in: [RequestStatus.PENDING_MANAGER, RequestStatus.PENDING_HR] }
      }
    }),
    prisma.leaveRequest.count({
      where: { 
        userId: session.user.id,
        status: RequestStatus.REJECTED 
      }
    })
  ])

  return {
    totalRequests,
    approvedRequests,
    pendingRequests,
    rejectedRequests
  }
}

export async function getLeaveTypes() {
  return await prisma.leaveType.findMany({
    orderBy: { name: 'asc' }
  })
}