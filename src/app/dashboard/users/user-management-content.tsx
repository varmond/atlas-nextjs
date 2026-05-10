"use client"

import React, { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// Simple toast function - replace with your preferred toast library
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message)
}
import { UserPlus, Mail, Users, Shield, Crown, User } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"

interface UserWithRole {
  id: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: string
  isActive: boolean
  quotaLimit: number
  plan: 'FREE' | 'PRO'
}

const UserRoleBadge = React.memo(({ role }: { role: string }) => {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { icon: Crown, color: 'bg-purple-100 text-purple-800', label: 'Owner' }
      case 'ADMIN':
        return { icon: Shield, color: 'bg-blue-100 text-blue-800', label: 'Admin' }
      case 'MEMBER':
        return { icon: User, color: 'bg-gray-100 text-gray-800', label: 'Member' }
      default:
        return { icon: User, color: 'bg-gray-100 text-gray-800', label: role }
    }
  }

  const config = getRoleConfig(role)
  const Icon = config.icon

  return (
    <Badge className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  )
})

UserRoleBadge.displayName = 'UserRoleBadge'

const InviteUserDialog = React.memo(({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')
  const [isLoading, setIsLoading] = useState(false)

  const inviteUserMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      // For now, we'll just create a user directly
      // In production, you'd send an invitation email
      const response = await client.admin.inviteUser.$post({
        json: data
      })
      return response.json()
    },
    onSuccess: () => {
      toast.success("User invited successfully!")
      setOpen(false)
      setEmail("")
      setRole('MEMBER')
      onSuccess()
    },
    onError: (error) => {
      toast.error("Failed to invite user")
      console.error("Invite error:", error)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      await inviteUserMutation.mutateAsync({ email, role })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User to Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'ADMIN' | 'MEMBER') => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Inviting..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
})

InviteUserDialog.displayName = 'InviteUserDialog'

function UserManagementContent() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  // Fetch organization users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["organization-users"],
    queryFn: async () => {
      const response = await client.admin.getOrganizationUsers.$get()
      return response.json()
    }
  })

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    return users.filter((user: UserWithRole) => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchTerm, roleFilter])

  // Calculate stats
  const stats = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter((u: UserWithRole) => u.isActive).length
    const admins = users.filter((u: UserWithRole) => u.role === 'ADMIN' || u.role === 'OWNER').length
    const members = users.filter((u: UserWithRole) => u.role === 'MEMBER').length

    return { totalUsers, activeUsers, admins, members }
  }, [users])

  // Table columns
  const columns = useMemo(() => [
    {
      key: 'email',
      header: 'Email',
      render: (value: string) => (
        <div className="flex items-center">
          <Mail className="w-4 h-4 mr-2 text-gray-400" />
          {value}
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (value: string) => <UserRoleBadge role={value} />
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (value: string) => (
        <Badge variant={value === 'PRO' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, user: UserWithRole) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Edit
          </Button>
          <Button variant="outline" size="sm">
            Deactivate
          </Button>
        </div>
      )
    }
  ], [])

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load users. Please try again.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="w-8 h-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Members</p>
                <p className="text-2xl font-bold">{stats.members}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Organization Users</CardTitle>
            <InviteUserDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["organization-users"] })} />
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="OWNER">Owners</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
                <SelectItem value="MEMBER">Members</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <DataTable
            data={filteredUsers}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default UserManagementContent
