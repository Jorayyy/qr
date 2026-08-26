"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui";
import { deleteVisitorAction } from "@/lib/actions/visitors";

export function DeleteVisitorButton({ visitorId }: { visitorId: string }) {
  const [state, formAction, pending] = useActionState(
    () => deleteVisitorAction(visitorId),
    { success: false, message: "" }
  );

  return (
    <form action={formAction} className="inline">
      <Button
        type="submit"
        variant="ghost"
        disabled={pending}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={(e) => {
          if (!confirm("Delete this visitor and all their visits?")) {
            e.preventDefault();
          }
        }}
      >
        {pending ? "Deleting..." : "Delete"}
      </Button>
      {state.message && !state.success && (
        <p className="mt-1 text-[10px] text-red-600">{state.message}</p>
      )}
    </form>
  );
}
