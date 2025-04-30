"use client"

import { useQuery } from "@tanstack/react-query"
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
import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { User } from "@prisma/client"

function InvoiceStatusBadge({ status }: { status: "DRAFT" | "POSTED" }) {
  return (
    <Badge 
      variant={status === "POSTED" ? "success" : "default"}
    >
      {status}
    </Badge>
  )
}

interface ViewInvoicesPageContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
}

export function ViewInvoicesPageContent({ user }: ViewInvoicesPageContentProps) {
  const router = useRouter()
  
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await client.invoice.getInvoices.$get()
      return response.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoicesData?.invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.invoiceNumber}</TableCell>
              <TableCell>{format(new Date(invoice.createdAt), "PPP")}</TableCell>
              <TableCell>
                {invoice.patient.firstName} {invoice.patient.lastName}
              </TableCell>
              <TableCell>{invoice.location.name}</TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell>
                ${invoice.items
                  .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
                  .toFixed(2)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/dashboard/invoices/view-invoices/${invoice.id}`)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 