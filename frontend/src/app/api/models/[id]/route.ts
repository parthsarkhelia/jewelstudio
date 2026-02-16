import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const model = await prisma.model3D.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  // Check access
  const session = await auth();
  if (model.visibility === "PRIVATE" && model.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Increment view count
  await prisma.model3D.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json({
    ...model,
    fileSize: model.fileSize ? Number(model.fileSize) : null,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const model = await prisma.model3D.findUnique({ where: { id } });

  if (!model || model.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  const body = await req.json();
  const updated = await prisma.model3D.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      visibility: body.visibility,
      tags: body.tags,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const model = await prisma.model3D.findUnique({ where: { id } });

  if (!model || model.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  await prisma.model3D.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
