import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"

export const locationRouter = router({
  getLocations: privateProcedure.query(async ({ c, ctx }) => {
    const locations = await db.location.findMany({
      where: { organizationId: ctx.user.organizationId ?? "" },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    })
    return c.json({ locations })
  }),
}) 