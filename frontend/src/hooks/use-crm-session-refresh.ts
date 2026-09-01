"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/providers/auth-provider";

/** Refresh /auth/me once per mount so manager flags and employeeId stay current. */
export function useCrmSessionRefresh(): void {
  const { user, refreshUser } = useAuth();
  const refreshed = useRef(false);

  useEffect(() => {
    if (!user || refreshed.current) return;
    refreshed.current = true;
    void refreshUser();
  }, [user, refreshUser]);
}
