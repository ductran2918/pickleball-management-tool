import {
  addMember,
  createSession,
  deleteSession,
  setMemberActive,
  updateMemberName,
  updateSession,
} from "./actions";
import { getDashboardData, type MatchSession, type Member, type MonthlyMemberTotal } from "../lib/db";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getMonthTitle(monthKey: string) {
  const [yearString, monthString] = monthKey.split("-");
  const year = Number(yearString);
  const month = Number(monthString);

  if (!year || !month) {
    return "Selected month";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function getTodayDateValue() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function renderMemberCheckboxes(members: Member[], selectedIds: number[] = []) {
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

function MonthlyAttendanceChart({
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
    <div className="mt-6 rounded-[2rem] border border-white/10 bg-stone-950/45 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-stone-400">Attendance chart</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Matches played per member in {monthTitle}</h3>
        </div>
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
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(251,191,36,0.7),rgba(245,158,11,0.95))] transition-[width]"
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

function SessionEditor({
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
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/60">Match</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{formatDate(session.playedOn)}</h3>
          <p className="mt-2 text-sm text-stone-300">
            {session.attendeeCount} players · {formatMoney(session.sharePerPlayer)} each
          </p>
          {session.attendeeNames.length > 0 ? (
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
          ) : (
            <p className="mt-3 text-sm text-stone-400">No players yet</p>
          )}
        </div>
        <form action={deleteSession}>
          <input type="hidden" name="sessionId" value={session.id} />
          <button
            type="submit"
            className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-300 hover:bg-rose-400/10"
          >
            Delete
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
          {renderMemberCheckboxes(allMembers, session.attendeeIds)}
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

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const data = await getDashboardData(resolvedSearchParams.month);
  const allMembers = [...data.activeMembers, ...data.archivedMembers];

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.25),transparent_35%),linear-gradient(135deg,#1d180f,#0d0b09_60%,#1a1308)] px-6 py-8 shadow-[0_40px_120px_rgba(0,0,0,0.4)] sm:px-10 sm:py-10">
          <p className="text-sm uppercase tracking-[0.4em] text-amber-200/70">Pickleball Club Admin</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Track attendance after each match and let the app split the court cost for you.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-stone-300">
                Add members once, select who joined a match, enter the court rent, and the monthly totals are
                calculated automatically.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[2rem] border border-white/10 bg-white/8 p-5">
                <p className="text-sm text-stone-400">Active members</p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.activeMembers.length}</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/8 p-5">
                <p className="text-sm text-stone-400">Matches saved</p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.sessions.length}</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/8 p-5">
                <p className="text-sm text-stone-400">Month view</p>
                <p className="mt-2 text-2xl font-semibold text-white">{getMonthTitle(data.selectedMonth)}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <section className="rounded-[2.25rem] border border-white/10 bg-[#14110e] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-8">
              <div className="flex flex-col gap-2">
                <p className="text-sm uppercase tracking-[0.3em] text-amber-200/60">Members</p>
                <h2 className="text-2xl font-semibold text-white">Club roster</h2>
              </div>

              <form action={addMember} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  name="name"
                  placeholder="Add a new member"
                  className="flex-1 rounded-full border border-white/10 bg-stone-950/70 px-5 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300/60"
                />
                <button
                  type="submit"
                  className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
                >
                  Add member
                </button>
              </form>

              <div className="mt-6 space-y-3">
                {data.activeMembers.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
                    Add your club members first. They will appear here and in the attendance form below.
                  </p>
                ) : (
                  data.activeMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <form action={updateMemberName} className="flex flex-1 flex-col gap-3 sm:flex-row">
                        <input type="hidden" name="memberId" value={member.id} />
                        <input
                          type="text"
                          name="name"
                          defaultValue={member.name}
                          className="flex-1 rounded-full border border-white/10 bg-stone-950/70 px-4 py-2.5 text-sm text-stone-100 outline-none transition focus:border-amber-300/60"
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-amber-300/30 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:border-amber-300 hover:bg-amber-300/10"
                        >
                          Save name
                        </button>
                      </form>
                      <form action={setMemberActive}>
                        <input type="hidden" name="memberId" value={member.id} />
                        <input type="hidden" name="nextState" value="archived" />
                        <button
                          type="submit"
                          className="rounded-full border border-white/10 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-300/40 hover:text-white"
                        >
                          Archive
                        </button>
                      </form>
                    </div>
                  ))
                )}
              </div>

              {data.archivedMembers.length > 0 ? (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <h3 className="text-sm font-medium uppercase tracking-[0.25em] text-stone-500">Archived members</h3>
                  <div className="mt-4 space-y-3">
                    {data.archivedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-stone-950/50 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <form action={updateMemberName} className="flex flex-1 flex-col gap-3 sm:flex-row">
                          <input type="hidden" name="memberId" value={member.id} />
                          <input
                            type="text"
                            name="name"
                            defaultValue={member.name}
                            className="flex-1 rounded-full border border-white/10 bg-stone-950/70 px-4 py-2.5 text-sm text-stone-100 outline-none transition focus:border-amber-300/60"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-amber-300/30 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:border-amber-300 hover:bg-amber-300/10"
                          >
                            Save name
                          </button>
                        </form>
                        <form action={setMemberActive}>
                          <input type="hidden" name="memberId" value={member.id} />
                          <input type="hidden" name="nextState" value="active" />
                          <button
                            type="submit"
                            className="rounded-full border border-emerald-400/20 px-4 py-2 text-sm text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-400/10"
                          >
                            Reactivate
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-[2.25rem] border border-white/10 bg-[#14110e] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-8">
              <div className="flex flex-col gap-2">
                <p className="text-sm uppercase tracking-[0.3em] text-amber-200/60">Attendance</p>
                <h2 className="text-2xl font-semibold text-white">Save a new match</h2>
              </div>

              <form action={createSession} className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-300">Match date</span>
                    <input
                      type="date"
                      name="playedOn"
                      defaultValue={getTodayDateValue()}
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
                      defaultValue="515"
                      className="w-full rounded-2xl border border-white/10 bg-stone-950/70 px-4 py-3 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300/60"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-stone-300">Players who joined</p>
                  {data.activeMembers.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
                      Create at least one active member before saving a match.
                    </p>
                  ) : (
                    renderMemberCheckboxes(data.activeMembers)
                  )}
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
                >
                  Save match
                </button>
              </form>
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-[2.25rem] border border-white/10 bg-[#14110e] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-amber-200/60">Monthly totals</p>
                  <h2 className="text-2xl font-semibold text-white">{getMonthTitle(data.selectedMonth)}</h2>
                </div>
                <form className="sm:min-w-52">
                  <label className="space-y-2 text-sm">
                    <span className="block font-medium text-stone-300">Month</span>
                    <select
                      name="month"
                      defaultValue={data.selectedMonth}
                      className="w-full rounded-full border border-white/10 bg-stone-950/70 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-300/60"
                    >
                      {data.monthOptions.length > 0 ? (
                        data.monthOptions.map((month) => (
                          <option key={month.key} value={month.key}>
                            {month.label}
                          </option>
                        ))
                      ) : (
                        <option value={data.selectedMonth}>{getMonthTitle(data.selectedMonth)}</option>
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
              </div>

              <div className="mt-6 space-y-3">
                {data.monthlyTotals.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
                    The monthly summary will appear after you save your first match.
                  </p>
                ) : (
                  <>
                    <MonthlyAttendanceChart
                      members={data.monthlyTotals}
                      monthTitle={getMonthTitle(data.selectedMonth)}
                    />
                    {data.monthlyTotals.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/6 px-4 py-4"
                      >
                        <div>
                          <p className="font-medium text-stone-100">{member.name}</p>
                          <p className="mt-1 text-sm text-stone-400">{member.sessionsJoined} matches joined</p>
                        </div>
                        <p className="text-lg font-semibold text-amber-200">{formatMoney(member.totalExpense)}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </section>

            <section className="rounded-[2.25rem] border border-white/10 bg-[#14110e] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-8">
              <div className="flex flex-col gap-2">
                <p className="text-sm uppercase tracking-[0.3em] text-amber-200/60">History</p>
                <h2 className="text-2xl font-semibold text-white">Saved matches</h2>
              </div>

              <div className="mt-6 space-y-5">
                {data.sessions.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
                    No match saved yet. Use the attendance form to create the first one.
                  </p>
                ) : (
                  data.sessions.map((session) => (
                    <SessionEditor key={session.id} session={session} allMembers={allMembers} />
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
