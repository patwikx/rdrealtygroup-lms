"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RequestStatusBadge } from "./request-status-badge"
// --- MODIFIED ---: Imported the model type for LeaveType
import { type LeaveType as LeaveTypeModel, LeaveSession } from "@prisma/client"
import { format, differenceInHours, differenceInDays } from "date-fns"
import {
  CalendarDays,
  Clock,
  User,
  FileText,
  Calendar,
  Timer,
  CheckCircle,
  MessageSquare,
  Building,
  Mail,
} from "lucide-react"
import type { RequestData } from "./request-table" // This type should also be updated where it's defined

interface RequestDetailsDialogProps {
  request: RequestData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// --- NEW ---: A string literal type for the names of leave types for type safety.
type LeaveTypeName = 'VACATION' | 'SICK' | 'MANDATORY' | 'UNPAID' | 'EMERGENCY' | 'BEREAVEMENT' | 'PATERNITY' | 'MATERNITY';

// --- MODIFIED ---: The maps are now keyed by the LeaveTypeName string literal
const leaveTypeLabels: Record<LeaveTypeName, string> = {
  VACATION: "Vacation",
  SICK: "Sick Leave",
  MANDATORY: "Mandatory",
  UNPAID: "Unpaid",
  EMERGENCY: "Emergency",
  BEREAVEMENT: "Bereavement",
  PATERNITY: "Paternity",
  MATERNITY: "Maternity",
}

const leaveTypeColors: Record<LeaveTypeName, string> = {
  VACATION: "bg-blue-50 text-blue-700 border-blue-200",
  SICK: "bg-red-50 text-red-700 border-red-200",
  MANDATORY: "bg-purple-50 text-purple-700 border-purple-200",
  UNPAID: "bg-gray-50 text-gray-700 border-gray-200",
  EMERGENCY: "bg-orange-50 text-orange-700 border-orange-200",
  BEREAVEMENT: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PATERNITY: "bg-green-50 text-green-700 border-green-200",
  MATERNITY: "bg-pink-50 text-pink-700 border-pink-200",
}

const sessionLabels: Record<LeaveSession, string> = {
  FULL_DAY: "Full Day",
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
}

export function RequestDetailsDialog({ request, open, onOpenChange }: RequestDetailsDialogProps) {
  if (!request) return null

  const isLeaveRequest = request.type === "leave"
  const isOvertimeRequest = request.type === "overtime"

  const calculateDuration = () => {
    if (isLeaveRequest && request.startDate && request.endDate) {
      const days = differenceInDays(request.endDate, request.startDate) + 1
      return request.session && request.session !== LeaveSession.FULL_DAY && days === 1 ? 0.5 : days
    }

    if (isOvertimeRequest && request.startTime && request.endTime) {
      return differenceInHours(request.endTime, request.startTime)
    }

    return 0
  }

  const duration = calculateDuration()

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    className = "",
  }: {
    icon: React.ElementType
    label: string
    value: React.ReactNode
    className?: string
  }) => (
    <div className={`flex items-start gap-3 ${className}`}>
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium text-sm break-words">{value}</div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isLeaveRequest ? (
              <CalendarDays className="h-5 w-5 text-blue-600" />
            ) : (
              <Clock className="h-5 w-5 text-orange-600" />
            )}
            {request.type === "leave" ? "Leave" : "Overtime"} Request
            <span className="text-muted-foreground font-normal text-sm">#{request.id.slice(-8)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Separator />

          {/* Employee & Request Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Employee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
              <InfoItem
                icon={User}
                label="Employee"
                value={
                  <>
                    <div className="font-medium">{request.user?.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {request.user?.employeeId}</div>
                  </>
                }
              />
              <InfoItem icon={Mail} label="Email" value={request.user?.email || 'N/A'} />
            </div>
          </div>

          <Separator />

          {/* Time Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {isLeaveRequest ? <Calendar className="h-4 w-4" /> : <Timer className="h-4 w-4" />}
              {isLeaveRequest ? "Leave Details" : "Overtime Details"}
            </div>
            <div className="grid grid-cols-2 gap-4 pl-6">
              {isLeaveRequest && request.leaveType && (
                <InfoItem
                  icon={FileText}
                  label="Leave Type"
                  value={
                    // --- MODIFIED ---: Access leaveType.name to get the correct key
                    <Badge variant="outline" className={leaveTypeColors[request.leaveType.name as LeaveTypeName]}>
                      {leaveTypeLabels[request.leaveType.name as LeaveTypeName]}
                    </Badge>
                  }
                />
              )}
              <InfoItem
                icon={CheckCircle}
                label="Status"
                value={<RequestStatusBadge status={request.status} />}
              />
              {isLeaveRequest && request.startDate && request.endDate && (
                <>
                  <InfoItem icon={CalendarDays} label="From" value={format(request.startDate, "MMM dd, yyyy")} />
                  <InfoItem icon={CalendarDays} label="To" value={format(request.endDate, "MMM dd, yyyy")} />
                  <InfoItem
                    icon={Clock}
                    label="Session"
                    value={request.session ? sessionLabels[request.session] : "Full Day"}
                  />
                  <InfoItem
                    icon={Timer}
                    label="Duration"
                    value={`${duration} ${duration === 1 ? "day" : "days"}`}
                  />
                </>
              )}
              {isOvertimeRequest && request.startTime && request.endTime && (
                <>
                  <InfoItem icon={CalendarDays} label="Date" value={format(request.startTime, "MMM dd, yyyy")} />
                  <InfoItem icon={Timer} label="Duration" value={`${duration} hour${duration === 1 ? '' : 's'}`} />
                  <InfoItem icon={Clock} label="Start Time" value={format(request.startTime, "h:mm a")} />
                  <InfoItem icon={Clock} label="End Time" value={format(request.endTime, "h:mm a")} />
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Reason */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" />
              Reason
            </div>
            <div className="pl-6 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md min-h-[60px]">
              {request.reason || "No reason provided."}
            </div>
          </div>

          <Separator />

          {/* Approval Timeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building className="h-4 w-4" />
              Approval Timeline
            </div>
            <div className="pl-6 space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Submitted</span>
                    <span className="text-xs text-muted-foreground">{format(request.createdAt, "MMM dd, h:mm a")}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${request.managerActionAt ? "bg-green-100" : "bg-gray-100"}`}>
                  {request.managerActionAt ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Clock className="h-3 w-3 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Manager Review</span>
                    {request.managerActionAt && <span className="text-xs text-muted-foreground">{format(request.managerActionAt, "MMM dd, h:mm a")}</span>}
                  </div>
                  {request.managerComments && (
                    <div className="mt-1 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      <MessageSquare className="h-3 w-3 inline mr-1" />
                      {request.managerComments}
                    </div>
                  )}
                  {!request.managerActionAt && <span className="text-xs text-muted-foreground">Pending approval</span>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${request.hrActionAt ? "bg-green-100" : "bg-gray-100"}`}>
                  {request.hrActionAt ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Clock className="h-3 w-3 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">HR Review</span>
                    {request.hrActionAt && <span className="text-xs text-muted-foreground">{format(request.hrActionAt, "MMM dd, h:mm a")}</span>}
                  </div>
                  {request.hrComments && (
                    <div className="mt-1 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      <MessageSquare className="h-3 w-3 inline mr-1" />
                      {request.hrComments}
                    </div>
                  )}
                  {!request.hrActionAt && <span className="text-xs text-muted-foreground">{request.managerActionAt ? "Pending approval" : "Awaiting manager approval"}</span>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Created {format(request.createdAt, "MMM dd, yyyy")}</span>
              <span>Updated {format(request.updatedAt, "MMM dd, yyyy")}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
