"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery, useMutation } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { User } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const invoiceFormSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  locationId: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
})

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>

interface CreateInvoicePageContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
}

export function CreateInvoicePageContent({ user }: CreateInvoicePageContentProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch locations
  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await client.location.getLocations.$get()
      return response.json()
    },
  })

  // Fetch patients
  const { data: patientsData } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await client.patient.getPatients.$get()
      return response.json()
    },
  })

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      notes: "",
    },
  })

  const createInvoiceMutation = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      const response = await client.invoice.saveDraft.$post({
        ...values,
        items: [],
        status: "DRAFT",
      })
      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Invoice Created",
        description: "New invoice has been created successfully",
      })
      router.push(`/dashboard/invoices/${data.invoice.id}`)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      })
    },
  })

  const onSubmit = async (values: InvoiceFormValues) => {
    setIsSubmitting(true)
    try {
      await createInvoiceMutation.mutateAsync(values)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patientsData?.patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locationsData?.locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createInvoiceMutation.isPending}
              >
                {(isSubmitting || createInvoiceMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Invoice"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  )
} 