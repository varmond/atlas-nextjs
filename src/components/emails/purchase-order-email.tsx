import React from "react"
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer"

// Create a simplified PDF component that strictly follows React PDF rules
const SimplePurchaseOrderPDF = ({ purchaseOrder, organizationName }: { purchaseOrder: any, organizationName: string }) => {
  // Define styles
  const styles = StyleSheet.create({
    page: { padding: 30 },
    title: { fontSize: 24, marginBottom: 10 },
    section: { marginBottom: 10 },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>
            Purchase Order #{String(purchaseOrder.orderNumber)}
          </Text>
          <Text>Date: {new Date().toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.section}>
          <Text>From: {organizationName}</Text>
        </View>
        
        <View style={styles.section}>
          <Text>To: {purchaseOrder.vendor.name}</Text>
        </View>
        
        {/* Very simple table */}
        <View style={styles.section}>
          {purchaseOrder.items.map((item: any, i: number) => (
            <View key={String(i)}>
              <Text>
                {item.product.name} - Qty: {String(item.quantity)} - 
                Price: ${String(item.price.toFixed(2))}
              </Text>
            </View>
          ))}
        </View>
        
        {/* {purchaseOrder.notes ? (
          <View style={styles.section}>
            <Text>Notes: {purchaseOrder.notes}</Text>
          </View>
        ) : null} */}
      </Page>
    </Document>
  )
}

// Generate PDF function
export const generatePDF = async (PdfComponent: React.ComponentType<any>, props: any) => {
  try {
    // Create the component
    const element = React.createElement(PdfComponent, props)
    
    // Use renderToBuffer for server-side rendering
    const buffer = await renderToBuffer(element)
    
    // Convert to base64
    return buffer.toString('base64')
  } catch (error) {
    console.error('PDF Generation Error:', error)
    throw new Error(`PDF Generation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}