"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { SubLocation, User } from "@prisma/client"
import { PlusIcon } from "lucide-react"

interface SubLocationsContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
  locationId: string
}

export function SubLocationsContent({ user, locationId }: SubLocationsContentProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")

  const { data: subLocationsData, refetch } = useQuery({
    queryKey: ["subLocations", locationId],
    queryFn: async () => {
      const response = await client["sub-location"].getSubLocations.$get({
        locationId
      })
      const data = await response.json()
      return {
        subLocations: data.subLocations.map(sl => ({
          ...sl,
          createdAt: new Date(sl.createdAt),
          updatedAt: new Date(sl.updatedAt)
        }))
      }
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await client["sub-location"].createSubLocation.$post({
        locationId,
        name,
        code,
      })
      toast({
        title: "Success",
        description: "Sub-location created successfully"
      })
      setIsOpen(false)
      setName("")
      setCode("")
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sub-location",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Sub-location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Sub-location</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Aisle A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g., A1"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Create Sub-location
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subLocationsData?.subLocations.map((subLocation) => (
              <TableRow key={subLocation.id}>
                <TableCell>{subLocation.name}</TableCell>
                <TableCell>{subLocation.code}</TableCell>
                <TableCell>
                  {new Date(subLocation.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {!subLocationsData?.subLocations.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No sub-locations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
} 