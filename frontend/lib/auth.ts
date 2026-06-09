const TOKEN_KEY = "token";
const COOKIE_MAX_AGE = 60 * 60 * 8;

export function saveToken(token: string) {
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  // Coba sessionStorage dulu
  const fromSession = sessionStorage.getItem(TOKEN_KEY);
  if (fromSession) return fromSession;

  // Fallback: baca dari cookie
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`));
  const fromCookie = match ? decodeURIComponent(match[1]) : null;

  // Sync balik ke sessionStorage
  if (fromCookie) sessionStorage.setItem(TOKEN_KEY, fromCookie);

  return fromCookie;
}

export function clearToken() {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}