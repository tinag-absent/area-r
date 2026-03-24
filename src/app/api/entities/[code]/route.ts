import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { readFile } from "fs/promises";
import path from "path";

interface Entity {
  id: string; code: string; name: string;
  classification: string; description: string;
  threat: string; intelligence: string; origin: string;
  appearance: string; behavior: string; containment: string;
}

export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { code } = await params;
  const level = auth.user.level ?? 0;

  const jsonPath = path.join(process.cwd(), "scripts/area13/entities-data.json");
  const raw  = await readFile(jsonPath, "utf-8");
  const data = JSON.parse(raw) as { entities: Entity[] };

  const entity = data.entities.find(
    e => e.code.toLowerCase() === code.toLowerCase() || e.id.toLowerCase() === code.toLowerCase()
  );

  if (!entity) throw Errors.notFound("エンティティが見つかりません");

  if (entity.classification === "classified" && level < 3) {
    return NextResponse.json({
      id: entity.id, code: entity.code, name: "███████",
      classification: "classified",
      description: "[機密] このエンティティへのアクセスには CLEARANCE LEVEL 3 以上が必要です。",
      threat: "???", intelligence: "???", origin: "???",
      appearance: "???", behavior: "???", containment: "???",
    });
  }

  return NextResponse.json(entity);
});
