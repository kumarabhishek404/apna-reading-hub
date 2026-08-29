import { createAlarm } from '@/api/alarms';
import { createNote, updateNote } from '@/api/notes';
import { createReminder } from '@/api/reminders';
import { persistMediaUrl } from '@/lib/persistMedia';
import { networkMonitor } from '@/lib/networkMonitor';
import { noteRepository } from '@/lib/offlineRepositories/noteOfflineRepository';
import { GenericOfflineRepository } from '@/lib/offlineRepositories/genericOfflineRepository';
import {
  ensureNotificationSetup,
  scheduleAlarmNotifications,
  scheduleReminderNotifications,
} from '@/services/notifications';
import { getPreferredAlarmSound, getPreferredReminderSound } from '@/lib/notificationSoundPreference';
import type { AlarmItem, ReminderItem } from '@/types';
import type { CaptureAttachment, CaptureIntent, CaptureKind } from '@/lib/captureIntent';
import { pdfAttachments, imageAttachments, drawingAttachments } from '@/lib/captureIntent';
import { noteHeadline } from '@/lib/noteHeadline';

const offline = new GenericOfflineRepository();

export type CaptureSaveResult = {
  kind: CaptureKind;
  message: string;
  id?: string;
  noteId?: string;
};

function fileNameFromUri(uri: string, fallback: string) {
  const piece = uri.split('/').pop() || fallback;
  return piece.split('?')[0] || fallback;
}

async function uploadFile(
  file: CaptureAttachment,
  fallbackName: string,
  fallbackMime: string,
  isOnline: boolean,
) {
  const name = file.name || fileNameFromUri(file.uri, fallbackName);
  const mimeType = file.mimeType || fallbackMime;
  const url = await persistMediaUrl(file.uri, {
    name,
    mimeType,
    upload: isOnline && file.type !== 'drawing',
  });
  return { url, name };
}

async function saveNoteFromCapture(options: {
  intent: CaptureIntent;
  attachments: CaptureAttachment[];
  draftNoteId?: string | null;
}): Promise<CaptureSaveResult> {
  const { intent, attachments, draftNoteId } = options;
  const isOnline = networkMonitor.isOnline();
  const images = imageAttachments(attachments);
  const drawings = drawingAttachments(attachments);
  const pdfs = pdfAttachments(attachments);

  const uploadedImages = await Promise.all(
    images.map((image) => uploadFile(image, 'photo.jpg', 'image/jpeg', isOnline)),
  );
  const uploadedDrawings = await Promise.all(
    drawings.map((drawing) => uploadFile(drawing, 'drawing.jpg', 'image/jpeg', isOnline)),
  );
  const uploadedPdfs = await Promise.all(
    pdfs.map((pdf) => uploadFile(pdf, 'document.pdf', 'application/pdf', isOnline)),
  );

  const blocks: Array<{
    type: 'text' | 'image' | 'pdf' | 'url' | 'handwriting';
    content: string | null;
    url: string | null;
    checked: boolean;
    order: number;
  }> = [];

  if (intent.content) {
    blocks.push({
      type: 'text',
      content: intent.content,
      url: null,
      checked: false,
      order: blocks.length,
    });
  }

  if (intent.url) {
    blocks.push({
      type: 'url',
      content: intent.url,
      url: intent.url,
      checked: false,
      order: blocks.length,
    });
  }

  for (const image of uploadedImages) {
    blocks.push({
      type: 'image',
      content: image.name,
      url: image.url,
      checked: false,
      order: blocks.length,
    });
  }

  for (const drawing of uploadedDrawings) {
    blocks.push({
      type: 'handwriting',
      content: 'Handwritten note',
      url: drawing.url,
      checked: false,
      order: blocks.length,
    });
  }

  for (const pdf of uploadedPdfs) {
    blocks.push({
      type: 'pdf',
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
  const noteFields = {
    title,
    content: intent.content,
    isPinned: false,
    isFavorite: false,
    blocks,
  };

  if (isOnline) {
    try {
      if (draftNoteId && !draftNoteId.startsWith('note_')) {
        const updated = await updateNote(draftNoteId, noteFields);
        return { kind: 'note', message: 'Saved to Notes', id: updated.note.id, noteId: updated.note.id };
      }
      const created = await createNote({ ...noteFields, tags: [] });
      return { kind: 'note', message: 'Saved to Notes', id: created.note.id, noteId: created.note.id };
    } catch (error) {
      console.warn('[Capture] Online save failed, storing locally', error);
    }
  }

  if (draftNoteId) {
    const updated = await noteRepository.updateNote(draftNoteId, noteFields);
    return { kind: 'note', message: 'Note saved on this device', id: updated.id, noteId: updated.id };
  }

  const created = await noteRepository.createNote({
    ...noteFields,
    tags: [],
  });
  return { kind: 'note', message: 'Note saved on this device', id: created.id, noteId: created.id };
}

export async function saveCapture(options: {
  intent: CaptureIntent;
  attachments: CaptureAttachment[];
  draftNoteId?: string | null;
}): Promise<CaptureSaveResult> {
  const { intent, attachments, draftNoteId } = options;
  const isOnline = networkMonitor.isOnline();

  if (intent.kind === 'alarm') {
    const granted = await ensureNotificationSetup();
    const payload = {
      title: intent.title || 'Alarm',
      time: intent.time || '07:00',
      repeatDays: intent.repeatDays ?? [0, 1, 2, 3, 4, 5, 6],
      isEnabled: true,
      sound: await getPreferredAlarmSound(),
      oneShotDate: intent.oneShotDate ?? null,
    };

    let created: AlarmItem;
    try {
      created = isOnline
        ? (await createAlarm(payload)).alarm
        : ((await offline.createEntity('alarm', payload)) as AlarmItem);
    } catch {
      created = (await offline.createEntity('alarm', payload)) as AlarmItem;
    }

    await scheduleAlarmNotifications(created);
    const when = intent.preview.replace(/^Alarm · /, '') || intent.time || payload.time;
    return {
      kind: 'alarm',
      message: granted ? `Alarm set for ${when}` : `Alarm saved. Enable notifications so it can ring.`,
      id: created.id,
    };
  }

  if (intent.kind === 'reminder') {
    const granted = await ensureNotificationSetup();
    const payload = {
      title: intent.title || 'Reminder',
      description: intent.description || '',
      dueAt: intent.dueAt || new Date().toISOString(),
      priority: 'medium' as const,
      repeat: intent.repeat ?? 'none',
      sound: await getPreferredReminderSound(),
      isCompleted: false,
    };

    let created: ReminderItem;
    try {
      created = isOnline
        ? (await createReminder(payload)).reminder
        : ((await offline.createEntity('reminder', payload)) as ReminderItem);
    } catch {
      created = (await offline.createEntity('reminder', payload)) as ReminderItem;
    }

    await scheduleReminderNotifications(created);
    return {
      kind: 'reminder',
      message: granted ? `Reminder set: ${intent.preview.replace(/^Reminder · /, '')}` : 'Reminder saved. Enable notifications so it can fire.',
      id: created.id,
    };
  }

  return saveNoteFromCapture({
    intent,
    attachments,
    draftNoteId,
  });
}
