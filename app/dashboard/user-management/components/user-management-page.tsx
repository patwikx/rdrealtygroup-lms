import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RegisterUserDialog } from "./register-user-dialog"
import { getDepartments, getUsers } from "@/lib/actions/user-actions"
import { UserTable } from "./users-table"

export default async function UsersPageWrapper() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions across your organization</p>
        </div>
        <RegisterUserDialog />
      </div>

      <Card>
        <CardContent>
          <Suspense fallback={<UserTableSkeleton />}>
            <UserTableWrapper />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

async function UserTableWrapper() {
  const [users, departments] = await Promise.all([getUsers(), getDepartments()])

  return <UserTable users={users} departments={departments} />
}

function UserTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}
