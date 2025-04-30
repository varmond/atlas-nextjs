import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Font,
} from "@react-pdf/renderer"
import { format } from "date-fns"

// Use a simpler font setup
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
  col2: { width: "15%" },
  col3: { width: "15%" },
  col4: { width: "15%" },
  col5: { width: "15%" },
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

interface InvoicePDFProps {
  invoice: any // Replace with proper type
  organizationName: string
}

export function InvoicePDF({ invoice, organizationName }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLeft}>{organizationName}</Text>
            <Text style={styles.headerRight}>Invoice #{invoice.invoiceNumber}</Text>
          </View>
          <View>
            <Text style={styles.headerRight}>
              {format(new Date(invoice.createdAt), "PPP")}
            </Text>
            <Text style={styles.headerRight}>
              Status: {invoice.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BILL TO</Text>
          <Text>{invoice.patient.firstName} {invoice.patient.lastName}</Text>
          {invoice.patient.email && <Text>{invoice.patient.email}</Text>}
          {invoice.patient.phone && <Text>{invoice.patient.phone}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Product</Text>
            <Text style={styles.col2}>Lot #</Text>
            <Text style={styles.col3}>Qty</Text>
            <Text style={styles.col4}>Price</Text>
            <Text style={styles.col5}>Total</Text>
          </View>
          
          {invoice.items.map((item: any) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text>{item.product.name}</Text>
                <Text style={{ fontSize: 8, color: "#666" }}>{item.product.sku}</Text>
              </View>
              <Text style={styles.col2}>{item.inventory.lotNumber}</Text>
              <Text style={styles.col3}>{item.quantity}</Text>
              <Text style={styles.col4}>${Number(item.price).toFixed(2)}</Text>
              <Text style={styles.col5}>
                ${(Number(item.price) * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              ${invoice.items
                .reduce((sum: number, item: any) => sum + Number(item.price) * item.quantity, 0)
                .toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${invoice.items
                .reduce((sum: number, item: any) => sum + Number(item.price) * item.quantity, 0)
                .toFixed(2)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
} 