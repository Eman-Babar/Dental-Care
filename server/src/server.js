import "dotenv/config";
import app from "./app.js";
import { startReminderScheduler } from "./jobs/reminderScheduler.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Dental Clinic server is running on port ${PORT}`);
  startReminderScheduler();
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process, then run: npm run dev`
    );
    process.exit(1);
  }
  throw err;
});
