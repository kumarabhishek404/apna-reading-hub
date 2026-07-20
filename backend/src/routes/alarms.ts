import { Router } from "express";
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

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || undefined;
  if (req.query.today === "true") {
    const alarms = await getTodayAlarms();
    return res.json({ alarms });
  }
  const alarms = await getAlarms(search);
  res.json({ alarms });
});

router.get("/:id", async (req, res) => {
  const alarm = await getAlarmById(req.params.id);
  if (!alarm) return res.status(404).json({ error: "Alarm not found" });
  res.json({ alarm });
});

router.post("/", async (req, res) => {
  const alarm = await createAlarm(req.body);
  res.status(201).json({ alarm });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "toggle") {
    const alarm = await toggleAlarmEnabled(id);
    return res.json({ alarm });
  }

  const alarm = await updateAlarm(id, data);
  res.json({ alarm });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deleteAlarm(id);
  res.json({ success: true });
});

export default router;
