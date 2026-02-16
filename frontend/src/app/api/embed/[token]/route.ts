import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const link = await prisma.sharedLink.findUnique({
    where: { token },
    include: {
      model: true,
    },
  });

  if (!link) {
    return NextResponse.json({ error: "Invalid share link" }, { status: 404 });
  }

  // Check expiration
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Share link expired" }, { status: 410 });
  }

  // Check if model is processed
  if (link.model.processingStatus !== "COMPLETED" || !link.model.glbFileUrl) {
    return NextResponse.json({ error: "Model not ready" }, { status: 400 });
  }

  return NextResponse.json({
    id: link.model.id,
    name: link.model.name,
    glbFileUrl: link.model.glbFileUrl,
    permission: link.permission,
  });
}
