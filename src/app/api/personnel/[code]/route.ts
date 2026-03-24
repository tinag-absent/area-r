import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { readFile } from "fs/promises";
import path from "path";

interface Personnel {
  id: string; name: string; division: string; rank: string;
  age: number; joinDate: string; specialization: string;
  resume: { education: string[]; experience: string[]; achievements: string[]; skills: string[] };
  diary: { date: string; entry: string }[];
  psychEval: { lastEval: string; status: string; notes: string };
}

export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { code } = await params;
  const level = auth.user.level ?? 0;

  const jsonPath = path.join(process.cwd(), "scripts/area13/personnel-data.json");
  const raw  = await readFile(jsonPath, "utf-8");
  const data = JSON.parse(raw) as { personnel: Personnel[] };

  const person = data.personnel.find(
    p => p.id.toLowerCase() === code.toLowerCase()
  );
  if (!person) throw Errors.notFound("機関員が見つかりません");

  // 日記とpsychEvalはLV2以上のみ
  const result: Partial<Personnel> & Pick<Personnel, "id"|"name"|"division"|"rank"|"age"|"joinDate"|"specialization"|"resume"> = {
    id: person.id, name: person.name, division: person.division,
    rank: person.rank, age: person.age, joinDate: person.joinDate,
    specialization: person.specialization, resume: person.resume,
  };

  if (level >= 2) {
    result.diary = person.diary;
    result.psychEval = person.psychEval;
  }

  return NextResponse.json(result);
});
