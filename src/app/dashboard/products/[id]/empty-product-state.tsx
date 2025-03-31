import { Card } from "@/components/ui/card"
import { client } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const EmptyProductState = ({
  productId,
  productName,
}: {
  productId: string
  productName: string
}) => {
  const router = useRouter()

  // This could be replaced with a real polling query to check for inventory
  const { data } = useQuery({
    queryKey: ["product", productId, "hasInventory"],
    queryFn: async () => {
      // Mock implementation - in a real app, you'd call a real endpoint
      return { hasInventory: false }
    },
    refetchInterval: 5000,
  })

  const hasInventory = data?.hasInventory

  useEffect(() => {
    if (hasInventory) router.refresh()
  }, [hasInventory, router])

  const exampleInventoryData = `{
  "sku": "SKU123456",
  "productId": "${productId}",
  "quantity": 100,
  "location": "Warehouse A"
}`

  return (
    <Card
      contentClassName="max-w-2xl w-full flex flex-col items-center p-6"
      className="flex-1 flex items-center justify-center"
    >
      <h2 className="text-xl/8 font-medium text-center tracking-tight text-gray-950">
        Add inventory for {productName}
      </h2>
      <p className="text-sm/6 text-gray-600 mb-8 max-w-md text-center text-pretty">
        This product doesn't have any inventory yet. Add some to start tracking.
      </p>

      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
          <div className="flex space-x-2">
            <div className="size-3 rounded-full bg-red-500"></div>
            <div className="size-3 rounded-full bg-yellow-500"></div>
            <div className="size-3 rounded-full bg-green-500"></div>
          </div>

          <span className="text-gray-400 text-sm">inventory-example.json</span>
        </div>

        <SyntaxHighlighter
          language="json"
          style={atomDark}
          customStyle={{
            borderRadius: "0px",
            margin: 0,
            padding: "1rem",
            fontSize: "0.875rem",
            lineHeight: "1.5",
          }}
        >
          {exampleInventoryData}
        </SyntaxHighlighter>
      </div>

      <Link href="/dashboard/add-inventory">
        <Button size="lg" className="mb-4">
          Add Inventory
        </Button>
      </Link>

      <p className="text-sm/6 text-gray-500 mt-2">
        Need help? Check out our{" "}
        <a href="#" className="text-blue-500 hover:underline">
          documentation
        </a>{" "}
        or{" "}
        <a href="#" className="text-blue-500 hover:underline">
          contact support
        </a>
        .
      </p>
    </Card>
  )
}
