"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, Database, Clock, Bell, Download, RefreshCw, Settings } from "lucide-react"

export function SystemSettings() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column for Main Configurations */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Manage system-wide policies, workflows, and notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Leave Policies Section */}
            <div>
              <h4 className="text-md font-semibold mb-3">Leave Policies</h4>
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Maximum Vacation Rollover</p>
                  <Badge variant="secondary">5 days</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Advance Leave Booking</p>
                  <Badge variant="secondary">365 days</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Minimum Notice Period</p>
                  <Badge variant="secondary">7 days</Badge>
                </div>
              </div>
            </div>

            {/* Approval Workflow Section */}
            <div>
              <h4 className="text-md font-semibold mb-3">Approval Workflow</h4>
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Manager Approval Required</p>
                  <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20">Enabled</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">HR Final Approval</p>
                  <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20">Enabled</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Auto-Approval Threshold</p>
                  <Badge variant="secondary">2 days</Badge>
                </div>
              </div>
            </div>

            {/* Notification Settings Section */}
            <div>
              <h4 className="text-md font-semibold mb-3">Notification Settings</h4>
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Email Alerts for Requests</p>
                  <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20">Enabled</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Manager Pending Notifications</p>
                  <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20">Enabled</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Low Balance Alerts</p>
                   <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50 dark:bg-red-900/20">Disabled</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column for Status & Data */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Overall Status</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20">Healthy</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-900/20">Connected</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Last Backup</span>
              </div>
              <span className="text-sm text-muted-foreground">2h ago</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data & Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                <Download className="h-4 w-4" /> Export All Records
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                <RefreshCw className="h-4 w-4" /> Create Manual Backup
              </Button>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-2 text-center mt-4">
              <div>
                <p className="text-xs text-muted-foreground">DB Size</p>
                <p className="font-semibold">2.4 GB</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Records</p>
                <p className="font-semibold">15,847</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="font-semibold">99.9%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
