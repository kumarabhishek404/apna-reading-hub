import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPdf extends Document {
  title: string;
  pdfUrl: string;
  description: string;
  isFavorite: boolean;
  userId: mongoose.Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PdfSchema = new Schema<IPdf>(
  {
    title: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    description: { type: String, default: "" },
    isFavorite: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

PdfSchema.index({ userId: 1, createdAt: -1 });

const PdfModel: Model<IPdf> = mongoose.models.Pdf || mongoose.model<IPdf>("Pdf", PdfSchema);

export default PdfModel;