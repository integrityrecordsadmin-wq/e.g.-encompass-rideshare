import { getMessaging, getToken } from "firebase/messaging";
import { app } from "./firebase";

const VAPID_KEY = "BE3N6sQPXCfigWIywUvjP-oiUb9dzFarzlZan5MQxQaxXJF_gnxdTcyo2CRlmSzArRM51op8io3s6PlbY2l7Hk4";

// Asks the browser for notification permission, registers the service worker,
// and returns a device-specific token to save on the driver's profile.
export async function registerForPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) {
    throw new Error("Push not supported in this browser context.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted: " + permission);

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  return token || null;
}

export async function sendPushNotification({ token, title, body, url }) {
  const res = await fetch("/api/send-push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, title, body, url }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}
