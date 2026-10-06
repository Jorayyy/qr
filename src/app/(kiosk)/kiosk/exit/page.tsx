import { KioskStation } from "@/components/kiosk-station";

export default function KioskExitPage() {
  return (
    <KioskStation
      title="Exit Scan"
      subtitle="Scan your QR code once to check out when leaving the campus."
      action="checkout"
      confirmLabel="Check Out Now"
      successMessage="Checked out. Thank you for visiting."
    />
  );
}
