"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { LeaveReportItem } from "@/lib/types/reports"
import type { RequestStatus, LeaveSession, EmployeeClassification } from "@prisma/client"

interface ReportTableProps {
  data: LeaveReportItem[]
  onSort: (field: keyof LeaveReportItem, direction: "asc" | "desc") => void
}

type SortField = keyof LeaveReportItem
type SortDirection = "asc" | "desc"

export function ReportTable({ data, onSort }: ReportTableProps) {
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

  const getSessionBadge = (session: LeaveSession) => {
    const colors = {
      FULL_DAY: "bg-blue-100 text-blue-800",
      MORNING: "bg-green-100 text-green-800",
      AFTERNOON: "bg-orange-100 text-orange-800",
    }

    return <Badge className={colors[session]}>{session.replace("_", " ")}</Badge>
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
            <SortableHeader field="leaveType">Leave Type</SortableHeader>
            <SortableHeader field="startDate">Start Date</SortableHeader>
            <SortableHeader field="endDate">End Date</SortableHeader>
            <SortableHeader field="session">Session</SortableHeader>
            <SortableHeader field="dayCount">Days</SortableHeader>
            <SortableHeader field="status">Status</SortableHeader>
            <SortableHeader field="createdAt">Created</SortableHeader>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
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
              <TableCell>{item.leaveType}</TableCell>
              <TableCell>{new Date(item.startDate).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(item.endDate).toLocaleDateString()}</TableCell>
              <TableCell>{getSessionBadge(item.session)}</TableCell>
              <TableCell className="text-center">{item.dayCount}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
