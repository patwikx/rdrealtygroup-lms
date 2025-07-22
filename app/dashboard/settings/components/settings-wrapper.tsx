import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Users, Building2, Shield } from "lucide-react"
import { auth } from "@/auth" // Corrected auth import
import { DepartmentManagement } from "./department-management"
import { SystemSettings } from "./system-settings"
import UsersPageWrapper from "../../user-management/components/user-management-page"

export default async function SettingsPageWrapper() {
  const session = await auth()

  // Redirect if user is not an HR or ADMIN
  if (!session?.user || (session.user.role !== "HR" && session.user.role !== "ADMIN")) {
    redirect("/unauthorized")
  }

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900/30">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
            <p className="text-muted-foreground">Manage employees, departments, and system settings.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="employees" className="space-y-8">
          {/* --- MODIFIED ---: Centered the TabsList and adjusted grid columns */}
          <div className="flex justify-center">
            <TabsList className="grid w-auto grid-cols-3 items-center rounded-lg bg-white dark:bg-gray-800">
                            <TabsTrigger
                value="employees"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="h-4 w-4" />
                Employees
              </TabsTrigger>
              <TabsTrigger
                value="departments"
                className="flex items-center gap-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Building2 className="h-4 w-4" />
                Departments
              </TabsTrigger>

              <TabsTrigger
                value="system"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Shield className="h-4 w-4" />
                System
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="departments" className="space-y-6">
            <Suspense fallback={<SettingsSkeleton />}>
              <DepartmentManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Suspense fallback={<SettingsSkeleton />}>
              <UsersPageWrapper />
            </Suspense>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Suspense fallback={<SettingsSkeleton />}>
              <SystemSettings />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-3 w-full mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
