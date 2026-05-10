// Admin and User Management Types

export interface Organization {
  id: string
  name: string
  subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'SUSPENDED'
  planType: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
  settings?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  userOrganizations?: UserOrganization[]
}

export interface User {
  id: string
  email: string
  isSuperAdmin: boolean
  currentOrganizationId?: string
  quotaLimit: number
  plan: 'FREE' | 'PRO'
  apiKey: string
  createdAt: Date
  updatedAt: Date
  userOrganizations?: UserOrganization[]
}

export interface UserOrganization {
  id: string
  userId: string
  organizationId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  isActive: boolean
  joinedAt: Date
  user?: User
  organization?: Organization
}

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export type Permission = 
  | 'inventory:read'
  | 'inventory:write'
  | 'inventory:delete'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'reports:read'
  | 'reports:write'
  | 'settings:read'
  | 'settings:write'
  | 'billing:read'
  | 'billing:write'

export interface AdminStats {
  totalOrganizations: number
  totalUsers: number
  activeOrganizations: number
  totalRevenue: number
  newOrganizationsThisMonth: number
  newUsersThisMonth: number
  systemHealth: {
    databaseConnections: number
    apiResponseTime: number
    errorRate: number
  }
}

export interface UserInvitation {
  id: string
  email: string
  organizationId: string
  role: UserRole
  invitedBy: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: Date
  createdAt: Date
}

export interface AuditLog {
  id: string
  userId: string
  organizationId: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  createdAt: Date
}

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    'inventory:read', 'inventory:write', 'inventory:delete',
    'users:read', 'users:write', 'users:delete',
    'reports:read', 'reports:write',
    'settings:read', 'settings:write',
    'billing:read', 'billing:write'
  ],
  ADMIN: [
    'inventory:read', 'inventory:write', 'inventory:delete',
    'users:read', 'users:write',
    'reports:read', 'reports:write',
    'settings:read', 'settings:write',
    'billing:read'
  ],
  MEMBER: [
    'inventory:read', 'inventory:write',
    'reports:read'
  ]
}

// Helper functions
export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
  return userPermissions.includes(requiredPermission)
}

export const getUserPermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || []
}

export const isSuperAdmin = (user: User): boolean => {
  return user.isSuperAdmin
}

export const isOrgAdmin = (role: UserRole): boolean => {
  return role === 'ADMIN' || role === 'OWNER'
}

export const canManageUsers = (role: UserRole): boolean => {
  return role === 'ADMIN' || role === 'OWNER'
}
