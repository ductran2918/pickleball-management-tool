import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import Link from "next/link";

import { AppNavigation } from "./_components/app-navigation";
import { logoutAdmin } from "./auth-actions";
import { getAdminAccountName, isAdminAuthenticated } from "./_lib/auth";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Pickleblall D7 Club",
  description: "Manage sessions, members, and costs for Pickleblall D7 Club.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAdmin = await isAdminAuthenticated();

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${plexMono.variable} antialiased`}>
        <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <header className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.2),transparent_32%),linear-gradient(135deg,#1d180f,#0d0b09_62%,#1a1308)] px-6 py-7 shadow-[0_40px_120px_rgba(0,0,0,0.35)] sm:px-8 sm:py-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.4em] text-amber-200/70">Pickleblall D7 Club</p>
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <AppNavigation />
                  {isAdmin ? (
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-emerald-100">
                        Admin: {getAdminAccountName()}
                      </span>
                      <form action={logoutAdmin}>
                        <button
                          type="submit"
                          className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-stone-200 transition hover:border-amber-300/40 hover:text-white"
                        >
                          Log out
                        </button>
                      </form>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-stone-200 transition hover:border-amber-300/40 hover:text-white"
                    >
                      Admin login
                    </Link>
                  )}
                </div>
              </div>
            </header>

            <main className="mt-8 pb-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
