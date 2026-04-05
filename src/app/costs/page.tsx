import { EmptyState, MonthlyAttendanceChart, SectionCard } from "../_components/club-ui";
import { MonthFilter } from "../_components/month-filter";
import { getMonthTitle } from "../_lib/format";
import { getCostsData } from "../../lib/db";

export const dynamic = "force-dynamic";

type CostsPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

export default async function CostsPage({ searchParams }: CostsPageProps) {
  const resolvedSearchParams = await searchParams;
  const data = await getCostsData(resolvedSearchParams.month);
  const monthTitle = getMonthTitle(data.selectedMonth);

  return (
    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard
        eyebrow="Cost review"
        title={monthTitle}
        description="This screen is read-focused. Use it to review monthly splits without mixing in member and session editing controls."
        actions={<MonthFilter monthOptions={data.monthOptions} selectedMonth={data.selectedMonth} />}
      >
        {data.monthlyTotals.length === 0 ? (
          <EmptyState>The monthly breakdown will appear after you save your first session.</EmptyState>
        ) : (
          <MonthlyAttendanceChart members={data.monthlyTotals} monthTitle={monthTitle} />
        )}
      </SectionCard>

      <SectionCard
        eyebrow="Member totals"
        title="Expense split by player"
        description="Each amount reflects the court cost divided evenly among players who attended each session in the selected month."
      >
        {data.monthlyTotals.length === 0 ? (
          <EmptyState>No costs to review for this month yet.</EmptyState>
        ) : (
          <div className="space-y-3">
            {data.monthlyTotals.map((member) => (
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
        )}
      </SectionCard>
    </div>
  );
}
