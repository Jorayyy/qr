"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Renders a QR that points at the visitor guide, built from the live origin so
 * it always matches the domain the site is served from.
 */
export function VisitQr({ path = "/visit", className }: { path?: string; className?: string }) {
  const [dataUrl, setDataUrl] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const target = `${window.location.origin}${path}`;
    QRCode.toDataURL(target, {
      width: 320,
      margin: 2,
      color: { dark: "#700000", light: "#ffffff" },
    }).then((data) => {
      setUrl(target);
      setDataUrl(data);
    });
  }, [path]);

  return (
    <div className={className}>
      <div className="mx-auto flex w-fit items-center justify-center rounded-2xl border-2 border-[var(--brand)] bg-white p-4 shadow-lg">
        {dataUrl ? (
          <img src={dataUrl} alt="QR code linking to the visitor guide" width={320} height={320} className="h-56 w-56 sm:h-64 sm:w-64" />
        ) : (
          <div className="h-56 w-56 animate-pulse rounded-lg bg-slate-100 sm:h-64 sm:w-64" />
        )}
      </div>
      {url ? <p className="mt-3 break-all text-center font-mono text-xs text-[var(--muted)]">{url}</p> : null}
    </div>
  );
}
