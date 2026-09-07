/**
 * Time utility for chat messages to ensure accurate real-time timestamp display.
 */

export function getCurrentChatTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatChatMessageTime(msg: { timestamp?: string; createdAt?: number }): string {
  if (msg.timestamp && typeof msg.timestamp === 'string' && msg.timestamp.trim()) {
    return msg.timestamp;
  }
  if (msg.createdAt) {
    try {
      const d = new Date(msg.createdAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch (e) {}
  }
  return getCurrentChatTime();
}
