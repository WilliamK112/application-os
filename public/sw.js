/**
 * Service Worker for Web Push notifications.
 * Place in /public/sw.js — registered by usePushNotifications hook.
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Notification", body: event.data.text() };
  }

  const { title, body, icon, link } = data;

  const options = {
    body: body ?? "",
    icon: icon ?? "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag ?? "default",
    data: { url: link ?? "/" },
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title ?? "Application OS", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
