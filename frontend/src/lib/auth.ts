import { API_BASE_URL } from "@/lib/api/client";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("isAuthenticated") === "true";
}

export function persistAuthSession(user: { email: string; name: string }) {
  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("userEmail", user.email);
  localStorage.setItem("userName", user.name);
}

export function clearAuthSession() {
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
}

export function persistEmailAuth(email: string, name?: string) {
  const resolvedName =
    name?.trim() ||
    email.split("@")[0]?.replace(/^./, (c) => c.toUpperCase()) ||
    "User";
  persistAuthSession({ email, name: resolvedName });
}

export async function verifyGoogleToken(token: string): Promise<{ email: string; name: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/google-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error("Auth failed");
  const data = await res.json();
  if (data.status !== "success" || !data.user) throw new Error("Invalid response");
  return { email: data.user.email, name: data.user.name };
}

