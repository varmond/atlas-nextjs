"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
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
import { useToast } from "@/hooks/use-toast"
import { CreateTierForm } from "./create-tier-form"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { User, MembershipTier } from "@prisma/client"
import { useRouter } from "next/navigation"

interface MembershipsContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
}

type TierWithCounts = {
  id: string
  name: string
  description: string | null
  price: string
  frequency: "MONTHLY" | "ANNUALLY"
  isActive: boolean
  createdAt: string
  updatedAt: string
  organizationId: string
  benefits: Array<{
    id: string
    name: string
    description: string | null
    benefitType: "DISCOUNT_PERCENTAGE" | "DISCOUNT_FIXED" | "FREE_PRODUCT" | "FREE_SERVICE"
    value: string
    productId: string | null
    tierId: string
    createdAt: string
    updatedAt: string
  }>
  _count: {
    subscriptions: number
  }
}

export function MembershipsContent({ user }: MembershipsContentProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const { data: tiersData, refetch } = useQuery({
    queryKey: ["membership-tiers"],
    queryFn: async () => {
      const response = await client.membership.getTiers.$get()
      return response.json()
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {/* <h2 className="text-3xl font-bold">Membership Tiers</h2> */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create New Tier</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Membership Tier</DialogTitle>
            </DialogHeader>
            <CreateTierForm 
              onSuccess={() => {
                setIsCreateOpen(false)
                refetch()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active Members</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiersData?.tiers.map((tier: TierWithCounts) => (
              <TableRow key={tier.id}>
                <TableCell className="font-medium">
                  {tier.name}
                  {tier.description && (
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  )}
                </TableCell>
                <TableCell>${tier.price}</TableCell>
                <TableCell>{tier.frequency}</TableCell>
                <TableCell>
                  <Badge variant={tier.isActive ? "success" : "secondary"}>
                    {tier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{tier._count.subscriptions}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/memberships/${tier.id}`)}
                  >
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
} 