"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "crypto";

function generateQRCode(): string {
  return `VMS-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export type RegisterVisitorInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  idType: "SSS" | "TIN" | "PASSPORT" | "STUDENT_ID" | "OTHER";
  idNumber?: string;
  departmentId: string;
  purpose: string;
  hostName?: string;
  hostDepartment?: string;
  notes?: string;
};

export type ActionState = {
  success: boolean;
  message: string;
  data?: {
    visitorId: string;
    visitId: string;
    qrCode: string;
  };
};

export async function registerVisitorAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = (formData.get("email") as string) || undefined;
  const phone = (formData.get("phone") as string) || undefined;
  const company = (formData.get("company") as string) || undefined;
  const idType = formData.get("idType") as
    | "SSS"
    | "TIN"
    | "PASSPORT"
    | "STUDENT_ID"
    | "OTHER";
  const idNumber = (formData.get("idNumber") as string) || undefined;
  const departmentId = formData.get("departmentId") as string;
  const purpose = formData.get("purpose") as string;
  const hostName = (formData.get("hostName") as string) || undefined;
  const hostDepartment = (formData.get("hostDepartment") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;

  if (!firstName || !lastName || !departmentId || !purpose) {
    return { success: false, message: "Missing required fields." };
  }

  try {
    const qrCode = generateQRCode();

    let visitor;
    const existing = email
      ? await db.visitor.findFirst({ where: { email } })
      : null;

    if (existing) {
      visitor = await db.visitor.update({
        where: { id: existing.id },
        data: { firstName, lastName, phone, company, idType, idNumber },
      });
    } else {
      visitor = await db.visitor.create({
        data: { firstName, lastName, email, phone, company, idType, idNumber },
      });
    }

    const visit = await db.visit.create({
      data: {
        visitorId: visitor.id,
        departmentId,
        purpose: purpose as any,
        qrCode,
        hostName,
        hostDepartment,
        notes,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/visitors");

    return {
      success: true,
      message: "Visitor registered successfully!",
      data: {
        visitorId: visitor.id,
        visitId: visit.id,
        qrCode,
      },
    };
  } catch (error) {
    return { success: false, message: "Failed to register visitor. Please try again." };
  }
}

export async function checkInAction(visitId: string) {
  try {
    await db.visit.update({
      where: { id: visitId },
      data: {
        status: "CHECKED_IN",
        actualArrival: new Date(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/scanner");
    revalidatePath(`/visitors`);
    return { success: true, message: "Visitor checked in successfully!" };
  } catch {
    return { success: false, message: "Failed to check in." };
  }
}

export async function checkOutAction(visitId: string) {
  try {
    await db.visit.update({
      where: { id: visitId },
      data: {
        status: "CHECKED_OUT",
        actualDeparture: new Date(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/scanner");
    revalidatePath(`/visitors`);
    return { success: true, message: "Visitor checked out successfully!" };
  } catch {
    return { success: false, message: "Failed to check out." };
  }
}

export async function cancelVisitAction(visitId: string) {
  try {
    await db.visit.update({
      where: { id: visitId },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/dashboard");
    revalidatePath("/scanner");
    revalidatePath(`/visitors`);
    return { success: true, message: "Visit cancelled." };
  } catch {
    return { success: false, message: "Failed to cancel visit." };
  }
}

export async function addVisitStopAction(visitId: string, departmentId: string, building?: string, notes?: string) {
  try {
    await db.visitStop.create({
      data: { visitId, departmentId, building, notes },
    });
    revalidatePath("/scanner");
    return { success: true, message: "Stop logged." };
  } catch {
    return { success: false, message: "Failed to log stop." };
  }
}

export async function checkOutStopAction(stopId: string) {
  try {
    await db.visitStop.update({
      where: { id: stopId },
      data: { checkedOutAt: new Date() },
    });
    revalidatePath("/scanner");
    return { success: true, message: "Stop checked out." };
  } catch {
    return { success: false, message: "Failed to check out stop." };
  }
}
