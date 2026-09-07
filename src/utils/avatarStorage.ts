// Utility for isolated per-account avatar storage and persistence
// Guarantees that each account has its own distinct profile picture that persists independently

export function getAccountAvatar(userId: string, fallbackAvatar?: string): string {
  if (!userId) return fallbackAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
  
  try {
    const stored = localStorage.getItem(`coding_partner_avatar_${userId}`);
    if (stored && stored.trim().length > 0) {
      return stored;
    }
  } catch (e) {
    console.warn('Could not read avatar from localStorage', e);
  }

  return fallbackAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
}

export function saveAccountAvatar(userId: string, avatarUrl: string): void {
  if (!userId || !avatarUrl) return;

  try {
    // 1. Save strictly under this specific user's key
    localStorage.setItem(`coding_partner_avatar_${userId}`, avatarUrl);

    // 2. Update in saved profiles list if present
    const stored = localStorage.getItem('coding_partner_saved_profiles');
    if (stored) {
      const list = JSON.parse(stored);
      if (Array.isArray(list)) {
        const updated = list.map((p: any) =>
          p.id === userId ? { ...p, avatar: avatarUrl } : p
        );
        localStorage.setItem('coding_partner_saved_profiles', JSON.stringify(updated));
      }
    }

    // 3. Update logged-in user in session/localStorage if currently active
    const activeSession = sessionStorage.getItem('coding_partner_logged_in_user');
    if (activeSession) {
      const parsed = JSON.parse(activeSession);
      if (parsed.id === userId) {
        parsed.avatar = avatarUrl;
        sessionStorage.setItem('coding_partner_logged_in_user', JSON.stringify(parsed));
      }
    }

    const activeLocal = localStorage.getItem('coding_partner_logged_in_user');
    if (activeLocal) {
      const parsed = JSON.parse(activeLocal);
      if (parsed.id === userId) {
        parsed.avatar = avatarUrl;
        localStorage.setItem('coding_partner_logged_in_user', JSON.stringify(parsed));
      }
    }

    // 4. Fire background update to server API so other connected clients also receive the update
    fetch(`/api/user/${encodeURIComponent(userId)}/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: avatarUrl }),
    }).catch((err) => {
      console.warn('Failed to sync avatar to backend', err);
    });
  } catch (e) {
    console.warn('Could not save avatar to localStorage', e);
  }
}
