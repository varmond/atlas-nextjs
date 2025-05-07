import { Hono } from "hono"
import { cors } from "hono/cors"
import { handle } from "hono/vercel"
import { authRouter } from "./routers/auth-router"
import { categoryRouter } from "./routers/category-router"
import { paymentRouter } from "./routers/payment-router"
import { projectRouter } from "./routers/project-router"
import { productRouter } from "./routers/product-router"
import { inventoryRouter } from "./routers/inventory-router"
import { locationRouter } from "./routers/location-router"
import { invoiceRouter } from "./routers/invoice-router"
import { patientRouter } from "./routers/patient-router"
import { purchaseOrderRouter } from "./routers/purchase-order-router"
import { vendorRouter } from "./routers/vendor-router"
import { subLocationRouter } from "./routers/sub-location-router"
import { dispenseRouter } from "./routers/dispense-router"

const app = new Hono().basePath("/api").use(cors())

/**
 * This is the primary router for your server.
 *
 * All routers added in /server/routers should be manually added here.
 */
const appRouter = app
  .route("/auth", authRouter)
  .route("/category", categoryRouter)
  .route("/payment", paymentRouter)
  .route("/project", projectRouter)
  .route("/product", productRouter)
  .route("/inventory", inventoryRouter)
  .route("/location", locationRouter)
  .route("/invoice", invoiceRouter)
  .route("/patient", patientRouter)
  .route("/purchase-order", purchaseOrderRouter)
  .route("/vendor", vendorRouter)
  .route("/sub-location", subLocationRouter)
  .route("/dispense", dispenseRouter)
// The handler Next.js uses to answer API requests
export const httpHandler = handle(app)

/**
 * (Optional)
 * Exporting our API here for easy deployment
 *
 * Run `npm run deploy` for one-click API deployment to Cloudflare's edge network
 */
export default app

// export type definition of API
export type AppType = typeof appRouter
