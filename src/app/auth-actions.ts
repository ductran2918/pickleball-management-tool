"use server";

import { redirect } from "next/navigation";

import {
  clearAdminSession,
  setAdminSession,
  validateAdminCredentials,
} from "./_lib/auth";

function getTrimmedString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAdmin(formData: FormData) {
  const account = getTrimmedString(formData.get("account"));
  const password = getTrimmedString(formData.get("password"));

  if (!(await validateAdminCredentials(account, password))) {
    redirect("/login?error=1");
  }

  await setAdminSession();
  redirect("/members");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/");
}
