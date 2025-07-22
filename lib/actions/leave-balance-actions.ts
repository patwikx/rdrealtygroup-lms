"use server"

import { PrismaClient, type UserRole, type LeaveType as LeaveTypeModel } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { AvailableManager, DepartmentWithManagers, EmployeeLeaveBalance, EmployeeWithDepartment, LeaveBalancesSummary } from "../types"

const prisma = new PrismaClient()

// User Management Actions
export async function getCurrentUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                name: "desc"
            }
        })
        return users;
    } catch (error) {
        console.error("Error fetching current users:", error)
        throw new Error("Failed to fetch users")
    }
}

// Department Management Actions
export async function getDepartmentsWithManagers(): Promise<DepartmentWithManagers[]> {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        managers: {
          select: {
            manager: {
              select: {
                id: true,
                name: true,
                employeeId: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      managers: dept.managers.map((dm) => dm.manager),
      members: dept.members,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
    }))
  } catch (error) {
    console.error("Error fetching departments:", error)
    throw new Error("Failed to fetch departments")
  }
}

export async function getAvailableManagers(): Promise<AvailableManager[]> {
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: {
          in: ["MANAGER", "HR", "ADMIN"],
        },
      },
      select: {
        id: true,
        name: true,
        employeeId: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return managers
  } catch (error) {
    console.error("Error fetching available managers:", error)
    throw new Error("Failed to fetch available managers")
  }
}

export async function createDepartment(name: string) {
  try {
    const existingDept = await prisma.department.findUnique({
      where: { name },
    })

    if (existingDept) {
      return { success: false, error: "Department with this name already exists" }
    }

    await prisma.department.create({
      data: { name },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error creating department:", error)
    return { success: false, error: "Failed to create department" }
  }
}

export async function updateDepartment(departmentId: string, name: string) {
  try {
    const existingDept = await prisma.department.findFirst({
      where: {
        name,
        id: { not: departmentId },
      },
    })

    if (existingDept) {
      return { success: false, error: "Department with this name already exists" }
    }

    await prisma.department.update({
      where: { id: departmentId },
      data: { name },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating department:", error)
    return { success: false, error: "Failed to update department" }
  }
}

export async function deleteDepartment(departmentId: string) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { members: true },
    })

    if (!department) {
      return { success: false, error: "Department not found" }
    }

    if (department.members.length > 0) {
      return { success: false, error: "Cannot delete department with members" }
    }

    await prisma.department.delete({
      where: { id: departmentId },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error deleting department:", error)
    return { success: false, error: "Failed to delete department" }
  }
}

export async function addManagerToDepartment(departmentId: string, managerId: string) {
  try {
    await prisma.departmentManager.create({
      data: {
        departmentId: departmentId,
        managerId: managerId,
      },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error adding manager to department:", error)
    return { success: false, error: "Failed to add manager to department" }
  }
}

export async function removeManagerFromDepartment(departmentId: string, managerId: string) {
  try {
    await prisma.departmentManager.delete({
      where: {
        departmentId_managerId: {
          departmentId: departmentId,
          managerId: managerId,
        },
      },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error removing manager from department:", error)
    return { success: false, error: "Failed to remove manager from department" }
  }
}

// Employee Management Actions
export async function getEmployeesWithDepartments(): Promise<EmployeeWithDepartment[]> {
  try {
    const employees = await prisma.user.findMany({
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return employees
  } catch (error) {
    console.error("Error fetching employees:", error)
    throw new Error("Failed to fetch employees")
  }
}

export async function createEmployee(data: {
  name: string
  email: string
  employeeId: string
  role: UserRole
  departmentId?: string
}) {
  try {
    const existingEmployee = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { employeeId: data.employeeId }],
      },
    })

    if (existingEmployee) {
      return { success: false, error: "Employee with this email or ID already exists" }
    }

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        employeeId: data.employeeId,
        role: data.role,
        password: "temp_password", // Should be handled properly in real app
        deptId: data.departmentId || null,
      },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error creating employee:", error)
    return { success: false, error: "Failed to create employee" }
  }
}

export async function updateEmployee(
  employeeId: string,
  data: Partial<{
    name: string
    email: string
    employeeId: string
    role: UserRole
    departmentId: string | null
  }>,
) {
  try {
    const { departmentId, ...restOfData } = data

    await prisma.user.update({
      where: { id: employeeId },
      data: {
        ...restOfData,
        deptId: departmentId,
      },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating employee:", error)
    return { success: false, error: "Failed to update employee" }
  }
}

export async function deleteEmployee(employeeId: string) {
  try {
    await prisma.user.delete({
      where: { id: employeeId },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error deleting employee:", error)
    return { success: false, error: "Failed to delete employee" }
  }
}

// Leave Balance Management Actions
export async function getLeaveBalancesSummary(year: number): Promise<LeaveBalancesSummary> {
  try {
    const leaveTypes = await prisma.leaveType.findMany()
    const balances = await prisma.leaveBalance.findMany({
      where: { year },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        leaveType: true, // Include the leave type details
      },
    })

    const totalEmployees = new Set(balances.map((b) => b.userId)).size
    const totalAllocated = balances.reduce((sum, b) => sum + b.allocatedDays, 0)
    const totalUsed = balances.reduce((sum, b) => sum + b.usedDays, 0)

    const byType: Record<string, { allocated: number; used: number; remaining: number }> = {}
    
    leaveTypes.forEach((lt) => {
      byType[lt.name] = { allocated: 0, used: 0, remaining: 0 }
    })

    balances.forEach((balance) => {
      if (byType[balance.leaveType.name]) {
        byType[balance.leaveType.name].allocated += balance.allocatedDays
        byType[balance.leaveType.name].used += balance.usedDays
        byType[balance.leaveType.name].remaining += balance.allocatedDays - balance.usedDays
      }
    })

    return {
      totalEmployees,
      totalAllocated,
      totalUsed,
      byType,
    }
  } catch (error) {
    console.error("Error fetching leave balances summary:", error)
    throw new Error("Failed to fetch leave balances summary")
  }
}

export async function getEmployeeLeaveBalances(year: number): Promise<EmployeeLeaveBalance[]> {
  try {
    const balances = await prisma.leaveBalance.findMany({
      where: { year },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        leaveType: true,
      },
      orderBy: [{ user: { name: 'asc' } }, { leaveType: { name: 'asc' } }],
    })

    // --- FIX ---: Map the Prisma result to the expected EmployeeLeaveBalance[] type.
    // This renames the `user` property to `employee` to match the type definition.
    return balances.map((balance) => {
        const { user, ...restOfBalance } = balance;
        return {
            ...restOfBalance,
            employee: user
        };
    });
  } catch (error) {
    console.error("Error fetching employee leave balances:", error)
    throw new Error("Failed to fetch employee leave balances")
  }
}

export async function updateEmployeeLeaveBalance(balanceId: string, allocatedDays: number, usedDays: number) {
  try {
    await prisma.leaveBalance.update({
      where: { id: balanceId },
      data: {
        allocatedDays,
        usedDays,
      },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating leave balance:", error)
    return { success: false, error: "Failed to update leave balance" }
  }
}

export async function renewAllLeaveBalances(newYear: number) {
  try {
    const previousYear = newYear - 1

    const users = await prisma.user.findMany({ select: { id: true } })
    const leaveTypes = await prisma.leaveType.findMany()
    const previousBalances = await prisma.leaveBalance.findMany({
      where: { year: previousYear },
    })

    let renewedCount = 0
    let totalRollover = 0

    await prisma.$transaction(async (tx) => {
      for (const user of users) {
        for (const leaveType of leaveTypes) {
          const previousBalance = previousBalances.find(
            (b) => b.userId === user.id && b.leaveTypeId === leaveType.id,
          )

          const rolloverDays = previousBalance ? Math.max(0, previousBalance.allocatedDays - previousBalance.usedDays) : 0
          const finalRollover = leaveType.name === 'VACATION' ? rolloverDays : 0
          totalRollover += finalRollover

          const newAllocation = leaveType.defaultAllocatedDays + finalRollover

          await tx.leaveBalance.upsert({
            where: {
              userId_leaveTypeId_year: {
                userId: user.id,
                leaveTypeId: leaveType.id,
                year: newYear,
              },
            },
            update: {
              allocatedDays: newAllocation,
              usedDays: 0,
            },
            create: {
              userId: user.id,
              leaveTypeId: leaveType.id,
              year: newYear,
              allocatedDays: newAllocation,
              usedDays: 0,
            },
          })
        }
        renewedCount++
      }
    })

    revalidatePath("/settings")
    return {
      success: true,
      data: {
        renewed: renewedCount,
        rollover: totalRollover,
      },
    }
  } catch (error) {
    console.error("Error renewing leave balances:", error)
    return { success: false, error: "Failed to renew leave balances" }
  }
}

export async function bulkUpdateLeaveBalances(
  updates: Array<{
    balanceId: string
    allocatedDays: number
    usedDays: number
  }>,
) {
  try {
    await prisma.$transaction(
      updates.map((update) =>
        prisma.leaveBalance.update({
          where: { id: update.balanceId },
          data: {
            allocatedDays: update.allocatedDays,
            usedDays: update.usedDays,
          },
        }),
      ),
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error bulk updating leave balances:", error)
    return { success: false, error: "Failed to bulk update leave balances" }
  }
}
