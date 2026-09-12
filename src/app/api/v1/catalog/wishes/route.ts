import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { prisma } from "@/lib/db";
import { resolveSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await resolveSession(request);
  if (!session) {
    return apiError("UNAUTHORIZED", "세션이 유효하지 않습니다.");
  }

  const tags = await prisma.tag.findMany({
    where: { category: { in: ["WISH", "EMOTION"] } },
    orderBy: { createdAt: "asc" },
  });

  const wishes = tags
    .filter((t) => t.category === "WISH")
    .map((t) => ({ id: t.id, slug: t.slug, labelKo: t.labelKo }));
  const emotions = tags
    .filter((t) => t.category === "EMOTION")
    .map((t) => ({ id: t.id, slug: t.slug, labelKo: t.labelKo }));

  return NextResponse.json({ wishes, emotions });
}
