import { createSession } from "../actions";
import { EmptyState, MemberCheckboxGrid, SectionCard, SessionSummaryCard } from "../_components/club-ui";
import { getTodayDateValue } from "../_lib/format";
import { getSessionsData } from "../../lib/db";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const data = await getSessionsData();

  return (
    <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
      <SectionCard
        eyebrow="New session"
        title="Create a match"
        description="Add the match date, court rent, and players who joined. Attendance editing happens inside each session detail page after creation."
      >
        <form action={createSession} className="space-y-5">
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
                className="w-full rounded-2xl border border-white/10 bg-stone-950/70 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-300/60"
              />
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-stone-300">Players who joined</p>
            {data.activeMembers.length === 0 ? (
              <EmptyState>Create at least one active member before saving a session.</EmptyState>
            ) : (
              <MemberCheckboxGrid members={data.activeMembers} />
            )}
          </div>

          <button
            type="submit"
            className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
          >
            Save session
          </button>
        </form>
      </SectionCard>

      <SectionCard
        eyebrow="Session history"
        title="Saved matches"
        description="Open any session to edit attendance, adjust cost, or delete the record. This screen stays list-focused."
      >
        {data.sessions.length === 0 ? (
          <EmptyState>No match saved yet. Use the form on the left to create the first one.</EmptyState>
        ) : (
          <div className="space-y-5">
            {data.sessions.map((session) => (
              <SessionSummaryCard key={session.id} session={session} href={`/sessions/${session.id}`} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
