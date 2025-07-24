"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CalendarIcon,  
  Sun, 
  Moon, 
  Calendar as CalendarDays,
  AlertTriangle,
  Timer,
  Loader2,
  Plane,
  Stethoscope,
  Briefcase,
  Ban,
  Users,
  Baby,
  HeartHandshake
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
// --- MODIFIED ---: Imported the model type for LeaveType
import { type LeaveType as LeaveTypeModel, LeaveSession, RequestStatus } from "@prisma/client"
import { toast } from 'sonner'

// This type should be consistent with the one in your data table
export type RequestData = {
  id: string
  type: 'leave' | 'overtime'
  userId: string
  user?: {
    name: string
    employeeId: string
    email?: string | null
  }
  leaveType?: LeaveTypeModel // Using the model type
  startDate?: Date
  endDate?: Date
  session?: LeaveSession
  startTime?: Date
  endTime?: Date
  reason: string
  status: RequestStatus
  createdAt: Date
  updatedAt: Date
}

interface EditRequestDialogProps {
  request: RequestData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedRequest: Partial<RequestData>) => Promise<void>
  // --- NEW ---: Pass available leave types from the database
  leaveTypes: LeaveTypeModel[]
}

// --- NEW ---: A string literal type for the names of leave types for type safety.
type LeaveTypeName = 'VACATION' | 'SICK' | 'MANDATORY' | 'UNPAID' | 'EMERGENCY' | 'BEREAVEMENT' | 'PATERNITY' | 'MATERNITY';

// --- MODIFIED ---: This config object is still useful for UI, but is now keyed by a string (LeaveTypeName)
const leaveTypeConfig: Record<LeaveTypeName, { 
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = {
  VACATION: { label: 'Vacation', icon: Plane },
  SICK: { label: 'Sick', icon: Stethoscope },
  MANDATORY: { label: 'Mandatory', icon: Briefcase },
  UNPAID: { label: 'Unpaid', icon: Ban },
  EMERGENCY: { label: 'Emergency', icon: AlertTriangle },
  BEREAVEMENT: { label: 'Bereavement', icon: Users },
  PATERNITY: { label: 'Paternity', icon: Baby },
  MATERNITY: { label: 'Maternity', icon: HeartHandshake }
}

const sessionConfig = {
  FULL_DAY: { label: 'Full Day', icon: Sun },
  MORNING: { label: 'Morning', icon: Sun },
  AFTERNOON: { label: 'Afternoon', icon: Moon }
}

export function EditRequestDialog({ request, open, onOpenChange, onSave, leaveTypes }: EditRequestDialogProps) {
  const [loading, setLoading] = useState(false)
  
  // Leave request states
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  // --- MODIFIED ---: State now holds the ID of the leave type
  const [leaveTypeId, setLeaveTypeId] = useState<string | undefined>()
  const [session, setSession] = useState<LeaveSession>(LeaveSession.FULL_DAY)
  
  // Overtime request states
  const [overtimeDate, setOvertimeDate] = useState<Date | undefined>()
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  
  // Common states
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (request) {
      setStartDate(request.startDate ? new Date(request.startDate) : undefined);
      setEndDate(request.endDate ? new Date(request.endDate) : undefined);
      // --- MODIFIED ---: Set the leaveTypeId from the request object
      setLeaveTypeId(request.leaveType?.id);
      setSession(request.session || LeaveSession.FULL_DAY);
      setOvertimeDate(request.startTime ? new Date(request.startTime) : undefined);
      setStartTime(request.startTime ? format(new Date(request.startTime), 'HH:mm') : '');
      setEndTime(request.endTime ? format(new Date(request.endTime), 'HH:mm') : '');
      setReason(request.reason || '');
    }
  }, [request]);

  if (!request) return null

  const isLeaveRequest = request.type === 'leave'

  const selectedLeaveType = leaveTypes.find(lt => lt.id === leaveTypeId);

  const calculateLeaveDays = () => {
    if (!startDate || !endDate) return 0
    const days = differenceInDays(endDate, startDate) + 1
    return session === LeaveSession.FULL_DAY ? days : Math.max(0.5, days - 0.5)
  }

  const isVacationTooSoon = () => {
    if (selectedLeaveType?.name !== 'VACATION' || !startDate) return false
    return differenceInDays(startDate, new Date()) < 3
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    if (isLeaveRequest) {
      if (!startDate || !endDate || !leaveTypeId) {
        toast.error('Please fill in all required fields for the leave request.')
        return
      }
      if (endDate < startDate) {
        toast.error('End date must be after start date.')
        return
      }
      if (isVacationTooSoon()) {
        toast.error('Vacation leave must be filed at least 3 days in advance.')
        return
      }
    }

    setLoading(true)
    
    try {
      const updatedData: Partial<RequestData> = { reason };

      if (isLeaveRequest && startDate && endDate && selectedLeaveType) {
        updatedData.startDate = startDate
        updatedData.endDate = endDate
        updatedData.leaveType = selectedLeaveType // Pass the full object
        updatedData.session = session
      }
      
      // Overtime logic remains the same
      // ...

      await onSave(updatedData)
      toast.success('Request updated successfully')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update request')
    }
    
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLeaveRequest ? <CalendarDays className="h-6 w-6" /> : <Timer className="h-6 w-6" />}
            Edit {isLeaveRequest ? 'Leave' : 'Overtime'} Request
          </DialogTitle>
          <DialogDescription>
            Make changes to your request. This will restart the approval process.
          </DialogDescription>
        </DialogHeader>
        
        <form id="edit-request-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
          {isLeaveRequest && (
            <>
              <div className="space-y-2">
                <Label>Leave Type</Label>
                {/* --- MODIFIED ---: Select now uses leaveTypeId and maps over the leaveTypes prop */}
                <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                  <SelectTrigger><SelectValue placeholder="Select leave type..." /></SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((lt) => {
                      const config = leaveTypeConfig[lt.name as LeaveTypeName];
                      if (!config) return null;
                      const IconComponent = config.icon;
                      return (
                        <SelectItem key={lt.id} value={lt.id}>
                          <div className="flex items-center gap-2"><IconComponent className="h-4 w-4" />{config.label}</div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus /></PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => date < (startDate || new Date(new Date().setHours(0,0,0,0)))} initialFocus /></PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Session</Label>
                <RadioGroup value={session} onValueChange={(value) => setSession(value as LeaveSession)} className="grid grid-cols-3 gap-2">
                  {Object.entries(sessionConfig).map(([value, config]) => (
                    <Label key={value} htmlFor={`edit-${value}`} className="flex items-center justify-center gap-2 cursor-pointer rounded-md border p-2 hover:bg-accent [&:has([data-state=checked])]:border-primary">
                      <RadioGroupItem value={value} id={`edit-${value}`} className="sr-only" />
                      <config.icon className="h-4 w-4" />{config.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}
          
          {/* Overtime fields would go here, no changes needed for them based on the schema update */}

          {calculateLeaveDays() > 0 && (
            <Alert variant={isVacationTooSoon() ? "destructive" : "default"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isVacationTooSoon() ? "Vacation must be filed 3+ days in advance." : `Duration: ${calculateLeaveDays()} ${calculateLeaveDays() === 1 ? 'day' : 'days'}.`}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" placeholder="Please provide a brief reason..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="resize-none" />
          </div>
        </form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button form="edit-request-form" type="submit" disabled={loading || (isLeaveRequest && isVacationTooSoon())}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
