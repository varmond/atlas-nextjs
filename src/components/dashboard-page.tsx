"use client"

import { ReactNode } from "react"
import { Button } from "./ui/button"
import { ArrowLeft } from "lucide-react"
import { Heading } from "./heading"
import { useRouter } from "next/navigation"

interface DashboardPageProps {
  title: string
  children: ReactNode
  hideBackButton?: boolean
  cta?: ReactNode
  subtitle?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export const DashboardPage = ({
  title,
  children,
  cta,
  hideBackButton,
  subtitle,
  breadcrumbs,
}: DashboardPageProps) => {
  const router = useRouter()
  
  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex mb-4" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={index} className="flex items-center">
                      {index > 0 && (
                        <svg
                          className="w-4 h-4 text-gray-400 mx-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {crumb.href ? (
                        <button
                          onClick={() => router.push(crumb.href!)}
                          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-900 font-medium">
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Title Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {!hideBackButton && (
                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                <div>
                  <Heading className="text-2xl font-bold text-gray-900">
                    {title}
                  </Heading>
                  {subtitle && (
                    <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                  )}
                </div>
              </div>
              
              {cta && (
                <div className="flex items-center space-x-3">
                  {cta}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
}
