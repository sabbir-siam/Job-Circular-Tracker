import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("jobs.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS circulars (
    id TEXT PRIMARY KEY,
    organization TEXT,
    postName TEXT,
    deadline TEXT,
    category TEXT,
    data TEXT
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/subscriptions", (req, res) => {
    const subs = db.prepare("SELECT * FROM subscriptions").all();
    res.json(subs);
  });

  app.post("/api/subscribe", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    try {
      db.prepare("INSERT INTO subscriptions (email) VALUES (?)").run(email);
      res.json({ success: true });
    } catch (e: any) {
      if (e.message.includes("UNIQUE")) {
        res.json({ success: true, message: "Already subscribed" });
      } else {
        res.status(500).json({ error: e.message });
      }
    }
  });

  app.post("/api/sync-circulars", (req, res) => {
    const { circulars } = req.body;
    if (!Array.isArray(circulars)) return res.status(400).json({ error: "Invalid data" });

    const insert = db.prepare(`
      INSERT OR REPLACE INTO circulars (id, organization, postName, deadline, category, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((data) => {
      for (const job of data) {
        insert.run(job.id, job.organization, job.postName, job.deadline, job.category, JSON.stringify(job));
      }
    });

    transaction(circulars);
    res.json({ success: true });
  });

  // Background task simulation: Check for deadlines 15 days away
  setInterval(() => {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + 15);
    const targetStr = targetDate.toISOString().split('T')[0];

    const upcomingJobs = db.prepare("SELECT * FROM circulars WHERE deadline = ?").all(targetStr);
    
    // Urgent Alert: 3 days before deadline
    const urgentDate = new Date();
    urgentDate.setDate(today.getDate() + 3);
    const urgentStr = urgentDate.toISOString().split('T')[0];
    const urgentJobs = db.prepare("SELECT * FROM circulars WHERE deadline = ?").all(urgentStr);

    const subscribers = db.prepare("SELECT email FROM subscriptions").all();

    if (subscribers.length > 0) {
      // Handle Upcoming Alerts
      if (upcomingJobs.length > 0) {
        console.log(`[ALERT SYSTEM] Found ${upcomingJobs.length} upcoming jobs for ${targetStr}`);
        for (const sub of subscribers) {
          for (const job of upcomingJobs) {
            console.log(`[EMAIL SENT] To: ${sub.email} | Subject: URGENT: Job Deadline in 15 Days | Body: The deadline for ${job.postName} at ${job.organization} is on ${job.deadline}. Apply now!`);
          }
        }
      }

      // Handle Urgent Alerts
      if (urgentJobs.length > 0) {
        console.log(`[URGENT ALERT] Found ${urgentJobs.length} urgent jobs for ${urgentStr}`);
        for (const sub of subscribers) {
          for (const job of urgentJobs) {
            console.log(`[EMAIL SENT] To: ${sub.email} | Subject: CRITICAL: Job Deadline in 3 Days! | Body: URGENT! The deadline for ${job.postName} at ${job.organization} is in just 3 days (${job.deadline}). Don't miss out!`);
          }
        }
      }
    }
  }, 1000 * 60 * 60); // Run every hour

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
