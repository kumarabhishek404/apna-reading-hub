import { Router } from "express";
import { getDashboardData, globalSearch } from "../services/search.service";
import { getAllTagsWithCounts } from "../services/tag.service";

const router = Router();

const dashboardRouter = Router();
dashboardRouter.get("/", async (_req, res) => {
  const data = await getDashboardData();
  res.json(data);
});

const searchRouter = Router();
searchRouter.get("/", async (req, res) => {
  const q = (req.query.q as string) ?? "";
  const results = await globalSearch(q);
  res.json({ results });
});

const tagsRouter = Router();
tagsRouter.get("/", async (_req, res) => {
  const tags = await getAllTagsWithCounts();
  res.json({ tags });
});

router.use("/dashboard", dashboardRouter);
router.use("/search", searchRouter);
router.use("/tags", tagsRouter);

export default router;
