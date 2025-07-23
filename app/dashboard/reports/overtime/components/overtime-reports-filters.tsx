"use client"

import { useState, useMemo } from "react"
import { CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { OvertimeReportFilters, OvertimeFilterOptions } from "@/lib/types/overtime-reports-types"
import { RequestStatus, EmployeeClassification } from "@prisma/client"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { MultiSelect } from "../../leave/components/multi-select"


interface OvertimeReportFiltersProps {
  filters: OvertimeReportFilters
  onFiltersChange: (filters: OvertimeReportFilters) => void
  filterOptions: OvertimeFilterOptions
  onReset: () => void
}

export function OvertimeReportFilters({
  filters,
  onFiltersChange,
  filterOptions,
  onReset,
}: OvertimeReportFiltersProps) {
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

  const statusOptions = useMemo(
    () => Object.values(RequestStatus).map((s) => ({ id: s, name: s.replace("_", " ") })),
    [],
  )

  const classificationOptions = useMemo(
    () => Object.values(EmployeeClassification).map((c) => ({ id: c, name: c })),
    [],
  )

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && (!Array.isArray(v) || v.length > 0),
  ).length

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn("w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <div className="flex w-full items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {date?.from
                    ? date.to
                      ? `${format(date.from, "LLL d, y")} - ${format(date.to, "LLL d, y")}`
                      : format(date.from, "LLL d, y")
                    : "Pick a date range"}
                </span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar initialFocus mode="range" selected={date} onSelect={handleDateChange} numberOfMonths={2} />
          </PopoverContent>
        </Popover>

        {/* Multi-Select Filters */}
        <MultiSelect
          placeholder="Departments"
          options={filterOptions.departments}
          selected={filters.departmentIds || []}
          onChange={(s) => onFiltersChange({ ...filters, departmentIds: s.length > 0 ? s : undefined })}
        />

        <MultiSelect
          placeholder="Status"
          options={statusOptions}
          selected={filters.statuses || []}
          onChange={(s) => onFiltersChange({ ...filters, statuses: s.length > 0 ? (s as RequestStatus[]) : undefined })}
        />

        <MultiSelect
          placeholder="Business Unit"
          options={classificationOptions}
          selected={filters.classifications || []}
          onChange={(s) =>
            onFiltersChange({ ...filters, classifications: s.length > 0 ? (s as EmployeeClassification[]) : undefined })
          }
        />

        <MultiSelect
          placeholder="Employees"
          options={filterOptions.employees.map((emp) => ({ id: emp.id, name: `${emp.name} (${emp.employeeId})` }))}
          selected={filters.employeeIds || []}
          onChange={(s) => onFiltersChange({ ...filters, employeeIds: s.length > 0 ? s : undefined })}
        />
      </div>

      {/* Clear Button */}
      {activeFilterCount > 0 && (
        <div className="flex justify-end">
          <Button onClick={onReset} variant="link" size="sm" className="h-auto p-0 text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}
