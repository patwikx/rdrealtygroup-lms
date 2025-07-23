"use client"

import { useState } from "react"
import { CalendarIcon, X, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { LeaveHistoryFilters } from "@/lib/types/leave-history-types"
import { RequestStatus, LeaveSession, LeaveType } from "@prisma/client"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { MultiSelect } from "../../reports/leave/components/multi-select"


interface LeaveHistoryFiltersProps {
  filters: LeaveHistoryFilters
  onFiltersChange: (filters: LeaveHistoryFilters) => void
  leaveTypes: LeaveType[]
  onReset: () => void
}

export function LeaveHistoryFiltersComponent({ 
  filters, 
  onFiltersChange, 
  leaveTypes,
  onReset 
}: LeaveHistoryFiltersProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: filters.startDate ? new Date(filters.startDate) : undefined,
    to: filters.endDate ? new Date(filters.endDate) : undefined,
  })

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate)
    onFiltersChange({
      ...filters,
      startDate: newDate?.from ? format(newDate.from, "yyyy-MM-dd") : undefined,
      endDate: newDate?.to ? format(newDate.to, "yyyy-MM-dd") : undefined,
    })
  }

  const statusOptions = Object.values(RequestStatus).map(s => ({
    id: s, 
    name: s.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }))

  const leaveTypeOptions = leaveTypes.map(lt => ({
    id: lt.id,
    name: lt.name
  }))

  const sessionOptions = Object.values(LeaveSession).map(s => ({
    id: s,
    name: s.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }))

  const activeFilterCount = Object.values(filters).filter(v => 
    v !== undefined && (!Array.isArray(v) || v.length > 0)
  ).length

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Filter className="h-4 w-4 text-primary" />
            </div>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button onClick={onReset} variant="outline" size="sm">
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <div className="flex w-full items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">
                    {date?.from ? (
                      date.to 
                        ? `${format(date.from, "LLL d, y")} - ${format(date.to, "LLL d, y")}` 
                        : format(date.from, "LLL d, y")
                    ) : (
                      "Select date range"
                    )}
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={date}
                onSelect={handleDateChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Multi-Select Filters */}
          <MultiSelect
            placeholder="Leave Types" 
            options={leaveTypeOptions} 
            selected={filters.leaveTypeId || []} 
            onChange={(s) => onFiltersChange({
              ...filters, 
              leaveTypeId: s.length > 0 ? s : undefined
            })} 
          />
          
          <MultiSelect 
            placeholder="Status" 
            options={statusOptions} 
            selected={filters.status || []} 
            onChange={(s) => onFiltersChange({
              ...filters, 
              status: s.length > 0 ? s as RequestStatus[] : undefined
            })} 
          />
          
          <MultiSelect 
            placeholder="Session" 
            options={sessionOptions} 
            selected={filters.session || []} 
            onChange={(s) => onFiltersChange({
              ...filters, 
              session: s.length > 0 ? s as LeaveSession[] : undefined
            })} 
          />
        </div>
      </CardContent>
    </Card>
  )
}