function exportToCSV(posts) {
  if (!posts.length) return;

  const headers = ["ID", "Author", "Date", "Text", "URL"];
  const csvContent = [
    headers.join(","),
    ...posts.map((p) => {
      const date = new Date(p.timestamp).toLocaleString().replace(",", "");
      const safeText = `"${(p.text || "")
        .replace(/"/g, '""')
        .replace(/\n/g, " ")}"`;
      const safeAuthor = `"${(p.author || "Unknown").replace(/"/g, '""')}"`;
      const safeUrl = p.url || "";
      return `${p.id},${safeAuthor},"${date}",${safeText},${safeUrl}`;
    }),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `fb_jobs_${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportToJSON(posts) {
  if (!posts.length) return;
  const blob = new Blob([JSON.stringify(posts, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, `fb_jobs_${new Date().toISOString().slice(0, 10)}.json`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
