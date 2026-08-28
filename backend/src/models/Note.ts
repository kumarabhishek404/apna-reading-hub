import mongoose, { Schema, Document, Model } from "mongoose";

export interface INote extends Document {
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  userId: mongoose.Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  // Mixed content support
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

const NoteSchema = new Schema<INote>(
  {
    title: { type: String, required: true },
    content: { type: String, default: "" },
    isPinned: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String }],
    blocks: [{
      type: { type: String, enum: ['text', 'image', 'pdf', 'url', 'checklist', 'handwriting', 'video'], required: true },
      content: { type: String, default: null },
      url: { type: String, default: null },
      checked: { type: Boolean, default: false },
      order: { type: Number, required: true },
      format: { type: String, enum: ['body', 'heading', 'subheading', 'bold', 'italic'], default: 'body' },
      color: { type: String }
    }]
  },
  {
    timestamps: true,
  }
);

NoteSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });
NoteSchema.index({ userId: 1, tags: 1 });
NoteSchema.index({ userId: 1, isFavorite: 1, updatedAt: -1 });
NoteSchema.index({ userId: 1, "blocks.type": 1 });
NoteSchema.index({ title: "text", content: "text" });

const NoteModel: Model<INote> = mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);

export default NoteModel;