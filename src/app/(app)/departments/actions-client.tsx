"use client";

import { useActionState } from "react";
import { toggleDepartmentAction, deleteDepartmentAction } from "@/lib/actions/departments";
import { pill } from "@/components/ui";
import { ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

const DEACTIVATE_PILL = pill("amber");
const ACTIVATE_PILL = pill("emerald");
const DELETE_PILL = pill("red");

export function ToggleForm({ departmentId, isActive }: { departmentId: string; isActive: boolean }) {
  const [state, formAction, pending] = useActionState(
    () => toggleDepartmentAction(departmentId),
    { success: false, message: "" }
  );

  const style = isActive ? DEACTIVATE_PILL : ACTIVATE_PILL;

  return (
    <form action={formAction}>
      <button type="submit" disabled={pending} className={style.outer}>
        <span className={style.chip}>
          {isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
        </span>
        {isActive ? "Deactivate" : "Activate"}
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
        className={DELETE_PILL.outer}
        title={canDelete ? "Delete department" : "Cannot delete — has associated visits/stops"}
      >
        <span className={DELETE_PILL.chip}>
          <Trash2 className="h-3.5 w-3.5" />
        </span>
        Delete
      </button>
      {state.message && !state.success && (
        <p className="mt-1 text-[10px] text-red-600">{state.message}</p>
      )}
    </form>
  );
}
