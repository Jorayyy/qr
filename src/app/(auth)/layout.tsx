import { Backdrop } from "@/components/public-shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden py-8">
      <Backdrop />
      <div className="relative z-10 w-full max-w-sm px-4">
        {children}
      </div>
    </div>
  );
}
