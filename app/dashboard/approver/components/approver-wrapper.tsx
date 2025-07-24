import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
// --- MODIFIED ---: Imported more descriptive icons
import { ListChecks, Clock, Users, ShieldCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
// This assumes 'getPendingRequests' is your primary server action for this page.
import { getPendingRequests } from '@/lib/actions/requests-actions';
import { RequestsTable } from './approval-requests-table';

async function ApproverContent() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // This authorization logic is correct and requires no changes.
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      reports: { select: { id: true, name: true } },
      managedDepartments: {
        select: { department: { select: { id: true, name: true } } },
      },
    },
  });

  if (!currentUser || !['MANAGER', 'HR', 'ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // We assume `getPendingRequests` now correctly fetches data using the updated logic
  const { leaveRequests, overtimeRequests } = await getPendingRequests();

  const totalRequests = leaveRequests.length + overtimeRequests.length;
  const pendingManagerRequests = [...leaveRequests, ...overtimeRequests].filter(
    (req) => req.status === 'PENDING_MANAGER'
  ).length;
  const pendingHRRequests = [...leaveRequests, ...overtimeRequests].filter(
    (req) => req.status === 'PENDING_HR'
  ).length;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Approvals</h1>
          <p className="text-muted-foreground">
            Review and process pending leave and overtime requests.
          </p>
        </div>
      </div>

      {/* --- MODIFIED SECTION ---: Stats Cards are updated for clarity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Pending</p>
              <p className="text-2xl font-bold">{totalRequests}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ListChecks className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Manager Review</p>
              <p className="text-2xl font-bold">{pendingManagerRequests}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">HR Review</p>
              <p className="text-2xl font-bold">{pendingHRRequests}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ShieldCheck className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Overtime Pending</p>
              <p className="text-2xl font-bold">{overtimeRequests.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      {/* This component was already updated and will work correctly with the fetched data */}
      <RequestsTable
        leaveRequests={leaveRequests}
        overtimeRequests={overtimeRequests}
        currentUser={currentUser}
      />
    </div>
  );
}

// No changes are needed for the loading skeleton.
function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-10" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// No changes are needed for the wrapper component.
export default function ApproverPageWrapper() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ApproverContent />
    </Suspense>
  );
}