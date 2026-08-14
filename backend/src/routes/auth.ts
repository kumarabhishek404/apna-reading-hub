import { Router } from "express";
import { getCurrentUserFromRequest, requireAuth } from "../lib/auth";
import { loginUser, registerUser } from "../services/auth.service";
import { asyncHandler } from "../lib/async-handler";
import { rateLimit } from "../middleware/rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyPrefix: "auth",
});

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  })
);

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { mobile, password } = req.body ?? {};
    const result = await loginUser(mobile ?? "", password ?? "");
    res.json(result);
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  })
);

export default router;
