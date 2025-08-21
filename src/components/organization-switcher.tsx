"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ChevronDown, Building2, Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function OrganizationSwitcher() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch user's organizations
  const { data: orgsData, isLoading } = useQuery({
    queryKey: ["user-organizations"],
    queryFn: async () => {
      const response = await client.organization.getUserOrganizations.$get()
      return response.json()
    },
  })

  // Fetch current organization
  const { data: currentOrgData } = useQuery({
    queryKey: ["current-organization"],
    queryFn: async () => {
      const response = await client.organization.getCurrentOrganization.$get()
      return response.json()
    },
  })

  const switchOrgMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await client.organization.switchOrganization.$post({
        organizationId
      })
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Organization Switched",
        description: "Successfully switched to the selected organization",
      })
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ["current-organization"] })
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] })
      // Refresh the page to update all organization-specific data
      router.refresh()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to switch organization",
        variant: "destructive",
      })
    },
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
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] })
      queryClient.invalidateQueries({ queryKey: ["current-organization"] })
      router.refresh()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      })
    },
  })

  const handleCreateOrg = () => {
    if (!newOrgName.trim()) return
    createOrgMutation.mutate(newOrgName)
  }

  const currentOrg = currentOrgData?.organization
  const organizations = orgsData?.organizations || []

  if (isLoading) {
    return (
      <Button variant="ghost" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {currentOrg?.name || "Select Organization"}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {organizations.map((userOrg: any) => (
            <DropdownMenuItem
              key={userOrg.organization.id}
              onClick={() => switchOrgMutation.mutate(userOrg.organization.id)}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">{userOrg.organization.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {userOrg.role.toLowerCase()}
                </span>
              </div>
              {currentOrg?.id === userOrg.organization.id && (
                <span className="text-xs text-green-600">Current</span>
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </DropdownMenuItem>
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 