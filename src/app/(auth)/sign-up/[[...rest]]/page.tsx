import Link from "next/link"
import { Button } from "@/components/ui/button"

/**
 * Public self-registration is disabled. Users accept an email invite or are added by an admin, then sign in.
 * In Clerk Dashboard: User & authentication → Sign-up → set "Sign-up mode" to Restricted (invitations only).
 */
const Page = () => {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Invitations only
        </h1>
        <p className="mt-3 text-muted-foreground">
          New accounts are created when your practice administrator invites you by
          email. Use the link in your invitation, then sign in with the same
          address.
        </p>
        <Button asChild className="mt-8">
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </div>
    </div>
  )
}

export default Page
