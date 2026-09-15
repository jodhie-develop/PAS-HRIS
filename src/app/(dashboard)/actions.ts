"use server";

import { signOut as sharedSignOut } from "@/lib/auth-actions";

export async function signOut() {
  await sharedSignOut();
}
