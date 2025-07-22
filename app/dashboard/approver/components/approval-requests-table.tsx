'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Eye, ShieldCheck, Users } from 'lucide-react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { ApprovalDialog } from './approval-dialog';
// --- MODIFIED ---: Updated to use the correct LeaveRequestWithDetails type
import type {
  LeaveRequestWithDetails,
  OvertimeRequestWithUser,
  UserWithRole,
} from '@/lib/types/requests';

interface RequestsTableProps {
  leaveRequests: LeaveRequestWithDetails[]; // --- MODIFIED ---
  overtimeRequests: OvertimeRequestWithUser[];
  currentUser: UserWithRole;
}

export function RequestsTable({
  leaveRequests,
  overtimeRequests,
  currentUser,
}: RequestsTableProps) {
  // --- MODIFIED ---: Updated the state to use the correct type
  const [selectedRequest, setSelectedRequest] = useState<
    LeaveRequestWithDetails | OvertimeRequestWithUser | null
  >(null);
  const [selectedRequestType, setSelectedRequestType] = useState<
    'leave' | 'overtime'
  >('leave');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewRequest = (
    // --- MODIFIED ---: Updated the function signature
    request: LeaveRequestWithDetails | OvertimeRequestWithUser,
    type: 'leave' | 'overtime'
  ) => {
    setSelectedRequest(request);
    setSelectedRequestType(type);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      PENDING_MANAGER: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      PENDING_HR: 'bg-blue-100 text-blue-800 border-blue-300',
      APPROVED: 'bg-green-100 text-green-800 border-green-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
    };

    return (
      <Badge
        variant="outline"
        className={variants[status as keyof typeof variants]}
      >
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const calculateLeaveDuration = (
    startDate: Date,
    endDate: Date,
    session: string
  ) => {
    if (session !== 'FULL_DAY') {
      return `${session === 'MORNING' ? 'Morning' : 'Afternoon'} (0.5 days)`;
    }
    const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  const calculateOvertimeDuration = (startTime: Date, endTime: Date) => {
    const hours = differenceInHours(new Date(endTime), new Date(startTime));
    if (hours < 1) {
        const minutes = Math.round(differenceInHours(new Date(endTime), new Date(startTime)) * 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Leave Requests */}
      {leaveRequests.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>Leave Requests</CardTitle>
              <Badge variant="secondary">{leaveRequests.length}</Badge>
            </div>

            {/* --- MODIFIED ---: Refined role display logic */}
            {currentUser.role === 'MANAGER' && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Manager Review
              </div>
            )}
            {currentUser.role === 'HR' && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                HR Review
              </div>
            )}
            {currentUser.role === 'ADMIN' && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Admin View
              </div>
            )}
          </CardHeader>

          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    {/* --- MODIFIED ---: Removed Department column */}
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.user.employeeId}
                          </div>
                        </div>
                      </TableCell>
                      {/* --- MODIFIED ---: Removed Department cell */}
                      <TableCell>
                        <Badge variant="outline">
                          {/* --- MODIFIED ---: Correctly accessing the name property */}
                          {request.leaveType.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {calculateLeaveDuration(
                          request.startDate,
                          request.endDate,
                          request.session
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {format(new Date(request.startDate), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-muted-foreground">
                            to {format(new Date(request.endDate), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request, 'leave')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overtime Requests */}
      {overtimeRequests.length > 0 && (
        <Card>
           <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Overtime Requests</CardTitle>
              <Badge variant="secondary">{overtimeRequests.length}</Badge>
            </div>
             {/* --- MODIFIED ---: Refined role display logic */}
             {currentUser.role === 'MANAGER' && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Manager Review
              </div>
            )}
            {currentUser.role === 'HR' && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                HR Review
              </div>
            )}
            {currentUser.role === 'ADMIN' && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Admin View
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                     {/* --- MODIFIED ---: Removed Department column */}
                    <TableHead>Duration</TableHead>
                    <TableHead>Time Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overtimeRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.user.employeeId}
                          </div>
                        </div>
                      </TableCell>
                      {/* --- MODIFIED ---: Removed Department cell */}
                      <TableCell>
                        <Badge variant="outline">
                          {calculateOvertimeDuration(
                            request.startTime,
                            request.endTime
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {format(new Date(request.startTime), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-muted-foreground">
                            {format(new Date(request.startTime), 'h:mm a')} -{' '}
                            {format(new Date(request.endTime), 'h:mm a')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request, 'overtime')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {leaveRequests.length === 0 && overtimeRequests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  No pending requests
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  All requests have been processed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ApprovalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        request={selectedRequest}
        requestType={selectedRequestType}
        userRole={
          currentUser.role === 'USER' ? 'MANAGER' : currentUser.role
        }
      />
    </div>
  );
}