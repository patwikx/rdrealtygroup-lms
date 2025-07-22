/**
 * seed.ts
 *
 * This script seeds the database with initial data for development and testing purposes.
 * It is designed to work with the updated Prisma schema.
 *
 * To run this script:
 * 1. Make sure you have `ts-node` installed: `npm install -D ts-node`
 * 2. Add the following to your `package.json` under the "prisma" section:
 * "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
 * 3. Run the command: `npx prisma db seed`
 */
import { PrismaClient, EmployeeClassification, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean up existing data in the correct order to avoid constraint violations
  console.log('🧹 Clearing existing data...');
  await prisma.departmentManager.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.overtimeRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.leaveType.deleteMany();
  console.log('✅ Existing data cleared.');

  // 2. Create Leave Types
  // This replaces the enum and allows for dynamic configuration of leave days.
  console.log('📄 Creating leave types...');
  const vacationLeave = await prisma.leaveType.create({
    data: { name: 'VACATION', defaultAllocatedDays: 15 },
  });
  const sickLeave = await prisma.leaveType.create({
    data: { name: 'SICK', defaultAllocatedDays: 10 },
  });
  const mandatoryLeave = await prisma.leaveType.create({
    data: { name: 'MANDATORY', defaultAllocatedDays: 5 },
  });
  const unpaidLeave = await prisma.leaveType.create({
    data: { name: 'UNPAID', defaultAllocatedDays: 0 },
  });
  const maternityLeave = await prisma.leaveType.create({
    data: { name: 'MATERNITY', defaultAllocatedDays: 105 },
  });
  const paternityLeave = await prisma.leaveType.create({
    data: { name: 'PATERNITY', defaultAllocatedDays: 7 },
  });
  // --- NEW ---: Added missing leave types to match frontend component
  const emergencyLeave = await prisma.leaveType.create({
    data: { name: 'EMERGENCY', defaultAllocatedDays: 5 },
  });
  const bereavementLeave = await prisma.leaveType.create({
    data: { name: 'BEREAVEMENT', defaultAllocatedDays: 3 },
  });
  
  // --- MODIFIED ---: Updated array to include all leave types
  const allLeaveTypes = [
      vacationLeave, 
      sickLeave, 
      mandatoryLeave, 
      unpaidLeave, 
      maternityLeave, 
      paternityLeave,
      emergencyLeave,
      bereavementLeave
  ];
  console.log('✅ Leave types created.');

  // 3. Create Departments
  console.log('🏢 Creating departments...');
  const engineeringDept = await prisma.department.create({
    data: { name: 'Engineering' },
  });
  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources' },
  });
  const financeDept = await prisma.department.create({
    data: { name: 'Finance' },
  });
  console.log('✅ Departments created.');

  // 4. Create Users
  // We create users with different roles and assign them to managers/departments.
  console.log('👤 Creating users...');
  const hashedPassword = await hash('Password123!', 10);

  // Admin User (has all permissions)
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@company.com',
      password: hashedPassword,
      employeeId: 'ADMIN-001',
      role: UserRole.ADMIN,
      classification: EmployeeClassification.TWC,
    },
  });

  // HR User
  const hrUser = await prisma.user.create({
    data: {
      name: 'HR Specialist',
      email: 'hr@company.com',
      password: hashedPassword,
      employeeId: 'HR-001',
      role: UserRole.HR,
      classification: EmployeeClassification.RDHFSI,
      department: { connect: { id: hrDept.id } },
    },
  });

  // Manager User
  const managerUser = await prisma.user.create({
    data: {
      name: 'Engineering Manager',
      email: 'manager@company.com',
      password: hashedPassword,
      employeeId: 'MGR-001',
      role: UserRole.MANAGER,
      classification: EmployeeClassification.RDRDC,
      department: { connect: { id: engineeringDept.id } },
    },
  });

  // Regular Employees
  const employee1 = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@company.com',
      password: hashedPassword,
      employeeId: 'EMP-001',
      role: UserRole.USER,
      classification: EmployeeClassification.RDRDC,
      department: { connect: { id: engineeringDept.id } },
      // Assign a direct approver
      approver: { connect: { id: managerUser.id } },
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      name: 'Bob Williams',
      email: 'bob@company.com',
      password: hashedPassword,
      employeeId: 'EMP-002',
      role: UserRole.USER,
      classification: EmployeeClassification.TWC,
      department: { connect: { id: engineeringDept.id } },
      // Assign a direct approver
      approver: { connect: { id: managerUser.id } },
    },
  });
  
  const allUsers = [adminUser, hrUser, managerUser, employee1, employee2];
  console.log('✅ Users created.');

  // 5. Link Managers to Departments (for multi-department management if needed)
  console.log('🔗 Linking managers to departments...');
  await prisma.departmentManager.create({
    data: {
      departmentId: engineeringDept.id,
      managerId: managerUser.id,
    },
  });
  console.log('✅ Managers linked.');

  // 6. Create initial Leave Balances for the current year
  console.log('💰 Creating leave balances...');
  const currentYear = new Date().getFullYear();
  for (const user of allUsers) {
    for (const leaveType of allLeaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          userId: user.id,
          leaveTypeId: leaveType.id,
          year: currentYear,
          allocatedDays: leaveType.defaultAllocatedDays,
          usedDays: 0,
        },
      });
    }
  }
  console.log('✅ Leave balances created.');

  // 7. Create Sample Pending Requests for demonstration
  console.log('📝 Creating sample pending requests...');
  // A leave request pending manager approval
  await prisma.leaveRequest.create({
    data: {
      userId: employee1.id,
      leaveTypeId: vacationLeave.id,
      startDate: new Date('2025-08-18'),
      endDate: new Date('2025-08-20'),
      reason: 'Family vacation to Palawan.',
      status: 'PENDING_MANAGER',
      session: 'FULL_DAY',
    },
  });

  // An overtime request pending manager approval
  await prisma.overtimeRequest.create({
    data: {
      userId: employee2.id,
      startTime: new Date('2025-07-25T18:00:00'),
      endTime: new Date('2025-07-25T21:00:00'),
      reason: 'Need to finish the critical feature deployment for Project Phoenix.',
      status: 'PENDING_MANAGER',
    },
  });

  // A leave request that has been approved by a manager and is now pending HR
  await prisma.leaveRequest.create({
    data: {
      userId: employee2.id,
      leaveTypeId: sickLeave.id,
      startDate: new Date('2025-08-04'),
      endDate: new Date('2025-08-04'),
      reason: 'Fever and headache, unable to work.',
      status: 'PENDING_HR',
      session: 'FULL_DAY',
      managerActionBy: managerUser.id,
      managerActionAt: new Date(),
      managerComments: 'Approved. Hope you feel better soon.',
    },
  });
  console.log('✅ Sample requests created.');

  console.log('🎉 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ An error occurred while seeding the database:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Ensure Prisma Client is disconnected
    await prisma.$disconnect();
  });
