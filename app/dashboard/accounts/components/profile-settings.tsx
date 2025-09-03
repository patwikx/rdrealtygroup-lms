"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Lock, Save, Eye, EyeOff } from "lucide-react"
import { UserProfile, UpdateProfileData, ChangePasswordData } from "@/lib/types/account-profile"
import { updateProfile, changePassword } from "@/lib/actions/user-profile"
import { toast } from "sonner"

interface ProfileSettingsProps {
  profile: UserProfile
}

export function ProfileSettings({ profile }: ProfileSettingsProps) {
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const profileFormRef = useRef<HTMLFormElement>(null)
  const passwordFormRef = useRef<HTMLFormElement>(null)

  const [profileData, setProfileData] = useState<UpdateProfileData>({
    name: profile.name,
    email: profile.email
  })

  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handleProfileUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submission
    if (isUpdatingProfile) return
    
    setIsUpdatingProfile(true)

    try {
      const result = await updateProfile(profileData)
      
      if (result.success) {
        toast.success(result.message || "Profile updated successfully")
      } else {
        toast.error(result.message || "Failed to update profile")
      }
    } catch (error) {
      toast.error("An error occurred while updating profile")
      console.error("Profile update error:", error)
    } finally {
      setIsUpdatingProfile(false)
    }
  }, [profileData, isUpdatingProfile])

  const handlePasswordChange = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submission
    if (isChangingPassword) return
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    setIsChangingPassword(true)

    try {
      const result = await changePassword(passwordData)
      
      if (result.success) {
        toast.success(result.message || "Password changed successfully")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
        // Reset form
        passwordFormRef.current?.reset()
      } else {
        toast.error(result.message || "Failed to change password")
      }
    } catch (error) {
      toast.error("An error occurred while changing password")
      console.error("Password change error:", error)
    } finally {
      setIsChangingPassword(false)
    }
  }, [passwordData, isChangingPassword])

  const togglePasswordVisibility = useCallback((field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }, [])

  const handleProfileDataChange = useCallback((field: keyof UpdateProfileData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfileData(prev => ({ ...prev, [field]: e.target.value }))
    }, [])

  const handlePasswordDataChange = useCallback((field: keyof ChangePasswordData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordData(prev => ({ ...prev, [field]: e.target.value }))
    }, [])

  // Memoize password inputs to prevent unnecessary re-renders
  const passwordInputs = useMemo(() => [
    {
      id: "currentPassword",
      label: "Current Password",
      value: passwordData.currentPassword,
      onChange: handlePasswordDataChange("currentPassword"),
      show: showPasswords.current,
      toggle: () => togglePasswordVisibility('current'),
      placeholder: "Enter your current password",
      colSpan: "col-span-full"
    },
    {
      id: "newPassword",
      label: "New Password",
      value: passwordData.newPassword,
      onChange: handlePasswordDataChange("newPassword"),
      show: showPasswords.new,
      toggle: () => togglePasswordVisibility('new'),
      placeholder: "Enter new password",
      colSpan: "col-span-full md:col-span-1"
    },
    {
      id: "confirmPassword",
      label: "Confirm New Password",
      value: passwordData.confirmPassword,
      onChange: handlePasswordDataChange("confirmPassword"),
      show: showPasswords.confirm,
      toggle: () => togglePasswordVisibility('confirm'),
      placeholder: "Confirm new password",
      colSpan: "col-span-full md:col-span-1"
    }
  ], [passwordData, showPasswords, handlePasswordDataChange, togglePasswordVisibility])

  // Memoize read-only fields
  const readOnlyFields = useMemo(() => [
    { label: "Employee ID", value: profile.employeeId },
    { label: "Role", value: profile.role },
    { label: "Department", value: profile.department?.name || "Not assigned" },
    { label: "Business Unit", value: profile.classification || "Not assigned" }
  ], [profile])

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={profileFormRef} onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={handleProfileDataChange("name")}
                  placeholder="Enter your full name"
                  required
                  disabled={isUpdatingProfile}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email || ""}
                  onChange={handleProfileDataChange("email")}
                  placeholder="Enter your email address"
                  required
                  disabled={isUpdatingProfile}
                />
              </div>
            </div>

            {/* Read-only fields */}
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readOnlyFields.map((field) => (
                <div key={field.label} className="space-y-2">
                  <Label>{field.label}</Label>
                  <div className="flex items-center gap-2">
                    <Input value={field.value} disabled />
                    <Badge variant="outline">Read-only</Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={isUpdatingProfile}
                className="min-w-[120px]"
              >
                {isUpdatingProfile ? (
                  "Updating..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <span>Change Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={passwordFormRef} onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {passwordInputs.map((input) => (
                <div key={input.id} className={input.colSpan}>
                  <div className="space-y-2">
                    <Label htmlFor={input.id}>{input.label}</Label>
                    <div className="relative">
                      <Input
                        id={input.id}
                        type={input.show ? "text" : "password"}
                        value={input.value}
                        onChange={input.onChange}
                        placeholder={input.placeholder}
                        required
                        minLength={input.id !== "currentPassword" ? 8 : 1}
                        disabled={isChangingPassword}
                        autoComplete={
                          input.id === "currentPassword" ? "current-password" : 
                          input.id === "newPassword" ? "new-password" : "new-password"
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={input.toggle}
                        disabled={isChangingPassword}
                        tabIndex={-1}
                      >
                        {input.show ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm text-muted-foreground">
              Password must be at least 8 characters long and contain a mix of letters, numbers, and special characters.
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={isChangingPassword}
                className="min-w-[140px]"
              >
                {isChangingPassword ? (
                  "Changing..."
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}