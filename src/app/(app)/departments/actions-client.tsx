"use client";

import { useActionState } from "react";
import { toggleDepartmentAction, deleteDepartmentAction } from "@/lib/actions/departments";
import { ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

export function ToggleForm({ departmentId, isActive }: { departmentId: string; isActive: boolean }) {
  const [state, formAction, pending] = useActionState(
    () => toggleDepartmentAction(departmentId),
    { success: false, message: "" }
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className={`text-xs font-medium hover:underline disabled:opacity-50 ${
          isActive ? "text-amber-600" : "text-emerald-600"
        }`}
      >
        {isActive ? (
          <>
            <ToggleRight className="inline h-3 w-3 mr-1" />
            Deactivate
          </>
        ) : (
          <>
            <ToggleLeft className="inline h-3 w-3 mr-1" />
            Activate
          </>
        )}
      </button>
      {state.message && !state.success && (
        <p className="mt-1 text-[10px] text-red-600">{state.message}</p>
      )}
    </form>
  );
}

export function DeleteForm({
  departmentId,
  visitCount,
  stopCount,
}: {
  departmentId: string;
  visitCount: number;
  stopCount: number;
}) {
  const [state, formAction, pending] = useActionState(
    () => deleteDepartmentAction(departmentId),
    { success: false, message: "" }
  );

  const canDelete = visitCount === 0 && stopCount === 0;

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending || !canDelete}
        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-30 disabled:pointer-events-none"
        title={canDelete ? "Delete department" : "Cannot delete — has associated visits/stops"}
      >
        <Trash2 className="inline h-3 w-3 mr-1" />
        Delete
      </button>
      {state.message && !state.success && (
        <p className="mt-1 text-[10px] text-red-600">{state.message}</p>
      )}
    </form>
  );
}
