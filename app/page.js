import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center gap-4 px-8" style={{ background: "#111318" }}>
      <h1 className="text-2xl font-semibold" style={{ color: "#F5F5F0" }}>Rideshare</h1>
      <p className="text-sm mb-4" style={{ color: "#7A7F8A" }}>Choose an app</p>
      <Link href="/rider" prefetch={false} className="w-full max-w-xs text-center py-3.5 rounded-xl font-medium" style={{ background: "#6C5CE7", color: "#111318" }}>
        Rider app
      </Link>
      <Link href="/driver" prefetch={false} className="w-full max-w-xs text-center py-3.5 rounded-xl font-medium" style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }}>
        Driver app
      </Link>
      <Link href="/admin" prefetch={false} className="w-full max-w-xs text-center py-3.5 rounded-xl font-medium" style={{ background: "#1D2028", color: "#F5F5F0", border: "1px solid #2B2F3A" }}>
        Admin dashboard
      </Link>
    </div>
  );
}
