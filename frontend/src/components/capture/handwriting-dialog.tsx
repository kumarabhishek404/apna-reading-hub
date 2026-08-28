"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eraser, Maximize2, Minimize2, PenLine, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PEN_COLORS = ["#0F172A", "#22409A", "#EA580C", "#15803D", "#BE123C", "#FFFFFF"];
const PEN_SIZES = [2, 4, 8, 14];
const PAPER = "#F8FAFC";

type Tool = "pen" | "eraser";

type SavedPage = { file: File; previewUrl: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (pages: SavedPage[]) => void;
};

function dataUrlToFile(dataUrl: string, name: string) {
  const [meta, body] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(meta)?.[1] || "image/png";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

export function HandwritingDialog({ open, onClose, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const pagesRef = useRef<string[]>([]);
  const inkRef = useRef<boolean[]>([false]);
  const pageIndexRef = useRef(0);
  const [color, setColor] = useState("#0F172A");
  const [size, setSize] = useState(4);
  const [tool, setTool] = useState<Tool>("pen");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [hasInk, setHasInk] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  function setupCanvas(restoreUrl?: string | null) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = parent.clientWidth * ratio;
    canvas.height = parent.clientHeight * ratio;
    canvas.style.width = `${parent.clientWidth}px`;
    canvas.style.height = `${parent.clientHeight}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, parent.clientWidth, parent.clientHeight);
    if (!restoreUrl) return;
    const image = new Image();
    image.onload = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(image, 0, 0, parent.clientWidth, parent.clientHeight);
    };
    image.src = restoreUrl;
  }

  function flattenCanvas() {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return "";
    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    const ctx = copy.getContext("2d");
    if (!ctx) return "";
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, copy.width, copy.height);
    ctx.drawImage(canvas, 0, 0);
    return copy.toDataURL("image/png");
  }

  function snapshotCurrent() {
    const dataUrl = flattenCanvas();
    if (!dataUrl) return;
    pagesRef.current[pageIndexRef.current] = dataUrl;
  }

  useEffect(() => {
    if (!open) return;
    pagesRef.current = [];
    inkRef.current = [false];
    pageIndexRef.current = 0;
    setPageIndex(0);
    setPageCount(1);
    setTool("pen");
    setHasInk(false);
    setFullScreen(false);
    const frame = window.requestAnimationFrame(() => setupCanvas());
    const resize = () => {
      snapshotCurrent();
      setupCanvas(pagesRef.current[pageIndexRef.current]);
    };
    window.addEventListener("resize", resize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    snapshotCurrent();
    const frame = window.requestAnimationFrame(() => setupCanvas(pagesRef.current[pageIndexRef.current]));
    return () => window.cancelAnimationFrame(frame);
  }, [fullScreen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && fullScreen) setFullScreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, fullScreen]);

  function markInk() {
    inkRef.current[pageIndexRef.current] = true;
    setHasInk(true);
  }

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === "eraser" ? size * 3 : size;
    event.currentTarget.setPointerCapture(event.pointerId);
    markInk();
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  function goToPage(next: number) {
    if (next < 0 || next >= pageCount) return;
    snapshotCurrent();
    pageIndexRef.current = next;
    setPageIndex(next);
    setupCanvas(pagesRef.current[next]);
  }

  function addPage() {
    snapshotCurrent();
    const next = pageCount;
    pagesRef.current[next] = "";
    inkRef.current[next] = false;
    pageIndexRef.current = next;
    setPageCount(next + 1);
    setPageIndex(next);
    setupCanvas();
  }

  function clearPage() {
    inkRef.current[pageIndexRef.current] = false;
    pagesRef.current[pageIndexRef.current] = "";
    setHasInk(inkRef.current.some(Boolean));
    setupCanvas();
  }

  function save() {
    snapshotCurrent();
    const pages: SavedPage[] = [];
    for (let i = 0; i < pageCount; i += 1) {
      if (!inkRef.current[i]) continue;
      const dataUrl = i === pageIndexRef.current ? flattenCanvas() : pagesRef.current[i];
      if (!dataUrl) continue;
      const file = dataUrlToFile(dataUrl, `drawing-${Date.now()}-${i + 1}.png`);
      pages.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    if (pages.length === 0) return;
    onSave(pages);
    onClose();
  }

  if (!open) return null;

  return (
    <div className={cn("fixed inset-0 z-[80] flex flex-col bg-slate-950/70", fullScreen ? "p-0" : "p-3 sm:p-6")}>
      <div
        className={cn(
          "mx-auto flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl",
          fullScreen ? "max-w-none rounded-none" : "max-w-5xl rounded-3xl",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-brand">Handwritten note</p>
          <div className="flex flex-wrap items-center gap-2">
            {PEN_COLORS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setColor(value);
                  setTool("pen");
                }}
                className="h-7 w-7 rounded-full border border-border"
                style={{
                  background: value,
                  outline: tool === "pen" && color === value ? "2px solid #22409A" : undefined,
                  outlineOffset: 2,
                }}
                aria-label={`Pen ${value}`}
              />
            ))}
            {PEN_SIZES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSize(value)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  size === value ? "bg-brand text-white" : "bg-slate-100 text-brand"
                }`}
              >
                {value}px
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTool("pen")}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                tool === "pen" ? "bg-brand text-white" : "bg-slate-100 text-brand",
              )}
            >
              <PenLine className="h-3.5 w-3.5" />
              Pen
            </button>
            <button
              type="button"
              onClick={() => setTool("eraser")}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                tool === "eraser" ? "bg-brand text-white" : "bg-slate-100 text-brand",
              )}
            >
              <Eraser className="h-3.5 w-3.5" />
              Eraser
            </button>
            <button
              type="button"
              onClick={clearPage}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-brand"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
            <button
              type="button"
              onClick={() => setFullScreen((current) => !current)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-brand"
              aria-label={fullScreen ? "Exit full screen" : "Write in full screen"}
            >
              {fullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {fullScreen ? "Exit" : "Full screen"}
            </button>
          </div>
        </div>
        <div className="relative min-h-0 flex-1 bg-slate-50">
          <canvas
            ref={canvasRef}
            className={cn("h-full w-full touch-none", tool === "eraser" ? "cursor-cell" : "cursor-crosshair")}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="icon" onClick={() => goToPage(pageIndex - 1)} disabled={pageIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="min-w-[5.5rem] text-center text-sm font-semibold text-brand">
              Page {pageIndex + 1} / {pageCount}
            </p>
            <Button type="button" variant="outline" size="icon" onClick={() => goToPage(pageIndex + 1)} disabled={pageIndex === pageCount - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" onClick={addPage}>
              <Plus className="h-4 w-4" />
              Page
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={!hasInk}>
              Save drawing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
