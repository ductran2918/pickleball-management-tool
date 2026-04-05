"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "./_lib/auth";
import { ensureSchema, getSql } from "../lib/db";

function getTrimmedString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function getOptionalNumber(value: FormDataEntryValue | null) {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function getAttendeeIds(formData: FormData) {
  return [...new Set(formData.getAll("attendeeIds").map((value) => Number(value)).filter(Number.isInteger))];
}

function revalidateAppPaths(extraPaths: string[] = []) {
  const paths = ["/", "/members", "/sessions", "/costs", ...extraPaths];

  for (const path of new Set(paths)) {
    revalidatePath(path);
  }
}

export async function addMember(formData: FormData) {
  await requireAdmin();
  await ensureSchema();
  const sql = getSql();

  const name = getTrimmedString(formData.get("name"));

  if (!name) {
    return;
  }

  await sql`
    INSERT INTO members (name)
    VALUES (${name})
    ON CONFLICT DO NOTHING
  `;

  revalidateAppPaths();
}

export async function setMemberActive(formData: FormData) {
  await requireAdmin();
  await ensureSchema();
  const sql = getSql();

  const memberId = getNumber(formData.get("memberId"));
  const nextState = getTrimmedString(formData.get("nextState"));

  if (!Number.isInteger(memberId) || !["active", "archived"].includes(nextState)) {
    return;
  }

  await sql`
    UPDATE members
    SET is_active = ${nextState === "active"}
    WHERE id = ${memberId}
  `;

  revalidateAppPaths();
}

export async function updateMemberName(formData: FormData) {
  await requireAdmin();
  await ensureSchema();
  const sql = getSql();

  const memberId = getNumber(formData.get("memberId"));
  const name = getTrimmedString(formData.get("name"));

  if (!Number.isInteger(memberId) || !name) {
    return;
  }

  await sql`
    UPDATE members
    SET name = ${name}
    WHERE id = ${memberId}
      AND NOT EXISTS (
        SELECT 1
        FROM members
        WHERE LOWER(name) = LOWER(${name}) AND id <> ${memberId}
      )
  `;

  revalidateAppPaths();
}

export async function createSession(formData: FormData) {
  await requireAdmin();
  await ensureSchema();
  const sql = getSql();

  const playedOn = getTrimmedString(formData.get("playedOn"));
  const courtCost = getOptionalNumber(formData.get("courtCost")) ?? 515;
  const attendeeIds = getAttendeeIds(formData);

  if (!playedOn || !Number.isFinite(courtCost) || courtCost < 0 || attendeeIds.length === 0) {
    return;
  }

  const insertedRows = (await sql`
    INSERT INTO sessions (played_on, court_cost)
    VALUES (${playedOn}, ${courtCost})
    RETURNING id
  `) as Array<{ id: number }>;

  const sessionId = insertedRows[0]?.id;

  if (!sessionId) {
    return;
  }

  try {
    await sql.transaction((txn) =>
      attendeeIds.map((memberId) => txn`
        INSERT INTO session_attendees (session_id, member_id)
        VALUES (${sessionId}, ${memberId})
        ON CONFLICT DO NOTHING
      `),
    );
  } catch (error) {
    await sql`
      DELETE FROM sessions
      WHERE id = ${sessionId}
    `;

    throw error;
  }

  revalidateAppPaths();
}

export async function updateSession(formData: FormData) {
  await requireAdmin();
  await ensureSchema();
  const sql = getSql();

  const sessionId = getNumber(formData.get("sessionId"));
  const playedOn = getTrimmedString(formData.get("playedOn"));
  const courtCost = getNumber(formData.get("courtCost"));
  const attendeeIds = getAttendeeIds(formData);

  if (
    !Number.isInteger(sessionId) ||
    !playedOn ||
    !Number.isFinite(courtCost) ||
    courtCost < 0 ||
    attendeeIds.length === 0
  ) {
    return;
  }

  await sql.transaction((txn) => [
    txn`
      UPDATE sessions
      SET played_on = ${playedOn}, court_cost = ${courtCost}
      WHERE id = ${sessionId}
    `,
    txn`
      DELETE FROM session_attendees
      WHERE session_id = ${sessionId}
    `,
    ...attendeeIds.map((memberId) => txn`
      INSERT INTO session_attendees (session_id, member_id)
      VALUES (${sessionId}, ${memberId})
      ON CONFLICT DO NOTHING
    `),
  ]);

  revalidateAppPaths([`/sessions/${sessionId}`]);
}

export async function deleteSession(formData: FormData) {
  await requireAdmin();
  await ensureSchema();
  const sql = getSql();

  const sessionId = getNumber(formData.get("sessionId"));
  const redirectTo = getTrimmedString(formData.get("redirectTo"));

  if (!Number.isInteger(sessionId)) {
    return;
  }

  await sql`
    DELETE FROM sessions
    WHERE id = ${sessionId}
  `;

  revalidateAppPaths();

  if (redirectTo) {
    redirect(redirectTo);
  }
}
