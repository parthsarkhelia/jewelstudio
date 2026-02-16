"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModelCard } from "@/components/models/model-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface PublicModel {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  tags: string[];
  viewCount: number;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

export default function ExplorePage() {
  const [models, setModels] = useState<PublicModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        sort,
        ...(search && { search }),
      });
      const res = await fetch(`/api/models/public?${params}`);
      if (res.ok) {
        const data = await res.json();
        setModels(data.models);
        setTotalPages(data.totalPages);
      }
      setLoading(false);
    };

    const timeout = setTimeout(fetchModels, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [search, sort, page]);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Explore</h1>
        <p className="text-muted-foreground mb-8">
          Discover stunning 3D jewelry models from the community
        </p>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold mb-2">No models found</h2>
            <p className="text-muted-foreground">
              {search ? "Try a different search term" : "Be the first to share a model!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {models.map((model) => (
                <ModelCard
                  key={model.id}
                  id={model.id}
                  name={model.name}
                  thumbnailUrl={model.thumbnailUrl}
                  processingStatus="COMPLETED"
                  viewCount={model.viewCount}
                  tags={model.tags}
                  userName={model.user.name}
                  userImage={model.user.image}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
