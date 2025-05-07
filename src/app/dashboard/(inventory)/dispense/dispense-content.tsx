"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Textarea } from "@/components/ui/textarea"
import type { User } from "@prisma/client"

const dispenseFormSchema = z.object({
  inventoryId: z.string().min(1, "Inventory item is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  note: z.string().optional(),
  dispensedAt: z.string().optional(),
})

type DispenseFormValues = z.infer<typeof dispenseFormSchema>

interface DispenseContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
}

export function DispenseContent({ user }: DispenseContentProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<DispenseFormValues>({
    resolver: zodResolver(dispenseFormSchema),
    defaultValues: {
      note: "",
    },
  })

  const { data: inventoryData } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const response = await client.inventory.getInventory.$get()
      return response.json()
    },
  })

  const dispenseMutation = useMutation({
    mutationFn: async (values: DispenseFormValues) => {
      const response = await client.dispense.createDispense.$post(values)
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory dispensed successfully",
      })
      form.reset()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to dispense inventory",
        variant: "destructive",
      })
    },
  })

  const onSubmit = async (values: DispenseFormValues) => {
    setIsSubmitting(true)
    try {
      await dispenseMutation.mutateAsync(values)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="inventoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inventory Item</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {inventoryData?.inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.product.name} - Lot: {item.lotNumber} ({item.unitsReceived} units)
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
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any additional notes"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting || dispenseMutation.isPending}
          >
            {(isSubmitting || dispenseMutation.isPending) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dispensing...
              </>
            ) : (
              "Dispense Inventory"
            )}
          </Button>
        </form>
      </Form>
    </Card>
  )
} 