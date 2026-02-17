"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Copy, Link2, Trash2 } from "lucide-react";
import type { SharedLink } from "@/types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: string;
}

export function ShareDialog({ open, onOpenChange, modelId }: ShareDialogProps) {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [permission, setPermission] = useState<"VIEW" | "COMMENT" | "DOWNLOAD">("VIEW");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetch(`/api/models/${modelId}/share`)
        .then((r) => r.json())
        .then(setLinks)
        .catch(() => {});
    }
  }, [open, modelId]);

  const createLink = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/models/${modelId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission }),
      });
      if (res.ok) {
        const link = await res.json();
        setLinks((prev) => [link, ...prev]);
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    const res = await fetch(`/api/models/${modelId}/share?linkId=${linkId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Model</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select value={permission} onValueChange={(v) => setPermission(v as typeof permission)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEW">View</SelectItem>
                <SelectItem value="COMMENT">Comment</SelectItem>
                <SelectItem value="DOWNLOAD">Download</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={createLink} disabled={creating} className="flex-1">
              <Link2 className="h-4 w-4 mr-2" />
              {creating ? "Creating..." : "Create Link"}
            </Button>
          </div>

          {links.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Active Links</p>
              {links.map((link) => (
                <div key={link.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <Input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/shared/${link.token}`}
                    className="h-8 text-xs"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {link.permission}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyLink(link.token)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-destructive"
                    onClick={() => deleteLink(link.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  {copied === link.token && (
                    <span className="text-xs text-green-500">Copied!</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
