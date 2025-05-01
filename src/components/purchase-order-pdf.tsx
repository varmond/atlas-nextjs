import {
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"
import { format } from "date-fns"

Font.register({
  family: 'Helvetica',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxP.ttf',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmWUlfBBc9.ttf',
      fontWeight: 700,
    }
  ]
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  headerLeft: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  headerRight: {
    fontSize: 10,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#666",
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e5e5",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  col1: { width: "40%" },
  col2: { width: "20%" },
  col3: { width: "20%" },
  col4: { width: "20%" },
  totals: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  totalLabel: {
    width: 100,
    textAlign: "right",
    marginRight: 10,
  },
  totalValue: {
    width: 100,
    textAlign: "right",
  },
})

interface PurchaseOrderPDFProps {
  purchaseOrder: any // Replace with proper type
  organizationName: string
}

export function PurchaseOrderPDF({ purchaseOrder, organizationName }: PurchaseOrderPDFProps) {
  try {
    // Calculate total outside of JSX
    const total = purchaseOrder.items
      .reduce((sum: number, item: any) => sum + Number(item.price) * item.quantity, 0)
      .toFixed(2)

    return (
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLeft}>{String(organizationName)}</Text>
            <Text style={styles.headerRight}>Purchase Order #{String(purchaseOrder.orderNumber)}</Text>
          </View>
          <View>
            <Text style={styles.headerRight}>{format(new Date(purchaseOrder.createdAt), "PPP")}</Text>
            <Text style={styles.headerRight}>Status: {String(purchaseOrder.status)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VENDOR</Text>
          <Text>{String(purchaseOrder.vendor.name)}</Text>
          {purchaseOrder.vendor.email && <Text>{String(purchaseOrder.vendor.email)}</Text>}
          {purchaseOrder.vendor.phone && <Text>{String(purchaseOrder.vendor.phone)}</Text>}
          {purchaseOrder.vendor.address && <Text>{String(purchaseOrder.vendor.address)}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHIP TO</Text>
          <Text>{String(purchaseOrder.location.name)}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Product</Text>
            <Text style={styles.col2}>Quantity</Text>
            <Text style={styles.col3}>Price</Text>
            <Text style={styles.col4}>Total</Text>
          </View>
          
          {purchaseOrder.items.map((item: any) => {
            const itemPrice = Number(item.price).toFixed(2)
            const itemTotal = (Number(item.price) * item.quantity).toFixed(2)
            
            return (
              <View key={String(item.id)} style={styles.tableRow}>
                <View style={styles.col1}>
                  <Text>{String(item.product.name)}</Text>
                  <Text style={{ fontSize: 8, color: "#666" }}>{String(item.product.sku)}</Text>
                </View>
                <Text style={styles.col2}>{String(item.quantity)}</Text>
                <Text style={styles.col3}>${itemPrice}</Text>
                <Text style={styles.col4}>${itemTotal}</Text>
              </View>
            )
          })}
        </View>

        {/* <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${String(total)}</Text>
          </View>
        </View> */}

        {/* {purchaseOrder.notes && (
          <View style={[styles.section, { marginTop: 40 }]}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <Text>{purchaseOrder.notes ?? ""}</Text>
          </View>
        )} */}
      </Page>
    )
  } catch (error) {
    console.error('PDF Component Error:', error)
    throw error
  }
} 