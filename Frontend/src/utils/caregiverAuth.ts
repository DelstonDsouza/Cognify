/**
 * caregiverAuth.ts
 * Handles caregiver registration, login, logout.
 * - Accounts stored in localStorage (persist forever)
 * - Session stored in localStorage (persists until explicit logout)
 */

const ACCOUNTS_KEY = "caregiver_accounts";
const SESSION_KEY  = "caregiver_session";

export interface CaregiverAccount {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  relationship: string;
  passwordHash: string;
  registeredAt: string;
}

export interface CaregiverSession {
  id: string;
  fullName: string;
  username: string;
  relationship: string;
  loginAt: string;
}

function hashPassword(password: string): string {
  return btoa(unescape(encodeURIComponent(password)));
}
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function getAccounts(): CaregiverAccount[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]"); }
  catch { return []; }
}

function saveAccounts(accounts: CaregiverAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function usernameExists(username: string): boolean {
  return getAccounts().some(a => a.username === username.trim().toLowerCase());
}

export function register(data: {
  fullName: string;
  username: string;
  phone: string;
  password: string;
  relationship: string;
}): { success: boolean; error?: string } {
  const username = data.username.trim().toLowerCase();
  if (!data.fullName.trim())    return { success: false, error: "Full name is required." };
  if (username.length < 3)      return { success: false, error: "Username must be at least 3 characters." };
  if (data.password.length < 6) return { success: false, error: "Password must be at least 6 characters." };
  if (usernameExists(username)) return { success: false, error: "Username already taken. Choose another." };

  const account: CaregiverAccount = {
    id:           Date.now().toString(),
    fullName:     data.fullName.trim(),
    username,
    phone:        data.phone.trim(),
    relationship: data.relationship,
    passwordHash: hashPassword(data.password),
    registeredAt: new Date().toISOString(),
  };
  saveAccounts([...getAccounts(), account]);
  return { success: true };
}

export function login(
  username: string,
  password: string
): { success: boolean; error?: string; session?: CaregiverSession } {
  const account = getAccounts().find(a => a.username === username.trim().toLowerCase());
  if (!account)                                      return { success: false, error: "No account found with that username." };
  if (!verifyPassword(password, account.passwordHash)) return { success: false, error: "Incorrect password." };

  const session: CaregiverSession = {
    id: account.id, fullName: account.fullName,
    username: account.username, relationship: account.relationship,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, session };
}

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