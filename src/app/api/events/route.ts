/**
 * GET /api/events — アクティブなARGイベント一覧
 * Updated: 2026-03-23 — createRoute に移行
 */
import { NextResponse }   from "next/server";
import { createRoute }    from "@/lib/api/handler";
import { queryAll }       from "@/lib/db";

interface EventAction {
  is_public?:    boolean;
  public_title?: string;
  public_desc?:  string;
  end_at?:       string;
  type?:         string;
}

export const GET = createRoute({
  auth: "player",
  handler: async ({ db }) => {
    const rows = await queryAll<{
      id: string; title: string; description: string | null;
      trigger_at: string; status: string; actions_json: string;
      fired_at: string | null;
    }>(db,
      `SELECT id, title, description, trigger_at, status, actions_json, fired_at
       FROM event_schedule
       WHERE status IN ('scheduled', 'published')
       ORDER BY trigger_at ASC
       LIMIT 50`
    );

    const events = rows.flatMap(row => {
      let actions: EventAction[] = [];
      try { actions = JSON.parse(row.actions_json); } catch { return []; }

      const pub = actions.find(a => a.is_public);
      if (!pub) return [];

      return [{
        id:          row.id,
        title:       pub.public_title ?? row.title,
        description: pub.public_desc  ?? row.description ?? "",
        triggerAt:   row.trigger_at,
        endAt:       pub.end_at ?? null,
        status:      row.status,
        firedAt:     row.fired_at,
        eventType:   pub.type ?? "event",
      }];
    });

    return NextResponse.json(events);
  },
});
