export const downloadCSV = (rows: any[], filename: string) => {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]).join(",");
  const csvRows = rows.map(r =>
    Object.values(r).join(",")
  );

  const csv = [headers, ...csvRows].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  window.URL.revokeObjectURL(url);
};