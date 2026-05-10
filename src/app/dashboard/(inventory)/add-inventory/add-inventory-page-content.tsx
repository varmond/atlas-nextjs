"use client"

import { SmartReceivingForm } from "@/components/smart-receiving-form"
import { ModernPageLayout } from "@/components/page-layouts"

export function AddInventoryPageContent() {
  return (
    <ModernPageLayout
      title="Add Inventory"
      description="Use the smart receiving system to quickly add inventory items"
    >
      <SmartReceivingForm />
    </ModernPageLayout>
  )
}
