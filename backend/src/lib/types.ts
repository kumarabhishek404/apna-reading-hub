export type ContentType = "blog" | "link" | "pdf" | "note" | "reminder" | "alarm";

export interface TagItem {
  id: string;
  name: string;
}

export interface BlogItem {
  id: string;
  title: string;
  url: string | null;
  content: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: TagItem[];
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: TagItem[];
}

export interface PdfItem {
  id: string;
  title: string;
  pdfUrl: string;
  description: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: TagItem[];
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: TagItem[];
}

export interface SearchResult {
  id: string;
  type: ContentType;
  title: string;
  subtitle?: string;
  url?: string;
  tags: TagItem[];
  createdAt: string;
}

export interface TagWithCount {
  id: string;
  name: string;
  count: number;
}

export type ReminderPriority = "low" | "medium" | "high";
export type ReminderRepeat = "none" | "daily" | "weekly" | "monthly";

export interface ReminderItem {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  priority: ReminderPriority;
  repeat: ReminderRepeat;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlarmItem {
  id: string;
  title: string;
  time: string;
  repeatDays: number[];
  isEnabled: boolean;
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

export interface RecentItem {
  id: string;
  type: ContentType;
  title: string;
  createdAt: string;
  tags: TagItem[];
}
