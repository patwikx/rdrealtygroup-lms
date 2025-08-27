"use server"

import auth from "@/auth"
import { prisma } from "@/lib/prisma"
import { LeaveApprovalFilters, LeaveRequestWithApprovalDetails, LeaveApprovalStats } from "@/lib/types/approval-history"
import { RequestStatus, UserRole } from "@prisma/client"
import { redirect } from "next/navigation"

export async function getLeaveApprovalHistory(
  filters: LeaveApprovalFilters = {},
  page: number = 1,
  limit: number = 10
): Promise<{
  requests: LeaveRequestWithApprovalDetails[]
  totalCount: number
  totalPages: number
  currentPage: number
}> {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get current user with their role and managed departments
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      managedDepartments: {
        include: {
          department: true
        }
      }
    }
  })

  if (!currentUser) {
    redirect("/login")
  }

  // Check if user has approval permissions
  const canApprove = currentUser.role === UserRole.MANAGER || 
                    currentUser.role === UserRole.HR || 
                    currentUser.role === UserRole.ADMIN ||
                    currentUser.managedDepartments.length > 0

  if (!canApprove) {
    throw new Error("You don't have permission to view approval history")
  }

  // Build where clause based on user role
  let where: Record<string, unknown> = {}

  if (currentUser.role === UserRole.HR || currentUser.role === UserRole.ADMIN) {
    // HR and ADMIN can see all requests
    where = {
      ...(filters.status?.length && { status: { in: filters.status } }),
      ...(filters.leaveTypeId?.length && { leaveTypeId: { in: filters.leaveTypeId } }),
      ...(filters.session?.length && { session: { in: filters.session } }),
      ...(filters.employeeId?.length && { userId: { in: filters.employeeId } }),
      ...(filters.departmentId?.length && { 
        user: { 
          deptId: { in: filters.departmentId } 
        } 
      }),
      ...(filters.startDate && filters.endDate && {
        AND: [
          { startDate: { gte: new Date(filters.startDate) } },
          { endDate: { lte: new Date(filters.endDate) } }
        ]
      })
    }
  } else {
    // MANAGER can only see requests from their direct reports and department members
    const managedDepartmentIds = currentUser.managedDepartments.map(md => md.departmentId)
    
    where = {
      OR: [
        // Direct reports
        {
          user: {
            approverId: currentUser.id
          }
        },
        // Department members (if they manage any departments)
        ...(managedDepartmentIds.length > 0 ? [{
          user: {
            deptId: { in: managedDepartmentIds }
          }
        }] : [])
      ],
      ...(filters.status?.length && { status: { in: filters.status } }),
      ...(filters.leaveTypeId?.length && { leaveTypeId: { in: filters.leaveTypeId } }),
      ...(filters.session?.length && { session: { in: filters.session } }),
      ...(filters.employeeId?.length && { userId: { in: filters.employeeId } }),
      ...(filters.departmentId?.length && { 
        user: { 
          deptId: { in: filters.departmentId } 
        } 
      }),
      ...(filters.startDate && filters.endDate && {
        AND: [
          { startDate: { gte: new Date(filters.startDate) } },
          { endDate: { lte: new Date(filters.endDate) } }
        ]
      })
    }
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
            employeeId: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
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

export async function getLeaveApprovalStats(): Promise<LeaveApprovalStats> {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get current user with their role and managed departments
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      managedDepartments: {
        include: {
          department: true
        }
      }
    }
  })

  if (!currentUser) {
    redirect("/login")
  }

  // Check if user has approval permissions
  const canApprove = currentUser.role === UserRole.MANAGER || 
                    currentUser.role === UserRole.HR || 
                    currentUser.role === UserRole.ADMIN ||
                    currentUser.managedDepartments.length > 0

  if (!canApprove) {
    throw new Error("You don't have permission to view approval statistics")
  }

  // Build where clause for stats based on user role
  let baseWhere: Record<string, unknown> = {}

  if (currentUser.role === UserRole.HR || currentUser.role === UserRole.ADMIN) {
    // HR and ADMIN can see all requests stats
    baseWhere = {}
  } else {
    // MANAGER can only see stats from their direct reports and department members
    const managedDepartmentIds = currentUser.managedDepartments.map(md => md.departmentId)
    
    baseWhere = {
      OR: [
        // Direct reports
        {
          user: {
            approverId: currentUser.id
          }
        },
        // Department members (if they manage any departments)
        ...(managedDepartmentIds.length > 0 ? [{
          user: {
            deptId: { in: managedDepartmentIds }
          }
        }] : [])
      ]
    }
  }

  const [totalRequests, approvedRequests, pendingRequests, rejectedRequests] = await Promise.all([
    prisma.leaveRequest.count({
      where: baseWhere
    }),
    prisma.leaveRequest.count({
      where: {
        ...baseWhere,
        status: RequestStatus.APPROVED 
      }
    }),
    prisma.leaveRequest.count({
      where: {
        ...baseWhere,
        status: { in: [RequestStatus.PENDING_MANAGER, RequestStatus.PENDING_HR] }
      }
    }),
    prisma.leaveRequest.count({
      where: {
        ...baseWhere,
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

export async function getEmployeesForApproval() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get current user with their role and managed departments
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      managedDepartments: {
        include: {
          department: true
        }
      }
    }
  })

  if (!currentUser) {
    redirect("/login")
  }

  // Check if user has approval permissions
  const canApprove = currentUser.role === UserRole.MANAGER || 
                    currentUser.role === UserRole.HR || 
                    currentUser.role === UserRole.ADMIN ||
                    currentUser.managedDepartments.length > 0

  if (!canApprove) {
    throw new Error("You don't have permission to view employees")
  }

  let where: Record<string, unknown> = {}

  if (currentUser.role === UserRole.HR || currentUser.role === UserRole.ADMIN) {
    // HR and ADMIN can see all employees
    where = {}
  } else {
    // MANAGER can only see their direct reports and department members
    const managedDepartmentIds = currentUser.managedDepartments.map(md => md.departmentId)
    
    where = {
      OR: [
        // Direct reports
        { approverId: currentUser.id },
        // Department members (if they manage any departments)
        ...(managedDepartmentIds.length > 0 ? [{
          deptId: { in: managedDepartmentIds }
        }] : [])
      ]
    }
  }

  return await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      employeeId: true,
      department: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export async function getDepartmentsForApproval() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get current user with their role and managed departments
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      managedDepartments: {
        include: {
          department: true
        }
      }
    }
  })

  if (!currentUser) {
    redirect("/login")
  }

  // Check if user has approval permissions
  const canApprove = currentUser.role === UserRole.MANAGER || 
                    currentUser.role === UserRole.HR || 
                    currentUser.role === UserRole.ADMIN ||
                    currentUser.managedDepartments.length > 0

  if (!canApprove) {
    throw new Error("You don't have permission to view departments")
  }

  let where: Record<string, unknown> = {}

  if (currentUser.role === UserRole.HR || currentUser.role === UserRole.ADMIN) {
    // HR and ADMIN can see all departments
    where = {}
  } else {
    // MANAGER can only see their managed departments
    const managedDepartmentIds = currentUser.managedDepartments.map(md => md.departmentId)
    where = {
      id: { in: managedDepartmentIds }
    }
  }

  return await prisma.department.findMany({
    where,
    select: {
      id: true,
      name: true
    },
    orderBy: { name: 'asc' }
  })
}

export async function approveLeaveRequest(requestId: string, comments?: string): Promise<void> {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      managedDepartments: {
        include: {
          department: true
        }
      }
    }
  })

  if (!currentUser) {
    throw new Error("User not found")
  }

  // Get the leave request with user details
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        include: {
          department: true
        }
      }
    }
  })

  if (!leaveRequest) {
    throw new Error("Leave request not found")
  }

  // Check if user has permission to approve this request
  const canApprove = currentUser.role === UserRole.HR || 
                    currentUser.role === UserRole.ADMIN ||
                    leaveRequest.user.approverId === currentUser.id ||
                    currentUser.managedDepartments.some(md => 
                      md.departmentId === leaveRequest.user.deptId
                    )

  if (!canApprove) {
    throw new Error("You don't have permission to approve this request")
  }

  // Determine the next status and update fields
  if (currentUser.role === UserRole.HR || currentUser.role === UserRole.ADMIN) {
    // HR can give final approval
    await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.APPROVED,
        hrActionBy: currentUser.id,
        hrActionAt: new Date(),
        hrComments: comments
      }
    })
  } else {
    // Manager approval - move to HR pending
    await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.PENDING_HR,
        managerActionBy: currentUser.id,
        managerActionAt: new Date(),
        managerComments: comments
      }
    })
  }
}

export async function rejectLeaveRequest(requestId: string, comments: string): Promise<void> {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      managedDepartments: {
        include: {
          department: true
        }
      }
    }
  })

  if (!currentUser) {
    throw new Error("User not found")
  }

  // Get the leave request with user details
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        include: {
          department: true
        }
      }
    }
  })

  if (!leaveRequest) {
    throw new Error("Leave request not found")
  }

  // Check if user has permission to reject this request
  const canReject = currentUser.role === UserRole.HR || 
                   currentUser.role === UserRole.ADMIN ||
                   leaveRequest.user.approverId === currentUser.id ||
                   currentUser.managedDepartments.some(md => 
                     md.departmentId === leaveRequest.user.deptId
                   )

  if (!canReject) {
    throw new Error("You don't have permission to reject this request")
  }

  // Update the request with rejection
  if (currentUser.role === UserRole.HR || currentUser.role === UserRole.ADMIN) {
    await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        hrActionBy: currentUser.id,
        hrActionAt: new Date(),
        hrComments: comments
      }
    })
  } else {
    await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        managerActionBy: currentUser.id,
        managerActionAt: new Date(),
        managerComments: comments
      }
    })
  }
}