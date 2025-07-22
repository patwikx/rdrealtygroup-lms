"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const prisma = new PrismaClient()

// Validation schema for creating leave types
const createLeaveTypeSchema = z.object({
  name: z.string()
    .min(2, "Leave type name must be at least 2 characters")
    .max(50, "Leave type name must not exceed 50 characters")
    .regex(/^[A-Z_]+$/, "Leave type name must be uppercase letters and underscores only"),
  defaultAllocatedDays: z.number()
    .min(0, "Default allocated days must be 0 or greater")
    .max(365, "Default allocated days cannot exceed 365"),
})

const updateLeaveTypeSchema = z.object({
  id: z.string(),
  name: z.string()
    .min(2, "Leave type name must be at least 2 characters")
    .max(50, "Leave type name must not exceed 50 characters")
    .regex(/^[A-Z_]+$/, "Leave type name must be uppercase letters and underscores only"),
  defaultAllocatedDays: z.number()
    .min(0, "Default allocated days must be 0 or greater")
    .max(365, "Default allocated days cannot exceed 365"),
})

export type LeaveType = {
  id: string
  name: string
  defaultAllocatedDays: number
  createdAt: Date
  updatedAt: Date
  _count?: {
    leaveRequests: number
    leaveBalances: number
  }
}

export async function getLeaveTypes(): Promise<LeaveType[]> {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      include: {
        _count: {
          select: {
            leaveRequests: true,
            leaveBalances: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })
    return leaveTypes
  } catch (error) {
    console.error("Failed to fetch leave types:", error)
    throw new Error("Failed to fetch leave types")
  }
}

export async function createLeaveType(data: z.infer<typeof createLeaveTypeSchema>) {
  try {
    const validatedData = createLeaveTypeSchema.parse(data)
    
    // Check if leave type name already exists
    const existingLeaveType = await prisma.leaveType.findUnique({
      where: {
        name: validatedData.name,
      },
    })

    if (existingLeaveType) {
      throw new Error("Leave type with this name already exists")
    }

    // Create leave type
    await prisma.leaveType.create({
      data: {
        name: validatedData.name,
        defaultAllocatedDays: validatedData.defaultAllocatedDays,
      },
    })

    revalidatePath("/leave-types")
    return { success: true, message: "Leave type created successfully" }
  } catch (error) {
    console.error("Create leave type error:", error)
    if (error instanceof z.ZodError) {
      return { success: false, message: error.message }
    }
    if (error instanceof Error) {
      return { success: false, message: error.message }
    }
    return { success: false, message: "Failed to create leave type" }
  }
}

export async function updateLeaveType(data: z.infer<typeof updateLeaveTypeSchema>) {
  try {
    const validatedData = updateLeaveTypeSchema.parse(data)
    
    // Check if leave type name already exists for other leave types
    const existingLeaveType = await prisma.leaveType.findFirst({
      where: {
        AND: [
          { id: { not: validatedData.id } },
          { name: validatedData.name },
        ],
      },
    })

    if (existingLeaveType) {
      throw new Error("Leave type with this name already exists")
    }

    // Update leave type
    await prisma.leaveType.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        defaultAllocatedDays: validatedData.defaultAllocatedDays,
      },
    })

    revalidatePath("/leave-types")
    return { success: true, message: "Leave type updated successfully" }
  } catch (error) {
    console.error("Update leave type error:", error)
    if (error instanceof z.ZodError) {
      return { success: false, message: error.message }
    }
    if (error instanceof Error) {
      return { success: false, message: error.message }
    }
    return { success: false, message: "Failed to update leave type" }
  }
}

export async function deleteLeaveType(id: string) {
  try {
    // Check if leave type is being used
    const leaveType = await prisma.leaveType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            leaveRequests: true,
            leaveBalances: true,
          },
        },
      },
    })

    if (!leaveType) {
      throw new Error("Leave type not found")
    }

    if (leaveType._count.leaveRequests > 0 || leaveType._count.leaveBalances > 0) {
      throw new Error("Cannot delete leave type that is being used in requests or balances")
    }

    await prisma.leaveType.delete({
      where: { id },
    })

    revalidatePath("/leave-types")
    return { success: true, message: "Leave type deleted successfully" }
  } catch (error) {
    console.error("Delete leave type error:", error)
    if (error instanceof Error) {
      return { success: false, message: error.message }
    }
    return { success: false, message: "Failed to delete leave type" }
  }
}