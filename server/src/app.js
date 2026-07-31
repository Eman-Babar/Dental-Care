import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicDoctorRoutes from "./routes/publicDoctorRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import publicChatRoutes from "./routes/publicChatRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function parseAllowedOrigins() {
  const raw =
    process.env.CLIENT_ORIGINS ||
    process.env.CLIENT_URL ||
    "http://localhost:5173,http://127.0.0.1:5173";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins();
const isDev = process.env.NODE_ENV !== "production";

function isLocalDevOrigin(origin) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch {
    return false;
  }
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts. Try again in a few minutes." },
});

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 300 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down and try again." },
});

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        (isDev && isLocalDevOrigin(origin))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/doctors', publicDoctorRoutes);
app.use('/api/doctor', doctorRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", publicFormLimiter, publicChatRoutes);
app.use("/api/contact", publicFormLimiter, contactRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/health", async (req, res) => {
  let database = "ok";
  try {
    const prisma = (await import("./config/prisma.js")).default;
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    database = "error";
    console.error("Health DB check failed:", err.message || err);
    return res.status(503).json({
      status: "DEGRADED",
      message: "API is up but database is unreachable.",
      database,
      time: new Date().toISOString(),
    });
  }

  res.json({
    status: "OK",
    message: "Dental Clinic backend service is healthy.",
    database,
    time: new Date().toISOString(),
  });
});

app.use((req, res, next) => {
  res.status(404).json({ message: `Resource not found: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err.message || err);

  if (err.message?.startsWith("CORS blocked")) {
    return res.status(403).json({ message: err.message });
  }

  if (err instanceof Error && err.message.includes('upload')) {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;
