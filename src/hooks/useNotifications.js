// file use: request push notification permission, save FCM token
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { initializeApp } from "firebase/app";

const VAPID_KEY = "YOUR_VAPID_KEY"; 

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token && auth.currentUser) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fcmToken: token
      });
    }
    return token;
  } catch (err) {
    console.error("Notification permission error:", err);
    return null;
  }
}

export function listenToForegroundMessages(onReceive) {
  try {
    const messaging = getMessaging();
    return onMessage(messaging, (payload) => {
      onReceive(payload);
    });
  } catch (err) {
    console.error("FCM listen error:", err);
    return () => {};
  }
}
