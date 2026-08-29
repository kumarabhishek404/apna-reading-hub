import { apiFetch } from "@/lib/api";
import { uploadOrEmbed } from "@/lib/mediaUpload";
import {
  drawingAttachments,
  imageAttachments,
  pdfAttachments,
  type CaptureAttachment,
  type CaptureIntent,
  type CaptureKind,
} from "@/lib/captureIntent";
import { noteHeadline } from "@/lib/noteHeadline";

export type WebCaptureAttachment = CaptureAttachment & { file?: File };

export type CaptureSaveResult = {
  kind: CaptureKind;
  message: string;
  id?: string;
  noteId?: string;
};

async function uploadFile(item: WebCaptureAttachment) {
  if (item.file) {
    const uploaded = await uploadOrEmbed(item.file);
    return { url: uploaded.url, name: uploaded.name || item.name || "file" };
  }
  return { url: item.uri, name: item.name || "file" };
}

function preferredSound(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) || fallback;
}

export async function saveCapture(options: {
  intent: CaptureIntent;
  attachments: WebCaptureAttachment[];
}): Promise<CaptureSaveResult> {
  const { intent, attachments } = options;

  if (intent.kind === "alarm") {
    const res = await apiFetch("/api/alarms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: intent.title || "Alarm",
        time: intent.time || "07:00",
        repeatDays: intent.repeatDays ?? [0, 1, 2, 3, 4, 5, 6],
        isEnabled: true,
        sound: preferredSound("apna.preferredAlarmSound", "apna_chime"),
        oneShotDate: intent.oneShotDate ?? null,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.alarm) throw new Error(data?.error || "Could not set alarm");
    const when = intent.preview.replace(/^Alarm · /, "") || intent.time || "07:00";
    return { kind: "alarm", message: `Alarm set for ${when}`, id: data.alarm.id };
  }

  if (intent.kind === "reminder") {
    const res = await apiFetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: intent.title || "Reminder",
        description: intent.description || "",
        dueAt: intent.dueAt || new Date().toISOString(),
        priority: "medium",
        repeat: intent.repeat ?? "none",
        sound: preferredSound("apna.preferredReminderSound", "apna_chime"),
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.reminder) throw new Error(data?.error || "Could not set reminder");
    return {
      kind: "reminder",
      message: `Reminder set: ${intent.preview.replace(/^Reminder · /, "")}`,
      id: data.reminder.id,
    };
  }

  const images = imageAttachments(attachments);
  const drawings = drawingAttachments(attachments);
  const pdfs = pdfAttachments(attachments);

  const uploadedImages = await Promise.all(images.map((item) => uploadFile(item)));
  const uploadedDrawings = await Promise.all(drawings.map((item) => uploadFile(item)));
  const uploadedPdfs = await Promise.all(pdfs.map((item) => uploadFile(item)));

  const blocks: Array<{
    type: "text" | "image" | "pdf" | "url" | "handwriting";
    content: string | null;
    url: string | null;
    checked: boolean;
    order: number;
  }> = [];

  if (intent.content) {
    blocks.push({
      type: "text",
      content: intent.content,
      url: null,
      checked: false,
      order: blocks.length,
    });
  }
  if (intent.url) {
    blocks.push({
      type: "url",
      content: intent.url,
      url: intent.url,
      checked: false,
      order: blocks.length,
    });
  }
  for (const image of uploadedImages) {
    blocks.push({
      type: "image",
      content: image.name,
      url: image.url,
      checked: false,
      order: blocks.length,
    });
  }
  for (const drawing of uploadedDrawings) {
    blocks.push({
      type: "handwriting",
      content: "Handwritten note",
      url: drawing.url,
      checked: false,
      order: blocks.length,
    });
  }
  for (const pdf of uploadedPdfs) {
    blocks.push({
      type: "pdf",
      content: pdf.name,
      url: pdf.url,
      checked: false,
      order: blocks.length,
    });
  }

  const title = noteHeadline({
    title: intent.title,
    content: intent.content,
    blocks,
  });

  const res = await apiFetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      content: intent.content,
      tags: [],
      blocks,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.note) throw new Error(data?.error || "Could not save note");
  return { kind: "note", message: "Saved to Notes", id: data.note.id, noteId: data.note.id };
}
