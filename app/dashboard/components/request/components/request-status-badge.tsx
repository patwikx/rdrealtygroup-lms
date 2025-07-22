import { Badge } from '@/components/ui/badge'
import { RequestStatus } from '@prisma/client'

interface RequestStatusBadgeProps {
  status: RequestStatus
}

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const statusConfig = {
    [RequestStatus.PENDING_MANAGER]: {
      variant: 'secondary' as const,
      text: 'Pending Manager',
      color: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    [RequestStatus.PENDING_HR]: {
      variant: 'secondary' as const,
      text: 'Pending HR',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    [RequestStatus.APPROVED]: {
      variant: 'default' as const,
      text: 'Approved',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    [RequestStatus.REJECTED]: {
      variant: 'destructive' as const,
      text: 'Rejected',
      color: 'bg-red-100 text-red-800 border-red-200'
    },
    [RequestStatus.CANCELLED]: {
      variant: 'outline' as const,
      text: 'Cancelled',
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={config.color}>
      {config.text}
    </Badge>
  )
}