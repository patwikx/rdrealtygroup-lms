"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Calendar, Clock, FileText, User, CheckCircle, XCircle, Building } from "lucide-react"
import { LeaveRequestWithApprovalDetails } from "@/lib/types/approval-history"
import { RequestStatus, LeaveSession } from "@prisma/client"
import { format, differenceInDays } from "date-fns"
import { approveLeaveRequest, rejectLeaveRequest } from "@/lib/actions/approval-history"
import { toast } from "sonner"

interface LeaveApprovalTableProps {
  requests: LeaveRequestWithApprovalDetails[]
  currentPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  onRefresh: () => void
}

export function LeaveApprovalTable({ 
  requests, 
  currentPage, 
  totalPages, 
  totalCount,
  onPageChange,
  onRefresh 
}: LeaveApprovalTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithApprovalDetails | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getStatusBadge = (status: RequestStatus) => {
    const statusConfig = {
      [RequestStatus.APPROVED]: { variant: "default" as const, color: "bg-green-100 text-green-800 border-green-200" },
      [RequestStatus.PENDING_MANAGER]: { variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      [RequestStatus.PENDING_HR]: { variant: "secondary" as const, color: "bg-blue-100 text-blue-800 border-blue-200" },
      [RequestStatus.REJECTED]: { variant: "destructive" as const, color: "bg-red-100 text-red-800 border-red-200" },
      [RequestStatus.CANCELLED]: { variant: "outline" as const, color: "bg-gray-100 text-gray-800 border-gray-200" }
    }

    const config = statusConfig[status]
    return (
      <Badge variant={config.variant} className={`${config.color} font-medium`}>
        {status.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  }

  const getSessionBadge = (session: LeaveSession) => {
    const sessionConfig = {
      [LeaveSession.FULL_DAY]: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Calendar },
      [LeaveSession.MORNING]: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: Clock },
      [LeaveSession.AFTERNOON]: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: Clock }
    }

    const config = sessionConfig[session]
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`${config.color} font-medium`}>
        <Icon className="w-3 h-3 mr-1" />
        {session.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  }

  const calculateDuration = (startDate: Date, endDate: Date, session: LeaveSession) => {
    const days = differenceInDays(endDate, startDate) + 1
    
    if (session === LeaveSession.FULL_DAY) {
      return `${days} day${days > 1 ? 's' : ''}`
    } else {
      return days === 1 ? '0.5 day' : `${days - 0.5} days`
    }
  }

  const canTakeAction = (status: RequestStatus) => {
    return status === RequestStatus.PENDING_MANAGER || status === RequestStatus.PENDING_HR
  }

  const handleAction = async (request: LeaveRequestWithApprovalDetails, type: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setActionType(type)
    setComments("")
  }

  const submitAction = async () => {
    if (!selectedRequest || !actionType) return

    setIsSubmitting(true)
    try {
      if (actionType === 'approve') {
        await approveLeaveRequest(selectedRequest.id, comments)
        toast.success("Leave request approved successfully")
      } else {
        if (!comments.trim()) {
          toast.error("Comments are required when rejecting a request")
          return
        }
        await rejectLeaveRequest(selectedRequest.id, comments)
        toast.success("Leave request rejected")
      }
      
      // Reset state
      setSelectedRequest(null)
      setActionType(null)
      setComments("")
      
      // Refresh the data
      onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-muted/50 rounded-full mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No leave requests found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            There are no leave requests to review at this time, or no requests match your current filters.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <span>Leave Approval Queue</span>
            <Badge variant="outline" className="ml-auto">
              {totalCount} total requests
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold">Leave Type</TableHead>
                  <TableHead className="font-semibold">Duration</TableHead>
                  <TableHead className="font-semibold">Session</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Applied Date</TableHead>
                  <TableHead className="font-semibold">Reason</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{request.user.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            ID: {request.user.employeeId}
                            {request.user.department && (
                              <>
                                <Building className="h-3 w-3" />
                                {request.user.department.name}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded">
                          <Calendar className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{request.leaveType.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(request.startDate, "MMM d")} - {format(request.endDate, "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {calculateDuration(request.startDate, request.endDate, request.session)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSessionBadge(request.session)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(request.createdAt, "MMM d, yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(request.createdAt, "h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm" title={request.reason}>
                        {request.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      {canTakeAction(request.status) ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleAction(request, 'approve')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleAction(request, 'reject')}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No action needed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} requests
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-muted-foreground px-2">...</span>
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => {
        setSelectedRequest(null)
        setActionType(null)
        setComments("")
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {actionType === 'approve' 
                    ? `You are approving ${selectedRequest.user.name}'s leave request for ${selectedRequest.leaveType.name}.`
                    : `You are rejecting ${selectedRequest.user.name}'s leave request for ${selectedRequest.leaveType.name}.`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Employee:</span>
                  <p className="font-medium">{selectedRequest.user.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Leave Type:</span>
                  <p className="font-medium">{selectedRequest.leaveType.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <p className="font-medium">
                    {format(selectedRequest.startDate, "MMM d")} - {format(selectedRequest.endDate, "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Session:</span>
                  <p className="font-medium">
                    {selectedRequest.session.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground text-sm">Reason:</span>
                <p className="text-sm mt-1 p-2 bg-muted/50 rounded">{selectedRequest.reason}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Comments {actionType === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <Textarea
                  placeholder={actionType === 'approve' 
                    ? "Add any comments about the approval (optional)..."
                    : "Please provide a reason for rejection (required)..."
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedRequest(null)
                setActionType(null)
                setComments("")
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitAction}
              disabled={isSubmitting || (actionType === 'reject' && !comments.trim())}
              className={actionType === 'approve' 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"
              }
            >
              {isSubmitting ? "Processing..." : (actionType === 'approve' ? 'Approve' : 'Reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}