// Shared CSV export — originally inline in BulkActionBar.tsx's own
// exportCsv, promoted here now that the report viewers (M6) need the
// exact same thing. Plain client-side file generation, not a server
// export — fine at this scale (a filtered register or report result,
// never a raw full-table dump).
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const escape = (field: string | number | null | undefined) => `"${String(field ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((row) => row.map(escape).join(","));
  const csv = [headers.map(escape).join(","), ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
