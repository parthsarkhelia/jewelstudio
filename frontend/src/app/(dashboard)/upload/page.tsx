"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpload } from "@/hooks/use-upload";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const ACCEPTED_FORMATS = {
  "model/gltf-binary": [".glb"],
  "model/gltf+json": [".gltf"],
  "application/octet-stream": [".obj", ".stl", ".ply", ".3dm", ".fbx"],
};

export default function UploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { upload, uploading, progress, processingStatus, error, reset } = useUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      setName(f.name.replace(/\.[^/.]+$/, ""));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: ACCEPTED_FORMATS,
  });

  const handleUpload = async () => {
    if (!file || !session) return;
    // Get JWT token for backend auth
    const tokenRes = await fetch("/api/auth/session");
    const tokenData = await tokenRes.json();
    // Use session token or JWT
    await upload(file, tokenData.accessToken || "dev-token", name);
  };

  const isComplete = processingStatus?.status === "COMPLETED";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Upload 3D Model</h1>

      <Card>
        <CardHeader>
          <CardTitle>Choose a File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : file
                  ? "border-green-500 bg-green-500/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">
                  {isDragActive ? "Drop file here" : "Drag & drop or click to browse"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports OBJ, STL, GLB, GLTF, 3DM, PLY, FBX
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Model Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter model name"
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {progress < 50 ? "Uploading..." : "Processing 3D model..."}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {isComplete && (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Model processed successfully!</span>
            </div>
          )}

          <div className="flex gap-3">
            {isComplete ? (
              <Button
                onClick={() => router.push(`/viewer/${processingStatus?.model_id}`)}
                className="flex-1"
              >
                View Model
              </Button>
            ) : (
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1"
              >
                {uploading ? "Processing..." : "Upload & Process"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                reset();
                setFile(null);
                setName("");
              }}
              disabled={uploading}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
