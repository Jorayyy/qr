import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { MfaManager } from "./mfa-manager";

export default async function SecurityPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { email: true, mfaEnabled: true },
  });
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader
        title="Two-factor authentication"
        subtitle="Add a second step at sign-in using an authenticator app"
      />
      <Card>
        <CardHeader
          title="Authenticator app"
          subtitle="Time-based one-time codes (TOTP) from apps like Google Authenticator, Authy, or 1Password."
        />
        <div className="px-5 pb-5">
          <MfaManager email={user.email} mfaEnabled={user.mfaEnabled} />
        </div>
      </Card>
    </div>
  );
}
