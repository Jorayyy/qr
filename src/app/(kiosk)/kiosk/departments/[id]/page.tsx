import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { KioskStation } from "@/components/kiosk-station";

export default async function DepartmentStationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reset?: string }>;
}) {
  const { id } = await params;
  const { reset } = await searchParams;

  const department = await db.department.findUnique({
    where: { id },
    select: { id: true, name: true, building: true, isActive: true },
  });
  if (!department || !department.isActive) notFound();

  return (
    <KioskStation
      key={reset ?? department.id}
      title={department.name}
      subtitle={`Entrance station${department.building ? ` · ${department.building}` : ""} — scan your QR code to check in here.`}
      action="checkin"
      departmentId={department.id}
      confirmLabel="Check In Here"
      successMessage={`Checked in at ${department.name}.`}
    />
  );
}
