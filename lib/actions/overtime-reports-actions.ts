"use server"

import { PrismaClient, type Prisma } from "@prisma/client"
import type {
  OvertimeReportFilters,
  OvertimeReportData,
  OvertimeFilterOptions,
  OvertimeReportItem,
} from "@/lib/types/overtime-reports-types"

const prisma = new PrismaClient()

export async function getOvertimeReports(
  filters: OvertimeReportFilters,
  page = 1,
  limit = 50,
): Promise<OvertimeReportData> {
  const offset = (page - 1) * limit

  // Build where clause based on filters with proper Prisma types
  const whereClause: Prisma.OvertimeRequestWhereInput = {}

  if (filters.startDate || filters.endDate) {
    whereClause.OR = [
      {
        startTime: {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate && { lte: new Date(filters.endDate + "T23:59:59.999Z") }),
        },
      },
      {
        endTime: {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate && { lte: new Date(filters.endDate + "T23:59:59.999Z") }),
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

  if (filters.statuses?.length) {
    whereClause.status = { in: filters.statuses }
  }

  if (filters.employeeIds?.length) {
    whereClause.userId = { in: filters.employeeIds }
  }

  // Get total count
  const totalCount = await prisma.overtimeRequest.count({ where: whereClause })

  // Get paginated results
  const overtimeRequests = await prisma.overtimeRequest.findMany({
    where: whereClause,
    include: {
      user: {
        include: {
          department: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
  })

  // Transform data
  const items: OvertimeReportItem[] = overtimeRequests.map((request) => {
    const startTime = new Date(request.startTime)
    const endTime = new Date(request.endTime)
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) // Convert to hours

    return {
      id: request.id,
      employeeId: request.user.employeeId,
      employeeName: request.user.name,
      email: request.user.email,
      department: request.user.department?.name || null,
      classification: request.user.classification,
      startTime: request.startTime.toISOString(),
      endTime: request.endTime.toISOString(),
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      reason: request.reason,
      status: request.status,
      managerActionBy: request.managerActionBy,
      managerActionAt: request.managerActionAt?.toISOString() || null,
      managerComments: request.managerComments,
      hrActionBy: request.hrActionBy,
      hrActionAt: request.hrActionAt?.toISOString() || null,
      hrComments: request.hrComments,
      createdAt: request.createdAt.toISOString(),
    }
  })

  // Calculate summary
  const summary = {
    totalRequests: totalCount,
    pendingRequests: items.filter((item) => item.status === "PENDING_MANAGER" || item.status === "PENDING_HR").length,
    approvedRequests: items.filter((item) => item.status === "APPROVED").length,
    rejectedRequests: items.filter((item) => item.status === "REJECTED").length,
    totalHoursRequested: items.reduce((sum, item) => sum + item.duration, 0),
    totalHoursApproved: items
      .filter((item) => item.status === "APPROVED")
      .reduce((sum, item) => sum + item.duration, 0),
  }

  return { items, summary, totalCount }
}

export async function getOvertimeFilterOptions(): Promise<OvertimeFilterOptions> {
  const [departments, employees] = await Promise.all([
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, employeeId: true },
      orderBy: { name: "asc" },
    }),
  ])

  return { departments, employees }
}

export async function exportOvertimeReportsCSV(filters: OvertimeReportFilters): Promise<string> {
  const { items } = await getOvertimeReports(filters, 1, 10000) // Get all records for export

  const headers = [
    "Employee ID",
    "Employee Name",
    "Email",
    "Department",
    "Classification",
    "Start Time",
    "End Time",
    "Duration (Hours)",
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
        new Date(item.startTime).toLocaleString(),
        new Date(item.endTime).toLocaleString(),
        item.duration,
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
