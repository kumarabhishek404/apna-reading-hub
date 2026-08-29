"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImagePlus, Maximize2, Minimize2, PenLine, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HandwritingDialog } from "@/components/capture/handwriting-dialog";
import { TypingPlaceholder } from "@/components/capture/typing-placeholder";
import { interpretCapture, isBlankCapture } from "@/lib/captureIntent";
import { saveCapture, type WebCaptureAttachment } from "@/lib/captureSave";
import { Logo } from "@/components/brand/logo";
import { PageFrame } from "@/components/layout/page-frame";
import { cn } from "@/lib/utils";

const KIND_STYLES = {
  note: "from-[#22409A] to-[#3B5BCC]",
  alarm: "from-[#A16207] to-[#CA8A04]",
  reminder: "from-[#EA580C] to-[#F97316]",
};

function saveLabel(kind: "note" | "alarm" | "reminder", loading: boolean) {
  if (loading) return "Saving...";
  if (kind === "alarm") return "Set alarm";
  if (kind === "reminder") return "Set reminder";
  return "Save";
}

export function CapturePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<WebCaptureAttachment[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const intent = useMemo(() => interpretCapture({ text, attachments }), [text, attachments]);

  useEffect(() => {
    if (!fullScreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullScreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullScreen]);

  function addFiles(files: FileList | null, type: WebCaptureAttachment["type"]) {
    if (!files?.length) return;
    const next: WebCaptureAttachment[] = Array.from(files).map((file) => ({
      type: type === "file" && file.type === "application/pdf" ? "pdf" : type,
      uri: URL.createObjectURL(file),
      name: file.name,
      mimeType: file.type,
      file,
    }));
    setAttachments((current) => [...current, ...next]);
  }

  async function persist() {
    if (isBlankCapture({ text, attachments })) {
      toast.message("Write, attach, or draw something first");
      return;
    }
    setLoading(true);
    try {
      const result = await saveCapture({ intent, attachments });
      toast.success(result.message);
      setText("");
      setAttachments([]);
      if (result.kind === "alarm") router.push("/alarms");
      else if (result.kind === "reminder") router.push("/notes?filter=reminder");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden lg:min-h-screen">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#22409A]/20 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-[#EA580C]/15 blur-3xl animate-pulse [animation-delay:400ms]" />
        <div className="absolute bottom-10 left-1/3 h-64 w-80 rounded-full bg-[#3B5BCC]/15 blur-3xl" />
      </div>

      <PageFrame className="relative flex min-h-[calc(100dvh-4rem)] flex-col pb-28 pt-6 lg:min-h-screen lg:pb-10">
        <div className="mb-6">
          <Logo size="sm" />
        </div>

        <div
          className={cn(
            "rounded-[28px] border border-white/70 bg-white/80 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl",
            fullScreen &&
              "fixed inset-0 z-[70] flex h-dvh max-h-dvh flex-col rounded-none border-0 bg-white p-4 shadow-none",
          )}
        >
          <div
            className={cn(
              "relative min-h-[280px] rounded-[22px] border border-slate-200/80 bg-white",
              fullScreen && "min-h-0 flex-1",
            )}
          >
            <TypingPlaceholder visible={!text} />
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              className={cn(
                "w-full resize-none bg-transparent px-5 py-5 text-base text-slate-900 outline-none",
                fullScreen ? "h-full min-h-0" : "h-[280px]",
              )}
              aria-label="Capture"
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pb-4">
                {attachments.map((item) => (
                  <span
                    key={item.uri}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {item.name || item.type}
                  </span>
                ))}
              </div>
            )}
          </div>

          {intent.preview && (text.trim() || attachments.length > 0) && (
            <p className="px-2 pt-3 text-xs font-medium text-slate-500">{intent.preview}</p>
          )}

          <div className="mt-3 flex min-w-0 items-center gap-2">
            <input
              ref={imageInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => addFiles(event.target.files, "image")}
            />
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => addFiles(event.target.files, "pdf")}
            />
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
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
            </div>
            <Button
              type="button"
              className={cn("shrink-0 bg-gradient-to-r px-4 text-white", KIND_STYLES[intent.kind])}
              onClick={() => void persist()}
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              {saveLabel(intent.kind, loading)}
            </Button>
          </div>
        </div>
      </PageFrame>

      <HandwritingDialog
        open={drawing}
        onClose={() => setDrawing(false)}
        onSave={(pages) => {
          setAttachments((current) => [
            ...current,
            ...pages.map((page) => ({
              type: "drawing" as const,
              uri: page.previewUrl,
              name: page.file.name,
              mimeType: "image/jpeg",
              file: page.file,
            })),
          ]);
        }}
      />
    </div>
  );
}
