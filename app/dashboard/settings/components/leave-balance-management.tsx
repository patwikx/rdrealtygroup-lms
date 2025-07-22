"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RefreshCw, TrendingUp, TrendingDown, Edit, Save, X, Search, Users } from "lucide-react"
import { useLeaveBalanceData } from "@/hooks/use-leave-balance-data"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { renewAllLeaveBalances, updateEmployeeLeaveBalance } from "@/lib/actions/leave-balance-actions"

// A string literal type for the names of leave types for type safety.
type LeaveTypeName = 'VACATION' | 'SICK' | 'MANDATORY' | 'UNPAID' | 'EMERGENCY' | 'BEREAVEMENT' | 'PATERNITY' | 'MATERNITY';

// This UI config can remain, as it's for presentation purposes.
const LEAVE_TYPE_COLORS: Record<LeaveTypeName, string> = {
  VACATION: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-800",
  SICK: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800",
  MANDATORY: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800",
  UNPAID: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600",
  EMERGENCY: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-800",
  BEREAVEMENT: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-800",
  PATERNITY: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-200 dark:border-cyan-800",
  MATERNITY: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/50 dark:text-pink-200 dark:border-pink-800",
}

export function LeaveBalanceManagement() {
  const [isPending, startTransition] = useTransition()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedLeaveType, setSelectedLeaveType] = useState("all")
  const [editingBalance, setEditingBalance] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ allocated: number; used: number }>({ allocated: 0, used: 0 })

  // --- MODIFIED ---: The hook now provides all necessary dynamic data.
  const { balancesSummary, employeeBalances, departments, leaveTypes, isLoading, refreshData } = useLeaveBalanceData(selectedYear)

  const filteredBalances = employeeBalances.filter((balance) => {
    const matchesSearch =
      balance.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      balance.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || balance.employee.department?.id === selectedDepartment
    // --- MODIFIED ---: Filter by the leave type's name from the nested object.
    const matchesLeaveType = selectedLeaveType === "all" || balance.leaveType.name === selectedLeaveType

    return matchesSearch && matchesDepartment && matchesLeaveType
  })

  const handleRenewAllBalances = () => {
    startTransition(async () => {
      try {
        // --- MODIFIED ---: `renewAllLeaveBalances` no longer needs default allocations.
        const result = await renewAllLeaveBalances(selectedYear + 1)
        if (result.success) {
          toast.success(`Leave balances renewed for ${selectedYear + 1}. ${result.data?.renewed} employees updated, ${result.data?.rollover} days rolled over.`)
          setSelectedYear(selectedYear + 1)
          refreshData()
        } else {
          toast.error(`${result.error}`)
        }
      } catch (error) {
        toast.error(`${error}`)
      }
    })
  }

  const handleUpdateBalance = (balanceId: string) => {
    startTransition(async () => {
      try {
        const result = await updateEmployeeLeaveBalance(balanceId, editValues.allocated, editValues.used)
        if (result.success) {
          toast.success("Leave balance updated successfully")
          setEditingBalance(null)
          refreshData()
        } else {
          toast.error(`${result.error}`)
        }
      } catch (error) {
        toast.error(`Failed to update leave balance. ${error}`)
      }
    })
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balancesSummary.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active employees with balances</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balancesSummary.totalAllocated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total days allocated this year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Used</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balancesSummary.totalUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total days used this year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balancesSummary.totalAllocated > 0
                ? `${((balancesSummary.totalUsed / balancesSummary.totalAllocated) * 100).toFixed(1)}%`
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">Overall leave usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>Employee Balances</CardTitle>
              <CardDescription>View, edit, and manage leave balances for all employees.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Renew Balances
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Renew Leave Balances for {selectedYear + 1}</DialogTitle>
                    <DialogDescription>
                      This will create new balances for all employees for {selectedYear + 1}. Unused vacation days will be rolled over based on the default values set in the database. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  {/* --- MODIFIED ---: Dynamically display leave types and their defaults from fetched data */}
                  <div className="grid grid-cols-2 gap-4 py-4">
                    {leaveTypes.map((leaveType) => (
                      <div key={leaveType.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">{leaveType.name.replace("_", " ")}</span>
                        <Badge variant="outline">{leaveType.defaultAllocatedDays} days</Badge>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button onClick={handleRenewAllBalances} disabled={isPending}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renew Balances
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Leave Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                {/* --- MODIFIED ---: Dynamically create select items from fetched leave types */}
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>{type.name.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead className="hidden lg:table-cell">Utilization</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin inline-block mr-2" />
                      Loading balances...
                    </TableCell>
                  </TableRow>
                ) : filteredBalances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No leave balances found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBalances.map((balance) => {
                    const remaining = balance.allocatedDays - balance.usedDays
                    const utilization = balance.allocatedDays > 0 ? (balance.usedDays / balance.allocatedDays) * 100 : 0
                    const isEditing = editingBalance === balance.id

                    return (
                      <TableRow key={balance.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{balance.employee.name?.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{balance.employee.name}</div>
                              <div className="text-sm text-muted-foreground">{balance.employee.employeeId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{balance.employee.department?.name || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          {/* --- MODIFIED ---: Use leaveType.name for color and label */}
                          <Badge className={`${LEAVE_TYPE_COLORS[balance.leaveType.name as LeaveTypeName]} whitespace-nowrap`}>
                            {balance.leaveType.name.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.allocated}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, allocated: Number.parseFloat(e.target.value) || 0 }))}
                              className="w-20 h-8"
                            />
                          ) : (
                            <span className="font-medium">{balance.allocatedDays}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.used}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, used: Number.parseFloat(e.target.value) || 0 }))}
                              className="w-20 h-8"
                            />
                          ) : (
                            <span className="font-medium">{balance.usedDays}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${remaining < 0 ? "text-red-600" : remaining < 5 ? "text-orange-600" : "text-green-600"}`}>
                            {isEditing ? editValues.allocated - editValues.used : remaining}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                              <div
                                className={`h-2 rounded-full ${utilization > 90 ? "bg-red-500" : utilization > 70 ? "bg-orange-500" : "bg-green-500"}`}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{utilization.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateBalance(balance.id)} disabled={isPending}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="icon" className="h-8 w-8" variant="outline" onClick={() => setEditingBalance(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="icon" className="h-8 w-8" variant="outline" onClick={() => {
                              setEditingBalance(balance.id)
                              setEditValues({ allocated: balance.allocatedDays, used: balance.usedDays })
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
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
