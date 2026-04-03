const cron = require("node-cron");
const CalendarEvent = require("../models/CalendarEvent");
const Notification = require("../models/Notification");

/**
 * Background job that runs every minute to check for upcoming calendar events
 * and triggers notifications based on their reminder settings.
 */
const initReminderJob = () => {
    // Run every minute: * * * * *
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            // We check for events starting in the next 25 hours to cover "1 day before" reminders
            const checkWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

            // Find events that have active, unsent reminders
            const events = await CalendarEvent.find({
                startDate: { $gte: now, $lte: checkWindow },
                "reminders.sent": false
            });

            for (const event of events) {
                let eventModified = false;

                for (const reminder of event.reminders) {
                    if (!reminder.sent) {
                        // Calculate when this reminder should trigger
                        const triggerTime = new Date(event.startDate.getTime() - (reminder.time * 60000));
                        
                        // If current time is past the trigger time, send notification
                        if (now >= triggerTime) {
                            // 1. Notify the owner
                            await Notification.create({
                                user: event.user,
                                title: "Upcoming Event Reminder",
                                message: `Your event "${event.title}" starts in ${reminder.time} minutes!`,
                                type: "reminder",
                                metadata: { eventId: event._id }
                            });

                            // 2. Notify attendees if any
                            if (event.attendees && event.attendees.length > 0) {
                                for (const attendeeId of event.attendees) {
                                    // Skip if the attendee is also the owner (already notified)
                                    if (attendeeId.toString() !== event.user.toString()) {
                                        await Notification.create({
                                            user: attendeeId,
                                            title: "Upcoming Event Remark",
                                            message: `The event "${event.title}" you are attending starts in ${reminder.time} minutes.`,
                                            type: "reminder",
                                            metadata: { eventId: event._id }
                                        });
                                    }
                                }
                            }

                            // Mark this specific reminder as sent
                            reminder.sent = true;
                            eventModified = true;
                        }
                    }
                }

                // Save individual event if reminders were updated
                if (eventModified) {
                    await event.save();
                }
            }
        } catch (error) {
            console.error("❌ Notification Job Error:", error);
        }
    });

    console.log("📅 Calendar Reminder Job initialized (Running every minute)");
};

module.exports = { initReminderJob };
