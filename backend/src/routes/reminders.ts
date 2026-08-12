import { Router } from "express";
import { requireAuth } from "../lib/auth";
import {
  createReminder,
  deleteReminder,
  getReminderById,
  getReminders,
  toggleReminderComplete,
  updateReminder,
} from "../services/reminder.service";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || undefined;
  const upcoming = req.query.upcoming === "true";
  const includeCompleted = req.query.includeCompleted === "true";
  const userId = (req as any).user?.userId;
  const reminders = await getReminders({ search, upcoming, includeCompleted, userId });
  res.json({ reminders });
});

router.get("/:id", async (req, res) => {
  const userId = (req as any).user?.userId;
  const reminder = await getReminderById(req.params.id, userId);
  if (!reminder) return res.status(404).json({ error: "Reminder not found" });
  res.json({ reminder });
});

router.post("/", async (req, res) => {
  const userId = (req as any).user?.userId;
  const reminder = await createReminder(req.body, userId);
  res.status(201).json({ reminder });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "complete") {
    const reminder = await toggleReminderComplete(id, userId);
    return res.json({ reminder });
  }

  const reminder = await updateReminder(id, data, userId);
  res.json({ reminder });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deleteReminder(id, userId);
  res.json({ success: true });
});

export default router;
