import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"

export const generatePDF = async (PdfComponent: React.ComponentType<any>, props: any) => {
  try {
    // Create component without Document wrapper
    const element = React.createElement(PdfComponent, props)
    const buffer = await renderToBuffer(element)
    return buffer.toString('base64')
  } catch (error) {
    console.error('PDF Generation Error:', error)
    throw new Error(`PDF Generation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}