// Service Worker for Web Push
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "海蝕機関", {
      body:    data.body ?? "",
      icon:    "/icons/icon-192.png",
      badge:   "/icons/favicon.svg",
      tag:     data.tag ?? "kaishoku",
      data:    { url: data.url ?? "/dashboard" },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((wins) => {
      const url = event.notification.data?.url ?? "/dashboard";
      for (const win of wins) {
        if (win.url.includes(self.location.origin) && "focus" in win) {
          win.focus();
          win.navigate(url);
          return;
        }
      }
      clients.openWindow(url);
    })
  );
});
