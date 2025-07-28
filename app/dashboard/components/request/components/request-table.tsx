"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { format, formatDistanceToNow, differenceInHours, differenceInDays } from "date-fns"
import { 
  CalendarDays, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  MoreHorizontal,
  GripVertical,
  Columns,
  Search,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RequestStatusBadge } from "./request-status-badge"
import { RequestStatus, LeaveSession, type LeaveType as LeaveTypeModel } from "@prisma/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { RequestDetailsDialog } from "./request-details-modal"
import { EditRequestDialog } from "./request-edit-modal"
import { cancelRequest, updateLeaveRequest, updateOvertimeRequest } from "@/lib/actions/leave-actions"

export type RequestData = {
  id: string
  type: 'leave' | 'overtime'
  userId: string
  user?: {
    name: string
    employeeId: string
    email?: string | null
  }
  leaveType?: LeaveTypeModel
  startDate?: Date
  endDate?: Date
  session?: LeaveSession
  startTime?: Date
  endTime?: Date
  reason: string
  status: RequestStatus
  createdAt: Date
  updatedAt: Date
  managerActionBy?: string | null
  managerActionAt?: Date | null
  managerComments?: string | null
  hrActionBy?: string | null
  hrActionAt?: Date | null
  hrComments?: string | null
}

type LeaveTypeName = 'VACATION' | 'SICK' | 'MANDATORY' | 'UNPAID' | 'EMERGENCY' | 'BEREAVEMENT' | 'PATERNITY' | 'MATERNITY';

const leaveTypeLabels: Record<LeaveTypeName, string> = {
  VACATION: 'Vacation Leave',
  SICK: 'Sick Leave',
  MANDATORY: 'Mandatory Leave',
  UNPAID: 'Unpaid Leave',
  EMERGENCY: 'Emergency Leave',
  BEREAVEMENT: 'Bereavement Leave',
  PATERNITY: 'Paternity Leave',
  MATERNITY: 'Maternity Leave'
}

// --- MODIFIED ---: This component now accepts `request` directly, making it more reusable.
const RequestActionsCell = ({ request, leaveTypes }: { request: RequestData, leaveTypes: LeaveTypeModel[] }) => {
  const [viewDetailsOpen, setViewDetailsOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [isCancelAlertOpen, setIsCancelAlertOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const canEdit = request.status === RequestStatus.PENDING_MANAGER
  const canCancel = request.status === RequestStatus.PENDING_MANAGER || request.status === RequestStatus.PENDING_HR
  
  const handleEdit = async (updatedData: Partial<RequestData>) => {
    setLoading(true)
    try {
      if (request.type === 'leave' && updatedData.startDate && updatedData.endDate && updatedData.leaveType && updatedData.session) {
        await updateLeaveRequest({
          requestId: request.id,
          leaveTypeId: updatedData.leaveType.id,
          startDate: updatedData.startDate,
          endDate: updatedData.endDate,
          session: updatedData.session,
          reason: updatedData.reason || ''
        })
      } else if (request.type === 'overtime' && updatedData.startTime && updatedData.endTime) {
        await updateOvertimeRequest({
          requestId: request.id,
          startTime: updatedData.startTime.toISOString(),
          endTime: updatedData.endTime.toISOString(),
          reason: updatedData.reason || ''
        })
      }
      toast.success("Request updated successfully!")
      setEditOpen(false)
    } catch (error) {
      toast.error(`Failed to update request. ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    try {
      const result = await cancelRequest(request.id, request.type)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Request cancelled successfully')
        setIsCancelAlertOpen(false)
      }
    } catch (error) {
      toast.error(`Failed to update request. ${error}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setViewDetailsOpen(true)}>
            <Eye className="mr-2 h-4 w-4" /> 
            View Details
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> 
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {canCancel && (
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              disabled={loading}
              onSelect={(e) => {
                e.preventDefault()
                setIsCancelAlertOpen(true)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> 
              Cancel
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently cancel the request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Yes, cancel request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RequestDetailsDialog
        request={request}
        open={viewDetailsOpen}
        onOpenChange={setViewDetailsOpen}
      />

      <EditRequestDialog
        request={request}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleEdit}
        leaveTypes={leaveTypes}
      />
    </>
  )
}

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 -m-2">
      <GripVertical className="h-5 w-5 text-muted-foreground/50" />
    </div>
  )
}

const getColumns = (leaveTypes: LeaveTypeModel[]): ColumnDef<RequestData>[] => [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
    size: 20,
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 20,
  },
  {
    accessorKey: "user",
    header: "Employee",
    cell: ({ row }) => {
      const user = row.original.user
      if (!user) return <span className="text-muted-foreground">-</span>
      return (
        <div className="font-medium">{user.name}</div>
      )
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const { type, leaveType } = row.original
      const Icon = type === 'leave' ? CalendarDays : Clock
      const color = type === 'leave' ? 'text-blue-500' : 'text-orange-500'
      return (
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <div>
            <span className="font-medium capitalize">{type}</span>
            {leaveType && (
              <div className="text-xs text-muted-foreground">{leaveTypeLabels[leaveType.name as LeaveTypeName]}</div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "period",
    header: "Period",
    cell: ({ row }) => {
      const request = row.original
      if (request.type === 'leave' && request.startDate && request.endDate) {
        return (
          <div>
            <div>{format(request.startDate, 'MMM dd')} - {format(request.endDate, 'MMM dd, yyyy')}</div>
          </div>
        )
      }
      if (request.type === 'overtime' && request.startTime && request.endTime) {
        return (
          <div>
            <div>{format(request.startTime, 'MMM dd, yyyy')}</div>
          </div>
        )
      }
      return <span className="text-muted-foreground">-</span>
    },
  },
    {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const request = row.original
      if (request.type === 'leave' && request.startDate && request.endDate) {
        const days = differenceInDays(request.endDate, request.startDate) + 1
        const adjustedDays = request.session && request.session !== LeaveSession.FULL_DAY && days === 1 ? 0.5 : days
        return (
          <div>
            <div className="text-sm text-muted-foreground">{adjustedDays} {adjustedDays === 1 ? 'day' : 'days'}</div>
          </div>
        )
      }
      if (request.type === 'overtime' && request.startTime && request.endTime) {
        const hours = differenceInHours(request.endTime, request.startTime)
        return (
          <div>
            <div className="text-sm text-muted-foreground">{format(request.startTime, 'p')} - {format(request.endTime, 'p')} ({hours}h)</div>
          </div>
        )
      }
      return <span className="text-muted-foreground">-</span>
    },
  },
    {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {
        const { reason } = row.original;
        return (
            <div className="truncate max-w-xs">
                {reason}
            </div>
        );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <RequestStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: "Submitted",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDistanceToNow(row.original.createdAt, { addSuffix: true })}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <RequestActionsCell request={row.original} leaveTypes={leaveTypes} />,
  },
]

function DraggableRow({ row }: { row: Row<RequestData> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({ id: row.original.id })
  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-state={row.getIsSelected() && "selected"}
      className={cn("bg-background", isDragging && "opacity-50")}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="whitespace-nowrap">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

interface RequestsDataTableProps {
  title: string;
  description?: string;
  requests: RequestData[];
  leaveTypes: LeaveTypeModel[];
  showUser?: boolean;
}

export function RequestsDataTable({ title, description, requests: initialData, leaveTypes, showUser = true }: RequestsDataTableProps) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(showUser ? {} : { user: false })
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "createdAt", desc: true }])
  const [globalFilter, setGlobalFilter] = React.useState("")
  
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    setData(initialData.filter(item => {
      if (!globalFilter) return true;
      return JSON.stringify(item).toLowerCase().includes(globalFilter.toLowerCase());
    }));
  }, [initialData, globalFilter]);

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor))
  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data?.map(({ id }) => id), [data])

  const columns = React.useMemo(() => getColumns(leaveTypes), [leaveTypes])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, globalFilter },
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((currentData) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(currentData, oldIndex, newIndex)
      })
    }
  }

  if (!isMounted) {
    return null; 
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-9"><Columns className="mr-2 h-4 w-4" />View</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {table.getAllColumns().filter((c) => c.getCanHide()).map((column) => (
                        <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(v) => column.toggleVisibility(!!v)}>
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* --- MOBILE VIEW --- */}
        <div className="space-y-4 md:hidden">
          {data.length > 0 ? data.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        {showUser && request.user && <p className="font-semibold">{request.user.name}</p>}
                        <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{request.type}</span>
                             {request.leaveType && (
                                <span className="text-sm text-muted-foreground">{leaveTypeLabels[request.leaveType.name as LeaveTypeName]}</span>
                            )}
                        </div>
                    </div>
                    <RequestActionsCell request={request} leaveTypes={leaveTypes} />
                </div>
                <div>
                   <RequestStatusBadge status={request.status} />
                </div>
                <div className="text-sm text-muted-foreground">
                    <p>Submitted: {formatDistanceToNow(request.createdAt, { addSuffix: true })}</p>
                </div>
            </div>
          )) : (
            <div className="h-24 text-center flex items-center justify-center">No results found.</div>
          )}
        </div>

        {/* --- DESKTOP VIEW --- */}
        <div className="hidden md:block space-y-4">
            <div className="rounded-md border">
                <div className="w-full overflow-x-auto">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <Table>
                        <TableHeader>
                          {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="whitespace-nowrap">
                                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                              ))}
                            </TableRow>
                          ))}
                        </TableHeader>
                        <TableBody>
                          {table.getRowModel().rows?.length ? (
                            <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                              {table.getRowModel().rows.map((row) => <DraggableRow key={row.id} row={row} />)}
                            </SortableContext>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={columns.length} className="h-24 text-center">No results found.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </DndContext>
                </div>
            </div>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="text-sm text-muted-foreground">
                  {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm font-medium">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
                  <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                  <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRight className="h-4 w-4" /></Button>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}