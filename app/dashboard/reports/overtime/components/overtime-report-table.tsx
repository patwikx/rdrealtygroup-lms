"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { OvertimeReportItem } from "@/lib/types/overtime-reports-types"
import type { RequestStatus, EmployeeClassification } from "@prisma/client"

interface OvertimeReportTableProps {
  data: OvertimeReportItem[]
  onSort: (field: keyof OvertimeReportItem, direction: "asc" | "desc") => void
}

type SortField = keyof OvertimeReportItem
type SortDirection = "asc" | "desc"

export function OvertimeReportTable({ data, onSort }: OvertimeReportTableProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(newDirection)
    onSort(field, newDirection)
  }

  const getStatusBadge = (status: RequestStatus) => {
    const variants = {
      PENDING_MANAGER: "secondary",
      PENDING_HR: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
      CANCELLED: "outline",
    } as const

    return <Badge variant={variants[status]}>{status.replace("_", " ")}</Badge>
  }

  const getClassificationBadge = (classification: EmployeeClassification | null) => {
    if (!classification) return null

    const colors = {
      RDRDC: "bg-purple-100 text-purple-800",
      RDHFSI: "bg-teal-100 text-teal-800",
      TWC: "bg-pink-100 text-pink-800",
    }

    return <Badge className={colors[classification]}>{classification}</Badge>
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(field)}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        {children}
        {sortField === field &&
          (sortDirection === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
      </Button>
    </TableHead>
  )

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="employeeId">Employee ID</SortableHeader>
            <SortableHeader field="employeeName">Employee</SortableHeader>
            <SortableHeader field="department">Department</SortableHeader>
            <SortableHeader field="classification">Business Unit</SortableHeader>
            <SortableHeader field="startTime">Start Time</SortableHeader>
            <SortableHeader field="endTime">End Time</SortableHeader>
            <SortableHeader field="duration">Duration</SortableHeader>
            <SortableHeader field="status">Status</SortableHeader>
            <SortableHeader field="createdAt">Created</SortableHeader>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const startDateTime = formatDateTime(item.startTime)
            const endDateTime = formatDateTime(item.endTime)

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.employeeId}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.employeeName}</div>
                    <div className="text-sm text-muted-foreground">{item.email}</div>
                  </div>
                </TableCell>
                <TableCell>{item.department || "N/A"}</TableCell>
                <TableCell>{getClassificationBadge(item.classification)}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{startDateTime.date}</div>
                    <div className="text-sm text-muted-foreground">{startDateTime.time}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{endDateTime.date}</div>
                    <div className="text-sm text-muted-foreground">{endDateTime.time}</div>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">{item.duration}h</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>View History</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
