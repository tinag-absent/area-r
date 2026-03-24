/**
 * 海蝕機関 UI コンポーネントライブラリ
 *
 * import { Badge, Button, CardSection, ... } from "@/components/ui"
 *
 * Server / Client 境界:
 *   Server Component 互換: Badge, StatusBadge, ThreatBadge, Tag, TagList,
 *                           CardSection, CardField, CardBody, EmptyState, LockedState,
 *                           HudLabel, Breadcrumb, PageHeader, ErrorMessage, LoadingStatus
 *   Client Component のみ: Button, Card
 */

export { Button }        from "./Button";
export type { ButtonVariant, ButtonProps } from "./Button";

export { PageHeader }    from "./PageHeader";
export { ErrorMessage }  from "./ErrorMessage";
export { LoadingStatus } from "./LoadingStatus";

export {
  Badge,
  StatusBadge,
  ThreatBadge,
  Tag,
  TagList,
} from "./Badge";
export type { BadgeStatus, ThreatLevel } from "./Badge";

// Client Component
export { Card }          from "./Card";

// Server Component互換
export {
  CardSection,
  CardField,
  CardBody,
} from "./CardParts";

export {
  EmptyState,
  LockedState,
} from "./EmptyState";

export { HudLabel, Breadcrumb } from "./HudLabel";

export { Icon, NavIcon } from "./Icon";
export type { IconName } from "./Icon";
