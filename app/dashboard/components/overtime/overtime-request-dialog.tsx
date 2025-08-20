'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CalendarIcon, 
  Clock, 
  Timer,
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react'
import { format, differenceInMinutes, set } from 'date-fns'
import { cn } from '@/lib/utils'
import { createOvertimeRequest } from '@/lib/actions/overtime-actions'
import { toast } from 'sonner'

interface OvertimeRequestDialogProps {
  userId: string
  trigger?: React.ReactNode
}

export function OvertimeRequestDialog({ userId, trigger }: OvertimeRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<Date>()
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) {
      // Reset form state when dialog closes
      setDate(undefined)
      setStartTime('')
      setEndTime('')
      setReason('')
      setLoading(false)
    }
  }, [open])

  const calculateDuration = () => {
    if (!date || !startTime || !endTime) return { hours: 0, minutes: 0, valid: false, totalHours: 0 }
    
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const [endHour, endMinute] = endTime.split(':').map(Number)
      
      const startDateTime = set(date, { hours: startHour, minutes: startMinute })
      const endDateTime = set(date, { hours: endHour, minutes: endMinute })
      
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1)
      }
      
      const totalMinutes = differenceInMinutes(endDateTime, startDateTime)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      
      return { 
        hours, 
        minutes, 
        valid: totalMinutes >= 30 && totalMinutes <= 16 * 60,
        totalHours: totalMinutes / 60
      }
    } catch {
      return { hours: 0, minutes: 0, valid: false, totalHours: 0 }
    }
  }
  const duration = calculateDuration()

  const isExcessiveOvertime = () => {
    return duration.totalHours > 12
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!date || !startTime || !endTime || !reason.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!duration.valid) {
      toast.error('Please enter valid start and end times')
      return
    }

    if (duration.totalHours <= 0) {
      toast.error('End time must be after start time')
      return
    }

    if (duration.totalHours > 16) {
      toast.error('Overtime cannot exceed 16 hours')
      return
    }

    setLoading(true)
    
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const [endHour, endMinute] = endTime.split(':').map(Number)
      
      const startDateTime = set(date, { hours: startHour, minutes: startMinute })
      const endDateTime = set(date, { hours: endHour, minutes: endMinute })
      
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1)
      }

      const result = await createOvertimeRequest({
        userId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        reason
      })

      if (result.success) {
        toast.success('Overtime request submitted successfully')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to submit overtime request')
      }
    } catch (error) {
      toast.error('Failed to submit overtime request')
    }
    
    setLoading(false)
  }

  const defaultTrigger = (
    <Button variant="outline">
      <Clock className="mr-2 h-4 w-4" />
      Request Overtime
    </Button>
  )

  const showDurationInfo = date && startTime && endTime;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-6 w-6" />
            New Overtime Request
          </DialogTitle>
          <DialogDescription>
            Fill in the details for your overtime work.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  disabled={() => false}
  initialFocus
/>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          {showDurationInfo && (
             <Alert variant={!duration.valid ? 'destructive' : 'default'}>
              {!duration.valid ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
              <AlertDescription>
                {!duration.valid 
                  ? 'Invalid time range. Must be between 30 mins and 16 hours.'
                  : `Total duration: ${duration.hours}h ${duration.minutes}m (${duration.totalHours.toFixed(2)} hours)`
                }
                 {isExcessiveOvertime() && ' (Note: Exceeds 12 hours)'}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Overtime</Label>
            <Textarea id="reason" placeholder="e.g., Urgent project deadline..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="resize-none" />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
<Button 
  type="submit" 
  disabled={!!(loading || (showDurationInfo && !duration.valid))}
>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Submit Request
</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
