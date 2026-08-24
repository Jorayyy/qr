import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { visitId } = await req.json();
  if (!visitId) {
    return NextResponse.json({ success: false, message: "Missing visitId" }, { status: 400 });
  }

  const visit = await db.visit.findUnique({ where: { id: visitId } });
  if (!visit) {
    return NextResponse.json({ success: false, message: "Visit not found" }, { status: 404 });
  }
  if (visit.status !== "PENDING") {
    return NextResponse.json({ success: false, message: `Visit is already ${visit.status.toLowerCase()}.` });
  }

  const updated = await db.visit.update({
    where: { id: visitId },
    data: { status: "CHECKED_IN", actualArrival: new Date() },
  });

  return NextResponse.json({ success: true, visit: updated });
}
