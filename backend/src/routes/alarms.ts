import { Router } from "express";
import { requireAuth } from "../lib/auth";
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

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || undefined;
  const userId = (req as any).user?.userId;
  if (req.query.today === "true") {
    const alarms = await getTodayAlarms(userId);
    return res.json({ alarms });
  }
  const alarms = await getAlarms(search, userId);
  res.json({ alarms });
});

router.get("/:id", async (req, res) => {
  const userId = (req as any).user?.userId;
  const alarm = await getAlarmById(req.params.id, userId);
  if (!alarm) return res.status(404).json({ error: "Alarm not found" });
  res.json({ alarm });
});

router.post("/", async (req, res) => {
  const userId = (req as any).user?.userId;
  const alarm = await createAlarm(req.body, userId);
  res.status(201).json({ alarm });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "toggle") {
    const alarm = await toggleAlarmEnabled(id, userId);
    return res.json({ alarm });
  }

  const alarm = await updateAlarm(id, data, userId);
  res.json({ alarm });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deleteAlarm(id, userId);
  res.json({ success: true });
});

export default router;
