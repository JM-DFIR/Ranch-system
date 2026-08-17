import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { useAnimalOverviewSummary, useAnimalSummaries, useAnimalTimeline } from "../../hooks";
import type { AnimalProfile } from "../../api";

interface OverviewTabProps {
  animal: AnimalProfile;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-12 text-muted-foreground">{label}</dt>
      <dd className="text-14 text-foreground">{value ?? "—"}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-card p-4">
      <h2 className="mb-3 text-13 font-medium text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

export function OverviewTab({ animal }: OverviewTabProps) {
  const { ranch } = AuthenticatedRoute.useSearch();
  const { data: summary, isLoading: summaryLoading } = useAnimalOverviewSummary(animal.id, animal.sex);
  const { data: recentEvents, isLoading: eventsLoading } = useAnimalTimeline(animal.id, undefined, 3);
  const { data: parents } = useAnimalSummaries([animal.damId, animal.sireId].filter((id): id is string => !!id));

  const dam = parents?.find((p) => p.id === animal.damId);
  const sire = parents?.find((p) => p.id === animal.sireId);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card title="Identity">
        <dl className="grid grid-cols-2 gap-3">
          <Field label="Species" value={animal.speciesName} />
          <Field label="Breed" value={animal.breedName} />
          <Field label="Color" value={animal.color} />
          <Field label="ANITRAC AIN" value={animal.anitracAin} />
        </dl>
      </Card>

      <Card title="Dates">
        <dl className="grid grid-cols-2 gap-3">
          <Field label="Date of birth" value={animal.dateOfBirth ? formatDate(animal.dateOfBirth) : null} />
          <Field
            label="Acquisition"
            value={
              animal.acquisitionType === "born_on_ranch"
                ? "Born on the ranch"
                : animal.acquisitionType.charAt(0).toUpperCase() + animal.acquisitionType.slice(1)
            }
          />
          <Field label="Acquired" value={animal.acquisitionDate ? formatDate(animal.acquisitionDate) : null} />
          <Field label="Enrolled" value={formatDate(animal.createdAt)} />
        </dl>
      </Card>

      <Card title="Parents">
        <dl className="grid grid-cols-2 gap-3">
          <Field
            label="Dam"
            value={
              dam ? (
                <Link to="/animals/$animalId" params={{ animalId: dam.id }} search={{ ranch }} className="text-primary hover:underline">
                  {dam.tagNumber}
                </Link>
              ) : null
            }
          />
          <Field
            label="Sire"
            value={
              sire ? (
                <Link to="/animals/$animalId" params={{ animalId: sire.id }} search={{ ranch }} className="text-primary hover:underline">
                  {sire.tagNumber}
                </Link>
              ) : null
            }
          />
        </dl>
      </Card>

      {summaryLoading ? (
        <Card title="Health">
          <Skeleton className="h-16 w-full" />
        </Card>
      ) : (
        <Card title="Health">
          <dl className="grid grid-cols-2 gap-3">
            <Field
              label="Last vaccination"
              value={
                summary?.lastVaccination
                  ? `${summary.lastVaccination.vaccineName} — ${formatDate(summary.lastVaccination.date)}`
                  : null
              }
            />
            <Field
              label="Last treatment"
              value={
                summary?.lastTreatment
                  ? `${summary.lastTreatment.medicationName ?? "Treatment"} — ${formatDate(summary.lastTreatment.date)}`
                  : null
              }
            />
            <Field
              label="Last vet visit"
              value={summary?.lastVetVisit ? formatDate(summary.lastVetVisit.date) : null}
            />
          </dl>
        </Card>
      )}

      {summaryLoading ? (
        <Card title="Weight">
          <Skeleton className="h-16 w-full" />
        </Card>
      ) : (
        <Card title="Weight">
          <dl className="grid grid-cols-2 gap-3">
            <Field
              label="Last reading"
              value={
                summary?.lastWeight
                  ? summary.lastWeight.weightKg != null
                    ? `${summary.lastWeight.weightKg} kg`
                    : `BCS ${summary.lastWeight.bodyConditionScore}`
                  : null
              }
            />
            <Field
              label="Average daily gain"
              value={summary?.lastWeight?.adgKg != null ? `${summary.lastWeight.adgKg} kg/day` : null}
            />
          </dl>
        </Card>
      )}

      {summary?.activePregnancy ? (
        <Card title="Pregnancy">
          <dl className="grid grid-cols-2 gap-3">
            <Field
              label="Status"
              value={summary.activePregnancy.status === "confirmed_pregnant" ? "Confirmed pregnant" : "Served"}
            />
            <Field
              label="Expected due"
              value={summary.activePregnancy.expectedDueDate ? formatDate(summary.activePregnancy.expectedDueDate) : null}
            />
          </dl>
        </Card>
      ) : null}

      <Card title="Recent events">
        {eventsLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : recentEvents && recentEvents.length > 0 ? (
          <ul className="space-y-2">
            {recentEvents.map((event) => (
              <li key={`${event.eventType}-${event.sourceId}`} className="flex items-baseline justify-between gap-2 text-14">
                <span className="text-foreground">{event.description}</span>
                <span className="shrink-0 font-mono text-12 text-muted-foreground">{formatDate(event.eventDate)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-13 text-muted-foreground">No events recorded yet.</p>
        )}
      </Card>
    </div>
  );
}
