import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { getDb, queryOne, queryProgressFlags } from "@/lib/db";
import { UserProvider } from "@/components/layout/UserProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastContainer } from "@/components/layout/ToastContainer";
import type { UserState } from "@/store";
import type { UserRole, UserStatus } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const jar   = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const db  = getDb();
  await db.execute("PRAGMA foreign_keys = ON");
  const row = await queryOne<{
    id: string; agent_id: string; username: string; display_name: string | null;
    division_id: string | null; role: UserRole; status: UserStatus;
    clearance_level: number; xp_total: number; anomaly_score: number;
    observer_load: number; consecutive_login_days: number;
  }>(
    db,
    `SELECT id, agent_id, username, display_name, division_id, role, status,
            clearance_level, xp_total, anomaly_score, observer_load, consecutive_login_days
     FROM users WHERE id = ?`,
    [payload.id]
  );

  if (!row || ["banned", "suspended", "inactive"].includes(row.status)) redirect("/login");

  const flags = await queryProgressFlags(db, row.id);

  const user: UserState = {
    id:           row.id,
    agentId:      row.agent_id,
    username:     row.username,
    displayName:  row.display_name,
    divisionId:   row.division_id,
    role:         row.role,
    status:       row.status,
    level:        Number(row.clearance_level),
    xp:           Number(row.xp_total ?? 0),
    anomalyScore: Number(row.anomaly_score ?? 0),
    observerLoad: Number(row.observer_load ?? 0),
    streak:       Number(row.consecutive_login_days),
    flags,
  };

  return (
    <UserProvider initialUser={user}>
      {/* A11Y-11: スキップナビゲーションリンク — キーボードユーザーがサイドバーをスキップできる */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2
                   focus:z-[10000] focus:px-4 focus:py-2 focus:bg-bg-surface
                   focus:text-primary focus:border focus:border-primary focus:rounded-sm
                   focus:text-[13px] focus:font-semibold"
      >
        メインコンテンツへスキップ
      </a>
      <div className="flex min-h-dvh" style={{ minHeight: "100dvh" }}>
        <Sidebar />
        <main id="main-content" tabIndex={-1}
          className="flex-1 overflow-auto md:ml-0 mobile-header-offset">
          {children}
        </main>
      </div>
      <ToastContainer />
    </UserProvider>
  );
}
