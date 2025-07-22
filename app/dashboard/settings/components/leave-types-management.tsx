"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  RefreshCw, 
  Edit, 
  Save, 
  X, 
  Search, 
  Calendar, 
  Trash2, 
  TrendingUp, 
  Hash,
  Clock,
  BarChart3
} from "lucide-react"
import { useLeaveTypesData } from "@/hooks/use-leave-types-data"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { deleteLeaveType, updateLeaveType } from "@/lib/actions/leave-type-actions"
import { CreateLeaveTypeDialog } from "./create-leave-type-dialog"

// Color mapping for different leave types
const LEAVE_TYPE_COLORS: Record<string, string> = {
  VACATION: "bg-blue-100 text-blue-800 border-blue-200",
  SICK: "bg-red-100 text-red-800 border-red-200",
  PERSONAL: "bg-green-100 text-green-800 border-green-200",
  MATERNITY: "bg-pink-100 text-pink-800 border-pink-200",
  PATERNITY: "bg-cyan-100 text-cyan-800 border-cyan-200",
  BEREAVEMENT: "bg-purple-100 text-purple-800 border-purple-200",
  EMERGENCY: "bg-orange-100 text-orange-800 border-orange-200",
  UNPAID: "bg-gray-100 text-gray-800 border-gray-200",
  MANDATORY: "bg-indigo-100 text-indigo-800 border-indigo-200",
}

export function LeaveTypesManagement() {
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState("")
  const [editingType, setEditingType] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ name: string; defaultAllocatedDays: number }>({ 
    name: "", 
    defaultAllocatedDays: 0 
  })

  const { leaveTypes, summary, isLoading, refreshData } = useLeaveTypesData()

  const filteredLeaveTypes = leaveTypes.filter((type) =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUpdateLeaveType = (typeId: string) => {
    startTransition(async () => {
      try {
        const result = await updateLeaveType({
          id: typeId,
          name: editValues.name,
          defaultAllocatedDays: editValues.defaultAllocatedDays,
        })
        
        if (result.success) {
          toast.success("Leave type updated successfully")
          setEditingType(null)
          refreshData()
        } else {
          toast.error(result.message || "Failed to update leave type")
        }
      } catch (error) {
        console.error("Update error:", error)
        toast.error("Failed to update leave type")
      }
    })
  }

  const handleDeleteLeaveType = (typeId: string, typeName: string) => {
    startTransition(async () => {
      try {
        const result = await deleteLeaveType(typeId)
        
        if (result.success) {
          toast.success(`Leave type "${typeName}" deleted successfully`)
          refreshData()
        } else {
          toast.error(result.message || "Failed to delete leave type")
        }
      } catch (error) {
        console.error("Delete error:", error)
        toast.error("Failed to delete leave type")
      }
    })
  }

  const getLeaveTypeColor = (typeName: string) => {
    return LEAVE_TYPE_COLORS[typeName] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leave Types</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLeaveTypes}</div>
            <p className="text-xs text-muted-foreground">Active leave types in system</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Default Days</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDefaultDays}</div>
            <p className="text-xs text-muted-foreground">Combined default allocations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Allocation</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageAllocation.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Days per leave type</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Type</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.mostUsedType?.name.replace("_", " ") || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.mostUsedType?._count?.leaveRequests || 0} requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Leave Types Management
              </CardTitle>
              <CardDescription>
                Create, edit, and manage leave types and their default allocations.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <CreateLeaveTypeDialog />
              <Button 
                variant="outline" 
                onClick={refreshData} 
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leave types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Default Allocation</TableHead>
                  <TableHead>Active Requests</TableHead>
                  <TableHead>Employee Balances</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin inline-block mr-2" />
                      Loading leave types...
                    </TableCell>
                  </TableRow>
                ) : filteredLeaveTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No leave types found matching your search." : "No leave types found. Create your first leave type to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaveTypes.map((leaveType) => {
                    const isEditing = editingType === leaveType.id

                    return (
                      <TableRow key={leaveType.id}>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editValues.name}
                              onChange={(e) => setEditValues(prev => ({ 
                                ...prev, 
                                name: e.target.value.toUpperCase().replace(/[^A-Z_]/g, '') 
                              }))}
                              className="w-40 h-8 font-mono"
                              placeholder="LEAVE_TYPE"
                            />
                          ) : (
                            <Badge className={`${getLeaveTypeColor(leaveType.name)} font-mono`}>
                              {leaveType.name}
                            </Badge>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                // --- FIX ---: Removed `|| ""` to correctly display 0
                                value={editValues.defaultAllocatedDays}
                                onChange={(e) => setEditValues(prev => ({ 
                                  ...prev, 
                                  defaultAllocatedDays: parseFloat(e.target.value) || 0 
                                }))}
                                className="w-20 h-8"
                                min="0"
                                max="365"
                                step="0.5"
                              />
                              <span className="text-sm text-muted-foreground">days</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{leaveType.defaultAllocatedDays}</span>
                              <span className="text-sm text-muted-foreground">days</span>
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {leaveType._count?.leaveRequests || 0}
                            </Badge>
                            <span className="text-sm text-muted-foreground">requests</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {leaveType._count?.leaveBalances || 0}
                            </Badge>
                            <span className="text-sm text-muted-foreground">employees</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(leaveType.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Button 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={() => handleUpdateLeaveType(leaveType.id)} 
                                disabled={isPending}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                className="h-8 w-8" 
                                variant="outline" 
                                onClick={() => setEditingType(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button 
                                size="icon" 
                                className="h-8 w-8" 
                                variant="outline" 
                                onClick={() => {
                                  setEditingType(leaveType.id)
                                  setEditValues({ 
                                    name: leaveType.name, 
                                    defaultAllocatedDays: leaveType.defaultAllocatedDays 
                                  })
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    variant="outline"
                                    disabled={(leaveType._count?.leaveRequests || 0) > 0 || (leaveType._count?.leaveBalances || 0) > 0}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Leave Type</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the leave type &quot;{leaveType.name}&quot;? 
                                      This action cannot be undone.
                                      {((leaveType._count?.leaveRequests || 0) > 0 || (leaveType._count?.leaveBalances || 0) > 0) && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                                          This leave type cannot be deleted because it has active requests or employee balances.
                                        </div>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteLeaveType(leaveType.id, leaveType.name)}
                                      disabled={(leaveType._count?.leaveRequests || 0) > 0 || (leaveType._count?.leaveBalances || 0) > 0}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
