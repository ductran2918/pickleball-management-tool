import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState, ReadOnlyNotice, SectionCard, SessionDetailReadOnly, SessionEditor } from "../../_components/club-ui";
import { isAdminAuthenticated } from "../../_lib/auth";
import { formatDate } from "../../_lib/format";
import { getSessionDetailData } from "../../../lib/db";

export const dynamic = "force-dynamic";

type SessionDetailPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const resolvedParams = await params;
  const sessionId = Number(resolvedParams.sessionId);

  if (!Number.isInteger(sessionId)) {
    notFound();
  }

  const data = await getSessionDetailData(sessionId);
  const isAdmin = await isAdminAuthenticated();

  if (!data.session) {
    notFound();
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.7fr_1.3fr]">
      <SectionCard
        eyebrow="Session detail"
        title={formatDate(data.session.playedOn)}
        description="Attendance belongs to the session record, so this page keeps the full edit flow in one place."
      >
        <div className="space-y-4">
          <Link
            href="/sessions"
            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-stone-200 transition hover:border-amber-300/40 hover:text-white"
          >
            Back to sessions
          </Link>

          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-stone-400">What you can edit here</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-300">
              <li>Date of play for the match.</li>
              <li>Court rent used for the split.</li>
              <li>Attendance checklist for every player in the session.</li>
              <li>Deletion when a session was saved by mistake.</li>
            </ul>
          </div>

          {data.activeMembers.length === 0 ? (
            <EmptyState>There are no active members right now, but archived members can still be preserved in old session records.</EmptyState>
          ) : null}
          {!isAdmin ? (
            <ReadOnlyNotice>Guest mode is read-only. Admin sign-in is required to edit attendance or session cost.</ReadOnlyNotice>
          ) : null}
        </div>
      </SectionCard>

      {isAdmin ? (
        <SessionEditor session={data.session} allMembers={data.allMembers} />
      ) : (
        <SessionDetailReadOnly session={data.session} />
      )}
    </div>
  );
}
