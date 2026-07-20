import app, { UPLOADS_DIR } from "./app";

const PORT = process.env.PORT || 4000;

// Local / Docker / Render: run as a long-lived server.
// On Vercel the Express app is imported by the Next.js API catch-all instead.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Reading Hub API running on port ${PORT}`);
    console.log(`Uploads directory: ${UPLOADS_DIR}`);
  });
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

export default app;
