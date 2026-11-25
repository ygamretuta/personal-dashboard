// Shows Web Push notifications and focuses the inbox when one is clicked.
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Morning", {
      body: data.body || "",
      data: { url: data.url || "/inbox" },
      tag: "morning-inbox",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/inbox";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const open = clients.find((client) => "focus" in client);
      return open ? open.focus() : self.clients.openWindow(url);
    }),
  );
});
