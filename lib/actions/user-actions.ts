"use server"

import { PrismaClient, UserRole, EmployeeClassification } from "@prisma/client"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const prisma = new PrismaClient()

// Validation schemas
const registerUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().optional(),
  employeeId: z.string().min(1, "Employee ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(UserRole),
  deptId: z.string().optional(),
  approverId: z.string().optional(),
  classification: z.nativeEnum(EmployeeClassification).optional(),
})

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().optional(),
  employeeId: z.string().min(1, "Employee ID is required"),
  role: z.enum(UserRole),
  deptId: z.string().optional(),
  approverId: z.string().optional(),
  classification: z.nativeEnum(EmployeeClassification).optional(),
})

const changePasswordSchema = z.object({
  id: z.string(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
})

export type User = {
  id: string
  name: string
  email: string | null
  employeeId: string
  role: UserRole
  deptId: string | null
  approverId: string | null
  classification: EmployeeClassification | null
  department: {
    id: string
    name: string
  } | null
  approver: {
    id: string
    name: string
    employeeId: string
  } | null
  createdAt: Date
  updatedAt: Date
}

export type Department = {
  id: string
  name: string
}

export type Approver = {
  id: string
  name: string
  employeeId: string
  role: UserRole
}

export async function getUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        employeeId: {
          not: 'admin', // Exclude the user with ID 'admin'
        },
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return users
  } catch (error) {
    console.error("Failed to fetch users:", error)
    throw new Error("Failed to fetch users")
  }
}

export async function getDepartments(): Promise<Department[]> {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    })
    return departments
  } catch (error) {
    console.error("Failed to fetch departments:", error)
    throw new Error("Failed to fetch departments")
  }
}

export async function getApprovers(): Promise<Approver[]> {
  try {
    const approvers = await prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.MANAGER, UserRole.HR, UserRole.ADMIN],
        },
        NOT: {
          employeeId: 'admin'
        }
      },
      select: {
        id: true,
        name: true,
        employeeId: true,
        role: true,
      },
      orderBy: [
        {
          role: "asc",
        },
        {
          name: "asc",
        },
      ],
    })
    return approvers
  } catch (error) {
    console.error("Failed to fetch approvers:", error)
    throw new Error("Failed to fetch approvers")
  }
}

export async function registerUser(data: z.infer<typeof registerUserSchema>) {
  try {
    const validatedData = registerUserSchema.parse(data)
    
    // Check if email or employeeId already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: validatedData.employeeId },
        ],
      },
    })

    if (existingUser) {
      if (existingUser.employeeId === validatedData.employeeId) {
        throw new Error("Employee ID already exists")
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Get all leave types to create default balances
    const leaveTypes = await prisma.leaveType.findMany()
    const currentYear = new Date().getFullYear()

    // Create user and leave balances in a transaction
    await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email || undefined, // Do not set null for optional fields
          employeeId: validatedData.employeeId,
          password: hashedPassword,
          role: validatedData.role,
          deptId: validatedData.deptId || undefined, // Use undefined for optional fields
          approverId: validatedData.approverId || undefined,
          classification: validatedData.classification || undefined,
        },
      })

      // Create default leave balances for each leave type
      if (leaveTypes.length > 0) {
        await tx.leaveBalance.createMany({
          data: leaveTypes.map((leaveType) => ({
            userId: newUser.id,
            leaveTypeId: leaveType.id,
            year: currentYear,
            allocatedDays: leaveType.defaultAllocatedDays,
            usedDays: 0,
          })),
        })
      }
    })

    revalidatePath("/dashboard/user-management")
    return { success: true, message: "User registered successfully with default leave balances" }
  } catch (error) {
    console.error("Registration error:", error)
    if (error instanceof z.ZodError) {
      return { success: false, message: error.message }
    }
    if (error instanceof Error) {
      return { success: false, message: error.message }
    }
    return { success: false, message: "Failed to register user" }
  }
}

export async function updateUser(data: z.infer<typeof updateUserSchema>) {
  try {
    const validatedData = updateUserSchema.parse(data)
    
    // Check if email or employeeId already exists for other users
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: validatedData.id } },
          {
            OR: [
              { email: validatedData.email },
              { employeeId: validatedData.employeeId },
            ],
          },
        ],
      },
    })

    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        throw new Error("Email already exists")
      }
      if (existingUser.employeeId === validatedData.employeeId) {
        throw new Error("Employee ID already exists")
      }
    }

    // Prevent user from setting themselves as their own approver
    if (validatedData.approverId === validatedData.id) {
      throw new Error("User cannot be their own approver")
    }

    // Update user
    await prisma.user.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        employeeId: validatedData.employeeId,
        role: validatedData.role,
        deptId: validatedData.deptId || null,
        approverId: validatedData.approverId || null,
        classification: validatedData.classification || null,
      },
    })

    revalidatePath("/dashboard/user-management")
    return { success: true, message: "User updated successfully" }
  } catch (error) {
    console.error("Update error:", error)
    if (error instanceof z.ZodError) {
      return { success: false, message: error.message }
    }
    if (error instanceof Error) {
      return { success: false, message: error.message }
    }
    return { success: false, message: "Failed to update user" }
  }
}

export async function changePassword(data: z.infer<typeof changePasswordSchema>) {
  try {
    const validatedData = changePasswordSchema.parse(data)
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: validatedData.id },
      data: {
        password: hashedPassword,
      },
    })

    revalidatePath("/dashboard/user-management")
    return { success: true, message: "Password changed successfully" }
  } catch (error) {
    console.error("Password change error:", error)
    if (error instanceof z.ZodError) {
      return { success: false, message: error.message }
    }
    return { success: false, message: "Failed to change password" }
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id },
    })

    revalidatePath("/dashboard/user-management")
    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    console.error("Delete error:", error)
    return { success: false, message: "Failed to delete user" }
  }
}