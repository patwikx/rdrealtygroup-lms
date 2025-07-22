"use client";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import React from "react";

/**
 * This component wraps the application with the NextAuth SessionProvider.
 * By accepting an initial `session` prop from a Server Component,
 * it provides the session data to the client-side immediately on page load.
 * This avoids a client-side fetch and ensures the UI is always in sync.
 */
export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
