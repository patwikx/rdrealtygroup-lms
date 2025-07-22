// --- MODIFIED --- to align with the new Prisma Schema

export interface LeaveRequestWithDetails {
  id: string;
  userId: string;
  // The nested user object no longer contains the department
  user: {
    name: string;
    email: string;
    employeeId: string;
  };
  // leaveType is now an object from the related LeaveType model
  leaveType: {
    name: string;
  };
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'PENDING_MANAGER' | 'PENDING_HR' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  session: 'FULL_DAY' | 'MORNING' | 'AFTERNOON';
  managerActionBy: string | null;
  managerActionAt: Date | null;
  managerComments: string | null;
  hrActionBy: string | null;
  hrActionAt: Date | null;
  hrComments: string | null;
  createdAt: Date;
}

export interface OvertimeRequestWithUser {
  id: string;
  userId: string;
  // The nested user object no longer contains the department
  user: {
    name: string;
    email: string;
    employeeId: string;
  };
  startTime: Date;
  endTime: Date;
  reason: string;
  status: 'PENDING_MANAGER' | 'PENDING_HR' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  managerActionBy: string | null;
  managerActionAt: Date | null;
  managerComments: string | null;
  hrActionBy: string | null;
  hrActionAt: Date | null;
  hrComments: string | null;
  createdAt: Date;
}

export interface UserWithRole {
  id: string;
  name: string | null;
  email: string | null;
  role: 'USER' | 'MANAGER' | 'HR' | 'ADMIN';
  managedDepartments: {
    department: {
      id: string;
      name: string;
    };
  }[];
  // --- NEW ---: Added reports to reflect the direct approver relationship
  reports: {
    id: string;
    name: string;
  }[];
}

// No changes needed for this interface
export interface ApprovalAction {
  action: 'approve' | 'reject';
  comments: string;
  requestId: string;
  requestType: 'leave' | 'overtime';
}