"use client";

import { useState, useCallback } from "react";
import { BACKEND_URL } from "@/lib/utils";
import type { UploadResponse, UploadStatus } from "@/types";

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [processingStatus, setProcessingStatus] = useState<UploadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, token: string, name?: string) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (name) formData.append("name", name);

      const res = await fetch(`${BACKEND_URL}/api/v1/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }

      const data: UploadResponse = await res.json();
      setUploadResult(data);
      setProgress(50);

      // Poll for processing status
      const pollStatus = async () => {
        const statusRes = await fetch(
          `${BACKEND_URL}/api/v1/upload/status/${data.task_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!statusRes.ok) return;

        const status: UploadStatus = await statusRes.json();
        setProcessingStatus(status);

        if (status.status === "COMPLETED") {
          setProgress(100);
          setUploading(false);
        } else if (status.status === "FAILED") {
          setError(status.error || "Processing failed");
          setUploading(false);
        } else {
          setTimeout(pollStatus, 2000);
        }
      };

      pollStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setUploadResult(null);
    setProcessingStatus(null);
    setError(null);
  }, []);

  return { upload, uploading, progress, uploadResult, processingStatus, error, reset };
}
