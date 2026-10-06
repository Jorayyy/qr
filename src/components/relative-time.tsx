"use client";

import { useEffect, useState } from "react";

function formatRelative(target: Date): string {
  const deltaMs = Date.now() - target.getTime();
  const past = deltaMs >= 0;
  const abs = Math.abs(deltaMs);
  const minutes = Math.floor(abs / 60_000);

  let phrase: string;
  if (minutes < 1) return "just now";
  if (minutes < 60) phrase = `${minutes} min`;
  else {
    const hours = Math.floor(minutes / 60);
    if (hours < 24) phrase = `${hours} hr`;
    else {
      const days = Math.floor(hours / 24);
      phrase = `${days} day${days === 1 ? "" : "s"}`;
    }
  }
  return past ? `${phrase} ago` : `in ${phrase}`;
}

function absoluteTitle(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "12 min ago" with the exact timestamp in the tooltip; ticks once a minute. */
export function RelativeTime({
  value,
  className,
}: {
  value: string | Date | null | undefined;
  className?: string;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!value) return <span className={className}>—</span>;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span className={className}>—</span>;

  return (
    <time
      dateTime={date.toISOString()}
      title={absoluteTitle(date)}
      suppressHydrationWarning
      className={className}
    >
      {formatRelative(date)}
    </time>
  );
}
