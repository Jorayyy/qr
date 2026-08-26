"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type DepartmentActionState = {
  success: boolean;
  message: string;
};

export async function createDepartmentAction(
  _prev: DepartmentActionState,
  formData: FormData
): Promise<DepartmentActionState> {
  const name = (formData.get("name") as string)?.trim();
  const building = (formData.get("building") as string)?.trim() || undefined;
  const contactPerson = (formData.get("contactPerson") as string)?.trim() || undefined;
  const contactEmail = (formData.get("contactEmail") as string)?.trim() || undefined;

  if (!name) {
    return { success: false, message: "Department name is required." };
  }

  try {
    const existing = await db.department.findFirst({ where: { name } });
    if (existing) {
      return { success: false, message: "A department with this name already exists." };
    }

    await db.department.create({
      data: { name, building, contactPerson, contactEmail },
    });

    revalidatePath("/departments");
    return { success: true, message: "Department created successfully." };
  } catch {
    return { success: false, message: "Failed to create department." };
  }
}

export async function updateDepartmentAction(
  id: string,
  _prev: DepartmentActionState,
  formData: FormData
): Promise<DepartmentActionState> {
  const name = (formData.get("name") as string)?.trim();
  const building = (formData.get("building") as string)?.trim() || undefined;
  const contactPerson = (formData.get("contactPerson") as string)?.trim() || undefined;
  const contactEmail = (formData.get("contactEmail") as string)?.trim() || undefined;

  if (!name) {
    return { success: false, message: "Department name is required." };
  }

  try {
    const existing = await db.department.findFirst({
      where: { name, NOT: { id } },
    });
    if (existing) {
      return { success: false, message: "A department with this name already exists." };
    }

    await db.department.update({
      where: { id },
      data: { name, building, contactPerson, contactEmail },
    });

    revalidatePath("/departments");
    revalidatePath(`/departments/${id}/edit`);
    return { success: true, message: "Department updated successfully." };
  } catch {
    return { success: false, message: "Failed to update department." };
  }
}

export async function toggleDepartmentAction(
  id: string
): Promise<DepartmentActionState> {
  try {
    const dept = await db.department.findUnique({ where: { id }, select: { isActive: true } });
    if (!dept) {
      return { success: false, message: "Department not found." };
    }

    await db.department.update({
      where: { id },
      data: { isActive: !dept.isActive },
    });

    revalidatePath("/departments");
    return {
      success: true,
      message: dept.isActive ? "Department deactivated." : "Department activated.",
    };
  } catch {
    return { success: false, message: "Failed to toggle department status." };
  }
}

export async function deleteDepartmentAction(
  id: string
): Promise<DepartmentActionState> {
  try {
    const visitCount = await db.visit.count({ where: { departmentId: id } });
    if (visitCount > 0) {
      return {
        success: false,
        message: `Cannot delete — this department is used by ${visitCount} visit(s). Deactivate it instead.`,
      };
    }

    const stopCount = await db.visitStop.count({ where: { departmentId: id } });
    if (stopCount > 0) {
      return {
        success: false,
        message: `Cannot delete — this department is used by ${stopCount} visit stop(s). Deactivate it instead.`,
      };
    }

    await db.department.delete({ where: { id } });
    revalidatePath("/departments");
    return { success: true, message: "Department deleted." };
  } catch {
    return { success: false, message: "Failed to delete department." };
  }
}
