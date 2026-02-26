/**
 * caregiverAuth.ts
 * Login/session via backend MongoDB API.
 * Registration is now handled directly in RegisterCaregiver.tsx
 * Session still stored in localStorage (browser session only).
 */

const SESSION_KEY = "caregiver_session";
const API_URL     = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

export interface CaregiverSession {
  id:           string;
  fullName:     string;
  username:     string;
  relationship: string;
  loginAt:      string;
}

// ── LOGIN — calls backend, which checks MongoDB ───────────────────────────────
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; session?: CaregiverSession }> {
  try {
    const res  = await fetch(`${API_URL}/api/caregiver/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || "Login failed." };

    const session: CaregiverSession = data.session;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, session };
  } catch {
    return { success: false, error: "Cannot connect to server. Make sure backend is running." };
  }
}

// ── SESSION helpers (unchanged — still use localStorage) ──────────────────────
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): CaregiverSession | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

// ── usernameExists — now checks backend (used by legacy code if any) ──────────
export async function usernameExists(username: string): Promise<boolean> {
  try {
    const res  = await fetch(`${API_URL}/api/caregiver/list`);
    const data = await res.json();
    return (data.caregivers || []).some(
      (c: any) => c.username === username.trim().toLowerCase()
    );
  } catch {
    return false;
  }
}