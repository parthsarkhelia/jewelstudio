import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";

  const where = {
    visibility: "PUBLIC" as const,
    processingStatus: "COMPLETED" as const,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { tags: { has: search } },
      ],
    }),
  };

  const orderBy =
    sort === "popular"
      ? { viewCount: "desc" as const }
      : { createdAt: "desc" as const };

  const [models, total] = await Promise.all([
    prisma.model3D.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        thumbnailUrl: true,
        tags: true,
        viewCount: true,
        createdAt: true,
        user: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.model3D.count({ where }),
  ]);

  return NextResponse.json({
    models,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
