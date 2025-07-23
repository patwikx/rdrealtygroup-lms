"use server"

import { PrismaClient, type Prisma } from "@prisma/client"
import type { LeaveReportFilters, ReportData, FilterOptions, LeaveReportItem } from "@/lib/types/reports"

const prisma = new PrismaClient()

export async function getLeaveReports(filters: LeaveReportFilters, page = 1, limit = 50): Promise<ReportData> {
  const offset = (page - 1) * limit

  // Build where clause based on filters with proper Prisma types
  const whereClause: Prisma.LeaveRequestWhereInput = {}

  if (filters.startDate || filters.endDate) {
    whereClause.OR = [
      {
        startDate: {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate && { lte: new Date(filters.endDate) }),
        },
      },
      {
        endDate: {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate && { lte: new Date(filters.endDate) }),
        },
      },
    ]
  }

  // Build user conditions separately
  const userConditions: Prisma.UserWhereInput = {}

  if (filters.departmentIds?.length) {
    userConditions.deptId = { in: filters.departmentIds }
  }

  if (filters.classifications?.length) {
    userConditions.classification = { in: filters.classifications }
  }

  // Only add user condition if we have any user filters
  if (Object.keys(userConditions).length > 0) {
    whereClause.user = userConditions
  }

  if (filters.leaveTypeIds?.length) {
    whereClause.leaveTypeId = { in: filters.leaveTypeIds }
  }

  if (filters.statuses?.length) {
    whereClause.status = { in: filters.statuses }
  }

  if (filters.employeeIds?.length) {
    whereClause.userId = { in: filters.employeeIds }
  }

  if (filters.sessions?.length) {
    whereClause.session = { in: filters.sessions }
  }

  // Get total count
  const totalCount = await prisma.leaveRequest.count({ where: whereClause })

  // Get paginated results
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: whereClause,
    include: {
      user: {
        include: {
          department: true,
        },
      },
      leaveType: true,
    },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
  })

  // Transform data
  const items: LeaveReportItem[] = leaveRequests.map((request) => {
    const startDate = new Date(request.startDate)
    const endDate = new Date(request.endDate)
    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const adjustedDayCount = request.session === "FULL_DAY" ? dayCount : dayCount * 0.5

    return {
      id: request.id,
      employeeId: request.user.employeeId,
      employeeName: request.user.name,
      email: request.user.email,
      department: request.user.department?.name || null,
      classification: request.user.classification,
      leaveType: request.leaveType.name,
      startDate: request.startDate.toISOString().split("T")[0],
      endDate: request.endDate.toISOString().split("T")[0],
      session: request.session,
      reason: request.reason,
      status: request.status,
      managerActionBy: request.managerActionBy,
      managerActionAt: request.managerActionAt?.toISOString() || null,
      managerComments: request.managerComments,
      hrActionBy: request.hrActionBy,
      hrActionAt: request.hrActionAt?.toISOString() || null,
      hrComments: request.hrComments,
      createdAt: request.createdAt.toISOString(),
      dayCount: adjustedDayCount,
    }
  })

  // Calculate summary
  const summary = {
    totalRequests: totalCount,
    pendingRequests: items.filter((item) => item.status === "PENDING_MANAGER" || item.status === "PENDING_HR").length,
    approvedRequests: items.filter((item) => item.status === "APPROVED").length,
    rejectedRequests: items.filter((item) => item.status === "REJECTED").length,
    totalDaysRequested: items.reduce((sum, item) => sum + item.dayCount, 0),
    totalDaysApproved: items.filter((item) => item.status === "APPROVED").reduce((sum, item) => sum + item.dayCount, 0),
  }

  return { items, summary, totalCount }
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const [departments, leaveTypes, employees] = await Promise.all([
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.leaveType.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, employeeId: true },
      orderBy: { name: "asc" },
    }),
  ])

  return { departments, leaveTypes, employees }
}

export async function exportLeaveReportsCSV(filters: LeaveReportFilters): Promise<string> {
  const { items } = await getLeaveReports(filters, 1, 10000) // Get all records for export

  const headers = [
    "Employee ID",
    "Employee Name",
    "Email",
    "Department",
    "Classification",
    "Leave Type",
    "Start Date",
    "End Date",
    "Session",
    "Days",
    "Reason",
    "Status",
    "Manager Action By",
    "Manager Action Date",
    "Manager Comments",
    "HR Action By",
    "HR Action Date",
    "HR Comments",
    "Created Date",
  ]

  const csvContent = [
    headers.join(","),
    ...items.map((item) =>
      [
        item.employeeId,
        `"${item.employeeName}"`,
        item.email,
        `"${item.department || ""}"`,
        item.classification || "",
        `"${item.leaveType}"`,
        item.startDate,
        item.endDate,
        item.session,
        item.dayCount,
        `"${item.reason}"`,
        item.status,
        `"${item.managerActionBy || ""}"`,
        item.managerActionAt ? new Date(item.managerActionAt).toLocaleDateString() : "",
        `"${item.managerComments || ""}"`,
        `"${item.hrActionBy || ""}"`,
        item.hrActionAt ? new Date(item.hrActionAt).toLocaleDateString() : "",
        `"${item.hrComments || ""}"`,
        new Date(item.createdAt).toLocaleDateString(),
      ].join(","),
    ),
  ].join("\n")

  return csvContent
}
