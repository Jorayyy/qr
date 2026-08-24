import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const qr = req.nextUrl.searchParams.get("qr");
  if (!qr) {
    return NextResponse.json({ error: "Missing qr parameter" }, { status: 400 });
  }

  const visit = await db.visit.findUnique({
    where: { qrCode: qr },
    include: {
      visitor: true,
      department: true,
      stops: { include: { department: true }, orderBy: { checkedInAt: "asc" } },
    },
  });

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  return NextResponse.json(visit);
}
