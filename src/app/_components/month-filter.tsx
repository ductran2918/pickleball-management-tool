"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";

import { getMonthTitle } from "../_lib/format";

type MonthFilterProps = {
  monthOptions: Array<{ key: string; label: string }>;
  selectedMonth: string;
  inline?: boolean;
  label?: string;
};

export function MonthFilter({
  monthOptions,
  selectedMonth,
  inline = false,
  label = "Month",
}: MonthFilterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleMonthChange(nextMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextMonth);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <label className={inline ? "flex items-center gap-3 text-sm" : "space-y-2 text-sm"}>
      <span className="block font-medium text-stone-300">{label}</span>
      <select
        name="month"
        value={selectedMonth}
        onChange={(event) => handleMonthChange(event.target.value)}
        className="w-full rounded-full border border-white/10 bg-stone-950/70 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-300/60"
        aria-label={label}
      >
        {monthOptions.length > 0 ? (
          monthOptions.map((month) => (
            <option key={month.key} value={month.key}>
              {month.label}
            </option>
          ))
        ) : (
          <option value={selectedMonth}>{getMonthTitle(selectedMonth)}</option>
        )}
      </select>
    </label>
  );
}
