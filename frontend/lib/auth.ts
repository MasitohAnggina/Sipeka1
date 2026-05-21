// lib/auth.ts
// Letakkan di /lib/auth.ts (buat folder /lib jika belum ada)

const TOKEN_KEY = "token";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 jam

export function saveToken(token: string) {
  // Simpan ke cookie agar bisa dibaca middleware
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  // Simpan ke sessionStorage untuk kebutuhan client
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  // Hapus cookie
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  // Hapus sessionStorage & localStorage
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}