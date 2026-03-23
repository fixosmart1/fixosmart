import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "../server/routes";
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

// Cache initialization so warm serverless starts skip re-seeding
let initPromise: Promise<void> | null = null;

async function initialize() {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // Serve the Vite-built frontend as static files
  const distPath = path.resolve(process.cwd(), "dist/public");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("/{*path}", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
}

initPromise = initialize().catch(console.error);

// Vercel expects either a handler function or an Express app as the default export.
// We wrap to ensure initialization completes before the first request.
const handler = async (req: Request, res: Response) => {
  await initPromise;
  (app as any)(req, res);
};

export default handler;
