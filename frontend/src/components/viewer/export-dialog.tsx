"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/lib/utils";
import { Loader2, Download, CheckCircle, AlertCircle } from "lucide-react";

const EXPORT_FORMATS = [
  { value: "obj", label: "OBJ (.obj)" },
  { value: "stl", label: "STL (.stl)" },
  { value: "ply", label: "PLY (.ply)" },
  { value: "glb", label: "GLB (.glb)" },
  { value: "gltf", label: "glTF (.gltf)" },
];

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: string;
  token: string;
}

export function ExportDialog({ open, onOpenChange, modelId, token }: ExportDialogProps) {
  const [format, setFormat] = useState("stl");
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setStatus("processing");
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model_id: modelId, target_format: format }),
      });

      if (!res.ok) throw new Error("Failed to start conversion");

      const data = await res.json();
      const jobId = data.job_id;

      // Poll
      const poll = async () => {
        const statusRes = await fetch(`${BACKEND_URL}/api/v1/convert/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statusData = await statusRes.json();

        if (statusData.status === "COMPLETED") {
          setDownloadUrl(statusData.download_url);
          setStatus("done");
        } else if (statusData.status === "FAILED") {
          setError(statusData.error || "Conversion failed");
          setStatus("error");
        } else {
          setTimeout(poll, 2000);
        }
      };
      poll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Model</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {EXPORT_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {status === "processing" && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Converting...
            </div>
          )}

          {status === "done" && downloadUrl && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" />
              Ready!
              <a
                href={downloadUrl}
                download
                className="ml-auto underline"
              >
                Download
              </a>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            {status === "done" && downloadUrl ? (
              <Button asChild className="flex-1">
                <a href={downloadUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            ) : (
              <Button
                onClick={handleExport}
                disabled={status === "processing"}
                className="flex-1"
              >
                {status === "processing" ? "Converting..." : "Export"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
