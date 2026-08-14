import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Lock, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CatalogueListCardProps<T> {
  rows: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  getId: (row: T) => string;
  getName: (row: T) => string;
  renderDetail?: (row: T) => ReactNode;
  /** false hides the remove action — the seeded, system-owned rows (e.g. "Active"). */
  canRemove?: (row: T) => boolean;
  onRemove: (row: T) => void;
  isRemoving: boolean;
  onAdd: () => void;
  addLabel: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  removeConfirmTitle: (row: T) => string;
  removeConfirmDescription: string;
}

// The shared list/add/remove shell behind all eight Reference Data
// Manager catalogues (blueprint.md §4.1's "Reference Data Manager" —
// one screen, not eight). Each catalogue supplies its own fetch/create/
// soft-delete calls and its own small "Add" dialog (the fields differ
// too much per table to share — species' gestation days and a feed
// item's unit have nothing in common) — this only shares the list
// chrome, same division of labour as the Family C reports share a
// renderer but not their SQL.
export function CatalogueListCard<T>({
  rows,
  isLoading,
  isError,
  error,
  onRetry,
  getId,
  getName,
  renderDetail,
  canRemove,
  onRemove,
  isRemoving,
  onAdd,
  addLabel,
  icon,
  emptyTitle,
  emptyDescription,
  removeConfirmTitle,
  removeConfirmDescription,
}: CatalogueListCardProps<T>) {
  const [toRemove, setToRemove] = useState<T | null>(null);
  const Icon = icon;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load this list"
          description={error instanceof Error ? error.message : "Check your connection and try again."}
          onRetry={onRetry}
        />
      ) : !rows || rows.length === 0 ? (
        <EmptyState icon={Icon} title={emptyTitle} description={emptyDescription} action={{ label: addLabel, onClick: onAdd }} />
      ) : (
        <div className="overflow-hidden rounded-card border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {renderDetail ? <TableHead>Detail</TableHead> : null}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const removable = canRemove ? canRemove(row) : true;
                return (
                  <TableRow key={getId(row)}>
                    <TableCell className="font-medium">{getName(row)}</TableCell>
                    {renderDetail ? <TableCell className="text-muted-foreground">{renderDetail(row)}</TableCell> : null}
                    <TableCell>
                      {removable ? (
                        <Button size="icon-sm" variant="ghost" aria-label={`Remove ${getName(row)}`} onClick={() => setToRemove(row)}>
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      ) : (
                        <Lock className="size-3.5 text-muted-foreground/50" aria-label="Built in — can't be removed" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(open) => !open && setToRemove(null)}
        title={toRemove ? removeConfirmTitle(toRemove) : ""}
        description={removeConfirmDescription}
        confirmLabel="Remove"
        destructive
        isConfirming={isRemoving}
        onConfirm={() => {
          if (toRemove) onRemove(toRemove);
          setToRemove(null);
        }}
      />
    </div>
  );
}
