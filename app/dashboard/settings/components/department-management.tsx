"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Building2, Plus, Users, Crown, Trash2, Edit, UserPlus, UserMinus, Search, RefreshCw, AlertTriangle } from "lucide-react"
import { useDepartmentData } from "@/hooks/use-department-data"
import { addManagerToDepartment, createDepartment, deleteDepartment, removeManagerFromDepartment, updateDepartment } from "@/lib/actions/leave-balance-actions"
import { toast } from "sonner"

export function DepartmentManagement() {
  const [isPending, startTransition] = useTransition()
  const [newDepartmentName, setNewDepartmentName] = useState("")
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedManagerId, setSelectedManagerId] = useState("")
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("")
  const [isAssignManagerOpen, setIsAssignManagerOpen] = useState(false)
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false)

  const { departments, availableManagers, isLoading, refreshData } = useDepartmentData()

  const filteredDepartments = departments.filter((dept) => dept.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCreateDepartment = () => {
    if (!newDepartmentName.trim()) {
      toast.error("Department name is required.")
      return
    }
    startTransition(async () => {
      const result = await createDepartment(newDepartmentName.trim())
      if (result.success) {
        toast.success(`${result.success}`)
        setNewDepartmentName("")
        setIsCreateDeptOpen(false)
        refreshData()
      } else {
        toast.error(`${result.error}`)
      }
    })
  }

  const handleUpdateDepartment = (departmentId: string) => {
    if (!editName.trim()) return
    startTransition(async () => {
      const result = await updateDepartment(departmentId, editName.trim())
      if (result.success) {
        toast.success("Department updated successfully.")
        setEditingDepartment(null)
        setEditName("")
        refreshData()
      } else {
        toast.error(`${result.error}`)
      }
    })
  }

  const handleAddManager = () => {
    if (!selectedDepartmentId || !selectedManagerId) return
    startTransition(async () => {
      const result = await addManagerToDepartment(selectedDepartmentId, selectedManagerId)
      if (result.success) {
        toast.success(`${result.success}`)
        setSelectedDepartmentId("")
        setSelectedManagerId("")
        setIsAssignManagerOpen(false)
        refreshData()
      } else {
        toast.error(`${result.error}`)
      }
    })
  }

  const handleRemoveManager = (departmentId: string, managerId: string) => {
    startTransition(async () => {
      const result = await removeManagerFromDepartment(departmentId, managerId)
      if (result.success) {
        toast.success(`${result.success}`)
        refreshData()
      } else {
        toast.error(`${result.error}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.reduce((acc, dept) => acc + dept.managers.length, 0)}</div>
            <p className="text-xs text-muted-foreground">Managers assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.reduce((acc, dept) => acc + dept.members.length, 0)}</div>
            <p className="text-xs text-muted-foreground">Across all departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Managers</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableManagers.length}</div>
            <p className="text-xs text-muted-foreground">Ready to be assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Management Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>Department Directory</CardTitle>
              <CardDescription>Create, manage, and assign managers to departments.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isAssignManagerOpen} onOpenChange={setIsAssignManagerOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <UserPlus className="h-4 w-4" /> Assign Manager
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Assign Manager to Department
                    </DialogTitle>
                    <DialogDescription>Select a department and an available manager to assign.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (<SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Manager</Label>
                      <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                        <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                        <SelectContent>
                          {availableManagers.map((manager) => (<SelectItem key={manager.id} value={manager.id}>{manager.name} ({manager.employeeId})</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleAddManager} disabled={isPending || !selectedDepartmentId || !selectedManagerId}>Assign</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={isCreateDeptOpen} onOpenChange={setIsCreateDeptOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Create Department</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Create New Department
                    </DialogTitle>
                    <DialogDescription>Add a new department to your organization.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="department-name">Department Name</Label>
                    <Input id="department-name" value={newDepartmentName} onChange={(e) => setNewDepartmentName(e.target.value)} placeholder="e.g., Marketing" />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleCreateDepartment} disabled={isPending || !newDepartmentName.trim()}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search departments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p>Loading departments...</p>
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No departments found. Create your first department to get started.</p>
              </div>
            ) : (
              filteredDepartments.map((department) => (
                <Card key={department.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg"><Building2 className="h-5 w-5 text-primary" /></div>
                        <div>
                          {editingDepartment === department.id ? (
                            <div className="flex items-center gap-2">
                              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                              <Button size="sm" onClick={() => handleUpdateDepartment(department.id)} disabled={isPending}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingDepartment(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <CardTitle className="text-lg">{department.name}</CardTitle>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingDepartment !== department.id && (
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => { setEditingDepartment(department.id); setEditName(department.name); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="destructive" className="h-8 w-8" disabled={department.members.length > 0}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Delete Department
                              </DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete <strong>{department.name}</strong>? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="sm:justify-start mt-4">
                              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => startTransition(async () => {
                                  const result = await deleteDepartment(department.id);
                                  if (result.success) { toast.success(`${result.success}`); refreshData(); }
                                })}
                              >
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3"><Crown className="h-4 w-4 text-amber-500" /> <span className="font-medium text-sm">Managers ({department.managers.length})</span></div>
                      {department.managers.length === 0 ? (
                        <p className="text-sm text-muted-foreground ml-6">No managers assigned.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 ml-6">
                          {department.managers.map((manager) => (
                            <div key={manager.id} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-1">
                              <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{manager.name?.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                              <span className="text-sm font-medium">{manager.name}</span>
                              <Button size="icon" variant="ghost" onClick={() => handleRemoveManager(department.id, manager.id)} className="h-6 w-6 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-3"><Users className="h-4 w-4 text-blue-500" /> <span className="font-medium text-sm">Team Members ({department.members.length})</span></div>
                      {department.members.length === 0 ? (
                        <p className="text-sm text-muted-foreground ml-6">No team members in this department.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 ml-6">
                          {department.members.slice(0, 7).map((member) => (<Badge key={member.id} variant="secondary" className="font-normal">{member.name}</Badge>))}
                          {department.members.length > 7 && (<Badge variant="outline">+{department.members.length - 7} more</Badge>)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
