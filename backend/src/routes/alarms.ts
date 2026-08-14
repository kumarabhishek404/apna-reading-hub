import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../lib/errors";
import {
  createAlarm,
  deleteAlarm,
  getAlarmById,
  getAlarms,
  getTodayAlarms,
  toggleAlarmEnabled,
  updateAlarm,
} from "../services/alarm.service";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string) || undefined;
    const userId = (req as any).user?.userId as string;
    if (req.query.today === "true") {
      const alarms = await getTodayAlarms(userId);
      res.json({ alarms });
      return;
    }
    const alarms = await getAlarms(search, userId);
    res.json({ alarms });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    const alarm = await getAlarmById(req.params.id, userId);
    if (!alarm) throw new HttpError(404, "Alarm not found");
    res.json({ alarm });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    if (!req.body?.title?.trim()) throw new HttpError(400, "Title is required");
    const alarm = await createAlarm(req.body, userId);
    res.status(201).json({ alarm });
  })
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const { id, action, ...data } = req.body ?? {};
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");

    if (action === "toggle") {
      const alarm = await toggleAlarmEnabled(id, userId);
      if (!alarm) throw new HttpError(404, "Alarm not found");
      res.json({ alarm });
      return;
    }

    const alarm = await updateAlarm(id, data, userId);
    res.json({ alarm });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const id = req.query.id as string;
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");
    await deleteAlarm(id, userId);
    res.json({ success: true });
  })
);

export default router;
