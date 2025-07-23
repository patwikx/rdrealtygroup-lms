"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { UserProfile, UserStats, UpdateProfileData, ChangePasswordData } from "@/lib/types/account-profile"
import { RequestStatus } from "@prisma/client"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function getUserProfile(): Promise<UserProfile> {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      department: {
        select: {
          id: true,
          name: true
        }
      },
      approver: {
        select: {
          id: true,
          name: true,
          employeeId: true
        }
      }
    }
  })

  if (!user) {
    throw new Error("User not found")
  }

  return user
}

export async function getUserStats(): Promise<UserStats> {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const currentYear = new Date().getFullYear()

  // FIX: Destructure all 7 results from Promise.all into correctly named variables
  const [
    totalLeaveRequests,
    totalOvertimeRequests,
    pendingLeaveCount,
    pendingOvertimeCount,
    approvedLeaveCount,
    approvedOvertimeCount,
    leaveBalances // This will now correctly be an array of leave balances
  ] = await Promise.all([
    prisma.leaveRequest.count({
      where: { userId: session.user.id }
    }),
    prisma.overtimeRequest.count({
      where: { userId: session.user.id }
    }),
    prisma.leaveRequest.count({
      where: { 
        userId: session.user.id,
        status: { in: [RequestStatus.PENDING_MANAGER, RequestStatus.PENDING_HR] }
      }
    }),
    prisma.overtimeRequest.count({
      where: { 
        userId: session.user.id,
        status: { in: [RequestStatus.PENDING_MANAGER, RequestStatus.PENDING_HR] }
      }
    }),
    prisma.leaveRequest.count({
      where: { 
        userId: session.user.id,
        status: RequestStatus.APPROVED
      }
    }),
    prisma.overtimeRequest.count({
      where: { 
        userId: session.user.id,
        status: RequestStatus.APPROVED
      }
    }),
    prisma.leaveBalance.findMany({
      where: {
        userId: session.user.id,
        year: currentYear
      }
    })
  ])

  // FIX: Sum the separate counts to get the total pending and approved requests
  const pendingRequests = pendingLeaveCount + pendingOvertimeCount;
  const approvedRequests = approvedLeaveCount + approvedOvertimeCount;

  // This part will now work correctly because `leaveBalances` is an array
  const currentYearLeaveUsed = leaveBalances.reduce((sum, balance) => sum + balance.usedDays, 0)
  const currentYearLeaveAllocated = leaveBalances.reduce((sum, balance) => sum + balance.allocatedDays, 0)

  return {
    totalLeaveRequests,
    totalOvertimeRequests,
    pendingRequests,
    approvedRequests,
    currentYearLeaveUsed,
    currentYearLeaveAllocated
  }
}

export async function updateProfile(data: UpdateProfileData): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  try {
    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id: session.user.id }
      }
    })

    if (existingUser) {
      return { success: false, message: "Email is already taken by another user" }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        email: data.email
      }
    })

    revalidatePath("/account")
    return { success: true, message: "Profile updated successfully" }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, message: "Failed to update profile" }
  }
}

export async function changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true }
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return { success: false, message: "Current password is incorrect" }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(data.newPassword, 12)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedNewPassword }
    })

    return { success: true, message: "Password changed successfully" }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, message: "Failed to change password" }
  }
}

export async function getLeaveBalances() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const currentYear = new Date().getFullYear()

  return await prisma.leaveBalance.findMany({
    where: {
      userId: session.user.id,
      year: currentYear
    },
    include: {
      leaveType: true
    },
    orderBy: {
      leaveType: {
        name: 'asc'
      }
    }
  })
}