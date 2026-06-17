"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { TagInput } from "@/components/shared/tag-input";
import { TagList } from "@/components/shared/tag-list";
import { apiFetch, apiUrl } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import type { PdfItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function PdfsPageClient() {
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const debouncedSearch = useDebounce(search);
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag") ?? undefined;
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (tag) params.set("tag", tag);
    apiFetch(`/api/pdfs?${params}`).then((r) => r.json()).then((d) => setPdfs(d.pdfs ?? []));
  }, [debouncedSearch, tag]);

  async function toggleFavorite(id: string) {
    const res = await apiFetch("/api/pdfs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "favorite" }),
    });
    const data = await res.json();
    if (data.pdf) setPdfs((prev) => prev.map((p) => (p.id === id ? data.pdf : p)));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name);
    formData.append("description", description);
    formData.append("tags", tags);
    const res = await apiFetch("/api/pdfs/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (data.pdf) {
      setOpen(false);
      setTitle("");
      setDescription("");
      setTags("");
      setFile(null);
      router.push(`/pdfs/${data.pdf.id}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this PDF?")) return;
    await apiFetch(`/api/pdfs?id=${id}`, { method: "DELETE" });
    setPdfs((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">PDFs</h1>
          <p className="text-stone-500">Upload and read PDF documents</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="h-4 w-4" /> Upload PDF</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload PDF</DialogTitle></DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2"><Label>PDF File</Label><Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required /></div>
              <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <TagInput value={tags} onChange={setTags} />
              <Button type="submit" disabled={uploading || !file}>{uploading ? "Uploading..." : "Upload"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PDFs..." className="pl-9" />
      </div>

      <div className="space-y-3">
        {pdfs.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-stone-500">No PDFs found</CardContent></Card>
        ) : (
          pdfs.map((pdf) => (
            <Card key={pdf.id}>
              <CardContent className="flex items-start gap-3 p-5">
                <FileText className="mt-1 h-5 w-5 text-stone-400" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/pdfs/${pdf.id}`} className="text-lg font-medium hover:underline">{pdf.title}</Link>
                    <FavoriteButton isFavorite={pdf.isFavorite} onToggle={() => toggleFavorite(pdf.id)} />
                  </div>
                  {pdf.description && <p className="text-sm text-stone-500">{pdf.description}</p>}
                  <TagList tags={pdf.tags} />
                  <p className="text-xs text-stone-400">{formatDate(pdf.createdAt)}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild><Link href={`/pdfs/${pdf.id}`}>View PDF</Link></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(pdf.id)}>Delete</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
