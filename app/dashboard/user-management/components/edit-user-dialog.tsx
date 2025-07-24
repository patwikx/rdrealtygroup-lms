"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter, // VISUAL: Imported for better structure
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// --- VISUAL: Imported icons for the form fields ---
import { Loader2, User as UserIcon, Badge, Mail, Users, Building, UserCheck } from "lucide-react"
import { EmployeeClassification, UserRole } from "@prisma/client"
import { Approver, Department, getApprovers, updateUser, User } from "@/lib/actions/user-actions"
import { toast } from "sonner"

// Original form schema (unchanged)
const formSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().optional(),
  employeeId: z.string().min(1, "Employee ID is required"),
  role: z.enum(UserRole),
  deptId: z.string().optional(),
  approverId: z.string().optional(),
  classification: z.enum(EmployeeClassification).optional(),
})

type FormData = z.infer<typeof formSchema>

interface EditUserDialogProps {
  user: User
  departments: Department[]
  children: React.ReactNode
}

export function EditUserDialog({ user, departments, children }: EditUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
    const [approvers, setApprovers] = useState<Approver[]>([])

  // Original useForm hook (unchanged)
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: user.id,
      name: user.name,
      email: user.email || undefined,
      employeeId: user.employeeId,
      role: user.role,
      deptId: user.deptId || "DEFAULT_DEPT_ID",
       approverId: undefined,
      classification: undefined,
    },
  })

  // Original useEffect hook (unchanged)
  useEffect(() => {
    if (open) {
      form.reset({
        id: user.id,
        name: user.name,
        email: user.email || undefined,
        employeeId: user.employeeId,
        role: user.role,
        deptId: user.deptId || "DEFAULT_DEPT_ID",
        approverId: user.approverId || undefined,
        classification: user.classification || undefined
      })
    }
  }, [open, user, form])

    useEffect(() => {
      if (open) {
        Promise.all([
          getApprovers().then(setApprovers).catch(console.error)
        ])
      }
    }, [open])

  // Original onSubmit function (unchanged)
  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      const result = await updateUser(data)

      if (result.success) {
        toast.success("Updated user successfully.")
        setOpen(false)
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {/* --- VISUAL: Using a grid layout for better spacing --- */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                        <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl>
                    {/* --- VISUAL: Added icon inside input --- */}
                    <div className="relative">
                      <Badge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="EMP001" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    {/* --- VISUAL: Added icon inside input --- */}
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="John Doe" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    {/* --- VISUAL: Added icon inside input --- */}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="john@company.com" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            {/* --- VISUAL: Grouped select fields in a responsive grid --- */}
<div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
  <FormField
    control={form.control}
    name="role"
    render={({ field }) => (
      <FormItem className="w-full min-w-0">
        <FormLabel className="flex items-center">
          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
          Role
        </FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
          </FormControl>
          <SelectContent className="w-full">
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />

              <FormField
                control={form.control}
                name="deptId"
                render={({ field }) => (
                  <FormItem className="w-full min-w-0">
                    <FormLabel className="flex items-center">
                      <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                      Department
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full">
                        {/* Original value prop */}
                        <SelectItem value="DEFAULT_DEPT_ID">No Department</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

             {/* --- NEW: Approver Selection Field --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
  control={form.control}
  name="approverId"
  render={({ field }) => (
    <FormItem className="w-full min-w-0">
      <FormLabel className="flex items-center">
        <UserCheck className="mr-2 h-4 w-4 text-muted-foreground" />
        Approver/Manager
      </FormLabel>
      <Select onValueChange={field.onChange} value={field.value || "none"}>
        <FormControl>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an approver" />
          </SelectTrigger>
        </FormControl>
        <SelectContent className="w-full">
          <SelectItem value="none">No Approver</SelectItem>
          {approvers.map((approver) => (
            <SelectItem key={approver.id} value={approver.id}>
              {approver.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>

             <FormField
  control={form.control}
  name="classification"
  render={({ field }) => (
    <FormItem className="w-full min-w-0">
      <FormLabel className="flex items-center">
        <Badge className="mr-2 h-4 w-4 text-muted-foreground" />
        Business Unit
      </FormLabel>
      <Select onValueChange={field.onChange} value={field.value || "none"}>
        <FormControl>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select business Unit" />
          </SelectTrigger>
        </FormControl>
        <SelectContent className="w-full">
          <SelectItem value="none">No Business Unit</SelectItem>
          <SelectItem value="RDRDC">RDRDC</SelectItem>
          <SelectItem value="RDHFSI">RDHFSI</SelectItem>
          <SelectItem value="TWC">TWC</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
            </div>

            {/* --- VISUAL: Moved buttons to a DialogFooter --- */}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {/* --- VISUAL: Improved loading text --- */}
                {isLoading ? "Saving..." : "Update User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}