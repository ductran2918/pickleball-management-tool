import Link from "next/link";

import {
  EmptyState,
  MonthlyAttendanceChart,
  SectionCard,
  SessionSummaryCard,
  StatCard,
} from "./_components/club-ui";
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
  const monthlyTotalExpense = data.monthlyTotals.reduce((sum, member) => sum + member.totalExpense, 0);
  const recentSessions = data.sessions.slice(0, 4);
  const topMembers = data.monthlyTotals.slice(0, 5);

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

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active members" value={data.activeMembers.length} />
            <StatCard label="Matches saved" value={data.sessions.length} />
            <StatCard label="Month view" value={monthTitle} />
            <StatCard label="Tracked cost this month" value={new Intl.NumberFormat("vi-VN").format(monthlyTotalExpense)} />
          </div>
        </div>
      </section>

      <div className="grid gap-8">
        <SectionCard eyebrow="Current month" title={monthTitle}>
          {data.monthlyTotals.length === 0 ? (
            <EmptyState>The monthly snapshot will appear after you save your first session.</EmptyState>
          ) : (
            <div className="space-y-5">
              <MonthlyAttendanceChart members={data.monthlyTotals} monthTitle={monthTitle} />
              <div className="space-y-3">
                {topMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/6 px-4 py-4"
                  >
                    <div>
                      <p className="font-medium text-stone-100">{member.name}</p>
                      <p className="mt-1 text-sm text-stone-400">{member.sessionsJoined} matches joined</p>
                    </div>
                    <p className="text-lg font-semibold text-amber-200">
                      {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(member.totalExpense)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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
