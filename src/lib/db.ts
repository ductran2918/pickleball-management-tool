import "server-only";

import { neon } from "@neondatabase/serverless";

let schemaReady: Promise<void> | null = null;

export type Member = {
  id: number;
  name: string;
  isActive: boolean;
};

export type MatchSession = {
  id: number;
  playedOn: string;
  courtCost: number;
  attendeeCount: number;
  sharePerPlayer: number;
  attendeeIds: number[];
  attendeeNames: string[];
};

export type MonthOption = {
  key: string;
  label: string;
};

export type MonthlyMemberTotal = {
  id: number;
  name: string;
  isActive: boolean;
  sessionsJoined: number;
  totalExpense: number;
};

export type DashboardData = {
  activeMembers: Member[];
  archivedMembers: Member[];
  sessions: MatchSession[];
  monthOptions: MonthOption[];
  selectedMonth: string;
  monthlyTotals: MonthlyMemberTotal[];
};

export type MembersData = Pick<DashboardData, "activeMembers" | "archivedMembers">;
export type SessionsData = {
  activeMembers: Member[];
  allMembers: Member[];
  sessions: MatchSession[];
};
export type SessionDetailData = {
  activeMembers: Member[];
  allMembers: Member[];
  session: MatchSession | null;
};
export type CostsData = Pick<DashboardData, "monthOptions" | "selectedMonth" | "monthlyTotals">;

export function getSql() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  return neon(connectionString);
}

type RawMemberRow = {
  id: number;
  name: string;
  is_active: boolean;
};

type RawSessionRow = {
  id: number;
  played_on: string;
  court_cost: number;
  attendee_count: number;
  share_per_player: number;
  attendee_ids: number[] | null;
  attendee_names: string[] | null;
};

type RawMonthRow = {
  month_key: string;
  month_label: string;
};

type RawMonthlyTotalRow = {
  id: number;
  name: string;
  is_active: boolean;
  sessions_joined: number;
  total_expense: number;
};

function getMonthBounds(monthKey: string) {
  const [yearString, monthString] = monthKey.split("-");
  const year = Number(yearString);
  const month = Number(monthString);

  if (!year || !month || month < 1 || month > 12) {
    return null;
  }

  const startDate = `${yearString}-${monthString.padStart(2, "0")}-01`;
  const endYear = month === 12 ? year + 1 : year;
  const endMonth = month === 12 ? 1 : month + 1;
  const endDate = `${String(endYear)}-${String(endMonth).padStart(2, "0")}-01`;

  return { startDate, endDate };
}

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();

      await sql`
        CREATE TABLE IF NOT EXISTS members (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS members_name_lower_idx
        ON members (LOWER(name))
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          played_on DATE NOT NULL,
          court_cost NUMERIC(12, 2) NOT NULL CHECK (court_cost >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS sessions_played_on_idx
        ON sessions (played_on DESC, id DESC)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS session_attendees (
          session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
          member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
          PRIMARY KEY (session_id, member_id)
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS session_attendees_member_idx
        ON session_attendees (member_id)
      `;
    })();
  }

  await schemaReady;
}

export async function getDashboardData(selectedMonthFromSearch?: string): Promise<DashboardData> {
  await ensureSchema();

  const sql = getSql();

  const members = (await sql`
    SELECT id, name, is_active
    FROM members
    ORDER BY is_active DESC, LOWER(name)
  `) as RawMemberRow[];

  const sessions = (await sql`
    SELECT
      s.id,
      s.played_on::text AS played_on,
      (s.court_cost)::float8 AS court_cost,
      COUNT(sa.member_id)::int AS attendee_count,
      COALESCE(
        ROUND((s.court_cost / NULLIF(COUNT(sa.member_id), 0))::numeric, 2),
        0
      )::float8 AS share_per_player,
      COALESCE(
        ARRAY_AGG(m.id ORDER BY LOWER(m.name)) FILTER (WHERE m.id IS NOT NULL),
        ARRAY[]::integer[]
      ) AS attendee_ids,
      COALESCE(
        ARRAY_AGG(m.name ORDER BY LOWER(m.name)) FILTER (WHERE m.id IS NOT NULL),
        ARRAY[]::text[]
      ) AS attendee_names
    FROM sessions s
    LEFT JOIN session_attendees sa ON sa.session_id = s.id
    LEFT JOIN members m ON m.id = sa.member_id
    GROUP BY s.id
    ORDER BY s.played_on DESC, s.id DESC
  `) as RawSessionRow[];

  const monthOptions = (await sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', played_on), 'YYYY-MM') AS month_key,
      TO_CHAR(DATE_TRUNC('month', played_on), 'Mon YYYY') AS month_label
    FROM sessions
    GROUP BY 1, 2
    ORDER BY month_key DESC
  `) as RawMonthRow[];

  const selectedMonth =
    selectedMonthFromSearch && getMonthBounds(selectedMonthFromSearch)
      ? selectedMonthFromSearch
      : monthOptions[0]?.month_key ?? getCurrentMonthKey();

  const monthBounds = getMonthBounds(selectedMonth) ?? getMonthBounds(getCurrentMonthKey());

  const monthlyTotals = monthBounds
    ? ((await sql`
        SELECT
          m.id,
          m.name,
          m.is_active,
          COUNT(sa.session_id) FILTER (
            WHERE s.played_on >= ${monthBounds.startDate} AND s.played_on < ${monthBounds.endDate}
          )::int AS sessions_joined,
          COALESCE(
            ROUND(
              SUM(
                CASE
                  WHEN s.played_on >= ${monthBounds.startDate} AND s.played_on < ${monthBounds.endDate}
                    THEN s.court_cost / attendee_counts.attendee_count
                  ELSE 0
                END
              )::numeric,
              2
            ),
            0
          )::float8 AS total_expense
        FROM members m
        LEFT JOIN session_attendees sa ON sa.member_id = m.id
        LEFT JOIN sessions s ON s.id = sa.session_id
        LEFT JOIN (
          SELECT session_id, COUNT(*)::numeric AS attendee_count
          FROM session_attendees
          GROUP BY session_id
        ) attendee_counts ON attendee_counts.session_id = s.id
        GROUP BY m.id, m.name, m.is_active
        ORDER BY total_expense DESC, sessions_joined DESC, LOWER(m.name)
      `) as RawMonthlyTotalRow[])
    : [];

  return {
    activeMembers: members
      .filter((member) => member.is_active)
      .map((member) => ({
        id: member.id,
        name: member.name,
        isActive: member.is_active,
      })),
    archivedMembers: members
      .filter((member) => !member.is_active)
      .map((member) => ({
        id: member.id,
        name: member.name,
        isActive: member.is_active,
      })),
    sessions: sessions.map((session) => ({
      id: session.id,
      playedOn: session.played_on,
      courtCost: Number(session.court_cost),
      attendeeCount: Number(session.attendee_count),
      sharePerPlayer: Number(session.share_per_player),
      attendeeIds: session.attendee_ids ?? [],
      attendeeNames: session.attendee_names ?? [],
    })),
    monthOptions: monthOptions.map((month) => ({
      key: month.month_key,
      label: month.month_label,
    })),
    selectedMonth,
    monthlyTotals: monthlyTotals.map((member) => ({
      id: member.id,
      name: member.name,
      isActive: member.is_active,
      sessionsJoined: Number(member.sessions_joined),
      totalExpense: Number(member.total_expense),
    })),
  };
}

export async function getOverviewData(selectedMonthFromSearch?: string) {
  return getDashboardData(selectedMonthFromSearch);
}

export async function getMembersData(): Promise<MembersData> {
  const data = await getDashboardData();

  return {
    activeMembers: data.activeMembers,
    archivedMembers: data.archivedMembers,
  };
}

export async function getSessionsData(): Promise<SessionsData> {
  const data = await getDashboardData();

  return {
    activeMembers: data.activeMembers,
    allMembers: [...data.activeMembers, ...data.archivedMembers],
    sessions: data.sessions,
  };
}

export async function getSessionDetailData(sessionId: number): Promise<SessionDetailData> {
  const data = await getDashboardData();

  return {
    activeMembers: data.activeMembers,
    allMembers: [...data.activeMembers, ...data.archivedMembers],
    session: data.sessions.find((session) => session.id === sessionId) ?? null,
  };
}

export async function getCostsData(selectedMonthFromSearch?: string): Promise<CostsData> {
  const data = await getDashboardData(selectedMonthFromSearch);

  return {
    monthOptions: data.monthOptions,
    selectedMonth: data.selectedMonth,
    monthlyTotals: data.monthlyTotals,
  };
}
