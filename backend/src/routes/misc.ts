import { Router } from "express";
import { asyncHandler } from "../lib/async-handler";
import { getDashboardData, globalSearch } from "../services/search.service";
import { getAllTagsWithCounts } from "../services/tag.service";

const router = Router();

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const data = await getDashboardData();
    res.json(data);
  })
);

router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string) ?? "";
    const results = await globalSearch(q);
    res.json({ results });
  })
);

router.get(
  "/tags",
  asyncHandler(async (_req, res) => {
    const tags = await getAllTagsWithCounts();
    res.json({ tags });
  })
);

export default router;
