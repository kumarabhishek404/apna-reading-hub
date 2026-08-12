import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILink extends Document {
  title: string;
  url: string;
  description: string;
  isFavorite: boolean;
  userId: mongoose.Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema = new Schema<ILink>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String, default: "" },
    isFavorite: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

LinkSchema.index({ userId: 1, createdAt: -1 });

const LinkModel: Model<ILink> = mongoose.models.Link || mongoose.model<ILink>("Link", LinkSchema);

export default LinkModel;