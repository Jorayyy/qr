import { KioskStation } from "@/components/kiosk-station";

export default async function KioskExitPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;

  return (
    <KioskStation
      key={reset ?? "exit"}
      title="Exit Scan"
      subtitle="Scan your QR code once to check out when leaving the campus."
      action="checkout"
      confirmLabel="Check Out Now"
      successMessage="Checked out. Thank you for visiting."
    />
  );
}
