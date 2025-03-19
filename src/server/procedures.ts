// import { env } from "process"
import { j } from "./__internals/j"
import { Redis } from "@upstash/redis/cloudflare"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { cacheExtension } from "./__internals/db/cache-extension"
import { Pool } from "@neondatabase/serverless"
import { db } from "@/db"
import { HTTPException } from "hono/http-exception"
import { currentUser } from "@clerk/nextjs/server"

/**
 * Middleware for providing a built-in cache with your Prisma database.
 *
 * You can remove this if you don't like it, but caching can massively speed up your database queries.
 */

const authMiddlewae = j.middleware(async ({ c, next }) => {
  const authHeader = c.req.header("Authorization")

  if (authHeader) {
    const apiKey = authHeader.split(" ")[1]

    const user = await db.user.findUnique({ where: { apiKey } })

    if (user) {
      return next({ user })
    }
  }

  const auth = await currentUser()

  if (!auth) {
    throw new HTTPException(401, { message: "Unauthorized" })
  }

  const user = await db.user.findUnique({ where: { externalId: auth.id } })

  if (!user) {
    throw new HTTPException(401, { message: "Unauthorized" })
  }

  return next({ user })
})

/**
 * Public (unauthenticated) procedures
 *
 * This is the base piece you use to build new queries and mutations on your API.
 */
export const baseProcedure = j.procedure
export const publicProcedure = baseProcedure
export const privateProcedure = publicProcedure.use(authMiddlewae)
