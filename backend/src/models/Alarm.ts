import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAlarm extends Document {
  title: string;
  time: string;
  repeatDays: string;
  isEnabled: boolean;
  sound: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AlarmSchema = new Schema<IAlarm>(
  {
    title: { type: String, required: true },
    time: { type: String, required: true }, // HH:mm (24h)
    repeatDays: { type: String, default: "0,1,2,3,4,5,6" }, // comma-separated 0=Sun..6=Sat
    isEnabled: { type: Boolean, default: true },
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

AlarmSchema.index({ userId: 1, time: 1 });

const AlarmModel: Model<IAlarm> = mongoose.models.Alarm || mongoose.model<IAlarm>("Alarm", AlarmSchema);

export default AlarmModel;