"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MarkdownViewer = dynamic(
  () => import("@/components/shared/markdown-viewer").then((m) => m.MarkdownViewer),
  { ssr: false }
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview" | "split">("write");

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "write" ? "default" : "outline"}
          onClick={() => setMode("write")}
        >
          Write
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "preview" ? "default" : "outline"}
          onClick={() => setMode("preview")}
        >
          Preview
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "split" ? "default" : "outline"}
          onClick={() => setMode("split")}
        >
          Split
        </Button>
      </div>
      <div
        className={cn(
          "grid gap-4",
          mode === "split" ? "md:grid-cols-2" : "grid-cols-1"
        )}
      >
        {(mode === "write" || mode === "split") && (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your note in Markdown..."
            className="min-h-[320px] font-mono text-sm"
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <div className="min-h-[320px] rounded-lg border border-stone-200 bg-stone-50 p-4">
            <MarkdownViewer content={value || "*Nothing to preview yet*"} />
          </div>
        )}
      </div>
    </div>
  );
}

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose-reading">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
