"use client"

import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import type { InventoryDispense, User } from "@prisma/client"

interface DispenseHistoryContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
}

export function DispenseHistoryContent({ user }: DispenseHistoryContentProps) {
  const { data: dispensesData, isLoading } = useQuery({
    queryKey: ["dispenses"],
    queryFn: async () => {
      const response = await client.dispense.getDispenses.$get()
      return response.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!dispensesData?.dispenses?.length) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">No dispense records found</div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Dispensed By</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dispensesData?.dispenses.map((dispense) => (
            <TableRow key={dispense.id}>
              <TableCell>{format(new Date(dispense.dispensedAt), "PPP")}</TableCell>
              <TableCell>
                {dispense.inventory.product.name} - Lot: {dispense.inventory.lotNumber}
              </TableCell>
              <TableCell>
                {dispense.inventory.Location?.name}
                {dispense.inventory.subLocation && ` (${dispense.inventory.subLocation.name})`}
              </TableCell>
              <TableCell>{dispense.quantity}</TableCell>
              <TableCell>{dispense.user.email}</TableCell>
              <TableCell>{dispense.note}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
} 