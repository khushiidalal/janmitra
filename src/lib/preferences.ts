// Universal Real-Time Preferences & Profile Event Bus for JANMITRA

export interface UserPreferences {
  language?: string;
  textSize?: 'Small' | 'Medium' | 'Large';
  highContrast?: boolean;
}

const PREF_KEY = 'userPreferences';

export function getStoredPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return { language: 'English (US)', textSize: 'Medium', highContrast: false };
  }

  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw);

    // Fallback to user.preferences if available
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      if (user?.preferences) return user.preferences;
    }
  } catch {
    // Ignore JSON errors
  }

  return { language: 'English (US)', textSize: 'Medium', highContrast: false };
}

export function applyGlobalPreferences(prefs: UserPreferences) {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;

  // High contrast mode
  if (prefs.highContrast) {
    html.classList.add('high-contrast');
  } else {
    html.classList.remove('high-contrast');
  }

  // Text size scaling
  html.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
  if (prefs.textSize === 'Small') {
    html.classList.add('text-size-small');
    html.style.fontSize = '13.5px';
  } else if (prefs.textSize === 'Large') {
    html.classList.add('text-size-large');
    html.style.fontSize = '17.5px';
  } else {
    html.classList.add('text-size-medium');
    html.style.fontSize = '15px';
  }
}

export function broadcastPreferencesUpdate(prefs: UserPreferences) {
  if (typeof window === 'undefined') return;

  const current = getStoredPreferences();
  const merged = { ...current, ...prefs };

  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(merged));

    // Also sync to cached user object
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      user.preferences = merged;
      localStorage.setItem('user', JSON.stringify(user));
    }
  } catch {
    // Storage quota or error handling
  }

  applyGlobalPreferences(merged);

  window.dispatchEvent(
    new CustomEvent('janmitra:preferences-updated', { detail: merged })
  );
}

export function broadcastProfileUpdate(user: any) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('user', JSON.stringify(user));
    if (user?.fullName) {
      localStorage.setItem('userName', user.fullName);
    }
  } catch {
    // Ignore error
  }

  window.dispatchEvent(
    new CustomEvent('janmitra:profile-updated', { detail: user })
  );
}
