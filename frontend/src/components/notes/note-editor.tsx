"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImagePlus, Maximize2, Minimize2, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HandwritingDialog } from "@/components/capture/handwriting-dialog";
import { apiFetch, assetUrl } from "@/lib/api";
import { persistNoteTitle } from "@/lib/noteHeadline";
import { uploadOrEmbed } from "@/lib/mediaUpload";
import { splitLinkSegments } from "@/lib/linkify";
import type { NoteItem } from "@/lib/types";
import { cn, parseTags } from "@/lib/utils";

type Block = NonNullable<NoteItem["blocks"]>[number] & { id?: string };

type Props = {
  noteId: string;
};

function LinkedText({
  value,
  onChange,
  fullScreen,
}: {
  value: string;
  onChange: (value: string) => void;
  fullScreen?: boolean;
}) {
  const segments = splitLinkSegments(value);
  return (
    <div className={cn("relative", fullScreen && "flex min-h-0 flex-1 flex-col")}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full resize-none bg-transparent text-base text-slate-900 outline-none",
          fullScreen ? "h-full min-h-0 flex-1" : "min-h-[220px]",
        )}
      />
      <p className="mt-2 text-xs text-muted">
        {segments.filter((segment) => segment.href).map((segment) => (
          <a
            key={segment.href}
            href={segment.href}
            target="_blank"
            rel="noreferrer"
            className="mr-2 text-link underline"
          >
            {segment.text}
          </a>
        ))}
      </p>
    </div>
  );
}

export function NoteEditor({ noteId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!fullScreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullScreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullScreen]);

  useEffect(() => {
    apiFetch(`/api/notes/${noteId}`)
      .then((res) => res.json())
      .then((data: { note: NoteItem }) => {
        const next = (data.note.blocks || []).map((block, index) => ({
          ...block,
          id: `${block.type}-${index}`,
        }));
        if (next.length === 0) {
          next.push({
            id: "text-legacy",
            type: "text",
            content: data.note.content || "",
            order: 0,
            format: "body",
          });
        }
        setBlocks(next);
        setTitle(
          persistNoteTitle({
            title: data.note.title,
            content: data.note.content,
            blocks: next,
          })
        );
        setTags(data.note.tags.map((tag) => tag.name).join(", "));
      })
      .finally(() => setLoading(false));
  }, [noteId]);

  async function addFile(file: File, type: "image" | "pdf" | "handwriting") {
    const uploaded = await uploadOrEmbed(file);
    setBlocks((current) => [
      ...current,
      {
        id: `${type}-${Date.now()}`,
        type,
        content: type === "handwriting" ? "Handwritten note" : uploaded.name,
        url: uploaded.url,
        order: current.length,
      },
    ]);
  }

  async function save() {
    setSaving(true);
    const content = blocks
      .map((block) => {
        if (block.type === "text") return block.content || "";
        if (block.type === "url") return block.url || block.content || "";
        return "";
      })
      .join("\n");
    const res = await apiFetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: noteId,
        title: persistNoteTitle({ title, content, blocks }),
        content,
        tags: parseTags(tags),
        blocks: blocks.map((block, index) => ({
          type: block.type,
          content: block.content || null,
          url: block.url || null,
          checked: block.checked || false,
          order: index,
          format: block.format,
          color: block.color,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save note");
      return;
    }
    toast.success("Note saved");
    router.push("/notes");
  }

  async function remove() {
    setDeleting(true);
    const res = await apiFetch(`/api/notes?id=${noteId}`, { method: "DELETE" });
    if (!res.ok) {
      setDeleting(false);
      toast.error("Could not delete note");
      return;
    }
    toast.success("Note deleted");
    router.push("/notes");
  }

  if (loading) {
    return <p className="p-8 text-muted">Loading...</p>;
  }

  const textBlock = blocks.find((block) => block.type === "text");

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">Note</h1>
        <Button variant="destructive" size="sm" onClick={() => void remove()} disabled={deleting}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <div
        className={cn(
          "rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm",
          fullScreen && "fixed inset-0 z-[70] flex h-dvh flex-col rounded-none border-0 p-5",
        )}
      >
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="mb-4 border-0 px-0 text-lg font-semibold shadow-none"
        />
        <LinkedText
          value={textBlock?.content || ""}
          fullScreen={fullScreen}
          onChange={(value) =>
            setBlocks((current) => {
              const next = [...current];
              const index = next.findIndex((block) => block.type === "text");
              if (index === -1) {
                next.unshift({ type: "text", content: value, order: 0, format: "body" });
              } else {
                next[index] = { ...next[index], content: value };
              }
              return next;
            })
          }
        />
        {fullScreen ? null : (
        <div className="mt-4 grid gap-3">
          {blocks
            .filter((block) => block.type !== "text")
            .map((block) => (
              <div key={block.id || `${block.type}-${block.order}`} className="rounded-2xl bg-slate-50 p-3 text-sm">
                {block.type === "image" || block.type === "handwriting" ? (
                  <img src={assetUrl(block.url || "")} alt="" className="max-h-64 rounded-xl object-contain" />
                ) : block.type === "pdf" ? (
                  <a href={assetUrl(block.url || "")} className="text-pdf underline" target="_blank" rel="noreferrer">
                    {block.content || "PDF"}
                  </a>
                ) : (
                  <a href={block.url || block.content || "#"} className="text-link underline" target="_blank" rel="noreferrer">
                    {block.url || block.content}
                  </a>
                )}
              </div>
            ))}
        </div>
        )}
        {fullScreen ? null : (
        <Input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="Tags, comma separated"
          className="mt-4"
        />
        )}
        <div className="mt-4 flex items-center gap-2">
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void addFile(file, "image");
            }}
          />
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void addFile(file, "pdf");
            }}
          />
          <Button type="button" variant="outline" size="icon" onClick={() => imageInput.current?.click()}>
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => fileInput.current?.click()}>
            <FileText className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => setDrawing(true)}>
            <PenLine className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setFullScreen((current) => !current)}
            aria-label={fullScreen ? "Exit full screen" : "Write in full screen"}
          >
            {fullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button className="ml-auto min-w-[140px]" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <HandwritingDialog
        open={drawing}
        onClose={() => setDrawing(false)}
        onSave={(pages) => {
          void (async () => {
            const uploaded: Array<{ url: string; name: string }> = [];
            for (const page of pages) {
              uploaded.push(await uploadOrEmbed(page.file));
            }
            setBlocks((current) => [
              ...current,
              ...uploaded.map((item, index) => ({
                id: `handwriting-${Date.now()}-${index}`,
                type: "handwriting" as const,
                content: pages.length > 1 ? `Handwritten note p.${index + 1}` : "Handwritten note",
                url: item.url,
                order: current.length + index,
              })),
            ]);
          })();
        }}
      />
    </div>
  );
}
