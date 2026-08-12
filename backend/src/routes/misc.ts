import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { asyncHandler } from "../lib/async-handler";
import { getDashboardData, globalSearch } from "../services/search.service";
import { getAllTagsWithCounts } from "../services/tag.service";

const router = Router();

router.use(requireAuth);

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId;
    const data = await getDashboardData(userId);
    res.json(data);
  })
);

router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string) ?? "";
    const userId = (req as any).user?.userId;
    const results = await globalSearch(q, userId);
    res.json({ results });
  })
);

router.get(
  "/tags",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId;
    const tags = await getAllTagsWithCounts(userId);
    res.json({ tags });
  })
);

export default router;
