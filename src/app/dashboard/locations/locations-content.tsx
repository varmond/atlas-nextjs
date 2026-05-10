"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { ModernPageLayout } from "@/components/page-layouts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@prisma/client"
import { Building2, Eye, Edit, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface LocationsContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
}

// Action buttons component
const ActionButtons = ({ location }: { location: any }) => (
  <div className="flex items-center justify-end space-x-1">
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-muted"
      asChild
    >
      <Link href={`/dashboard/locations/${location.id}/sub-locations`}>
        <Eye className="h-4 w-4" />
      </Link>
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-muted"
    >
      <Edit className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
)

export function LocationsContent({ user }: LocationsContentProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const { data: locationsData, refetch, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await client.location.getLocations.$get()
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Filter locations based on search
  const filteredLocations = useMemo(() => {
    if (!locationsData?.locations) return []
    if (!searchTerm) return locationsData.locations
    
    return locationsData.locations.filter((location: any) =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [locationsData, searchTerm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await client.location.createLocation.$post({
        name,
        description,
      })
      toast({
        title: "Success",
        description: "Location created successfully"
      })
      setIsOpen(false)
      setName("")
      setDescription("")
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create location",
        variant: "destructive"
      })
    }
  }

  // Define table columns
  const columns = [
    {
      key: 'name' as const,
      header: 'Location',
      sortable: true,
      filterable: true,
      width: 350,
      render: (value: any, row: any) => (
        <div className="space-y-1">
          <div className="font-medium">{row.name}</div>
          {row.description && (
            <div className="text-sm text-muted-foreground">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'isActive' as const,
      header: 'Status',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: any) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: 'description' as const,
      header: 'Sub-locations',
      sortable: false,
      filterable: false,
      width: 140,
      render: (value: any, row: any) => (
        <Badge variant="outline" className="text-xs">
          0 sub-locations
        </Badge>
      ),
    },
    {
      key: 'id' as const,
      header: '',
      sortable: false,
      filterable: false,
      width: 120,
      render: (value: any, row: any) => <ActionButtons location={row} />,
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading locations...</p>
        </div>
      </div>
    )
  }

  return (
    <ModernPageLayout
      title="Locations"
      description={`${filteredLocations.length} location${filteredLocations.length !== 1 ? 's' : ''} found`}
      actions={
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      }
    >
      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredLocations as any}
        columns={columns as any}
        pageSize={25}
        searchable={false} // We handle search manually
        sortable={true}
        filterable={false}
        selectable={true}
        loading={isLoading}
        emptyMessage="No locations found. Create your first location to get started."
        className="w-full"
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Warehouse"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Primary storage facility"
              />
            </div>
            <Button type="submit" className="w-full">
              Create Location
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </ModernPageLayout>
  )
} 