import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, Errors } from "@/lib/api-error";
import { requireAuth, isAuthError } from "@/lib/server-auth";
import { getDb, queryOne } from "@/lib/db";

export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) => {
  const auth = requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { missionId } = await params;
  const db = getDb();

  const mission = await queryOne<{
    id: string; title: string; description: string | null;
    category: string; status: string; required_level: number;
    xp_reward: number; phase: number; assigned_division: string | null;
    issued_by: string | null; issued_at: string | null; deadline_at: string | null;
  }>(db,
    `SELECT id, title, description, category, status, required_level,
            xp_reward, phase, assigned_division, issued_by, issued_at, deadline_at
     FROM missions WHERE id = ? AND required_level <= ?`,
    [missionId, auth.user.level ?? 0]
  );

  if (!mission) throw Errors.notFound("ミッションが見つかりません");

  const myParticipation = await queryOne<{
    id: string; status: string; applied_at: string;
    reviewed_at: string | null; completed_at: string | null; note: string | null;
  }>(db,
    `SELECT id, status, applied_at, reviewed_at, completed_at, note
     FROM mission_participants WHERE mission_id = ? AND user_id = ?`,
    [missionId, auth.user.id]
  );

  const participantCount = await queryOne<{ cnt: number }>(db,
    `SELECT COUNT(*) as cnt FROM mission_participants WHERE mission_id = ? AND status IN ('approved','completed')`,
    [missionId]
  );

  return NextResponse.json({
    ...mission,
    myParticipation: myParticipation ?? null,
    participantCount: participantCount?.cnt ?? 0,
  });
});
