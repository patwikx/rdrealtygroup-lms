"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { UserPlus, Search, Edit, Trash2, Users, Crown, Shield, User, RefreshCw } from "lucide-react"
import type { UserRole } from "@prisma/client"
import { useEmployeeData } from "@/hooks/use-employee-data"
import { createEmployee } from "@/lib/actions/leave-balance-actions"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

const USER_ROLES: UserRole[] = ["USER", "MANAGER", "HR", "ADMIN"]

const ROLE_COLORS: Record<UserRole, string> = {
  USER: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-800",
  MANAGER: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800",
  HR: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-800",
  ADMIN: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800",
}

const ROLE_ICONS: Record<UserRole, React.ReactElement> = {
  USER: <User className="h-4 w-4" />,
  MANAGER: <Crown className="h-4 w-4" />,
  HR: <Users className="h-4 w-4" />,
  ADMIN: <Shield className="h-4 w-4" />,
}

export function EmployeeManagement() {
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    employeeId: "",
    role: "USER" as UserRole,
    departmentId: "",
  })

  const { employees, departments, isLoading, refreshData } = useEmployeeData()

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || employee.department?.id === selectedDepartment
    const matchesRole = selectedRole === "all" || employee.role === selectedRole

    return matchesSearch && matchesDepartment && matchesRole
  })

  const handleCreateEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.employeeId) {
      toast.error("All fields are required.")
      return
    }

    startTransition(async () => {
      try {
        const result = await createEmployee(newEmployee)
        if (result.success) {
          toast.success("Employee created successfully")
          setNewEmployee({ name: "", email: "", employeeId: "", role: "USER", departmentId: "" })
          setIsCreateDialogOpen(false)
          refreshData()
        } else {
          toast.error(`${result.error}`)
        }
      } catch (error) {
        toast.error(`Failed to create employee: ${error}`)
      }
    })
  }

  const roleStats = USER_ROLES.reduce(
    (acc, role) => {
      acc[role] = employees.filter((emp) => emp.role === role).length
      return acc
    },
    {} as Record<UserRole, number>
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {USER_ROLES.map((role) => (
          <Card key={role}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{role}S</CardTitle>
              {ROLE_ICONS[role]}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roleStats[role] || 0}</div>
              <p className="text-xs text-muted-foreground">
                {employees.length > 0 ? `${((roleStats[role] || 0) / employees.length * 100).toFixed(1)}% of total` : "0.0% of total"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employee Directory Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>View, add, and manage all employee records.</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Employee</DialogTitle>
                  <DialogDescription>Add a new employee to the system. A default password will be set.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={newEmployee.name} onChange={(e) => setNewEmployee((prev) => ({ ...prev, name: e.target.value }))} placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={newEmployee.email} onChange={(e) => setNewEmployee((prev) => ({ ...prev, email: e.target.value }))} placeholder="Enter email address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input id="employeeId" value={newEmployee.employeeId} onChange={(e) => setNewEmployee((prev) => ({ ...prev, employeeId: e.target.value }))} placeholder="Enter employee ID" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newEmployee.role} onValueChange={(value: UserRole) => setNewEmployee((prev) => ({ ...prev, role: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">{ROLE_ICONS[role]} {role}</div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department (Optional)</Label>
                    <Select value={newEmployee.departmentId} onValueChange={(value) => setNewEmployee((prev) => ({ ...prev, departmentId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Department</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateEmployee} disabled={isPending}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Employee
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="All Roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
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
                  <TableHead className="hidden lg:table-cell">Employee ID</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin inline-block mr-2" />
                      Loading employees...
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No employees found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{employee.name?.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground hidden md:block">
                              Joined {new Date(employee.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{employee.employeeId}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{employee.email}</TableCell>
                      <TableCell>
                        <Badge className={`${ROLE_COLORS[employee.role]} whitespace-nowrap`}>
                          <div className="flex items-center gap-1.5">
                            {ROLE_ICONS[employee.role]}
                            {employee.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {employee.department ? (
                          <Badge variant="secondary">{employee.department.name}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="destructive" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
