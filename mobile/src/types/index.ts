export type ContentType = 'blog' | 'link' | 'pdf' | 'note' | 'reminder' | 'alarm';

export interface TagItem {
  id: string;
  name: string;
  count?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogItem {
  id: string;
  title: string;
  url: string | null;
  content: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ id: string; name: string }>;
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ id: string; name: string }>;
}

export interface PdfItem {
  id: string;
  title: string;
  pdfUrl: string;
  description: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ id: string; name: string }>;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ id: string; name: string }>;
  blocks?: Array<{
    type: 'text' | 'image' | 'pdf' | 'url' | 'checklist' | 'handwriting' | 'video';
    content?: string | null;
    url?: string | null;
    checked?: boolean;
    order: number;
    format?: 'body' | 'heading' | 'subheading' | 'bold' | 'italic';
    color?: string;
  }>;
}

export interface ReminderItem {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  priority: 'low' | 'medium' | 'high';
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  isCompleted: boolean;
  sound: 'default' | 'apna_chime' | 'apna_alert';
  createdAt: string;
  updatedAt: string;
}

export interface AlarmItem {
  id: string;
  title: string;
  time: string;
  repeatDays: number[];
  isEnabled: boolean;
  sound: 'default' | 'apna_chime' | 'apna_alert';
  /** YYYY-MM-DD. When set, the alarm rings once on this date instead of repeating. */
  oneShotDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalBlogs: number;
  totalLinks: number;
  totalPdfs: number;
  totalNotes: number;
  totalReminders: number;
  totalAlarms: number;
}
