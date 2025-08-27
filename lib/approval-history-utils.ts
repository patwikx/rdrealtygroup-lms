import { RequestStatus } from '@prisma/client'
import { format } from 'date-fns'

// Status configuration for consistent styling
export const STATUS_CONFIG = {
  PENDING_MANAGER: {
    label: 'Pending Manager',
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⏳'
  },
  PENDING_HR: {
    label: 'Pending HR',
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '📋'
  },
  APPROVED: {
    label: 'Approved',
    variant: 'success' as const,
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅'
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: '❌'
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '🚫'
  }
} as const

// Type configuration
export const TYPE_CONFIG = {
  LEAVE: {
    label: 'Leave',
    className: 'border-blue-200 text-blue-800 bg-blue-50',
    icon: '🏖️'
  },
  OVERTIME: {
    label: 'Overtime',
    className: 'border-purple-200 text-purple-800 bg-purple-50',
    icon: '⏰'
  }
} as const

// Date formatting utilities
export const formatDate = (date: Date | null | undefined): string => {
  if (!date) return 'N/A'
  return format(new Date(date), 'MMM dd, yyyy')
}

export const formatDateTime = (date: Date | null | undefined): string => {
  if (!date) return 'N/A'
  return format(new Date(date), 'MMM dd, yyyy h:mm a')
}

export const formatTime = (date: Date | null | undefined): string => {
  if (!date) return 'N/A'
  return format(new Date(date), 'h:mm a')
}

// Duration calculation for overtime
export const calculateOvertimeDuration = (startTime: Date | null, endTime: Date | null): string => {
  if (!startTime || !endTime) return 'N/A'
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end.getTime() - start.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  if (diffHours < 1) {
    const diffMinutes = Math.round(diffMs / (1000 * 60))
    return `${diffMinutes} minutes`
  }
  
  const hours = Math.floor(diffHours)
  const minutes = Math.round((diffHours - hours) * 60)
  
  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }
  
  return `${hours}h ${minutes}m`
}

// Leave duration calculation
export const calculateLeaveDays = (startDate: Date | null, endDate: Date | null, session: string = 'FULL_DAY'): number => {
  if (!startDate || !endDate) return 0
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end date
  
  // Adjust for half-day sessions
  if (session === 'MORNING' || session === 'AFTERNOON') {
    return diffDays === 1 ? 0.5 : diffDays
  }
  
  return diffDays
}

// Priority levels for requests (for sorting/display purposes)
export const getRequestPriority = (status: RequestStatus): number => {
  const priorityMap = {
    PENDING_MANAGER: 1,
    PENDING_HR: 2,
    APPROVED: 3,
    REJECTED: 4,
    CANCELLED: 5
  }
  return priorityMap[status] || 6
}

// Get status color for charts/graphs
export const getStatusColor = (status: RequestStatus): string => {
  const colorMap = {
    PENDING_MANAGER: '#f59e0b', // yellow
    PENDING_HR: '#3b82f6',      // blue
    APPROVED: '#10b981',        // green
    REJECTED: '#ef4444',        // red
    CANCELLED: '#6b7280'        // gray
  }
  return colorMap[status] || '#6b7280'
}

// Search helpers
export const createSearchParams = (filters: Record<string, string | undefined>): URLSearchParams => {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value.trim() !== '') {
      params.set(key, value)
    }
  })
  
  return params
}

// Export types for reuse
export type ApprovalStatusKey = keyof typeof STATUS_CONFIG
export type ApprovalTypeKey = keyof typeof TYPE_CONFIG