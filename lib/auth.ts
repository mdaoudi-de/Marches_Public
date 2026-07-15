import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me",
);

export const SESSION_COOKIE = "poc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 h

export interface SessionUser {
  id: number;
  username: string;
  role: string;
  fullName: string;
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    username: user.username,
    role: user.role,
    fullName: user.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: Number(payload.sub),
      username: String(payload.username),
      role: String(payload.role),
      fullName: String(payload.fullName),
    };
  } catch {
    return null;
  }
}

/** À utiliser en tête des Server Actions / pages protégées. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié.");
  return user;
}
