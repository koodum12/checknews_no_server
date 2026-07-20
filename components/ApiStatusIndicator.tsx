"use client";

import { useEffect, useState } from "react";
import { checkServerHealth } from "@/lib/api";

type Status = "checking" | "online" | "offline";

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    checkServerHealth().then((ok) => setStatus(ok ? "online" : "offline"));
  }, []);

  const dot =
    status === "online"
      ? "bg-emerald-400"
      : status === "offline"
      ? "bg-amber-400"
      : "bg-gray-300 animate-pulse";

  const label =
    status === "online"
      ? "서버 연결됨"
      : status === "offline"
      ? "Mock 모드"
      : "확인 중…";

  return (
    <div className="flex items-center gap-2 px-2">
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
