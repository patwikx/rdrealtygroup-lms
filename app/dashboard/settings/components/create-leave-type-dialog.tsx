"use client"

import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Loader2, Calendar, Clock, Info } from "lucide-react"
import { createLeaveType } from "@/lib/actions/leave-type-actions"
import { toast } from "sonner"

// ✅ Removed regex restriction here
const formSchema = z.object({
  name: z.string()
    .min(2, "Leave type name must be at least 2 characters")
    .max(50, "Leave type name must not exceed 50 characters"),
  defaultAllocatedDays: z.number()
    .min(0, "Default allocated days must be 0 or greater")
    .max(365, "Default allocated days cannot exceed 365"),
})

type FormData = z.infer<typeof formSchema>

export function CreateLeaveTypeDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      defaultAllocatedDays: 0,
    },
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      const result = await createLeaveType(data)

      if (result.success) {
        toast.success("Leave type created successfully.")
        form.reset()
        setOpen(false)
      } else {
        toast.error(result.message || "Failed to create leave type.")
      }
    } catch (error) {
      console.error("Create leave type error:", error)
      toast.error("Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ No more auto-formatting — user types freely
  const handleNameChange = (value: string) => {
    form.setValue('name', value)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Leave Type
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            Create New Leave Type
          </DialogTitle>
          <DialogDescription>
            Define a new type of leave that employees can request. This will be available for all users to select when submitting leave requests.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    Leave Type Name
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input 
                        placeholder="Vacation Leave"
                        {...field}
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                      <div className="flex items-start space-x-2 text-xs text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                        <Info className="h-3 w-3 mt-0.5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-800 mb-1">Naming Tips:</p>
                          <ul className="space-y-1 text-blue-700">
                            <li>• You can use letters, spaces, or underscores</li>
                            <li>• Examples: Vacation Leave, Sick Leave, Mandatory</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultAllocatedDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    Default Allocated Days (per year)
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input 
                          type="number"
                          placeholder="21"
                          min="0"
                          max="365"
                          step="0.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="pl-10"
                        />
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-md border">
                        <p className="font-medium mb-1">Common Allocations:</p>
                        <div className="grid grid-cols-3 gap-3">
                          <span>• VL: 10 days</span>
                          <span className="whitespace-nowrap">• SL: 15 days</span>
                          <span>• ML: 5 days</span>
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)} 
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Creating..." : "Create Leave Type"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
