import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecordPregnancyCheck } from "../hooks";
import { pregnancyCheckFormSchema, type PregnancyCheckFormValues } from "../schema";

interface RecordPregnancyCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  damId: string;
  damTagNumber: string;
  breedingEventId: string;
}

const TODAY = () => new Date().toISOString().slice(0, 10);

const RESULT_OPTIONS = [
  { value: "pregnant", label: "Pregnant" },
  { value: "not_pregnant", label: "Not pregnant" },
  { value: "inconclusive", label: "Inconclusive" },
];

// Tied to one specific breeding event (BreedingTab's own row action),
// not the multi-entry-point record-drawer pattern — there's no
// meaningful "free-pick" case for a check without an event to check
// (session-pack.md Part 5, "M4"). A result of "pregnant" or
// "not_pregnant" also updates the parent breeding_events.status
// (useRecordPregnancyCheck, hooks.ts) — inconclusive leaves it as-is,
// since nothing was actually resolved.
export function RecordPregnancyCheckDialog({ open, onOpenChange, damId, damTagNumber, breedingEventId }: RecordPregnancyCheckDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PregnancyCheckFormValues>({
    resolver: zodResolver(pregnancyCheckFormSchema),
    defaultValues: { checkDate: TODAY(), method: "", result: "pregnant", estimatedDays: "" },
  });

  const mutation = useRecordPregnancyCheck(damId);

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(
      { breedingEventId, values },
      {
        onSuccess: () => {
          toast.success(`Pregnancy check recorded for ${damTagNumber}`);
          reset();
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error("Couldn't record the check", { description: error instanceof Error ? error.message : undefined });
        },
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a pregnancy check for {damTagNumber}</DialogTitle>
          <DialogDescription>A result of pregnant or not pregnant also updates the breeding event's status.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="check-date">Check date</Label>
              <Input id="check-date" type="date" max={TODAY()} {...register("checkDate")} />
              {errors.checkDate ? <p className="text-13 text-status-critical">{errors.checkDate.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label>Result</Label>
              <Controller
                control={control}
                name="result"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESULT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="check-method">Method</Label>
              <Input id="check-method" {...register("method")} placeholder="e.g. Ultrasound" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="check-days">Estimated days</Label>
              <Input id="check-days" type="number" min="0" {...register("estimatedDays")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Record check"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
