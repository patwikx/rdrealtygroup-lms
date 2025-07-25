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
  DialogFooter,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// --- VISUAL: Imported new icons for the input fields ---
import { UserPlus, Loader2, User, Badge, Mail, KeyRound, Building, Users, UserCheck } from "lucide-react"
import { UserRole, EmployeeClassification } from "@prisma/client"
import { getDepartments, getApprovers, registerUser, type Approver } from "@/lib/actions/user-actions"
import { toast } from "sonner"

// Updated form schema to include approverId
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().optional(),
  employeeId: z.string().min(1, "Employee ID is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(UserRole),
  deptId: z.string().optional(),
  approverId: z.string().optional(),
  classification: z.enum(EmployeeClassification).optional(),
})

type FormData = z.infer<typeof formSchema>

export function RegisterUserDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [approvers, setApprovers] = useState<Approver[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: undefined,
      employeeId: "",
      password: "",
      role: UserRole.USER,
      deptId: undefined,
      approverId: undefined,
      classification: undefined,
    },
  })

  useEffect(() => {
    if (open) {
      Promise.all([
        getDepartments().then(setDepartments).catch(console.error),
        getApprovers().then(setApprovers).catch(console.error)
      ])
    }
  }, [open])

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      // Convert undefined values to undefined for optional fields
      const submitData = {
        ...data,
        deptId: data.deptId === undefined ? undefined : data.deptId,
        approverId: data.approverId === undefined ? undefined : data.approverId,
        classification: data.classification === undefined ? undefined : data.classification,
      }

      const result = await registerUser(submitData)

      if (result.success) {
        toast.success("User registered successfully.")
        form.reset()
        setOpen(false)
      } else {
        toast.error(result.message || "Failed to register user.")
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Register User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system. They can log in with the provided credentials.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {/* --- VISUAL: Changed to a single column grid for better icon alignment --- */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
<div className="grid grid-cols-[100px_1fr] gap-4">
  <FormField
    control={form.control}
    name="employeeId"
    render={({ field }) => (
      <FormItem className="w-[100px]">
        <FormLabel>Employee ID</FormLabel>
        <FormControl>
          <div className="relative">
            <Badge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="X-000" {...field} className="pl-10" required />
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
      <FormItem className="w-full">
        <FormLabel>Full Name</FormLabel>
        <FormControl>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Juan Dela Cruz" {...field} className="pl-10" />
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

           

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    {/* --- VISUAL: Added icon inside input --- */}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="example@email.com" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    {/* --- VISUAL: Added icon inside input --- */}
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* --- VISUAL: Kept select fields in a responsive grid --- */}
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
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
          </FormControl>
          <SelectContent className="w-full">
            <SelectItem value="none">No Department</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an approver" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full">
                        <SelectItem value="none">No Approver</SelectItem>
                        {approvers.map((approver) => (
                          <SelectItem key={approver.id} value={approver.id}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex flex-col">
                                <span className="font-medium">{approver.name}</span>
                              </div>
                            </div>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Registering..." : "Register User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}