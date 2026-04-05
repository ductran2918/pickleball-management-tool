import Link from "next/link";

import {
  EmptyState,
  MonthlyAttendanceChart,
  SectionCard,
  SessionSummaryCard,
  StatCard,
} from "./_components/club-ui";
import { MonthFilter } from "./_components/month-filter";
import { getMonthTitle } from "./_lib/format";
import { getOverviewData } from "../lib/db";

export const dynamic = "force-dynamic";

type OverviewPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const resolvedSearchParams = await searchParams;
  const data = await getOverviewData(resolvedSearchParams.month);
  const monthTitle = getMonthTitle(data.selectedMonth);
  const selectedYear = data.selectedMonth.slice(0, 4);
  const matchesPlayedThisYear = data.sessions.filter((session) => session.playedOn.startsWith(`${selectedYear}-`)).length;
  const recentSessions = data.sessions.slice(0, 4);

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.25),transparent_35%),linear-gradient(135deg,#1d180f,#0d0b09_60%,#1a1308)] px-6 py-8 shadow-[0_40px_120px_rgba(0,0,0,0.4)] sm:px-10 sm:py-10">
        <div className="max-w-6xl">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-200/70">Welcome</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Welcome to Pickleblall D7 Club
            </h2>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/sessions"
                className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
              >
                Create session
              </Link>
              <Link
                href="/members"
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-stone-200 transition hover:border-amber-300/40 hover:text-white"
              >
                Manage members
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:max-w-3xl">
            <StatCard label="Active members" value={data.activeMembers.length} />
            <StatCard label={`Matches played in ${selectedYear}`} value={matchesPlayedThisYear} />
          </div>
        </div>
      </section>

      <div className="grid gap-8">
        <SectionCard
          eyebrow="Monthly overview"
          title={monthTitle}
          actions={
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <MonthFilter monthOptions={data.monthOptions} selectedMonth={data.selectedMonth} inline />
              <Link
                href={`/costs?month=${data.selectedMonth}`}
                className="inline-flex rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
              >
                View club data by month
              </Link>
            </div>
          }
        >
          {data.monthlyTotals.length === 0 ? (
            <EmptyState>The monthly snapshot will appear after you save your first session.</EmptyState>
          ) : (
            <MonthlyAttendanceChart members={data.monthlyTotals} monthTitle={monthTitle} />
          )}
        </SectionCard>
      </div>

      <SectionCard eyebrow="Recent sessions" title="Latest match records">
        {recentSessions.length === 0 ? (
          <EmptyState>No match saved yet. Start in the Sessions tab to create the first one.</EmptyState>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {recentSessions.map((session) => (
              <SessionSummaryCard key={session.id} session={session} href={`/sessions/${session.id}`} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
