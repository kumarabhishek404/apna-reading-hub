import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../lib/errors";
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

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string) || undefined;
    const upcoming = req.query.upcoming === "true";
    const includeCompleted = req.query.includeCompleted === "true";
    const userId = (req as any).user?.userId as string;
    const reminders = await getReminders({
      search,
      upcoming,
      includeCompleted,
      userId,
    });
    res.json({ reminders });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    const reminder = await getReminderById(req.params.id, userId);
    if (!reminder) throw new HttpError(404, "Reminder not found");
    res.json({ reminder });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    if (!req.body?.title?.trim()) throw new HttpError(400, "Title is required");
    const reminder = await createReminder(req.body, userId);
    res.status(201).json({ reminder });
  })
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const { id, action, ...data } = req.body ?? {};
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");

    if (action === "complete") {
      const reminder = await toggleReminderComplete(id, userId);
      if (!reminder) throw new HttpError(404, "Reminder not found");
      res.json({ reminder });
      return;
    }

    const reminder = await updateReminder(id, data, userId);
    res.json({ reminder });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const id = req.query.id as string;
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");
    await deleteReminder(id, userId);
    res.json({ success: true });
  })
);

export default router;
