import { addMember, setMemberActive, updateMemberName } from "../actions";
import { EmptyState, SectionCard } from "../_components/club-ui";
import { getMembersData } from "../../lib/db";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const data = await getMembersData();

  return (
    <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
      <SectionCard
        eyebrow="Members"
        title="Club roster"
        description="Keep the player list clean here. This screen is only for member management so names and status changes stay easy to scan."
      >
        <form action={addMember} className="flex flex-col gap-3 sm:flex-row">
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
            <EmptyState>Add your club members first. They will appear here and become available in session attendance.</EmptyState>
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
      </SectionCard>

      <SectionCard
        eyebrow="Archive"
        title="Inactive members"
        description="Archived members stay out of new attendance forms but can be restored anytime."
      >
        {data.archivedMembers.length === 0 ? (
          <EmptyState>No archived members right now.</EmptyState>
        ) : (
          <div className="space-y-3">
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
        )}
      </SectionCard>
    </div>
  );
}
