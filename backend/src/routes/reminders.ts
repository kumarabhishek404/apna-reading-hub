import { Router } from "express";
import {
  createReminder,
  deleteReminder,
  getReminderById,
  getReminders,
  toggleReminderComplete,
  updateReminder,
} from "../services/reminder.service";

const router = Router();

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || undefined;
  const upcoming = req.query.upcoming === "true";
  const includeCompleted = req.query.includeCompleted === "true";
  const reminders = await getReminders({ search, upcoming, includeCompleted });
  res.json({ reminders });
});

router.get("/:id", async (req, res) => {
  const reminder = await getReminderById(req.params.id);
  if (!reminder) return res.status(404).json({ error: "Reminder not found" });
  res.json({ reminder });
});

router.post("/", async (req, res) => {
  const reminder = await createReminder(req.body);
  res.status(201).json({ reminder });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "complete") {
    const reminder = await toggleReminderComplete(id);
    return res.json({ reminder });
  }

  const reminder = await updateReminder(id, data);
  res.json({ reminder });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deleteReminder(id);
  res.json({ success: true });
});

export default router;
