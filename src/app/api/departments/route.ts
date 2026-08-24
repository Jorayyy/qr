import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const departments = await db.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, building: true },
  });
  return NextResponse.json(departments);
}
