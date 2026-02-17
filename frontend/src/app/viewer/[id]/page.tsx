"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { MaterialPanel } from "@/components/viewer/material-panel";
import { Toolbar } from "@/components/viewer/toolbar";
import { ExportDialog } from "@/components/viewer/export-dialog";
import { ShareDialog } from "@/components/viewer/share-dialog";
import { CommentsDialog } from "@/components/viewer/comments-dialog";
import { useViewerStore } from "@/hooks/use-viewer";
import type { Model3D } from "@/types";
import { ArrowLeft, Share2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const Scene = dynamic(
  () => import("@/components/viewer/scene").then((mod) => mod.Scene),
  { ssr: false }
);

export default function ViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [model, setModel] = useState<Model3D | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMaterials, setShowMaterials] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const setSelectedMesh = useViewerStore((s) => s.setSelectedMesh);

  useEffect(() => {
    fetch(`/api/models/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setModel(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleScreenshot = useCallback(() => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${model?.name || "model"}-screenshot.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [model]);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Model not found</p>
      </div>
    );
  }

  if (model.processingStatus !== "COMPLETED" || !model.glbFileUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {model.processingStatus === "FAILED" ? (
          <p className="text-destructive">Processing failed: {model.processingError}</p>
        ) : (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Model is being processed...</p>
          </>
        )}
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Main viewer area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button size="icon" variant="ghost">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold">{model.name}</h1>
              <p className="text-xs text-muted-foreground">
                {model.vertexCount?.toLocaleString()} vertices &middot;{" "}
                {model.faceCount?.toLocaleString()} faces
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" variant="outline" onClick={() => setShowShare(true)}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowComments(true)}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Comments
            </Button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div ref={containerRef} className="flex-1 relative">
          <Scene
            glbUrl={model.glbFileUrl}
            onMeshClick={(name) => {
              setSelectedMesh(name);
              setShowMaterials(true);
            }}
          />
          <Toolbar
            onScreenshot={handleScreenshot}
            onExport={() => setShowExport(true)}
            onFullscreen={handleFullscreen}
          />
        </div>
      </div>

      {/* Right sidebar - Material Panel */}
      {showMaterials && (
        <div className="w-72 border-l bg-background overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Materials</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowMaterials(false)}
            >
              Close
            </Button>
          </div>
          <MaterialPanel />
        </div>
      )}

      {/* Dialogs */}
      <ExportDialog
        open={showExport}
        onOpenChange={setShowExport}
        modelId={model.id}
      />
      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        modelId={model.id}
      />
      <CommentsDialog
        open={showComments}
        onOpenChange={setShowComments}
        modelId={model.id}
      />
    </div>
  );
}
