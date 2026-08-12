import { Router } from "express";
import { getCurrentUserFromRequest, requireAuth } from "../lib/auth";
import { loginUser, registerUser } from "../services/auth.service";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const payload = req.body;
    const result = await registerUser(payload);
    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return res.status(400).json({ error: message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const result = await loginUser(mobile, password);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return res.status(401).json({ error: message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await getCurrentUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  return res.json({ user });
});

export default router;
