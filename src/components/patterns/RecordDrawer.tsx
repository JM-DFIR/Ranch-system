import { useCallback, useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog } from "./ConfirmDialog";

interface RecordDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Caller tracks form dirty state (e.g. react-hook-form's formState.isDirty). */
  isDirty?: boolean;
  children: ReactNode;
}

// The universal container for every "record X" action — the dashboard
// quick-action bar, an animal profile, and the register's bulk action
// bar all open the same component (documented as the canonical pattern
// once Record Vaccination, the first real drawer, exists — Session 6).
// 480px. Focus trap and Escape-to-close come from the underlying Radix
// Dialog primitive; the dirty-close warning is the one thing layered on
// top, so Escape and the overlay click both funnel through it too.
export function RecordDrawer({
  open,
  onOpenChange,
  title,
  description,
  isDirty = false,
  children,
}: RecordDrawerProps) {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isDirty) {
        setShowDiscardConfirm(true);
        return;
      }
      onOpenChange(nextOpen);
    },
    [isDirty, onOpenChange],
  );

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[480px]">
          <SheetHeader className="border-b border-line">
            <SheetTitle className="font-display text-20">{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title="Discard unsaved changes?"
        description="What you've entered so far will be lost."
        confirmLabel="Discard"
        destructive
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
