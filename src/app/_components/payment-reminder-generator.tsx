"use client";

import { useState } from "react";

import { formatMoney } from "../_lib/format";
import type { MonthlyMemberTotal } from "../../lib/db";

type PaymentReminderGeneratorProps = {
  monthTitle: string;
  monthlyTotals: MonthlyMemberTotal[];
};

type ReminderPreset = {
  key: string;
  label: string;
  message: string;
};

const SPECIAL_CASE_NAMES = ["Chị Nam Trân", "Nam Phương"] as const;

function buildMessage(monthTitle: string, playerName: string, totalCost: number, closingName = playerName) {
  return `Cho em tổng kết chi phí pickleball tháng ${monthTitle} của "${playerName}" là ${formatMoney(totalCost)}. Em tổng kết ở link này ạ: https://pickleball-d7-club.vercel.app/costs Số tài khoản của em là 054611 - ngân hàng VIB (NH Quốc tế) ạ. Thanks, ${closingName}.`;
}

export function PaymentReminderGenerator({
  monthTitle,
  monthlyTotals,
}: PaymentReminderGeneratorProps) {
  const memberPresets: ReminderPreset[] = monthlyTotals.map((member) => ({
    key: `member-${member.id}`,
    label: member.name,
    message: buildMessage(monthTitle, member.name, member.totalExpense),
  }));

  const combinedMembers = monthlyTotals.filter((member) =>
    SPECIAL_CASE_NAMES.includes(member.name as (typeof SPECIAL_CASE_NAMES)[number]),
  );
  const combinedTotal = combinedMembers.reduce((sum, member) => sum + member.totalExpense, 0);
  const combinedPreset =
    combinedMembers.length > 0
      ? {
          key: "special-case",
          label: "Chị Nam Trân + Nam Phương",
          message: buildMessage(monthTitle, "Chị Nam Trân + Nam Phương", combinedTotal, "anh Tri"),
        }
      : null;

  const presets = combinedPreset ? [...memberPresets, combinedPreset] : memberPresets;
  const [selectedKey, setSelectedKey] = useState(presets[0]?.key ?? "");
  const [copied, setCopied] = useState(false);

  const selectedPreset = presets.find((preset) => preset.key === selectedKey) ?? presets[0] ?? null;

  async function copyMessage() {
    if (!selectedPreset) {
      return;
    }

    await navigator.clipboard.writeText(selectedPreset.message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (!selectedPreset) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm leading-6 text-stone-400">
        Add members and monthly costs first to generate reminder messages.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        {presets.map((preset) => {
          const isActive = preset.key === selectedPreset.key;

          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => setSelectedKey(preset.key)}
              className={[
                "rounded-full px-4 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-amber-300 text-stone-950 shadow-[0_12px_30px_rgba(251,191,36,0.22)]"
                  : "border border-white/10 bg-white/6 text-stone-200 hover:border-amber-300/40 hover:text-white",
              ].join(" ")}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-stone-950/40 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-stone-200">Generated reminder</p>
            <p className="mt-1 text-sm text-stone-400">Click a name above to switch the message instantly.</p>
          </div>
          <button
            type="button"
            onClick={() => void copyMessage()}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-stone-200 transition hover:border-amber-300/40 hover:text-white"
          >
            {copied ? "Copied" : "Copy message"}
          </button>
        </div>

        <textarea
          readOnly
          value={selectedPreset.message}
          className="mt-4 min-h-40 w-full rounded-[1.5rem] border border-white/10 bg-[#14110e] px-4 py-4 text-sm leading-7 text-stone-200 outline-none"
        />
      </div>
    </div>
  );
}
