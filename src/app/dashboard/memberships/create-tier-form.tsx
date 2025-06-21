"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  frequency: z.enum(["MONTHLY", "ANNUALLY"]),
  benefits: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    benefitType: z.enum(["DISCOUNT_PERCENTAGE", "DISCOUNT_FIXED", "FREE_PRODUCT", "FREE_SERVICE"]),
    value: z.number(),
    productId: z.string().optional(),
  })).default([])
})

type FormValues = z.infer<typeof formSchema>

interface CreateTierFormProps {
  onSuccess: () => void
}

export function CreateTierForm({ onSuccess }: CreateTierFormProps) {
  const { toast } = useToast()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      frequency: "MONTHLY",
      benefits: [],
    },
  })

  const createTierMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await client.membership.createTier.$post({
        name: values.name,
        description: values.description,
        price: values.price,
        frequency: values.frequency,
        benefits: values.benefits,
      })
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Membership tier created successfully",
      })
      onSuccess()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create membership tier",
        variant: "destructive",
      })
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => createTierMutation.mutate(values))} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="ANNUALLY">Annually</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={createTierMutation.isPending}
          className="w-full"
        >
          {createTierMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Tier"
          )}
        </Button>
      </form>
    </Form>
  )
} 