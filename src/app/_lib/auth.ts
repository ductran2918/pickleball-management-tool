import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "pickleball_d7_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function requireEnvValue(name: "ADMIN_ACCOUNT" | "ADMIN_PASSWORD") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set.`);
  }

  return value;
}

function getSessionSecret() {
  return `${requireEnvValue("ADMIN_ACCOUNT")}::${requireEnvValue("ADMIN_PASSWORD")}`;
}

function createSessionSignature(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

function encodeSessionValue(account: string) {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const payload = `${account}:${expiresAt}`;
  const signature = createSessionSignature(payload);

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

function decodeSessionValue(value: string) {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const [account, expiresAtString, signature] = decoded.split(":");

    if (!account || !expiresAtString || !signature) {
      return null;
    }

    const payload = `${account}:${expiresAtString}`;
    const expectedSignature = createSessionSignature(payload);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (actualBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
      return null;
    }

    const expiresAt = Number(expiresAtString);

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return null;
    }

    return { account, expiresAt };
  } catch {
    return null;
  }
}

function safeEqualText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getAdminAccountName() {
  return requireEnvValue("ADMIN_ACCOUNT");
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return false;
  }

  const session = decodeSessionValue(sessionCookie);

  return session?.account === getAdminAccountName();
}

export async function setAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, encodeSessionValue(getAdminAccountName()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function validateAdminCredentials(account: string, password: string) {
  return (
    safeEqualText(account, requireEnvValue("ADMIN_ACCOUNT")) &&
    safeEqualText(password, requireEnvValue("ADMIN_PASSWORD"))
  );
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/login");
  }
}
