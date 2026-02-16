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
import { Label } from "@/components/ui/label";
import { Copy, Check, Trash2 } from "lucide-react";
import type { SharedLink } from "@/types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: string;
}

export function ShareDialog({ open, onOpenChange, modelId }: ShareDialogProps) {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [permission, setPermission] = useState("VIEW");
  const [copied, setCopied] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/models/${modelId}/share`)
      .then((r) => r.json())
      .then(setLinks);
  }, [open, modelId]);

  const createLink = async () => {
    setCreating(true);
    const res = await fetch(`/api/models/${modelId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permission }),
    });
    if (res.ok) {
      const link = await res.json();
      setLinks((prev) => [link, ...prev]);
    }
    setCreating(false);
  };

  const deleteLink = async (linkId: string) => {
    await fetch(`/api/models/${modelId}/share?linkId=${linkId}`, {
      method: "DELETE",
    });
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/embed/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const getEmbedCode = (token: string) => {
    const url = `${window.location.origin}/embed/${token}`;
    return `<iframe src="${url}" width="600" height="400" frameborder="0" allowfullscreen></iframe>`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Model</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEW">View only</SelectItem>
                <SelectItem value="COMMENT">Can comment</SelectItem>
                <SelectItem value="DOWNLOAD">Can download</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={createLink} disabled={creating} className="flex-1">
              {creating ? "Creating..." : "Create Link"}
            </Button>
          </div>

          {links.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Shared links</Label>
              {links.map((link) => (
                <div key={link.id} className="flex items-center gap-2 p-2 border rounded-md">
                  <Input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/embed/${link.token}`}
                    className="text-xs h-8"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyLink(link.token)}
                  >
                    {copied === link.token ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteLink(link.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {links.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Embed code</Label>
              <Input
                readOnly
                value={getEmbedCode(links[0].token)}
                className="text-xs font-mono h-8"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
