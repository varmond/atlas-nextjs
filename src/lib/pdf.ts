import { Document, pdf } from "@react-pdf/renderer"
import React from "react"

export const generatePDF = async (PdfComponent: React.ComponentType<any>, props: any) => {
  try {
    // Import pdf dynamically like in the invoice component
    const { pdf } = await import('@react-pdf/renderer')
    
    const doc = React.createElement(Document, {}, 
      React.createElement(PdfComponent, props)
    )
    
    const blob = await pdf(doc).toBlob()
    const arrayBuffer = await blob.arrayBuffer()
    return Buffer.from(arrayBuffer).toString('base64')
  } catch (error) {
    console.error('PDF Generation Error:', error)
    throw new Error(`PDF Generation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}