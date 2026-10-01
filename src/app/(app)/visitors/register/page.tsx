import { requirePermission } from "@/lib/auth";
import RegisterVisitorForm from "./register-form";

export default async function RegisterVisitorPage() {
  await requirePermission("visitor:write");
  return <RegisterVisitorForm />;
}
