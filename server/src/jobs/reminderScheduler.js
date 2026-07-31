import cron from "node-cron";
import { runDueReminders } from "../utils/appointmentReminders.js";
import { sendDailyClinicDigest } from "../utils/dailyDigest.js";

/**
 * Hourly patient reminders + optional morning clinic digest.
 */
export function startReminderScheduler() {
  if (process.env.REMINDERS_ENABLED === "false") {
    console.log("Appointment reminders scheduler disabled (REMINDERS_ENABLED=false)");
  } else {
    cron.schedule("5 * * * *", () => {
      runDueReminders().catch((err) =>
        console.error("Reminder job failed:", err.message || err)
      );
    });
    console.log("Appointment reminders scheduler started (hourly)");
  }

  if (process.env.DIGEST_ENABLED === "false") {
    console.log("Daily digest disabled (DIGEST_ENABLED=false)");
    return;
  }

  // Default 08:05 server local time — set TZ=Asia/Karachi on the host for PK mornings
  const expr = process.env.DIGEST_CRON || "5 8 * * *";
  cron.schedule(expr, () => {
    sendDailyClinicDigest().catch((err) =>
      console.error("Daily digest failed:", err.message || err)
    );
  });
  console.log(`Daily clinic digest scheduled (${expr})`);
}
