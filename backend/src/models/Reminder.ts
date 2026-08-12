import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReminder extends Document {
  title: string;
  description: string;
  dueAt: Date;
  priority: string;
  repeat: string;
  isCompleted: boolean;
  sound: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema = new Schema<IReminder>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueAt: { type: Date, required: true },
    priority: { 
      type: String, 
      enum: ["low", "medium", "high"], 
      default: "medium" 
    },
    repeat: { 
      type: String, 
      enum: ["none", "daily", "weekly", "monthly"], 
      default: "none" 
    },
    isCompleted: { type: Boolean, default: false },
    sound: {
      type: String,
      enum: ["default", "apna_chime", "apna_alert"],
      default: "default",
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

ReminderSchema.index({ userId: 1, dueAt: 1 });

const ReminderModel: Model<IReminder> = mongoose.models.Reminder || mongoose.model<IReminder>("Reminder", ReminderSchema);

export default ReminderModel;