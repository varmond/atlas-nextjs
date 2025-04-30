"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { User } from "@prisma/client"
import { useToast } from "@/hooks/use-toast"
import { AddPurchaseOrderItemDialog } from "./add-purchase-order-item-dialog"
import { useState } from "react"
import { Loader2 } from "lucide-react"

function PurchaseOrderStatusBadge({ status }: { status: "DRAFT" | "POSTED" | "RECEIVED" | "CANCELLED" }) {
  const variants = {
    DRAFT: "default",
    POSTED: "success",
    RECEIVED: "success",
    CANCELLED: "destructive"
  } as const

  return (
    <Badge variant={variants[status]}>
      {status}
    </Badge>
  )
}

interface PurchaseOrderDetailPageContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
  id: string
}

export function PurchaseOrderDetailPageContent({ user, id }: PurchaseOrderDetailPageContentProps) {
  const { toast } = useToast()
  const [isAddingItem, setIsAddingItem] = useState(false)

  const { data: purchaseOrderData, isLoading } = useQuery({
    queryKey: ["purchaseOrder", id],
    queryFn: async () => {
      const response = await client["purchase-order"].getPurchaseOrder.$get({
        id,
      })
      return response.json()
    },
  })

  const postPurchaseOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await client["purchase-order"].postPurchaseOrder.$post({
        id,
      })
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Purchase Order Posted",
        description: "Purchase order has been posted successfully",
      })
    },
  })

  if (isLoading || !purchaseOrderData?.purchaseOrder) {
    return <div>Loading...</div>
  }

  const purchaseOrder = purchaseOrderData.purchaseOrder

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-medium mb-4">Vendor Information</h3>
          <div className="space-y-2">
            <p>{purchaseOrder.vendor.name}</p>
            {purchaseOrder.vendor.email && (
              <p className="text-sm text-gray-500">{purchaseOrder.vendor.email}</p>
            )}
            {purchaseOrder.vendor.phone && (
              <p className="text-sm text-gray-500">{purchaseOrder.vendor.phone}</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium mb-4">Purchase Order Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <PurchaseOrderStatusBadge status={purchaseOrder.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location</span>
              <span>{purchaseOrder.location.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PO Number</span>
              <span>{purchaseOrder.orderNumber}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Items</h3>
          {purchaseOrder.status === "DRAFT" && (
            <Button onClick={() => setIsAddingItem(true)}>Add Item</Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrder.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <div>{item.product.name}</div>
                    <div className="text-xs text-gray-500">{item.product.sku}</div>
                  </div>
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-right">
                  ${Number(item.price).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total</span>
            <span>
              ${purchaseOrder.items
                .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>

        {purchaseOrder.status === "DRAFT" && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => postPurchaseOrderMutation.mutate()}
              disabled={purchaseOrder.items.length === 0 || postPurchaseOrderMutation.isPending}
            >
              {postPurchaseOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Purchase Order"
              )}
            </Button>
          </div>
        )}
      </Card>

      <AddPurchaseOrderItemDialog
        open={isAddingItem}
        onOpenChange={setIsAddingItem}
        purchaseOrderId={purchaseOrder.id}
      />
    </div>
  )
} 