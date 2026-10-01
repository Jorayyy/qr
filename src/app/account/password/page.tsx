import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { PasswordForm } from "./password-form";

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { mustChangePassword: true },
  });
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader
        title="Change password"
        subtitle={
          user.mustChangePassword
            ? "Set a new password to continue"
            : "Update your account password"
        }
      />
      <Card>
        <CardHeader
          title="Password"
          subtitle="Changing your password signs out every other session."
        />
        <div className="px-5 pb-5">
          <PasswordForm mustChange={user.mustChangePassword} />
        </div>
      </Card>
    </div>
  );
}
