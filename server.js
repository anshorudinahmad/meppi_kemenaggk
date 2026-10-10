// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var port = parseInt(process.env.PORT || "3000", 10);
var host = "0.0.0.0";
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});
var distPath = path.resolve(__dirname, "dist");
var indexPath = path.join(distPath, "index.html");
app.use(express.static(distPath, {
  maxAge: "1d",
  setHeaders: (res, filePath) => {
    if (filePath.endsWith("index.html")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  }
}));
app.get("*", (_req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send("MONEV Pelayanan Publik is ready.");
  }
});
var server = app.listen(port, host, () => {
  console.log(`[MONEV Server] Production server running on http://${host}:${port}`);
});
server.on("error", (err) => {
  console.error("[MONEV Server Error]", err);
});
process.on("SIGTERM", () => {
  console.log("[MONEV Server] Received SIGTERM signal, shutting down gracefully...");
  server.close(() => {
    console.log("[MONEV Server] Server closed.");
    process.exit(0);
  });
});
process.on("SIGINT", () => {
  console.log("[MONEV Server] Received SIGINT signal, shutting down gracefully...");
  server.close(() => {
    process.exit(0);
  });
});
var server_default = app;
export {
  server_default as default
};
