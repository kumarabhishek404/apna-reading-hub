import { Router } from "express";
import { getCurrentUserFromRequest, requireAuth } from "../lib/auth";
import { loginUser, registerUser } from "../services/auth.service";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    const status =
      /already exists/i.test(message) ? 409 :
      /required|valid|match|characters/i.test(message) ? 400 :
      400;
    return res.status(status).json({ error: message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { mobile, password } = req.body ?? {};
    const result = await loginUser(mobile ?? "", password ?? "");
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    const status = /required/i.test(message) ? 400 : 401;
    return res.status(status).json({ error: message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    return res.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return res.status(500).json({ error: message });
  }
});

export default router;
