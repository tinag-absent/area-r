"use client";
import { useAdminUsers }  from "@/hooks/useAdminUsers";
import { Button }         from "@/components/ui/Button";
import { PageHeader }     from "@/components/ui/PageHeader";
import { ErrorMessage }   from "@/components/ui/ErrorMessage";
import { LoadingStatus }  from "@/components/ui/LoadingStatus";
import type { AdminEditableField, UserStatus, UserRole } from "@/lib/types";
import type { AdminUser, EditState } from "@/hooks/useAdminUsers";
import { Icon, NavIcon } from "@/components/ui/Icon";

const FIELD_LABEL: Record<AdminEditableField, string> = {
  status:          "ステータス",
  role:            "ロール",
  clearance_level: "クリアランスレベル",
  xp_total:        "XP合計",
  anomaly_score:   "異常スコア",
};

const STATUS_COLOR: Partial<Record<UserStatus, string>> = {
  active:    "var(--color-success)",
  inactive:  "var(--color-fg-dim)",
  suspended: "var(--color-warning)",
  banned:    "var(--color-danger)",
};

const EDITABLE_FIELDS: { field: AdminEditableField; label: string }[] = [
  { field: "status",          label: "状態" },
  { field: "role",            label: "役割" },
  { field: "clearance_level", label: "LV"   },
  { field: "xp_total",        label: "XP"   },
];

function EditFieldControl({ editing, setEditing }: { editing: EditState; setEditing: (state: EditState) => void }) {
  if (editing.field === "status") {
    return (
      <>
        <label htmlFor="edit-field-value" className="sr-only">新しい{FIELD_LABEL[editing.field]}を選択</label>
        <select
          id="edit-field-value"
          className="input-base w-full"
          value={editing.value}
          onChange={e => setEditing({ ...editing, value: e.target.value })}
        >
          {(["active","inactive","suspended","banned"] as UserStatus[]).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </>
    );
  }
  if (editing.field === "role") {
    return (
      <>
        <label htmlFor="edit-field-value" className="sr-only">新しい{FIELD_LABEL[editing.field]}を選択</label>
        <select
          id="edit-field-value"
          className="input-base w-full"
          value={editing.value}
          onChange={e => setEditing({ ...editing, value: e.target.value })}
        >
          {(["player","observer","admin"] as UserRole[]).map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </>
    );
  }
  return (
    <>
      <label htmlFor="edit-field-value" className="sr-only">{FIELD_LABEL[editing.field]}の新しい値</label>
      <input
        id="edit-field-value"
        className="input-base w-full"
        type="number"
        value={editing.value}
        onChange={e => setEditing({ ...editing, value: e.target.value })}
      />
    </>
  );
}

export default function AdminUsersPage() {
  const {
    users, searchQuery, setSearchQuery, loading,
    editing, setEditing, saving, saveError,
    editTriggerRef,
    searchUsers, openEdit, closeEdit, saveEdit,
  } = useAdminUsers();

  return (
    <div className="animate-[fadeIn_0.4s_ease_both] p-4 sm:p-8">
      <PageHeader eyebrow="ADMIN — USER MANAGEMENT" title="ユーザー管理" eyebrowColor="warning" />

      {/* Search */}
      <div className="flex gap-2 mb-5" role="search">
        <label htmlFor="user-search" className="sr-only">ユーザー検索</label>
        <input
          id="user-search"
          type="search"
          className="input-base max-w-[300px] w-full"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="IDまたはエージェントIDで検索…"
          onKeyDown={e => e.key === "Enter" && searchUsers(searchQuery)}
        />
        <Button variant="secondary" onClick={() => searchUsers(searchQuery)}>
          検索
        </Button>
      </div>

      {/* Modal */}
      <EditModal
        editing={editing}
        setEditing={setEditing}
        saving={saving}
        saveError={saveError}
        onClose={closeEdit}
        onSave={saveEdit}
      />

      {loading ? (
        <LoadingStatus />
      ) : (
        <div className="overflow-x-auto rounded-sm" style={{ border: "1px solid rgba(255,180,60,0.1)" }}>
          <table className="w-full border-collapse text-[12px]">
            <caption className="sr-only">登録ユーザー一覧</caption>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,180,60,0.12)", background: "rgba(255,180,60,0.03)" }}>
                {["エージェントID","Username","ロール","ステータス","LV","XP","異常スコア","最終ログイン","操作"].map(h => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-left font-bold whitespace-nowrap hud-label"
                    style={{ color: "var(--color-warning)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <UserRow
                  key={user.id}
                  user={user}
                  editTriggerRef={editTriggerRef}
                  onEdit={openEdit}
                  isLast={i === users.length - 1}
                />
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p
              className="py-6 text-center hud-label"
              style={{ color: "var(--color-fg-muted)" }}
            >
              ユーザーが見つかりません
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user, editTriggerRef, onEdit, isLast,
}: {
  user:            AdminUser;
  editTriggerRef:  React.MutableRefObject<HTMLButtonElement | null>;
  onEdit:          (userId: string, field: AdminEditableField, value: string, trigger: HTMLButtonElement) => void;
  isLast:          boolean;
}) {
  return (
    <tr
      className="transition-colors"
      style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,180,60,0.06)" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,180,60,0.03)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <td className="px-3 py-2.5 font-bold" style={{ color: "var(--color-primary)" }}>{user.agent_id}</td>
      <td className="px-3 py-2.5" style={{ color: "var(--color-foreground)" }}>{user.username}</td>
      <td className="px-3 py-2.5" style={{ color: "var(--color-fg-dim)" }}>{user.role}</td>
      <td className="px-3 py-2.5">
        <span style={{ color: STATUS_COLOR[user.status] ?? "var(--color-fg-dim)" }}>
          <Icon name="dot" size={8} style={{ marginRight: 4 }} aria-hidden />{user.status}
        </span>
      </td>
      <td className="px-3 py-2.5" style={{ color: "var(--color-foreground)" }}>{Number(user.clearance_level)}</td>
      <td className="px-3 py-2.5" style={{ color: "var(--color-foreground)" }}>{Number(user.xp_total).toLocaleString()}</td>
      <td
        className="px-3 py-2.5"
        style={{ color: Number(user.anomaly_score) > 50 ? "var(--color-danger)" : "var(--color-fg-dim)" }}
      >
        {Number(user.anomaly_score)}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: "var(--color-fg-dim)" }}>
        {user.last_login_at
          ? new Date(user.last_login_at.replace(" ", "T") + "Z").toLocaleDateString("ja-JP")
          : "—"}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex gap-1" role="group" aria-label={`${user.username} の操作`}>
          {EDITABLE_FIELDS.map(({ field, label }) => (
            <button
              key={field}
              className="px-2 py-px text-[10px] font-bold rounded-sm cursor-pointer transition-all duration-150"
              style={{
                border: "1px solid rgba(255,180,60,0.2)",
                color: "var(--color-fg-dim)",
                background: "transparent",
                letterSpacing: "0.04em",
              }}
              aria-label={`${user.username} の${FIELD_LABEL[field]}を変更`}
              onClick={e => onEdit(user.id, field, String(user[field as keyof AdminUser] ?? ""), e.currentTarget)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,180,60,0.5)";
                (e.currentTarget as HTMLElement).style.color = "var(--color-warning)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,180,60,0.2)";
                (e.currentTarget as HTMLElement).style.color = "var(--color-fg-dim)";
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}

function EditModal({
  editing, setEditing, saving, saveError, onClose, onSave,
}: {
  editing:    EditState | null;
  setEditing: (s: EditState) => void;
  saving:     boolean;
  saveError:  string;
  onClose:    () => void;
  onSave:     () => void;
}) {
  return (
    <dialog
      aria-labelledby="edit-modal-title"
      aria-describedby={saveError ? "edit-modal-error" : undefined}
      onCancel={onClose}
      className="bg-transparent border-0 p-4 max-w-[340px] w-full backdrop:bg-bg/80"
    >
      {editing && (
        <div
          className="animate-[fadeIn_0.3s_ease_both] rounded-sm p-5 w-full"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid rgba(255,180,60,0.2)",
          }}
        >
          <h2
            id="edit-modal-title"
            className="font-bold mb-4 m-0 text-[14px]"
            style={{ color: "var(--color-foreground)" }}
          >
            {FIELD_LABEL[editing.field]} を変更
          </h2>
          <EditFieldControl editing={editing} setEditing={setEditing} />
          {saveError && <ErrorMessage id="edit-modal-error" message={saveError} className="mt-2 mb-0" />}
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="secondary" onClick={onClose}>キャンセル</Button>
            <Button onClick={onSave} disabled={saving} isLoading={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
