"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Reply } from "lucide-react";
import type { Comment } from "@/types";

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: string;
}

export function CommentsDialog({ open, onOpenChange, modelId }: CommentsDialogProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`/api/models/${modelId}/comments`)
        .then((r) => r.json())
        .then((data) => {
          setComments(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [open, modelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/models/${modelId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), parentId: replyTo }),
      });

      if (res.ok) {
        const newComment = await res.json();

        if (replyTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyTo
                ? { ...c, replies: [...(c.replies || []), newComment] }
                : c,
            ),
          );
        } else {
          setComments((prev) => [{ ...newComment, replies: [] }, ...prev]);
        }

        setText("");
        setReplyTo(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          )}

          {!loading && comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Be the first!
            </p>
          )}

          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <CommentItem
                comment={comment}
                onReply={() => setReplyTo(comment.id)}
                formatDate={formatDate}
              />
              {comment.replies?.map((reply) => (
                <div key={reply.id} className="ml-8">
                  <CommentItem
                    comment={reply}
                    formatDate={formatDate}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t">
          <div className="flex-1 space-y-1">
            {replyTo && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Reply className="h-3 w-3" />
                Replying to comment
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="underline"
                >
                  Cancel
                </button>
              </div>
            )}
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              disabled={submitting}
            />
          </div>
          <Button type="submit" size="icon" disabled={submitting || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CommentItem({
  comment,
  onReply,
  formatDate,
}: {
  comment: Comment;
  onReply?: () => void;
  formatDate: (d: string) => string;
}) {
  return (
    <div className="flex gap-2">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={comment.user?.image || ""} />
        <AvatarFallback className="text-xs">
          {comment.user?.name?.charAt(0)?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{comment.user?.name || "User"}</span>
          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="text-sm">{comment.text}</p>
        {onReply && (
          <button
            type="button"
            onClick={onReply}
            className="text-xs text-muted-foreground hover:text-foreground mt-1"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
}
