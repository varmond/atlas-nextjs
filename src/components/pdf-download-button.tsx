"use client"

import { Button } from "@/components/ui/button"
import { Loader2, Printer } from "lucide-react"
import { useState } from "react"
import { InvoicePDF } from "@/components/invoice-pdf"

interface PDFDownloadButtonProps {
  invoice: any
  organizationName: string
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return date.getFullYear().toString() +
         pad(date.getMonth() + 1) +
         pad(date.getDate()) +
         pad(date.getHours()) +
         pad(date.getMinutes()) +
         pad(date.getSeconds());
}

const formattedDate = formatDate(new Date());


export function PDFDownloadButton({ invoice, organizationName }: PDFDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const blob = await pdf(
        <InvoicePDF invoice={invoice} organizationName={organizationName} />
      ).toBlob()
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${invoice.invoiceNumber}_${formattedDate}.pdf`);
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleDownload}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Printer className="h-4 w-4 mr-2" />
          Download PDF
        </>
      )}
    </Button>
  )
} 