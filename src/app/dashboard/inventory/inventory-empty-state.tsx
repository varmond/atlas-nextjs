import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Box, Package, Plus } from "lucide-react"
import { CreateInventoryItemModal } from "@/components/create-inventory-item-modal"

export const InventoryEmptyState = () => {
  return (
    <Card className="flex flex-col items-center justify-center rounded-2xl flex-1 text-center p-6">
      <div className="flex justify-center w-full">
        <div className="size-48 flex items-center justify-center -mt-16">
          <Package className="size-32 text-gray-200" />
        </div>
      </div>
      <h1 className="mt-2 text-xl/8 font-medium tracking-tight text-gray-900">
        No Inventory Items Yet
      </h1>
      <p className="text-sm/6 text-gray-600 max-w-prose mt-2 mb-8">
        Start tracking your inventory by adding your first product
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Button
          variant={"outline"}
          className="flex items-center space-x-2 w-full sm:w-auto"
          // This would be connected to a function to add demo items
        >
          <Box className="size-5" />
          <span>Add Sample Products</span>
        </Button>

        <CreateInventoryItemModal containerClassName="w-full sm:w-auto">
          <Button className="flex items-center space-x-2 w-full sm:w-auto">
            <Plus className="size-5" />
            <span>Add Product</span>
          </Button>
        </CreateInventoryItemModal>
      </div>
    </Card>
  )
}
