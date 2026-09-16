// Read a chosen File as text. File.text() is missing from some engines, so a
// FileReader fallback covers them all. Shared by every place a walker picks a
// file: the backup restore, the Start-screen restore, and the CSV import.
export function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
