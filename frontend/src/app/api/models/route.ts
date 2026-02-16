import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";

  const where = {
    userId: session.user.id,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { tags: { has: search } },
      ],
    }),
  };

  const [models, total] = await Promise.all([
    prisma.model3D.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        thumbnailUrl: true,
        processingStatus: true,
        visibility: true,
        vertexCount: true,
        faceCount: true,
        fileSize: true,
        tags: true,
        viewCount: true,
        createdAt: true,
      },
    }),
    prisma.model3D.count({ where }),
  ]);

  return NextResponse.json({
    models: models.map((m) => ({ ...m, fileSize: m.fileSize ? Number(m.fileSize) : null })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const model = await prisma.model3D.create({
    data: {
      userId: session.user.id,
      name: body.name,
      description: body.description,
      visibility: body.visibility || "PRIVATE",
      tags: body.tags || [],
    },
  });

  return NextResponse.json(model, { status: 201 });
}
