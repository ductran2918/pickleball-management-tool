import { redirect } from "next/navigation";

import { loginAdmin } from "../auth-actions";
import { isAdminAuthenticated } from "../_lib/auth";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isAdminAuthenticated()) {
    redirect("/members");
  }

  const resolvedSearchParams = await searchParams;
  const hasError = resolvedSearchParams.error === "1";

  return (
    <section className="mx-auto max-w-xl rounded-[2.25rem] border border-white/10 bg-[#14110e] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-8">
      <p className="text-sm uppercase tracking-[0.3em] text-amber-200/60">Admin access</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">Sign in</h1>

      {hasError ? (
        <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          Incorrect admin account or password.
        </p>
      ) : null}

      <form action={loginAdmin} className="mt-6 space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-300">Admin account</span>
          <input
            type="text"
            name="account"
            className="w-full rounded-2xl border border-white/10 bg-stone-950/70 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-300/60"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-300">Password</span>
          <input
            type="password"
            name="password"
            className="w-full rounded-2xl border border-white/10 bg-stone-950/70 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-300/60"
          />
        </label>

        <button
          type="submit"
          className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
        >
          Sign in as admin
        </button>
      </form>
    </section>
  );
}
