import { getMessaging, getToken } from "firebase/messaging";
import { app } from "./firebase";

const VAPID_KEY = "BE3N6sQPXCfigWIywUvjP-oiUb9dzFarzlZan5MQxQaxXJF_gnxdTcyo2CRlmSzArRM51op8io3s6PlbY2l7Hk4";

// Asks the browser for notification permission, registers the service worker,
// and returns a device-specific token to save on the driver's profile.
// Returns null if permission is denied or push isn't supported (e.g. desktop
// Safari, or an iPhone that hasn't added the site to its home screen yet).
export async function registerForPush() {
  try {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) {
      return null;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (e) {
    console.error("Push registration failed:", e);
    return null;
  }
}

export async function sendPushNotification({ token, title, body, url }) {
  try {
    await fetch("/api/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, title, body, url }),
    });
  } catch (e) {
    console.error("Failed to send push:", e);
  }
}
