"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { QrCode, Camera, Loader2, X } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isOpen: boolean
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startScanning = useCallback(async () => {
    try {
      setError("")
      setIsScanning(true)
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      // Start barcode detection (simplified - in production you'd use a library like QuaggaJS or ZXing)
      // For now, we'll simulate detection
      setTimeout(() => {
        // Simulate barcode detection
        const mockBarcode = "1234567890123"
        onScan(mockBarcode)
        stopScanning()
      }, 3000)
      
    } catch (err) {
      console.error("Camera access error:", err)
      setError("Unable to access camera. Please check permissions.")
      setIsScanning(false)
    }
  }, [onScan])

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
  }, [])

  const handleClose = useCallback(() => {
    stopScanning()
    onClose()
  }, [stopScanning, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Scan Barcode</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="text-center mb-4">
            {!isScanning ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Position the barcode within the camera view
                </p>
                <Button onClick={startScanning} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-gray-900 rounded-lg"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-blue-500 rounded-lg p-2">
                    <div className="w-48 h-32 border-2 border-blue-500 rounded"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                    Scanning...
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-500">
            {isScanning ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Looking for barcode...
              </div>
            ) : (
              <p>Point your camera at a barcode to scan</p>
            )}
          </div>

          {isScanning && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={stopScanning}
                className="w-full"
              >
                Stop Scanning
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
