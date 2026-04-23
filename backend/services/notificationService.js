import { admin } from '../config/firebase.js';

export const sendVolunteerNotifications = async (finalTeamUids, nearbyVolunteers, criticalScore, requestId) => {
  if (finalTeamUids.length === 0) return;

  const targetTokens = nearbyVolunteers
    .filter(v => finalTeamUids.includes(v.uid) && v.fcmToken)
    .map(v => v.fcmToken);

  if (targetTokens.length === 0) {
    console.log("Team selected, but no valid FCM tokens found for notifications.");
    return;
  }

  try {
    const message = {
      notification: {
        title: '🚨 Urgent: Volunteer Task Assigned',
        body: `Severity ${criticalScore}/10. Your skills are needed nearby. Tap for details.`,
      },
      data: {
        requestId,
        type: 'NEW_REQUEST'
      },
      tokens: targetTokens,
    };

    const fcmResponse = await admin.messaging().sendEachForMulticast(message);
    console.log(`Push notifications sent. Success: ${fcmResponse.successCount}, Failed: ${fcmResponse.failureCount}`);

    if (fcmResponse.failureCount > 0) {
      fcmResponse.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.warn(`Failed to send to token ${targetTokens[idx]}:`, resp.error.code);
        }
      });
    }
  } catch (notificationError) {
    console.error("Fatal error sending push notifications:", notificationError);
  }
};