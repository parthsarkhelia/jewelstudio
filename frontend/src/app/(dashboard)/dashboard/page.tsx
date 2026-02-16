"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModelCard } from "@/components/models/model-card";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

interface DashboardModel {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  processingStatus: string;
  visibility: string;
  viewCount: number;
  tags: string[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [models, setModels] = useState<DashboardModel[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchModels = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/models?${params}`);
      if (res.ok) {
        const data = await res.json();
        setModels(data.models);
      }
      setLoading(false);
    };

    const timeout = setTimeout(fetchModels, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [status, search]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Models</h1>
        <Link href="/upload">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </Link>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold mb-2">No models yet</h2>
          <p className="text-muted-foreground mb-4">
            Upload your first 3D jewelry model to get started.
          </p>
          <Link href="/upload">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Model
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              id={model.id}
              name={model.name}
              thumbnailUrl={model.thumbnailUrl}
              processingStatus={model.processingStatus}
              visibility={model.visibility}
              viewCount={model.viewCount}
              tags={model.tags}
            />
          ))}
        </div>
      )}
    </div>
  );
}
