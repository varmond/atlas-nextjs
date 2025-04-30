import { db } from "@/db"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"
import { z } from "zod"
import { HTTPException } from "hono/http-exception"

const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export const patientRouter = router({
  getPatients: privateProcedure.query(async ({ c, ctx }) => {
    const patients = await db.patient.findMany({
      where: { organizationId: ctx.user.organizationId ?? "" },
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
      const patient = await db.patient.findUnique({
        where: {
          id: input.id,
          organizationId: ctx.user.organizationId ?? "",
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
      const patient = await db.patient.create({
        data: {
          ...input,
          organizationId: ctx.user.organizationId ?? "",
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
      const patient = await db.patient.update({
        where: {
          id: input.id,
          organizationId: ctx.user.organizationId ?? "",
        },
        data: input.data,
      })
      return c.json({ patient })
    }),

  deletePatient: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ c, ctx, input }) => {
      await db.patient.delete({
        where: {
          id: input.id,
          organizationId: ctx.user.organizationId ?? "",
        },
      })
      return c.json({ success: true })
    }),
}) 