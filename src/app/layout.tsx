import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import { AppNavigation } from "./_components/app-navigation";

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
  title: "Pickleball Club Admin",
  description: "Track attendance, split court rent, and review monthly member expenses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${plexMono.variable} antialiased`}>
        <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <header className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.2),transparent_32%),linear-gradient(135deg,#1d180f,#0d0b09_62%,#1a1308)] px-6 py-7 shadow-[0_40px_120px_rgba(0,0,0,0.35)] sm:px-8 sm:py-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.4em] text-amber-200/70">Pickleball Club Admin</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Run members, sessions, and costs in separate lanes.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">
                    Navigate the club like an operations board instead of one long form. Members live in one place,
                    attendance belongs to each session, and the money view stays focused.
                  </p>
                </div>
                <AppNavigation />
              </div>
            </header>

            <main className="mt-8 pb-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
