"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building2, Calendar, Shield, User, Mail, Hash } from "lucide-react"
import { UserProfile } from "@/lib/types/account-profile"
import { UserRole, EmployeeClassification } from "@prisma/client"
import { format } from "date-fns"
import Image from "next/image"

interface ProfileHeaderProps {
  profile: UserProfile
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      [UserRole.USER]: { variant: "secondary" as const, color: "bg-blue-100 text-blue-800 border-blue-200" },
      [UserRole.MANAGER]: { variant: "default" as const, color: "bg-green-100 text-green-800 border-green-200" },
      [UserRole.HR]: { variant: "default" as const, color: "bg-purple-100 text-purple-800 border-purple-200" },
      [UserRole.ADMIN]: { variant: "destructive" as const, color: "bg-red-100 text-red-800 border-red-200" }
    }

    const config = roleConfig[role]
    return (
      <Badge variant={config.variant} className={`${config.color} font-medium`}>
        <Shield className="w-3 h-3 mr-1" />
        {role}
      </Badge>
    )
  }

  const getClassificationBadge = (classification: EmployeeClassification | null) => {
    if (!classification) return null

    const classificationConfig = {
      [EmployeeClassification.RDRDC]: { color: "bg-orange-100 text-orange-800 border-orange-200" },
      [EmployeeClassification.RDHFSI]: { color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
      [EmployeeClassification.TWC]: { color: "bg-indigo-100 text-indigo-800 border-indigo-200" }
    }

    const config = classificationConfig[classification]
    return (
      <Badge variant="outline" className={`${config.color} font-medium`}>
        <Building2 className="w-3 h-3 mr-1" />
        {classification}
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="border-2 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
{/* Profile Picture and Info */}
<div className="flex flex-col items-center gap-y-4">
  {/* Picture Box */}
  <div className="w-48 h-48 bg-gray-200 rounded-lg shadow-md overflow-hidden">
    <Image
      src="https://4b9moeer4y.ufs.sh/f/pUvyWRtocgCVbeTTKw0Arpg1t3Ahk2I08Jdj7noqmlKwvXQi" // Fake 192x192 image
      alt="Profile"
      className="w-full h-full object-cover"
      width={192}
      height={192}
    />
  </div>

  {/* Name and Badges */}
  <div className="text-center space-y-2">
    <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
    <div className="flex flex-wrap justify-center gap-2">
      {getRoleBadge(profile.role)}
      {getClassificationBadge(profile.classification)}
    </div>
  </div>
</div>

          {/* Details Grid */}
          <div className="flex-1 lg:ml-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-semibold">{profile.employeeId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold truncate">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-semibold">{profile.department?.name || "Not assigned"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reports To</p>
                  <p className="font-semibold">
                    {profile.approver ? `${profile.approver.name}` : "No manager assigned"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-semibold">{format(profile.createdAt, "MMM d, yyyy")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-semibold">{format(profile.updatedAt, "MMM d, yyyy")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}