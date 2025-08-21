"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Users, Building2, Loader2, Trash2, Edit, Shield } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export function OrganizationManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [newOrgName, setNewOrgName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userRole, setUserRole] = useState<"OWNER" | "ADMIN" | "MEMBER">("MEMBER")
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch all organizations (super admin only)
  const { data: orgsData, isLoading, error } = useQuery({
    queryKey: ["all-organizations"],
    queryFn: async () => {
      const response = await client.organization.getAllOrganizations.$get()
      return response.json()
    },
    retry: false, // Don't retry on 403 errors
  })

  // Fetch members for selected organization
  const { data: membersData } = useQuery({
    queryKey: ["organization-members", selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return { members: [] }
      const response = await client.organization.getOrganizationMembers.$get({
        organizationId: selectedOrgId
      })
      return response.json()
    },
    enabled: !!selectedOrgId
  })

  const createOrgMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await client.organization.createOrganization.$post({
        name
      })
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Organization Created",
        description: "New organization has been created successfully",
      })
      setIsCreateOpen(false)
      setNewOrgName("")
      queryClient.invalidateQueries({ queryKey: ["all-organizations"] })
    },
    onError: (error: any) => {
      toast({
        title: "Access Denied",
        description: error.message || "Only super admins can create organizations",
        variant: "destructive",
      })
    },
  })

  const addUserMutation = useMutation({
    mutationFn: async ({ email, organizationId, role }: {
      email: string
      organizationId: string
      role: "OWNER" | "ADMIN" | "MEMBER"
    }) => {
      const response = await client.organization.addUserToOrganization.$post({
        userEmail: email,
        organizationId,
        role
      })
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "User Added",
        description: "User has been added to the organization successfully",
      })
      setIsAddUserOpen(false)
      setUserEmail("")
      setUserRole("MEMBER")
      queryClient.invalidateQueries({ queryKey: ["organization-members", selectedOrgId] })
      queryClient.invalidateQueries({ queryKey: ["all-organizations"] })
    },
    onError: (error: any) => {
      toast({
        title: "Access Denied",
        description: error.message || "Only super admins can add users to organizations",
        variant: "destructive",
      })
    },
  })

  const handleCreateOrg = () => {
    if (!newOrgName.trim()) return
    createOrgMutation.mutate(newOrgName)
  }

  const handleAddUser = () => {
    if (!userEmail.trim() || !selectedOrgId) return
    addUserMutation.mutate({
      email: userEmail,
      organizationId: selectedOrgId,
      role: userRole
    })
  }

  const organizations = orgsData?.organizations || []
  const members = membersData?.members || []

  // Check if user has super admin access
  const hasSuperAdminAccess = !error

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Show access denied message if user is not super admin
  if (!hasSuperAdminAccess) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <Shield className="h-4 w-4" />
            <h3 className="font-medium">Access Denied</h3>
          </div>
          <p className="text-gray-600">
            You need super admin privileges to access organization management. 
            Please contact your system administrator.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Organization Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Super Admin Panel - Manage all organizations and users
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrg}
                  disabled={!newOrgName.trim() || createOrgMutation.isPending}
                >
                  {createOrgMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organizations List */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Organizations</h3>
          <div className="space-y-4">
            {organizations.map((org: any) => (
              <div
                key={org.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedOrgId === org.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedOrgId(org.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{org.name}</h4>
                    <p className="text-sm text-gray-500">
                      {org._count?.userOrganizations || 0} members • {org._count?.Products || 0} products • {org._count?.Inventory || 0} inventory items
                    </p>
                    <p className="text-xs text-gray-400">
                      Created {format(new Date(org.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant={org.subscriptionStatus === 'ACTIVE' ? 'success' : 'secondary'}>
                    {org.planType}
                  </Badge>
                </div>
              </div>
            ))}
            {organizations.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No organizations found
              </p>
            )}
          </div>
        </Card>

        {/* Organization Members */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Members</h3>
            {selectedOrgId && (
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add User to Organization</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-email">User Email</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user-role">Role</Label>
                      <Select value={userRole} onValueChange={(value: any) => setUserRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="OWNER">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddUserOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddUser}
                        disabled={!userEmail.trim() || addUserMutation.isPending}
                      >
                        {addUserMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Adding...
                          </>
                        ) : (
                          "Add User"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {selectedOrgId ? (
            <div className="space-y-2">
              {members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{member.user.email}</p>
                    <p className="text-sm text-gray-500">
                      Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {member.role.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No members found
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Select an organization to view members
            </p>
          )}
        </Card>
      </div>
    </div>
  )
} 