'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
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
  Plus, 
  Clock, 
  Sun, 
  Moon, 
  Calendar as CalendarDays,
  AlertTriangle,
  Plane,
  Stethoscope,
  Ban,
  Users,
  Baby,
  HeartHandshake,
  Loader2
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { createLeaveRequest } from '@/lib/actions/leave-actions'
import { LeaveSession, type LeaveType } from '@prisma/client'
import { toast } from 'sonner'

type LeaveTypeName = 'VACATION' | 'SICK' | 'UNPAID' | 'EMERGENCY' | 'BEREAVEMENT' | 'PATERNITY' | 'MATERNITY';

interface LeaveRequestDialogProps {
  userId: string
  leaveTypes: LeaveType[]
  trigger?: React.ReactNode
}

const leaveTypeConfig: Record<LeaveTypeName, { 
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}> = {
  VACATION: { 
    label: 'Vacation Leave', 
    icon: Plane, 
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: 'Planned time off for rest and recreation'
  },
  SICK: { 
    label: 'Sick Leave', 
    icon: Stethoscope, 
    color: 'text-red-600 bg-red-50 border-red-200',
    description: 'Medical leave for illness or health issues'
  },
  UNPAID: { 
    label: 'Unpaid Leave', 
    icon: Ban, 
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    description: 'Leave without pay for personal reasons'
  },
  EMERGENCY: { 
    label: 'Emergency Leave', 
    icon: AlertTriangle, 
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    description: 'Urgent leave for unexpected situations. This will be deducted on your Vaction Leave.'
  },
  BEREAVEMENT: { 
    label: 'Bereavement Leave', 
    icon: Users, 
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    description: 'Leave for mourning the loss of a loved one'
  },
  PATERNITY: { 
    label: 'Paternity Leave', 
    icon: Baby, 
    color: 'text-green-600 bg-green-50 border-green-200',
    description: 'Leave for new fathers'
  },
  MATERNITY: { 
    label: 'Maternity Leave', 
    icon: HeartHandshake, 
    color: 'text-pink-600 bg-pink-50 border-pink-200',
    description: 'Leave for new mothers'
  }
}

const sessionConfig = {
  FULL_DAY: { label: 'Full Day', icon: Sun },
  MORNING: { label: 'Morning', icon: Sun },
  AFTERNOON: { label: 'Afternoon', icon: Moon }
}

export function LeaveRequestDialog({ userId, leaveTypes, trigger }: LeaveRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [leaveTypeId, setLeaveTypeId] = useState<string>()
  const [session, setSession] = useState<LeaveSession>(LeaveSession.FULL_DAY)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) {
      setStartDate(undefined)
      setEndDate(undefined)
      setLeaveTypeId(undefined)
      setSession(LeaveSession.FULL_DAY)
      setReason('')
      setLoading(false)
    }
  }, [open])

  // --- MODIFIED ---: Added optional chaining (?) to prevent crash if `leaveTypes` is undefined.
  const selectedLeaveType = leaveTypes?.find(lt => lt.id === leaveTypeId);

  const calculatedDays = () => {
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
    
    if (!startDate || !endDate || !leaveTypeId || !reason.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (endDate < startDate) {
      toast.error('End date cannot be before the start date.')
      return
    }

    if (isVacationTooSoon()) {
      toast.error('Vacation leave must be filed at least 3 days in advance.')
      return
    }

    setLoading(true)
    
    try {
      const result = await createLeaveRequest({
        userId,
        leaveTypeId,
        startDate,
        endDate,
        session,
        reason
      })

      if (result.success) {
        toast.success('Leave request submitted successfully.')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to submit leave request.')
      }
    } catch (error) {
      toast.error(`An unexpected error occurred. ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Request Leave
    </Button>
  )

  const selectedConfig = selectedLeaveType ? leaveTypeConfig[selectedLeaveType.name as LeaveTypeName] : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            New Leave Request
          </DialogTitle>
          <DialogDescription>
            Fill in the details below. Your request will be sent for approval.
          </DialogDescription>
        </DialogHeader>
        
        <form id="leave-request-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a leave type..." />
              </SelectTrigger>
              <SelectContent>
                {/* --- MODIFIED ---: Added optional chaining to safely map over `leaveTypes` */}
                {leaveTypes?.map((lt) => {
                  const config = leaveTypeConfig[lt.name as LeaveTypeName];
                  if (!config) return null;
                  const IconComponent = config.icon;
                  return (
                    <SelectItem key={lt.id} value={lt.id}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {selectedConfig && (
              <Alert className={cn("border", selectedConfig.color)}>
                <selectedConfig.icon className="h-4 w-4" />
                <AlertDescription className="text-xs">{selectedConfig.description}</AlertDescription>
              </Alert>
            )}
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
                <Label key={value} htmlFor={value} className="flex items-center justify-center gap-2 cursor-pointer rounded-md border p-2 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                  <RadioGroupItem value={value} id={value} className="sr-only" />
                  <config.icon className="h-4 w-4" />
                  {config.label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {(calculatedDays() > 0 || isVacationTooSoon()) && (
            <Alert variant={isVacationTooSoon() ? "destructive" : "default"}>
              {isVacationTooSoon() ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <AlertDescription>
                {isVacationTooSoon() 
                  ? "Vacation must be filed at least 3 days in advance."
                  : `Total duration: ${calculatedDays()} ${calculatedDays() === 1 ? 'day' : 'days'}.`
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" placeholder="Please provide a brief reason..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="resize-none" />
          </div>
        </form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button form="leave-request-form" type="submit" disabled={loading || isVacationTooSoon()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
