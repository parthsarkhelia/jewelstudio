"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Box } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface ModelCardProps {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  processingStatus: string;
  visibility?: string;
  viewCount: number;
  tags?: string[];
  userName?: string | null;
  userImage?: string | null;
}

export function ModelCard({
  id,
  name,
  thumbnailUrl,
  processingStatus,
  visibility,
  viewCount,
  tags,
  userName,
}: ModelCardProps) {
  return (
    <Link href={`/viewer/${id}`}>
      <Card className="group overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all">
        <div className="aspect-square relative bg-muted">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              {processingStatus === "COMPLETED" ? (
                <Box className="h-12 w-12 text-muted-foreground" />
              ) : processingStatus === "FAILED" ? (
                <span className="text-sm text-destructive">Failed</span>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-xs text-muted-foreground">Processing...</span>
                </div>
              )}
            </div>
          )}
          {visibility && visibility !== "PUBLIC" && (
            <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
              {visibility}
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm truncate">{name}</h3>
          <div className="flex items-center justify-between mt-1">
            {userName && (
              <span className="text-xs text-muted-foreground truncate">{userName}</span>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Eye className="h-3 w-3" />
              {formatNumber(viewCount)}
            </div>
          </div>
          {tags && tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
