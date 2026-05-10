"use client"

import { Modal } from "@/components/ui/modal"
import { Toaster } from "@/components/ui/toaster"
import { Sidebar } from "@/components/sidebar"
import { Menu, X, Package } from "lucide-react"
import { PropsWithChildren, useState, useMemo, memo } from "react"

// Memoized mobile header component
const MobileHeader = memo(({ onMenuClick }: { onMenuClick: () => void }) => (
  <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-40">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-brand-700 rounded-lg flex items-center justify-center">
        <Package className="w-5 h-5 text-white" />
      </div>
      <p className="text-lg font-semibold text-gray-900">
        Peppers<span className="text-brand-600">Atlas</span>
      </p>
    </div>
    <div className="flex items-center space-x-2">
      <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
        <Menu className="w-5 h-5 text-gray-600" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
          3
        </span>
      </button>
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  </div>
))

MobileHeader.displayName = "MobileHeader"

const Layout = ({ children }: PropsWithChildren) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Memoized handlers
  const handleMenuClick = useMemo(() => () => setIsDrawerOpen(true), [])
  const handleCloseDrawer = useMemo(() => () => setIsDrawerOpen(false), [])

  return (
    <div className="relative h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Modal
          className="p-0"
          showModal={isDrawerOpen}
          setShowModal={setIsDrawerOpen}
        >
          <div className="h-full w-80">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-brand-700 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  Peppers<span className="text-brand-600">Atlas</span>
                </p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <Sidebar />
          </div>
        </Modal>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader onMenuClick={handleMenuClick} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted/40">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  )
}

export default Layout
