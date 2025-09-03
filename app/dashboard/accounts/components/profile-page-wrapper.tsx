"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, User } from "lucide-react"

import { getUserProfile, getUserStats } from "@/lib/actions/user-profile"
import { UserProfile, UserStats } from "@/lib/types/account-profile"
import { ProfileHeader } from "./profile-header"
import { AccountStats } from "./account-stats"
import { ProfileSettings } from "./profile-settings"

export default function AccountPageWrapper() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [profileData, statsData] = await Promise.all([
        getUserProfile(),
        getUserStats(),
      ])

      setProfile(profileData)
      setStats(statsData)
    } catch (error) {
      console.error("Error fetching account data:", error)
      setError("Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Memoize loading skeleton to prevent unnecessary re-renders
  const loadingSkeleton = useMemo(() => (
    <div className="w-full space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Profile Header Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex flex-col items-center gap-y-4">
              <Skeleton className="w-48 h-48 rounded-lg" />
              <div className="text-center space-y-2">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
            <div className="flex-1 lg:ml-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leave Usage Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-3 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-8 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Skeleton */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
              <Skeleton className="h-10 w-32 ml-auto" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-36 ml-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ), [])

  // Memoize error state to prevent unnecessary re-renders
  const errorState = useMemo(() => (
    <div className="w-full">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-muted/50 rounded-full mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Unable to load profile</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            {error || "There was an error loading your profile information. Please try refreshing the page."}
          </p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Retrying...' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    </div>
  ), [error, handleRefresh, refreshing])

  // Show loading skeleton while data is being fetched
  if (loading) {
    return loadingSkeleton
  }

  // Show error state if data couldn't be loaded
  if (error || !profile || !stats) {
    return errorState
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
            <p className="text-muted-foreground mt-1">
              Manage your profile and view statistics
            </p>
          </div>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Components are now stacked vertically in a logical order */}
      <ProfileHeader profile={profile} />
      <ProfileSettings profile={profile} />
      <AccountStats stats={stats} />
    </div>
  )
}