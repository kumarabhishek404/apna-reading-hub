import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITag extends Document {
  name: string;
  createdAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
  }
);

const TagModel: Model<ITag> = mongoose.models.Tag || mongoose.model<ITag>("Tag", TagSchema);

export default TagModel;