import Link from "next/link";
import type { ReactNode } from "react";

import { deleteSession, updateSession } from "../actions";
import { formatDate, formatMoney, getMonthTitle } from "../_lib/format";
import type { MatchSession, Member, MonthlyMemberTotal } from "../../lib/db";

const sectionClassName =
  "rounded-[2.25rem] border border-white/10 bg-[#14110e] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-8";

export function SectionCard({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={sectionClassName}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200/60">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">{description}</p> : null}
        </div>
        {actions ? <div className="sm:min-w-52">{actions}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm leading-6 text-stone-400">
      {children}
    </p>
  );
}

export function ReadOnlyNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/8 px-5 py-4 text-sm leading-6 text-amber-100">
      {children}
    </div>
  );
}

export function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/8 p-5">
      <p className="text-sm text-stone-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {detail ? <p className="mt-2 text-sm text-stone-500">{detail}</p> : null}
    </div>
  );
}

export function MemberCheckboxGrid({
  members,
  selectedIds = [],
}: {
  members: Member[];
  selectedIds?: number[];
}) {
  const selected = new Set(selectedIds);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {members.map((member) => (
        <label
          key={member.id}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-200 transition hover:border-amber-300/40 hover:bg-white/10"
        >
          <input
            type="checkbox"
            name="attendeeIds"
            value={member.id}
            defaultChecked={selected.has(member.id)}
            className="h-4 w-4 accent-amber-400"
          />
          <span>{member.name}</span>
        </label>
      ))}
    </div>
  );
}

export function MonthlyAttendanceChart({
  members,
  monthTitle,
}: {
  members: MonthlyMemberTotal[];
  monthTitle: string;
}) {
  const sortedMembers = [...members].sort(
    (left, right) => right.sessionsJoined - left.sessionsJoined || left.name.localeCompare(right.name),
  );
  const maxSessionsJoined = Math.max(...sortedMembers.map((member) => member.sessionsJoined), 1);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-stone-950/45 p-5">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-stone-400">Attendance chart</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Matches played per member in {monthTitle}</h3>
      </div>

      <div className="mt-5 space-y-4">
        {sortedMembers.map((member) => {
          const barWidth = `${(member.sessionsJoined / maxSessionsJoined) * 100}%`;

          return (
            <div key={member.id} className="grid gap-2 sm:grid-cols-[minmax(0,11rem)_1fr_auto] sm:items-center sm:gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-100">{member.name}</p>
                <p className="text-sm text-stone-500">
                  {member.sessionsJoined} {member.sessionsJoined === 1 ? "match" : "matches"}
                </p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/8 ring-1 ring-inset ring-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(251,191,36,0.7),rgba(245,158,11,0.95))]"
                  style={{ width: barWidth }}
                />
              </div>
              <p className="text-right text-sm font-semibold tabular-nums text-amber-200">{member.sessionsJoined}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SessionSummaryCard({
  session,
  href,
}: {
  session: MatchSession;
  href: string;
}) {
  const previewNames = session.attendeeNames.slice(0, 4);
  const overflowCount = session.attendeeNames.length - previewNames.length;

  return (
    <article className="rounded-[2rem] border border-white/10 bg-[#191612] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/60">Session</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{formatDate(session.playedOn)}</h3>
          <p className="mt-2 text-sm text-stone-300">
            {session.attendeeCount} players · {formatMoney(session.sharePerPlayer)} each · {formatMoney(session.courtCost)} total
          </p>
        </div>
        <Link
          href={href}
          className="rounded-full bg-amber-300 px-4 py-2.5 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
        >
          Manage attendance
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {previewNames.map((attendeeName) => (
          <span
            key={attendeeName}
            className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-stone-300"
          >
            {attendeeName}
          </span>
        ))}
        {overflowCount > 0 ? (
          <span className="rounded-full border border-dashed border-white/10 px-3 py-1.5 text-sm text-stone-400">
            +{overflowCount} more
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function SessionEditor({
  session,
  allMembers,
}: {
  session: MatchSession;
  allMembers: Member[];
}) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-[#191612] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/60">Session editor</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">{formatDate(session.playedOn)}</h3>
          <p className="mt-2 text-sm text-stone-300">
            {session.attendeeCount} players · {formatMoney(session.sharePerPlayer)} each · {formatMoney(session.courtCost)} total
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {session.attendeeNames.map((attendeeName) => (
              <span
                key={attendeeName}
                className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-stone-300"
              >
                <span className="text-stone-100">{attendeeName}</span>
                <span className="ml-2 text-amber-200">{formatMoney(session.sharePerPlayer)}</span>
              </span>
            ))}
          </div>
        </div>

        <form action={deleteSession}>
          <input type="hidden" name="sessionId" value={session.id} />
          <input type="hidden" name="redirectTo" value="/sessions" />
          <button
            type="submit"
            className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-300 hover:bg-rose-400/10"
          >
            Delete session
          </button>
        </form>
      </div>

      <form action={updateSession} className="mt-6 space-y-5">
        <input type="hidden" name="sessionId" value={session.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-300">Match date</span>
            <input
              type="date"
              name="playedOn"
              defaultValue={session.playedOn}
              className="w-full rounded-2xl border border-white/10 bg-stone-950/70 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-300/60"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-300">Court rent</span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="courtCost"
              defaultValue={session.courtCost}
              className="w-full rounded-2xl border border-white/10 bg-stone-950/70 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-300/60"
            />
          </label>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-stone-300">Players in this match</p>
          <MemberCheckboxGrid members={allMembers} selectedIds={session.attendeeIds} />
        </div>

        <button
          type="submit"
          className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
        >
          Save changes
        </button>
      </form>
    </article>
  );
}

export function SessionDetailReadOnly({
  session,
}: {
  session: MatchSession;
}) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-[#191612] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.25)]">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-200/60">Session detail</p>
        <h3 className="mt-2 text-3xl font-semibold text-white">{formatDate(session.playedOn)}</h3>
        <p className="mt-2 text-sm text-stone-300">
          {session.attendeeCount} players · {formatMoney(session.sharePerPlayer)} each · {formatMoney(session.courtCost)} total
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
          <p className="text-sm text-stone-400">Court rent</p>
          <p className="mt-2 text-xl font-semibold text-white">{formatMoney(session.courtCost)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
          <p className="text-sm text-stone-400">Players</p>
          <p className="mt-2 text-xl font-semibold text-white">{session.attendeeCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
          <p className="text-sm text-stone-400">Per player</p>
          <p className="mt-2 text-xl font-semibold text-white">{formatMoney(session.sharePerPlayer)}</p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-stone-300">Players in this match</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {session.attendeeNames.map((attendeeName) => (
            <span
              key={attendeeName}
              className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-stone-300"
            >
              <span className="text-stone-100">{attendeeName}</span>
              <span className="ml-2 text-amber-200">{formatMoney(session.sharePerPlayer)}</span>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function MonthFilter({
  monthOptions,
  selectedMonth,
}: {
  monthOptions: Array<{ key: string; label: string }>;
  selectedMonth: string;
}) {
  return (
    <form>
      <label className="space-y-2 text-sm">
        <span className="block font-medium text-stone-300">Month</span>
        <select
          name="month"
          defaultValue={selectedMonth}
          className="w-full rounded-full border border-white/10 bg-stone-950/70 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-300/60"
        >
          {monthOptions.length > 0 ? (
            monthOptions.map((month) => (
              <option key={month.key} value={month.key}>
                {month.label}
              </option>
            ))
          ) : (
            <option value={selectedMonth}>{getMonthTitle(selectedMonth)}</option>
          )}
        </select>
      </label>
      <button
        type="submit"
        className="mt-3 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-stone-200 transition hover:border-amber-300/40 hover:text-white"
      >
        View month
      </button>
    </form>
  );
}
