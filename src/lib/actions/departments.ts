"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getRequestContext, getSession, type SessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { can, type Permission } from "@/lib/rbac";
import { departmentSchema, formString, uuidSchema } from "@/lib/validation";

export type DepartmentActionState = {
  success: boolean;
  message: string;
};

const DENIED: DepartmentActionState = {
  success: false,
  message: "You are not authorized to manage departments.",
};

async function guard(
  permission: Permission,
  action: string,
  targetId?: string
): Promise<{ user: SessionUser; ctx: Awaited<ReturnType<typeof getRequestContext>> } | null> {
  const ctx = await getRequestContext();
  const user = await getSession();
  if (!user || !can(user.role, permission)) {
    await recordAudit({
      actorId: user?.userId,
      actorEmail: user?.email,
      action,
      result: "DENIED",
      targetType: "action",
      targetId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
      meta: { permission, role: user?.role ?? "anonymous" },
    });
    return null;
  }
  return { user, ctx };
}

function readDepartmentForm(formData: FormData) {
  return departmentSchema.safeParse({
    name: formString(formData, "name"),
    building: formString(formData, "building"),
    contactPerson: formString(formData, "contactPerson"),
    contactEmail: formString(formData, "contactEmail"),
  });
}

export async function createDepartmentAction(
  _prev: DepartmentActionState,
  formData: FormData
): Promise<DepartmentActionState> {
  const auth = await guard("department:manage", "DEPARTMENT_CREATED");
  if (!auth) return DENIED;

  const parsed = readDepartmentForm(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please check the form fields.",
    };
  }

  try {
    const existing = await db.department.findFirst({ where: { name: parsed.data.name } });
    if (existing) {
      return { success: false, message: "A department with this name already exists." };
    }

    const department = await db.department.create({ data: parsed.data });

    await recordAudit({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      action: "DEPARTMENT_CREATED",
      result: "SUCCESS",
      targetType: "department",
      targetId: department.id,
      ip: auth.ctx.ip,
      userAgent: auth.ctx.userAgent,
      requestId: auth.ctx.requestId,
      meta: { name: department.name },
    });

    revalidatePath("/departments");
    return { success: true, message: "Department created successfully." };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "DEPARTMENT_CREATE_ERROR",
        requestId: auth.ctx.requestId,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return { success: false, message: "Failed to create department." };
  }
}

export async function updateDepartmentAction(
  id: string,
  _prev: DepartmentActionState,
  formData: FormData
): Promise<DepartmentActionState> {
  const auth = await guard("department:manage", "DEPARTMENT_UPDATED", id);
  if (!auth) return DENIED;

  const departmentId = uuidSchema.safeParse(id);
  if (!departmentId.success) return { success: false, message: "Invalid department." };

  const parsed = readDepartmentForm(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please check the form fields.",
    };
  }

  try {
    const target = await db.department.findUnique({ where: { id: departmentId.data } });
    if (!target) return { success: false, message: "Department not found." };

    const duplicate = await db.department.findFirst({
      where: { name: parsed.data.name, NOT: { id: departmentId.data } },
    });
    if (duplicate) {
      return { success: false, message: "A department with this name already exists." };
    }

    await db.department.update({ where: { id: departmentId.data }, data: parsed.data });

    await recordAudit({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      action: "DEPARTMENT_UPDATED",
      result: "SUCCESS",
      targetType: "department",
      targetId: departmentId.data,
      ip: auth.ctx.ip,
      userAgent: auth.ctx.userAgent,
      requestId: auth.ctx.requestId,
      meta: { name: parsed.data.name },
    });

    revalidatePath("/departments");
    revalidatePath(`/departments/${departmentId.data}/edit`);
    return { success: true, message: "Department updated successfully." };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "DEPARTMENT_UPDATE_ERROR",
        requestId: auth.ctx.requestId,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return { success: false, message: "Failed to update department." };
  }
}

export async function toggleDepartmentAction(id: string): Promise<DepartmentActionState> {
  const auth = await guard("department:manage", "DEPARTMENT_TOGGLED", id);
  if (!auth) return DENIED;

  const departmentId = uuidSchema.safeParse(id);
  if (!departmentId.success) return { success: false, message: "Invalid department." };

  try {
    const dept = await db.department.findUnique({
      where: { id: departmentId.data },
      select: { id: true, isActive: true },
    });
    if (!dept) return { success: false, message: "Department not found." };

    await db.department.update({
      where: { id: dept.id },
      data: { isActive: !dept.isActive },
    });

    await recordAudit({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      action: "DEPARTMENT_TOGGLED",
      result: "SUCCESS",
      targetType: "department",
      targetId: dept.id,
      ip: auth.ctx.ip,
      userAgent: auth.ctx.userAgent,
      requestId: auth.ctx.requestId,
      meta: { activated: !dept.isActive },
    });

    revalidatePath("/departments");
    return {
      success: true,
      message: dept.isActive ? "Department deactivated." : "Department activated.",
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "DEPARTMENT_TOGGLE_ERROR",
        requestId: auth.ctx.requestId,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return { success: false, message: "Failed to toggle department status." };
  }
}

export async function deleteDepartmentAction(id: string): Promise<DepartmentActionState> {
  const auth = await guard("department:manage", "DEPARTMENT_DELETED", id);
  if (!auth) return DENIED;

  const departmentId = uuidSchema.safeParse(id);
  if (!departmentId.success) return { success: false, message: "Invalid department." };

  try {
    const visitCount = await db.visit.count({ where: { departmentId: departmentId.data } });
    if (visitCount > 0) {
      return {
        success: false,
        message: `Cannot delete — this department is used by ${visitCount} visit(s). Deactivate it instead.`,
      };
    }

    const stopCount = await db.visitStop.count({ where: { departmentId: departmentId.data } });
    if (stopCount > 0) {
      return {
        success: false,
        message: `Cannot delete — this department is used by ${stopCount} visit stop(s). Deactivate it instead.`,
      };
    }

    await db.department.delete({ where: { id: departmentId.data } });

    await recordAudit({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      action: "DEPARTMENT_DELETED",
      result: "SUCCESS",
      targetType: "department",
      targetId: departmentId.data,
      ip: auth.ctx.ip,
      userAgent: auth.ctx.userAgent,
      requestId: auth.ctx.requestId,
    });

    revalidatePath("/departments");
    return { success: true, message: "Department deleted." };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "DEPARTMENT_DELETE_ERROR",
        requestId: auth.ctx.requestId,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return { success: false, message: "Failed to delete department." };
  }
}
