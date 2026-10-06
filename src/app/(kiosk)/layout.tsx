import { KioskIdleReset } from "@/components/KioskIdleReset";

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <KioskIdleReset />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
