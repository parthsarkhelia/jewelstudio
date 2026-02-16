import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const links = await prisma.sharedLink.findMany({
    where: { modelId: id, userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(links);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const model = await prisma.model3D.findUnique({ where: { id } });
  if (!model || model.userId !== session.user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const link = await prisma.sharedLink.create({
    data: {
      modelId: id,
      userId: session.user.id,
      permission: body.permission || "VIEW",
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const linkId = searchParams.get("linkId");
  if (!linkId) {
    return NextResponse.json({ error: "linkId required" }, { status: 400 });
  }

  await prisma.sharedLink.delete({ where: { id: linkId } });

  return NextResponse.json({ success: true });
}
