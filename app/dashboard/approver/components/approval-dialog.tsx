'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type {
  LeaveRequestWithDetails,
  OvertimeRequestWithUser,
} from '@/lib/types/requests';
import {
  processLeaveRequest,
  processOvertimeRequest,
} from '@/lib/actions/requests-actions';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: LeaveRequestWithDetails | OvertimeRequestWithUser | null;
  requestType: 'leave' | 'overtime';
  userRole: 'MANAGER' | 'HR' | 'ADMIN';
}

export function ApprovalDialog({
  open,
  onOpenChange,
  request,
  requestType,
  userRole,
}: ApprovalDialogProps) {
  const [comments, setComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!request) return;

    setIsProcessing(true);
    try {
      // --- MODIFIED BLOCK ---
      // This block is updated to correctly handle the server action's response.

      // 1. Await the result from the server action.
      const result = await (requestType === 'leave'
        ? processLeaveRequest({ action, comments, requestId: request.id })
        : processOvertimeRequest({ action, comments, requestId: request.id }));

      // 2. Safely check if the result contains an error.
      // The `in` operator checks for the property's existence, satisfying TypeScript.
      if (result && 'error' in result && result.error) {
        throw new Error(String(result.error));
      }

      // 3. If no error, proceed with success toast.
      toast.success(
        `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      );

      setComments('');
      onOpenChange(false);
    } catch (error) {
      // The thrown error (either from the action or network) is caught here.
      const errorMessage =
        error instanceof Error ? error.message : `Failed to ${action} request`;
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!request) return null;

  const isLeaveRequest = requestType === 'leave';
  const leaveRequest = request as LeaveRequestWithDetails;
  const overtimeRequest = request as OvertimeRequestWithUser;

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      PENDING_MANAGER: 'bg-yellow-100 text-yellow-800',
      PENDING_HR: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={variants[status] ?? 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  // The rest of the JSX remains the same...
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLeaveRequest ? (
              <>
                <Calendar className="h-5 w-5" />
                Leave Request Approval
              </>
            ) : (
              <>
                <Clock className="h-5 w-5" />
                Overtime Request Approval
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Review and provide {userRole === 'MANAGER' ? 'manager' : 'HR'}{' '}
            approval for this request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Employee Details</h3>
              {getStatusBadge(request.status)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">{request.user.name}</p>
                  <p className="text-sm text-gray-600">{request.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">ID: {request.user.employeeId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Request Details</h3>
            {isLeaveRequest ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Leave Type</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded border">
                      {leaveRequest.leaveType.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Session</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded border">
                      {leaveRequest.session.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded border">
                      {format(new Date(leaveRequest.startDate), 'PPP')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded border">
                      {format(new Date(leaveRequest.endDate), 'PPP')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Start Time</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded border">
                      {format(
                        new Date(overtimeRequest.startTime),
                        'MMM d, yyyy h:mm a'
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Time</Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded border">
                      {format(
                        new Date(overtimeRequest.endTime),
                        'MMM d, yyyy h:mm a'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Reason</Label>
              <p className="mt-1 p-3 bg-gray-50 rounded border min-h-[60px] whitespace-pre-wrap">
                {request.reason}
              </p>
            </div>
          </div>

          {(request.managerActionAt || request.hrActionAt) && (
            <div className="space-y-3">
              <h3 className="font-semibold">Previous Actions</h3>
              {request.managerActionAt && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-sm text-blue-800">
                    Manager Action -{' '}
                    {format(
                      new Date(request.managerActionAt),
                      'MMM d, yyyy h:mm a'
                    )}
                  </p>
                  {request.managerComments && (
                    <p className="text-sm mt-1 text-blue-700 whitespace-pre-wrap">
                      {request.managerComments}
                    </p>
                  )}
                </div>
              )}
              {request.hrActionAt && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-medium text-sm text-green-800">
                    HR Action -{' '}
                    {format(
                      new Date(request.hrActionAt),
                      'MMM d, yyyy h:mm a'
                    )}
                  </p>
                  {request.hrComments && (
                    <p className="text-sm mt-1 text-green-700 whitespace-pre-wrap">
                      {request.hrComments}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comments">
              {userRole === 'MANAGER' ? 'Manager' : 'HR'} Comments
            </Label>
            <Textarea
              id="comments"
              placeholder="Add your comments here (optional)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleAction('reject')}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Reject'}
          </Button>
          <Button onClick={() => handleAction('approve')} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}