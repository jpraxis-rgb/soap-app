/**
 * Notification service stub.
 *
 * In production this would integrate with Expo Push Notifications,
 * but for now these are placeholder functions that log actions.
 */

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Schedule a daily study reminder based on user preferences.
 * Called when a user sets up their study schedule or updates preferences.
 */
export async function scheduleDailyReminder(
  userId: string,
  preferredTime: string, // e.g. "08:00"
): Promise<void> {
  // TODO: Integrate with Expo Push Notifications
  // 1. Look up user's Expo push token from DB
  // 2. Schedule a recurring notification at preferredTime
  // 3. Store the scheduled notification ID for cancellation
  console.log(
    `[notifications] Scheduled daily reminder for user ${userId} at ${preferredTime}`,
  );
}

/**
 * Cancel a previously scheduled daily reminder.
 */
export async function cancelDailyReminder(userId: string): Promise<void> {
  // TODO: Cancel the scheduled notification using stored ID
  console.log(
    `[notifications] Cancelled daily reminder for user ${userId}`,
  );
}

/**
 * Check for inactive users and send re-engagement nudge.
 * Should be called by a cron job / scheduled task every few hours.
 *
 * Logic: if a user has not logged a session in 48+ hours, send a nudge.
 */
export async function sendInactivityNudge(
  userId: string,
  lastSessionDate: Date,
): Promise<void> {
  const hoursSinceLastSession =
    (Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastSession < 48) {
    return; // Not inactive yet
  }

  const payload: NotificationPayload = {
    userId,
    title: 'Sentimos sua falta!',
    body: 'Que tal uma sessao rapida de 15 minutos? Cada minuto conta para sua aprovacao.',
    data: { type: 'inactivity_nudge' },
  };

  await sendPushNotification(payload);
}

/**
 * Send a session completion congratulation.
 */
export async function sendSessionCompletionNotification(
  userId: string,
  topic: string,
  streakDays: number,
): Promise<void> {
  const streakMessage =
    streakDays > 1 ? ` Voce esta em uma sequencia de ${streakDays} dias!` : '';

  const payload: NotificationPayload = {
    userId,
    title: 'Sessao concluida!',
    body: `Otimo trabalho estudando "${topic}".${streakMessage}`,
    data: { type: 'session_complete', streak: streakDays },
  };

  await sendPushNotification(payload);
}

/**
 * Low-level push notification sender.
 * Stub: just logs the notification payload.
 */
async function sendPushNotification(
  payload: NotificationPayload,
): Promise<void> {
  // TODO: Use Expo's push notification API
  // const expoPushToken = await getExpoPushToken(payload.userId);
  // await fetch('https://exp.host/--/api/v2/push/send', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     to: expoPushToken,
  //     title: payload.title,
  //     body: payload.body,
  //     data: payload.data,
  //   }),
  // });
  console.log(`[notifications] Push notification for user ${payload.userId}:`, {
    title: payload.title,
    body: payload.body,
  });
}
