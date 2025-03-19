import { db } from "@/db"
import { j } from "./__internals/j"

/**
 * Middleware for providing a built-in cache with your Prisma database.
 *
 * You can remove this if you don't like it, but caching can massively speed up your database queries.
 */
export const authMiddleware = j.middleware(async({ c, next }) => {
  const authHeader = c.req.header("Authorization")

  if (authHeader) {
    const apiKey = authHeader.split(" ")[1]

    const user = await db.user
  }

  // const user = { name: "John", id: "1" }
  return next({ user })
})
