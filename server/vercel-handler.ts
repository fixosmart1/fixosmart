import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const ALLOWED_ORIGINS = [
  "https://www.fixosmart.com",
  "https://fixosmart.com",
  "https://fixosmart.vercel.app",
];

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// CORS — allow credentials from production origins
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-session-token");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let initPromise: Promise<void> | null = null;
let initError: Error | null = null;

async function initialize() {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // Static files not needed in Vercel (CDN serves them), but kept for safety
  const distPath = path.resolve(process.cwd(), "dist/public");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("/{*path}", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
}

// Start initialization immediately; capture any error so handler can respond fast
initPromise = initialize().catch((err) => {
  initError = err;
  console.error("[vercel-handler] initialization failed:", err);
});

const handler = async (req: Request, res: Response) => {
  try {
    await initPromise;
  } catch (_) {}

  // If init failed, return a clear error rather than hanging
  if (initError) {
    return res.status(503).json({
      message: "Service temporarily unavailable. Please check server logs.",
      error: initError.message,
    });
  }

  (app as any)(req, res);
};

export default handler;
