"use client";

import { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";
import type { Model3D } from "@/types";

const Scene = dynamic(
  () => import("@/components/viewer/scene").then((mod) => mod.Scene),
  { ssr: false }
);

export default function EmbedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [model, setModel] = useState<Model3D | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Resolve share link to model
    fetch(`/api/embed/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Invalid share link");
        return r.json();
      })
      .then(setModel)
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#111]">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!model || !model.glbFileUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#111]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <Scene glbUrl={model.glbFileUrl} />
      <div className="absolute bottom-2 right-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Powered by iJewel
        </a>
      </div>
    </div>
  );
}
