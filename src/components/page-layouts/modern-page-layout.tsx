"use client"

import { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/utils"

interface ModernPageLayoutProps {
  title: string
  description?: string
  children: ReactNode
  showBackButton?: boolean
  actions?: ReactNode
  className?: string
}

export const ModernPageLayout = ({
  title,
  description,
  children,
  showBackButton = false,
  actions,
  className,
}: ModernPageLayoutProps) => {
  const router = useRouter()

  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}
