import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileText, Upload } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimalDocuments } from "../../hooks";
import { getDocumentSignedUrl, uploadAnimalDocument } from "../../api";

interface DocumentsTabProps {
  animalId: string;
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Documents (vaccination certificates, ANITRAC papers, permits) are a
// plain online-only upload — not one of the five offline write-queue
// operations (CLAUDE.md §8) the way animals.photo_path is. Uploads go
// straight to Supabase Storage; the private "documents" bucket
// (0024_documents_storage.sql) means every read is a signed URL,
// generated on demand rather than pre-fetched for the whole list.
export function DocumentsTab({ animalId }: DocumentsTabProps) {
  const { profile } = useAuth();
  const { data: documents, isLoading } = useAnimalDocuments(animalId);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!profile) throw new Error("Not signed in");
      await uploadAnimalDocument(profile.orgId, animalId, file, profile.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.animals.documents(animalId) });
      toast.success("Document uploaded");
    },
    onError: (error) => {
      toast.error("Couldn't upload document", { description: error instanceof Error ? error.message : undefined });
    },
  });

  const handleView = async (documentId: string, filePath: string) => {
    setDownloadingId(documentId);
    try {
      const url = await getDocumentSignedUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Couldn't open document", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadMutation.mutate(file);
            e.target.value = "";
          }}
        />
        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending} className="gap-1.5">
          <Upload className="size-3.5" aria-hidden />
          {uploadMutation.isPending ? "Uploading…" : "Upload document"}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !documents?.length ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Vaccination certificates, ANITRAC papers, permits — upload anything that belongs with this animal's record."
          action={{ label: "Upload document", onClick: () => fileInputRef.current?.click() }}
        />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-card">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-14 text-foreground">{doc.fileName}</p>
                  <p className="text-12 text-muted-foreground">
                    {formatDate(doc.createdAt)}
                    {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
                    {doc.sizeBytes != null ? ` · ${formatSize(doc.sizeBytes)}` : ""}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
                disabled={downloadingId === doc.id}
                onClick={() => void handleView(doc.id, doc.filePath)}
              >
                <Download className="size-3.5" aria-hidden />
                {downloadingId === doc.id ? "Opening…" : "View"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
