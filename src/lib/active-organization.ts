import type { User } from "@prisma/client"
import { HTTPException } from "hono/http-exception"

/** Resolve the tenant (practice) id for API handlers. Prefer the user's selected org. */
export type OrgScopedUser = Pick<User, "currentOrganizationId" | "organizationId">

export function getActiveOrganizationId(user: OrgScopedUser): string | null {
  return user.currentOrganizationId ?? user.organizationId ?? null
}

export function requireActiveOrganizationId(user: OrgScopedUser): string {
  const id = getActiveOrganizationId(user)
  if (!id) {
    throw new HTTPException(400, {
      message:
        "No active practice is selected. Switch organization in the sidebar or contact your administrator.",
    })
  }
  return id
}
