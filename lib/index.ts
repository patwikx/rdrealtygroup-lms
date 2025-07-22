export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string; // Optional: for user avatars
  employeeId: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'USER';
  deptId: string | null;
  department?: { id: string; name: string } | null;
  createdAt: Date;
}


import { UserRole, EmployeeClassification } from "@prisma/client"

export interface AvailableManager {
  id: string
  name: string
  employeeId: string
  email: string
  role: UserRole
}

export interface DepartmentWithManagers {
  id: string
  name: string
  managers: AvailableManager[]
  members: {
    id: string
    name: string
    employeeId: string
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface EmployeeWithDepartment {
  id: string
  employeeId: string
  email: string
  password: string
  name: string
  role: UserRole
  classification: EmployeeClassification | null
  deptId: string | null
  approverId: string | null
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

export interface LeaveTypeData {
  id: string
  name: string
  defaultAllocatedDays: number
  createdAt: Date
  updatedAt: Date
}

export interface EmployeeLeaveBalance {
  id: string
  leaveType: {
    id: string
    name: string
  }
  allocatedDays: number
  usedDays: number
  year: number
  employee: {
    id: string
    name: string
    employeeId: string
    email: string
    department: {
      id: string
      name: string
    } | null
  }
}

export interface LeaveBalancesSummary {
  totalEmployees: number
  totalAllocated: number
  totalUsed: number
  byType: Record<string, { allocated: number; used: number; remaining: number }>
}