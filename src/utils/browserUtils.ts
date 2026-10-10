/**
 * Universal Cross-Browser Utilities
 * Provides resilient fallbacks for Clipboard, LocalStorage, Device Detection, and Audio
 * across Safari (macOS & iOS), Chrome, Firefox, Edge, and Android WebViews.
 */

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  /**
   * Safely read and parse JSON from localStorage without throwing errors
   */
  getJSON: <T>(key: string, fallback: T): T => {
    try {
      const val = safeLocalStorage.getItem(key);
      if (!val) return fallback;
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  },
  /**
   * Safely stringify and store JSON in localStorage without throwing errors
   */
  setJSON: <T>(key: string, value: T): boolean => {
    try {
      const str = JSON.stringify(value);
      return safeLocalStorage.setItem(key, str);
    } catch {
      return false;
    }
  },
};

/**
 * Safely parse any JSON string with guaranteed fallback on syntax error
 */
export function safeJsonParse<T>(jsonStr: string | null | undefined, fallback: T): T {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return fallback;
  }
}

/**
 * Robust cross-browser clipboard copy with legacy textarea fallback
 * Works in Safari iOS, restrictive iframe permissions, and HTTP/HTTPS.
 */
export async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Modern navigator.clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy method
    }
  }

  // 2. Legacy execCommand('copy') fallback for Safari/iframe restrictions
  try {
    if (typeof document === 'undefined') return false;
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Cross-browser haptic vibration (safely handles Safari/iOS where vibration is unsupported)
 */
export function safeHapticVibrate(ms = 25): void {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  } catch {
    // Ignore unsupported device errors
  }
}

/**
 * Cross-browser check for touch/mobile devices
 */
export function isMobileOrTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const isSmallScreen = window.innerWidth < 768;
  const isTouch =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isSmallScreen || isTouch;
}
