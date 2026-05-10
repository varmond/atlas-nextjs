import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"
import { requireActiveOrganizationId } from "@/lib/active-organization"

const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export const patientRouter = router({
  getPatients: privateProcedure.query(async ({ c, ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.user)
    const patients = await db.patient.findMany({
      where: { organizationId },
      orderBy: { lastName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    })
    console.log(patients)
    return c.json({ patients })
  }),

  getPatient: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ c, ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.user)
      const patient = await db.patient.findFirst({
        where: {
          id: input.id,
          organizationId,
        },
      })

      if (!patient) {
        throw new HTTPException(404, { message: "Patient not found" })
      }

      return c.json({ patient })
    }),

  createPatient: privateProcedure
    .input(patientSchema)
    .mutation(async ({ c, ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.user)
      const patient = await db.patient.create({
        data: {
          ...input,
          organizationId,
        },
      })
      return c.json({ patient })
    }),

  updatePatient: privateProcedure
    .input(z.object({
      id: z.string(),
      data: patientSchema,
    }))
    .mutation(async ({ c, ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.user)
      const result = await db.patient.updateMany({
        where: {
          id: input.id,
          organizationId,
        },
        data: input.data,
      })
      if (result.count === 0) {
        throw new HTTPException(404, { message: "Patient not found" })
      }
      const patient = await db.patient.findFirst({
        where: { id: input.id, organizationId },
      })
      return c.json({ patient })
    }),

  deletePatient: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ c, ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.user)
      const result = await db.patient.deleteMany({
        where: {
          id: input.id,
          organizationId,
        },
      })
      if (result.count === 0) {
        throw new HTTPException(404, { message: "Patient not found" })
      }
      return c.json({ success: true })
    }),
}) 