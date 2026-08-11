import type { VisibilityState } from "@tanstack/react-table";
import { Columns3, Rows3, Rows4 } from "lucide-react";

import type { Density } from "@/components/patterns/DataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HIDEABLE_COLUMNS } from "../columns";

interface TableToolbarProps {
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (next: VisibilityState) => void;
  density: Density;
  onDensityChange: (density: Density) => void;
}

// Density is a row-height preference, independent of pagination/page
// size (session-pack.md, Session 3) — it never changes how many rows
// are fetched, only how tall each one renders.
export function TableToolbar({
  columnVisibility,
  onColumnVisibilityChange,
  density,
  onDensityChange,
}: TableToolbarProps) {
  const isVisible = (id: string) => columnVisibility[id] !== false;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center rounded-md border border-input p-0.5">
        <Button
          variant={density === "comfortable" ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label="Comfortable row height"
          aria-pressed={density === "comfortable"}
          onClick={() => onDensityChange("comfortable")}
        >
          <Rows3 className="size-4" aria-hidden />
        </Button>
        <Button
          variant={density === "compact" ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label="Compact row height"
          aria-pressed={density === "compact"}
          onClick={() => onDensityChange("compact")}
        >
          <Rows4 className="size-4" aria-hidden />
        </Button>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Columns3 className="size-3.5" aria-hidden />
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {HIDEABLE_COLUMNS.map((col) => (
            <DropdownMenuCheckboxItem
              key={col.id}
              checked={isVisible(col.id)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(checked) => onColumnVisibilityChange({ ...columnVisibility, [col.id]: checked })}
            >
              {col.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
