import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";

import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/kitchen-sink")({
  component: KitchenSink,
});

const RAMPS = [
  {
    name: "Acacia",
    prefix: "acacia",
    steps: [
      ["50", "#F0F5F2"],
      ["100", "#DCE8E2"],
      ["200", "#B9D1C5"],
      ["300", "#8DB4A2"],
      ["400", "#5C9179"],
      ["500", "#3D7C61"],
      ["600", "#2F6B54"],
      ["700", "#265545"],
      ["800", "#1F4638"],
      ["900", "#1B3A2F"],
      ["950", "#0F221B"],
    ],
  },
  {
    name: "Ochre",
    prefix: "ochre",
    steps: [
      ["50", "#FDF6EC"],
      ["100", "#F9E8CE"],
      ["200", "#F2CE9A"],
      ["300", "#E7AE60"],
      ["400", "#D89138"],
      ["500", "#C2761E"],
      ["600", "#A25C16"],
      ["700", "#7F4515"],
      ["800", "#663717"],
      ["900", "#552F16"],
    ],
  },
  {
    name: "Bone",
    prefix: "bone",
    steps: [
      ["50", "#FAF8F4"],
      ["100", "#F1EDE6"],
      ["200", "#E2DCD2"],
      ["300", "#CFC7B9"],
      ["400", "#ADA396"],
      ["500", "#8A8175"],
      ["600", "#6B655C"],
      ["700", "#514C45"],
      ["800", "#38342F"],
      ["900", "#1A1815"],
    ],
  },
] as const;

const STATUS_SWATCHES = [
  { name: "ok", label: "Healthy / active", hex: "#2F6B54" },
  { name: "warn", label: "Attention / due soon", hex: "#C2761E" },
  { name: "critical", label: "Overdue / severe", hex: "#A63A2B" },
  { name: "info", label: "Informational", hex: "#2C5D7C" },
  { name: "neutral", label: "Deceased / inactive", hex: "#6B655C" },
] as const;

const TYPE_SCALE = [12, 13, 14, 16, 20, 26, 34] as const;

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const satisfies readonly VariantProps<typeof buttonVariants>["variant"][];

const BUTTON_SIZES = [
  "xs",
  "sm",
  "default",
  "lg",
] as const satisfies readonly VariantProps<typeof buttonVariants>["size"][];

const BADGE_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ok",
  "warn",
  "critical",
  "info",
  "neutral",
  "destructive",
] as const satisfies readonly VariantProps<typeof badgeVariants>["variant"][];

const SAMPLE_ANIMALS = [
  { tag: "MUX 118", species: "Cattle", weight: "412.50", status: "ok" as const },
  { tag: "M47", species: "Goat", weight: "38.20", status: "warn" as const },
  { tag: "MUX 122", species: "Cattle", weight: "389.00", status: "critical" as const },
];

function KitchenSink() {
  return (
    <main className="mx-auto max-w-6xl space-y-16 px-8 py-12">
      <header className="space-y-2">
        <p className="text-13 font-medium text-status-ok">Design system</p>
        <h1 className="font-display text-34 font-semibold text-foreground">
          Kitchen sink
        </h1>
        <p className="max-w-prose text-16 text-muted-foreground">
          Every token and primitive on one page, per CLAUDE.md §4. This is where the
          visual language gets locked before anything real is built on top of it.
        </p>
      </header>

      {/* ---------------------------------------------------------- */}
      <Section title="Colour — palette ramps">
        <div className="space-y-8">
          {RAMPS.map((ramp) => (
            <div key={ramp.name}>
              <h3 className="mb-3 text-14 font-medium text-foreground">{ramp.name}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
                {ramp.steps.map(([step, hex]) => (
                  <div key={step} className="space-y-1.5">
                    <div
                      className="h-14 rounded-card border border-line"
                      style={{ backgroundColor: hex }}
                    />
                    <p className="tabular text-12 text-foreground">
                      {ramp.prefix}-{step}
                    </p>
                    <p className="tabular text-12 text-muted-foreground">{hex}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section
        title="Colour — status semantics"
        description="Functional only, never decorative. Red means something is wrong — it never means “look here.”"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STATUS_SWATCHES.map((s) => (
            <div key={s.name} className="space-y-1.5">
              <div
                className="h-14 rounded-card border border-line"
                style={{ backgroundColor: s.hex }}
              />
              <p className="text-12 font-medium text-foreground">{s.name}</p>
              <p className="text-12 text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section
        title="Typography — three roles"
        description="Display (Bricolage Grotesque) · Body/UI (Inter) · Data (IBM Plex Mono). Scale: 12/13/14/16/20/26/34 — nothing outside these seven sizes."
      >
        <div className="space-y-8">
          <TypeFaceDemo
            label="Display — Bricolage Grotesque"
            fontClassName="font-display font-semibold"
          />
          <TypeFaceDemo label="Body / UI — Inter" fontClassName="font-sans font-normal" />
          <TypeFaceDemo
            label="Data — IBM Plex Mono"
            fontClassName="font-mono tabular"
            sample="MUX 0118 · 412.50 kg · 2027-03-14"
          />
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section title="Buttons — variants and sizes">
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-13 text-muted-foreground">Variants</p>
            <div className="flex flex-wrap items-center gap-3">
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-13 text-muted-foreground">Sizes</p>
            <div className="flex flex-wrap items-center gap-3">
              {BUTTON_SIZES.map((size) => (
                <Button key={size} size={size}>
                  Record death
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-13 text-muted-foreground">Disabled</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled>Record death</Button>
              <Button variant="outline" disabled>
                Record death
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section title="Inputs — all states">
        <div className="grid max-w-xl gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="ks-default">Tag number</Label>
            <Input id="ks-default" placeholder="MUX 0501" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ks-filled">Tag number</Label>
            <Input id="ks-filled" defaultValue="MUX 0118" className="tabular" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ks-error">Tag number</Label>
            <Input
              id="ks-error"
              defaultValue="MUX 0118"
              aria-invalid
              className="tabular"
            />
            <p className="text-12 text-destructive">
              This tag is already in use on Kilifi Ranch.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ks-disabled">Tag number</Label>
            <Input id="ks-disabled" defaultValue="MUX 0118" disabled />
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section title="Badges — every semantic colour">
        <div className="flex flex-wrap items-center gap-2">
          {BADGE_VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section title="Card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle className="font-display text-20">Kilifi Ranch</CardTitle>
            <CardDescription>Coastal, 240 acres</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-14">
              <span className="text-muted-foreground">Active animals</span>
              <span className="tabular font-medium">312</span>
            </div>
            <div className="flex items-center justify-between text-14">
              <span className="text-muted-foreground">Requiring attention</span>
              <Badge variant="warn">7</Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">
              View ranch
            </Button>
          </CardFooter>
        </Card>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section
        title="Table — tabular numerals"
        description="Every tag number, count, date and weight uses .tabular so a column of 500 rows stays scannable."
      >
        <div className="overflow-hidden rounded-card border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Species</TableHead>
                <TableHead className="text-right">Weight (kg)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE_ANIMALS.map((animal) => (
                <TableRow key={animal.tag}>
                  <TableCell className="tabular font-medium">{animal.tag}</TableCell>
                  <TableCell>{animal.species}</TableCell>
                  <TableCell className="tabular text-right">{animal.weight}</TableCell>
                  <TableCell>
                    <Badge variant={animal.status}>{animal.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section title="Loading skeleton">
        <div className="max-w-sm space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Section>

      {/* ---------------------------------------------------------- */}
      <Section
        title="Empty state"
        description="Every empty register explains what belongs there and offers the action that fills it. Never “No data.”"
      >
        <div className="flex max-w-md flex-col items-center gap-3 rounded-card border border-dashed border-line bg-secondary/40 px-8 py-12 text-center">
          <Inbox className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-14 font-medium text-foreground">No animals recorded yet</p>
          <p className="text-13 text-muted-foreground">
            Enrol your herd one animal at a time, with a photo, from Enrollment Mode.
          </p>
          <Button size="sm">Start enrolling</Button>
        </div>
      </Section>

      <Separator />
      <footer className="pb-8 text-12 text-muted-foreground">
        LIMS design system — Session 0.
      </footer>
    </main>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-20 font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="max-w-prose text-13 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function TypeFaceDemo({
  label,
  fontClassName,
  sample = "Every animal has a record",
}: {
  label: string;
  fontClassName: string;
  sample?: string;
}) {
  return (
    <div>
      <p className="mb-3 text-13 text-muted-foreground">{label}</p>
      <div className="space-y-1.5">
        {TYPE_SCALE.map((size) => (
          <div key={size} className="flex items-baseline gap-4">
            <span className="tabular w-10 shrink-0 text-12 text-muted-foreground">
              {size}
            </span>
            <span className={cnText(fontClassName, size)}>{sample}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tailwind's scanner needs literal class strings, not runtime template
// interpolation — a dynamic `text-${size}` would silently never be
// generated. These full literals are what actually get picked up.
const TYPE_SIZE_CLASS: Record<(typeof TYPE_SCALE)[number], string> = {
  12: "text-12",
  13: "text-13",
  14: "text-14",
  16: "text-16",
  20: "text-20",
  26: "text-26",
  34: "text-34",
};

function cnText(fontClassName: string, size: (typeof TYPE_SCALE)[number]) {
  return cn(fontClassName, TYPE_SIZE_CLASS[size], "text-foreground");
}
