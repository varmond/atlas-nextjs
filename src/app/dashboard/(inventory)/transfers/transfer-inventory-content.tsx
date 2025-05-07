"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@prisma/client"

interface TransferInventoryContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
}

export function TransferInventoryContent({ user }: TransferInventoryContentProps) {
  const [sourceLocationId, setSourceLocationId] = useState("")
  const [sourceSubLocationId, setSourceSubLocationId] = useState("")
  const [destLocationId, setDestLocationId] = useState("")
  const [destSubLocationId, setDestSubLocationId] = useState("")
  const [inventoryId, setInventoryId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  const { toast } = useToast()

  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await client.inventory.getLocations.$get()
      return response.json()
    },
  })

  const { data: inventoryData } = useQuery({
    queryKey: ["inventory", sourceLocationId],
    queryFn: async () => {
      const response = await client.inventory.getInventory.$get({
        locationId: sourceLocationId
      })
      return response.json()
    },
    enabled: !!sourceLocationId
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await client.inventory.createTransfer.$post({
        inventoryId,
        quantity: parseInt(quantity),
        sourceLocationId,
        sourceSubLocationId: sourceSubLocationId || undefined,
        destLocationId,
        destSubLocationId: destSubLocationId || undefined,
        notes,
      })
      toast({
        title: "Success",
        description: "Transfer completed successfully"
      })
      // Reset form
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete transfer",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">Source</h3>
            <Select value={sourceLocationId} onValueChange={setSourceLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source location" />
              </SelectTrigger>
              <SelectContent>
                {locationsData?.locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Destination</h3>
            <Select value={destLocationId} onValueChange={setDestLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination location" />
              </SelectTrigger>
              <SelectContent>
                {locationsData?.locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Item Details</h3>
          <Select value={inventoryId} onValueChange={setInventoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select inventory item" />
            </SelectTrigger>
            <SelectContent>
              {inventoryData?.inventoryItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.product.name} - {item.lotNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <Textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full">
          Complete Transfer
        </Button>
      </form>
    </Card>
  )
} 