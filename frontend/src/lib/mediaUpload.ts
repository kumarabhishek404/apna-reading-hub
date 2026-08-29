import { apiFetch } from "@/lib/api";

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadOrEmbed(file: File) {
  const dataUrl = await fileToDataUrl(file);
  try {
    const res = await apiFetch("/api/media/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        mimeType: file.type || "image/jpeg",
        data: dataUrl,
      }),
    });
    if (res.ok) {
      return (await res.json()) as { url: string; name: string };
    }
  } catch {
    // Keep the drawing in the note even if the upload route is unavailable.
  }
  return { url: dataUrl, name: file.name };
}
