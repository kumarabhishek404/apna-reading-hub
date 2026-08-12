import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlog extends Document {
  title: string;
  url?: string;
  content: string;
  isFavorite: boolean;
  userId: mongoose.Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    url: { type: String },
    content: { type: String, default: "" },
    isFavorite: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

BlogSchema.index({ userId: 1, createdAt: -1 });
BlogSchema.index({ title: "text", content: "text", url: "text" });

const BlogModel: Model<IBlog> = mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

export default BlogModel;