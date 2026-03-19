import cron from "node-cron";
import { processDeliveryNotificationsAndAutoComplete } from "./modules/orders/order.service";
import { createNotification } from "./modules/notifications/notification.controller";

/**
 * Runs every hour to:
 * 1. Find SHIPPED orders that have passed their estimated delivery time
 *    and send a "please confirm" notification.
 * 2. Auto-complete orders that were notified 3+ days ago but not confirmed.
 */
export const startCronJobs = () => {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Running delivery notification & auto-complete job...");
    try {
      await processDeliveryNotificationsAndAutoComplete(createNotification);
      console.log("[CRON] Delivery job completed successfully.");
    } catch (err) {
      console.error("[CRON] Delivery job failed:", err);
    }
  });

  console.log("[CRON] Scheduled jobs registered.");
};
