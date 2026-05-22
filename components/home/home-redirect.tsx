"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";

export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (pb.authStore.isValid) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}
