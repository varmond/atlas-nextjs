"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { client } from "@/lib/client"
import { format } from "date-fns"

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
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { AddInvoiceItemDialog } from "./add-invoice-item-dialog"
import { Loader2, ArrowLeft, Printer } from "lucide-react"
import { PDFDownloadButton } from "@/components/pdf-download-button"
import { InvoicePDF } from "@/components/invoice-pdf"
import { User } from "@prisma/client"

interface InvoiceDetailPageContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
}

export function InvoiceDetailPageContent({ user }: InvoiceDetailPageContentProps) {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isAddingItem, setIsAddingItem] = useState(false)

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["invoice", params.id],
    queryFn: async () => {
      const response = await client.invoice.getInvoice.$get({
        id: params.id as string,
      })
      return response.json()
    },
  })

  const postInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await client.invoice.postInvoice.$post({
        id: params.id as string,
      })
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Invoice Posted",
        description: "Invoice has been posted successfully",
      })
      router.push("/dashboard/view-invoices")
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post invoice",
        variant: "destructive",
      })
    },
  })

  if (isLoading || !invoiceData?.invoice) {
    return <div>Loading...</div>
  }

  const { invoice } = invoiceData

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/view-invoices")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button> */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Invoice #{invoice.invoiceNumber}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Created {format(new Date(invoice.createdAt), "PPP")}</span>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === "DRAFT" && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsAddingItem(true)}
              >
                Add Item
              </Button>
              <Button
                onClick={() => postInvoiceMutation.mutate()}
                disabled={invoice.items.length === 0 || postInvoiceMutation.isPending}
              >
                {postInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Invoice"
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-medium mb-4">Patient Information</h3>
          <div className="space-y-2">
            <p>
              {invoice.patient.firstName} {invoice.patient.lastName}
            </p>
            {invoice.patient.email && (
              <p className="text-sm text-gray-500">{invoice.patient.email}</p>
            )}
            {invoice.patient.phone && (
              <p className="text-sm text-gray-500">{invoice.patient.phone}</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium mb-4">Invoice Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location</span>
              <span>{invoice.location.name}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-medium mb-4">Items</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Lot Number</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <div>{item.product.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.product.sku}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{item.inventory.lotNumber}</TableCell>
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
      </Card>

      <div className="mt-6 flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Subtotal</span>
          <span>
            ${invoice.items
              .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
              .toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>
            ${invoice.items
              .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
              .toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <PDFDownloadButton 
          invoice={invoice} 
          organizationName={user.organization.name}
        />
      </div>

      <AddInvoiceItemDialog
        open={isAddingItem}
        onOpenChange={setIsAddingItem}
        invoiceId={invoice.id}
        locationId={invoice.locationId}
      />
    </div>
  )
}

function InvoiceStatusBadge({ status }: { status: "DRAFT" | "POSTED" }) {
  return (
    <Badge 
      variant={status === "POSTED" ? "success" : "default"}
    >
      {status}
    </Badge>
  )
} 