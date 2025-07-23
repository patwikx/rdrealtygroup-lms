"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import { LeaveBalance, LeaveType } from "@prisma/client"

interface LeaveBalancesProps {
 balances: (LeaveBalance & { leaveType: LeaveType })[]
}

export function LeaveBalances({ balances }: LeaveBalancesProps) {
 if (balances.length === 0) {
  return (
   <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
     <div className="p-4 bg-muted/50 rounded-full mb-4">
      <Calendar className="h-8 w-8 text-muted-foreground" />
     </div>
     <h3 className="text-lg font-semibold mb-2">No Leave Balances</h3>
     <p className="text-muted-foreground text-center max-w-md">
      No leave balances have been set up for the current year.
     </p>
    </CardContent>
   </Card>
  )
 }

 return (
  <Card>
   <CardHeader>
    <CardTitle>Leave Balances - {new Date().getFullYear()}</CardTitle>
   </CardHeader>
   <CardContent className="p-0">
        {/* Use a Table for maximum compactness */}
    <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Leave Type</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
            </TableRow>
          </TableHeader>
     <TableBody>
      {balances.map((balance) => {
       const usagePercentage = balance.allocatedDays > 0 
        ? (balance.usedDays / balance.allocatedDays) * 100 
        : 0
       const remainingDays = balance.allocatedDays - balance.usedDays

       return (
              <TableRow key={balance.id}>
                <TableCell className="font-medium">{balance.leaveType.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={usagePercentage} className="h-2 w-[100px]" />
                    <span className="text-xs text-muted-foreground">
                      {balance.usedDays}/{balance.allocatedDays}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={remainingDays > 0 ? "outline" : "destructive"}>
                    {remainingDays}
                  </Badge>
                </TableCell>
              </TableRow>
      )
     })}
     </TableBody>
    </Table>
   </CardContent>
  </Card>
 )
}