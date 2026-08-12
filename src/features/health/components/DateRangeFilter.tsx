import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DateRangeFilterProps {
  dateFrom: string | undefined;
  dateTo: string | undefined;
  onChange: (range: { dateFrom?: string; dateTo?: string }) => void;
}

// The one filter every standalone health register shares — ranch is
// already global via `_authenticated`'s switcher, so this is the only
// register-local filter these secondary screens need (unlike the
// animal register's full FilterBar).
export function DateRangeFilter({ dateFrom, dateTo, onChange }: DateRangeFilterProps) {
  const hasRange = !!dateFrom || !!dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-card px-4 py-3">
      <Input
        type="date"
        value={dateFrom ?? ""}
        onChange={(e) => onChange({ dateFrom: e.target.value || undefined, dateTo })}
        className="h-8 w-36"
        aria-label="From date"
      />
      <span className="text-12 text-muted-foreground">to</span>
      <Input
        type="date"
        value={dateTo ?? ""}
        onChange={(e) => onChange({ dateFrom, dateTo: e.target.value || undefined })}
        className="h-8 w-36"
        aria-label="To date"
      />
      {hasRange ? (
        <Button variant="ghost" size="sm" onClick={() => onChange({ dateFrom: undefined, dateTo: undefined })} className="gap-1 text-muted-foreground">
          <X className="size-3.5" aria-hidden />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
