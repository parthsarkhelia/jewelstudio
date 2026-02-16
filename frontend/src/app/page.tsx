import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary">
      <div className="mx-auto max-w-4xl text-center px-4">
        <h1 className="text-6xl font-bold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
            iJewel
          </span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Upload, view, and share 3D jewelry models with stunning realistic
          materials. Customize metals, gemstones, and export in any format.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center rounded-md border border-border px-8 py-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Explore Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}
