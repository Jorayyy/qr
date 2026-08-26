import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditDepartmentForm from "./form";

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSessionUser();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/dashboard");

  const department = await db.department.findUnique({ where: { id } });
  if (!department) notFound();

  return <EditDepartmentForm department={department} />;
}
