import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stethoscope, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorState } from "@/components/patterns/ErrorState";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVeterinarianDirectory } from "../hooks";
import { softDeleteVeterinarian, type VeterinarianRecord } from "../api";
import { AddVeterinarianDialog } from "./AddVeterinarianDialog";

// The Veterinarians directory (blueprint.md Part 4's coverage matrix,
// session-pack.md Session 8). A reference catalogue like species or
// vaccines — org-wide, any member can add or soft-delete a row
// (0021_reference_catalogue_manager_write.sql) — so this is a plain
// list + add + remove, not the "record X" drawer pattern.
export function VeterinariansPage() {
  const { profile } = useAuth();
  const { data: vets, isLoading, isError, error, refetch } = useVeterinarianDirectory(profile?.orgId);
  const [addOpen, setAddOpen] = useState(false);
  const [toRemove, setToRemove] = useState<VeterinarianRecord | null>(null);
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: (id: string) => softDeleteVeterinarian(id),
    onSuccess: () => {
      if (profile) void queryClient.invalidateQueries({ queryKey: queryKeys.health.veterinarianDirectory(profile.orgId) });
      if (profile) void queryClient.invalidateQueries({ queryKey: queryKeys.health.veterinarianOptions(profile.orgId) });
      toast.success("Veterinarian removed");
      setToRemove(null);
    },
    onError: (err) => {
      toast.error("Couldn't remove veterinarian", { description: err instanceof Error ? err.message : undefined });
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Veterinarians"
        description="Shared across every ranch — anyone can add one."
        actions={<Button onClick={() => setAddOpen(true)}>Add veterinarian</Button>}
      />

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load veterinarians"
          description={error instanceof Error ? error.message : "Check your connection and try again."}
          onRetry={() => void refetch()}
        />
      ) : !vets || vets.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No veterinarians added yet"
          description="Add the veterinarians you work with so they're one search away when you record a vet visit or treatment."
          action={{ label: "Add veterinarian", onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Practice</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vets.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{v.practice ?? "—"}</TableCell>
                  <TableCell className="font-mono tabular-nums">{v.phone ?? "—"}</TableCell>
                  <TableCell>{v.email ?? "—"}</TableCell>
                  <TableCell>
                    <Button size="icon-sm" variant="ghost" aria-label={`Remove ${v.name}`} onClick={() => setToRemove(v)}>
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddVeterinarianDialog open={addOpen} onOpenChange={setAddOpen} />
      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(open) => !open && setToRemove(null)}
        title={`Remove ${toRemove?.name}?`}
        description="They'll no longer appear when choosing a veterinarian for a new record. Existing records are unaffected."
        confirmLabel="Remove"
        destructive
        onConfirm={() => toRemove && removeMutation.mutate(toRemove.id)}
      />
    </div>
  );
}
