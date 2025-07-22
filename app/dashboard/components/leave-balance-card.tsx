import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type LeaveBalance } from '@prisma/client';
import {
  Plane,
  HeartPulse,
  Briefcase,
  Ban,
  AlertTriangle,
  Users,
  Baby,
  HeartHandshake
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LeaveBalanceWithDetails extends LeaveBalance {
  leaveType: {
    id: string;
    name: string;
  };
}

type LeaveTypeName = 'VACATION' | 'SICK' | 'MANDATORY' | 'UNPAID' | 'EMERGENCY' | 'BEREAVEMENT' | 'PATERNITY' | 'MATERNITY';

interface LeaveBalanceCardProps {
  balances: LeaveBalanceWithDetails[];
}

const leaveTypeLabels: Record<LeaveTypeName, string> = {
  VACATION: 'Vacation',
  SICK: 'Sick Leave',
  MANDATORY: 'Mandatory',
  UNPAID: 'Unpaid',
  EMERGENCY: 'Emergency',
  BEREAVEMENT: 'Bereavement',
  PATERNITY: 'Paternity',
  MATERNITY: 'Maternity'
};

const leaveTypeIcons: Record<LeaveTypeName, React.ElementType> = {
    VACATION: Plane,
    SICK: HeartPulse,
    MANDATORY: Briefcase,
    UNPAID: Ban,
    EMERGENCY: AlertTriangle,
    BEREAVEMENT: Users,
    PATERNITY: Baby,
    MATERNITY: HeartHandshake
};

const leaveTypeProgressColors: Record<LeaveTypeName, string> = {
  VACATION: 'bg-blue-500',
  SICK: 'bg-rose-500',
  MANDATORY: 'bg-purple-500',
  UNPAID: 'bg-slate-400',
  EMERGENCY: 'bg-amber-500',
  BEREAVEMENT: 'bg-indigo-500',
  PATERNITY: 'bg-teal-500',
  MATERNITY: 'bg-pink-500'
};


export function LeaveBalanceCard({ balances }: LeaveBalanceCardProps) {
  const displayedLeaveTypes = ['VACATION', 'SICK', 'MANDATORY'];

  const filteredBalances = balances.filter(balance => 
    displayedLeaveTypes.includes(balance.leaveType.name)
  );

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Leave Balances</CardTitle>
        <CardDescription>Your key leave entitlements for {new Date().getFullYear()}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {filteredBalances.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">
              {balances.length === 0
                ? "No leave balances have been assigned for this year."
                : "Key leave balances (Vacation, Sick, Mandatory) are not available."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBalances.map((balance) => {
              const leaveTypeName = balance.leaveType.name as LeaveTypeName;
              const Icon = leaveTypeIcons[leaveTypeName];
              const remaining = balance.allocatedDays - balance.usedDays;
              // --- MODIFIED ---: The percentage now reflects the remaining balance, not the used amount.
              const percentage = balance.allocatedDays > 0 ? (remaining / balance.allocatedDays) * 100 : 0;
              
              if (!Icon) return null;

              return (
                <div key={balance.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {leaveTypeLabels[leaveTypeName]}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {remaining.toFixed(1)} <span className="text-xs text-muted-foreground">days left</span>
                    </span>
                  </div>
                  
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={cn("h-full transition-all duration-500", leaveTypeProgressColors[leaveTypeName])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                   <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Used: {balance.usedDays}</span>
                    <span>Total: {balance.allocatedDays}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
