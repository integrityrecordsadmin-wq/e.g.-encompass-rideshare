// This file must live at the root of the public folder (public/firebase-messaging-sw.js)
// so the browser can register it to receive push notifications even when
// the site isn't open in a foreground tab.

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// These values are public/safe to embed directly (same ones used in the app itself).
firebase.initializeApp({
  apiKey: "AIzaSyAIKpWTG5J59YVwczLadUWaxP7JBx5k2Xg",
  authDomain: "encompass-3c913.firebaseapp.com",
  projectId: "encompass-3c913",
  storageBucket: "encompass-3c913.firebasestorage.app",
  messagingSenderId: "775675339694",
  appId: "1:775675339694:web:8b9197504f5b517aba5e3f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "New ride request";
  const options = {
    body: payload.notification?.body || "Tap to view",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/driver";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
