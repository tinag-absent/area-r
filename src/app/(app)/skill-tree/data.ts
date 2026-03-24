// ─────────────────────────────────────────────────────────────────────
// 海蝕機関 — スキルツリーデータ
// ─────────────────────────────────────────────────────────────────────

export type SkillTier = 1 | 2 | 3 | 4;  // 中心からの距離

export interface Skill {
  id:          string;
  label:       string;        // 短い表示名
  description: string;        // ホバー時の説明
  branch:      BranchId;      // 所属分野
  tier:        SkillTier;     // 深さ（1=根本、4=末端）
  requires:    string[];      // 前提スキルID
  xpCost:      number;        // 習得に必要なXP
  icon:        string;        // 絵文字 or 記号
}

export type BranchId =
  | "core"        // 中心（全分野共通）
  | "observe"     // 観測
  | "combat"      // 収束戦闘
  | "archive"     // 記録解析
  | "engineer"    // 技術工作
  | "psych"       // 精神耐性
  | "covert"      // 潜入隠密
  | "liaison"     // 交渉・連絡（新規）
  | "ritual"      // 儀式・知識（新規）
  | "adapt";      // 適応・変容（新規・副作用あり）

export interface Branch {
  id:          BranchId;
  label:       string;
  icon:        string;
  color:       string;
  description: string;
  angle:       number;   // 中心からの角度（度）
}

// ─── 分野定義 ─────────────────────────────────────────────────────────

export const BRANCHES: Branch[] = [
  {
    id: "core", label: "機関員基礎", icon: "◈",
    color: "#00c8ff", description: "全エージェント共通の基礎スキル群",
    angle: 0,
  },
  {
    id: "observe", label: "観測技術", icon: "◎",
    color: "#00c8ff", description: "海蝕現象の感知・記録・分析能力",
    angle: 0,   // 上
  },
  {
    id: "combat", label: "収束戦闘", icon: "◆",
    color: "#a064ff", description: "エンティティへの直接対処・封じ込め能力",
    angle: 60,  // 右上
  },
  {
    id: "engineer", label: "技術工作", icon: "◈",
    color: "#ffb43c", description: "機器の改造・即席装備製作・施設侵入",
    angle: 120, // 右下
  },
  {
    id: "archive", label: "記録解析", icon: "◐",
    color: "#3ecf6a", description: "情報収集・解読・パターン認識",
    angle: 180, // 下
  },
  {
    id: "psych", label: "精神耐性", icon: "◉",
    color: "#ff6b9d", description: "異次元現象・心理的干渉への抵抗力",
    angle: 240, // 左下
  },
  {
    id: "covert", label: "潜入隠密", icon: "◫",
    color: "#4dd9ff", description: "隠密行動・情報工作・身分偽装",
    angle: 300, // 左上
  },
  // ── 新規ブランチ ───────────────────────────────────────────────────
  {
    id: "liaison", label: "交渉・連絡", icon: "◑",
    color: "#ff8c42", description: "NPC・他エージェントとの情報共有と信頼関係の構築",
    angle: 345, // 右上寄り（covert と observe の中間）
  },
  {
    id: "ritual", label: "儀式・知識", icon: "◊",
    color: "#b06eff", description: "海蝕現象の理論的原理と古代記録・SIGMA文献の解読",
    angle: 225, // 左下（psych と archive の中間）
  },
  {
    id: "adapt", label: "適応・変容", icon: "◍",
    color: "#ff4060", description: "高σ曝露による身体適応。強力だが anomaly_score が上昇する",
    angle: 255, // 下寄り左（archive と psych の間）
  },
];

// ─── スキルデータ ─────────────────────────────────────────────────────

export const SKILLS: Skill[] = [

  // ══════════════════════════════════════════════════
  // CORE — 中心（全分野の起点）
  // ══════════════════════════════════════════════════
  {
    id: "core-init", label: "機関員認定", icon: "◈",
    description: "海蝕機関の正式エージェントとして認定される。すべてのスキルの起点。",
    branch: "core", tier: 1, requires: [], xpCost: 0,
  },

  // ══════════════════════════════════════════════════
  // OBSERVE — 観測技術（上方向）
  // ══════════════════════════════════════════════════
  // Tier1
  {
    id: "obs-basic", label: "基礎観測", icon: "◎",
    description: "携帯型センサーの基本操作。σ値の読み取りと異常の初期識別ができる。",
    branch: "observe", tier: 1, requires: ["core-init"], xpCost: 50,
  },
  // Tier2
  {
    id: "obs-calibrate", label: "精密校正", icon: "◎",
    description: "センサーの補正値を最適化し、測定精度を±0.01σまで高める。",
    branch: "observe", tier: 2, requires: ["obs-basic"], xpCost: 120,
  },
  {
    id: "obs-pattern", label: "波形解析", icon: "◎",
    description: "σ値の時系列パターンから、エンティティ出現の予兆を読み取る。",
    branch: "observe", tier: 2, requires: ["obs-basic"], xpCost: 120,
  },
  // Tier3
  {
    id: "obs-longrange", label: "広域観測", icon: "◎",
    description: "WSG-Tと連携した500km圏内の広域センサーネット解析ができる。",
    branch: "observe", tier: 3, requires: ["obs-calibrate"], xpCost: 200,
  },
  {
    id: "obs-multispec", label: "多重スペクトル", icon: "◎",
    description: "可視・不可視の複数次元周波数帯を同時観測し、隠れた裂孔を発見する。",
    branch: "observe", tier: 3, requires: ["obs-calibrate"], xpCost: 220,
  },
  {
    id: "obs-predict", label: "侵食予測", icon: "◎",
    description: "過去データと波形解析を組み合わせ、σ値の72時間予測モデルを構築できる。",
    branch: "observe", tier: 3, requires: ["obs-pattern"], xpCost: 220,
  },
  {
    id: "obs-rift-map", label: "裂孔マッピング", icon: "◎",
    description: "次元裂孔の三次元位置・深度・規模を精密にマッピングする。",
    branch: "observe", tier: 3, requires: ["obs-pattern"], xpCost: 200,
  },
  // Tier4
  {
    id: "obs-master", label: "観測マスター", icon: "◎",
    description: "すべての観測技術を統合。肉眼でσ値を概算できるレベルに到達。",
    branch: "observe", tier: 4, requires: ["obs-longrange", "obs-multispec"], xpCost: 400,
  },
  {
    id: "obs-rift-sense", label: "裂孔感知", icon: "◎",
    description: "機器なしで微弱な次元裂孔を皮膚感覚・嗅覚で察知できる（副作用あり）。",
    branch: "observe", tier: 4, requires: ["obs-multispec", "obs-predict"], xpCost: 450,
  },
  {
    id: "obs-sigma-read", label: "SIGMA共鳴", icon: "◎",
    description: "観測者SIGMAの次元知覚と部分的に同調し、通常では見えない情報を得る。極めて稀な才能。",
    branch: "observe", tier: 4, requires: ["obs-predict", "obs-rift-map"], xpCost: 500,
  },
  {
    id: "obs-void-chart", label: "虚域地図作成", icon: "◎",
    description: "σ5.0以上の危険域の構造を遠隔から把握し、安全な経路を導く。",
    branch: "observe", tier: 4, requires: ["obs-rift-map"], xpCost: 400,
  },

  // ══════════════════════════════════════════════════
  // COMBAT — 収束戦闘（右上）
  // ══════════════════════════════════════════════════
  // Tier1
  {
    id: "cbt-basic", label: "収束基礎", icon: "◆",
    description: "CFG-TYPE3の基本操作。フィールド展開と収束の手順を習得。",
    branch: "combat", tier: 1, requires: ["core-init"], xpCost: 50,
  },
  // Tier2
  {
    id: "cbt-speed", label: "展開速度", icon: "◆",
    description: "収束フィールドの展開時間を標準の60%に短縮。緊急時の生存率が向上。",
    branch: "combat", tier: 2, requires: ["cbt-basic"], xpCost: 130,
  },
  {
    id: "cbt-radius", label: "広域展開", icon: "◆",
    description: "フィールド半径を標準15mから最大22mまで拡張できる。",
    branch: "combat", tier: 2, requires: ["cbt-basic"], xpCost: 130,
  },
  // Tier3
  {
    id: "cbt-sustain", label: "長時間維持", icon: "◆",
    description: "消費電力を最適化し、連続稼働時間を4時間から7時間に延長。",
    branch: "combat", tier: 3, requires: ["cbt-speed"], xpCost: 210,
  },
  {
    id: "cbt-pulse", label: "収束パルス", icon: "◆",
    description: "収束エネルギーを指向性パルスとして放射し、エンティティを一時的に無力化。",
    branch: "combat", tier: 3, requires: ["cbt-speed"], xpCost: 230,
  },
  {
    id: "cbt-multi", label: "複合フィールド", icon: "◆",
    description: "2台のCFG-TYPE3を同期させ、独立したフィールドを連結して巨大化できる。",
    branch: "combat", tier: 3, requires: ["cbt-radius"], xpCost: 210,
  },
  {
    id: "cbt-shield", label: "個人収束盾", icon: "◆",
    description: "DIS-SUITの出力を増幅し、個人用の収束フィールドを短時間生成する。",
    branch: "combat", tier: 3, requires: ["cbt-radius"], xpCost: 230,
  },
  // Tier4
  {
    id: "cbt-nova", label: "収束爆裂", icon: "◆",
    description: "フィールドを意図的に不安定化させ、制御された爆発的収束を引き起こす。要特殊認可。",
    branch: "combat", tier: 4, requires: ["cbt-pulse", "cbt-sustain"], xpCost: 460,
  },
  {
    id: "cbt-solo", label: "単独封鎖", icon: "◆",
    description: "本来3名が必要な高脅威エンティティを単独で一時封鎖できる。LIMA-5のみが達成。",
    branch: "combat", tier: 4, requires: ["cbt-pulse", "cbt-shield"], xpCost: 480,
  },
  {
    id: "cbt-overload", label: "緊急過負荷", icon: "◆",
    description: "CFG-TYPE3を破壊覚悟で出力10倍に過負荷。CRITICAL級エンティティを一時押し返す。",
    branch: "combat", tier: 4, requires: ["cbt-multi", "cbt-nova"], xpCost: 500,
  },
  {
    id: "cbt-rift-seal", label: "裂孔封印", icon: "◆",
    description: "次元裂孔に収束フィールドを充填し、完全封鎖を単独で行える高度技術。",
    branch: "combat", tier: 4, requires: ["cbt-multi"], xpCost: 440,
  },

  // ══════════════════════════════════════════════════
  // ENGINEER — 技術工作（右下）
  // ══════════════════════════════════════════════════
  // Tier1
  {
    id: "eng-basic", label: "機器整備", icon: "◈",
    description: "基本的な機器の点検・清掃・部品交換。フィールドでの応急修理が可能。",
    branch: "engineer", tier: 1, requires: ["core-init"], xpCost: 50,
  },
  // Tier2
  {
    id: "eng-mod", label: "装備改造", icon: "◈",
    description: "既存装備に改造を施し、性能を部分的に強化できる。",
    branch: "engineer", tier: 2, requires: ["eng-basic"], xpCost: 130,
  },
  {
    id: "eng-sensor-hack", label: "センサー改造", icon: "◈",
    description: "PES-MK2のファームウェアを書き換え、測定範囲を9.9σ超えまで拡張。",
    branch: "engineer", tier: 2, requires: ["eng-basic"], xpCost: 140,
  },
  // Tier3
  {
    id: "eng-improvise", label: "即席装備", icon: "◈",
    description: "フィールドの廃材・部品から即席の観測・収束補助装備を製作できる。",
    branch: "engineer", tier: 3, requires: ["eng-mod"], xpCost: 220,
  },
  {
    id: "eng-amplifier", label: "増幅装置", icon: "◈",
    description: "収束フィールド出力を外部増幅器で強化するアダプターを自作。",
    branch: "engineer", tier: 3, requires: ["eng-mod"], xpCost: 210,
  },
  {
    id: "eng-relay", label: "通信中継", icon: "◈",
    description: "崩壊しかけた施設内でも独自の中継網を構築し、通信を維持する。",
    branch: "engineer", tier: 3, requires: ["eng-sensor-hack"], xpCost: 200,
  },
  {
    id: "eng-dismantle", label: "逆工学", icon: "◈",
    description: "敵対組織・不明勢力の機器を分解・解析し、技術情報を抽出する。",
    branch: "engineer", tier: 3, requires: ["eng-sensor-hack"], xpCost: 230,
  },
  // Tier4
  {
    id: "eng-omega", label: "封印装置製作", icon: "◈",
    description: "封印部門の格納技術を転用した携帯型封印装置を自作できる。要特殊部品。",
    branch: "engineer", tier: 4, requires: ["eng-improvise", "eng-amplifier"], xpCost: 460,
  },
  {
    id: "eng-prototype", label: "プロトタイプ開発", icon: "◈",
    description: "技術部門と共同で試作装備の開発・実証実験を主導できる立場になる。",
    branch: "engineer", tier: 4, requires: ["eng-improvise", "eng-relay"], xpCost: 440,
  },
  {
    id: "eng-jammer", label: "次元妨害装置", icon: "◈",
    description: "エンティティの次元知覚を一時的に阻害する妨害フィールドを生成する装置を製作。",
    branch: "engineer", tier: 4, requires: ["eng-amplifier", "eng-dismantle"], xpCost: 480,
  },
  {
    id: "eng-suit-upgrade", label: "DIS-SUIT改", icon: "◈",
    description: "DIS-SUITの遮断性能を2倍に引き上げ、σ10.0超えの環境でも30分稼働可能にする。",
    branch: "engineer", tier: 4, requires: ["eng-dismantle"], xpCost: 450,
  },

  // ══════════════════════════════════════════════════
  // ARCHIVE — 記録解析（下）
  // ══════════════════════════════════════════════════
  // Tier1
  {
    id: "arc-basic", label: "記録基礎", icon: "◐",
    description: "標準的なフィールドレポートの作成。情報の分類と保管手順を習得。",
    branch: "archive", tier: 1, requires: ["core-init"], xpCost: 50,
  },
  // Tier2
  {
    id: "arc-decode", label: "暗号解読", icon: "◐",
    description: "機関の内部暗号体系を理解し、機密通信の送受信を独立して行える。",
    branch: "archive", tier: 2, requires: ["arc-basic"], xpCost: 120,
  },
  {
    id: "arc-crossref", label: "横断検索", icon: "◐",
    description: "複数の記録を横断的に照合し、隠れた相関関係を発見する。",
    branch: "archive", tier: 2, requires: ["arc-basic"], xpCost: 120,
  },
  // Tier3
  {
    id: "arc-forensic", label: "記録鑑定", icon: "◐",
    description: "改竄された文書・ログの痕跡を検出し、元の情報を復元する。",
    branch: "archive", tier: 3, requires: ["arc-decode"], xpCost: 200,
  },
  {
    id: "arc-cipher", label: "独自暗号", icon: "◐",
    description: "機関標準暗号を超えた独自暗号体系を開発・運用できる。",
    branch: "archive", tier: 3, requires: ["arc-decode"], xpCost: 220,
  },
  {
    id: "arc-timeline", label: "事象年表", icon: "◐",
    description: "海蝕現象の発生パターンから、隠された歴史的因果関係を再構築する。",
    branch: "archive", tier: 3, requires: ["arc-crossref"], xpCost: 210,
  },
  {
    id: "arc-sigma-log", label: "SIGMA通信解析", icon: "◐",
    description: "SIGMAとの接触ログに残る言語パターンを解析し、意図を推測する。",
    branch: "archive", tier: 3, requires: ["arc-crossref"], xpCost: 230,
  },
  // Tier4
  {
    id: "arc-omniscient", label: "全記録統合", icon: "◐",
    description: "機関の全データベースに横断アクセスし、任意の情報を瞬時に引き出せる。",
    branch: "archive", tier: 4, requires: ["arc-forensic", "arc-cipher"], xpCost: 440,
  },
  {
    id: "arc-predict-plan", label: "計画予測", icon: "◐",
    description: "蒼海計画関連の断片情報から、次の行動を高精度で予測する。",
    branch: "archive", tier: 4, requires: ["arc-cipher", "arc-timeline"], xpCost: 480,
  },
  {
    id: "arc-deep-scan", label: "深層スキャン", icon: "◐",
    description: "黒塗り文書のインク層を解析し、一部の機密情報を復元できる特殊技術。",
    branch: "archive", tier: 4, requires: ["arc-forensic", "arc-sigma-log"], xpCost: 500,
  },
  {
    id: "arc-memorymap", label: "記憶地図", icon: "◐",
    description: "目撃者の証言・行動ログから事件の全体像を仮想空間に再現する。",
    branch: "archive", tier: 4, requires: ["arc-timeline", "arc-sigma-log"], xpCost: 460,
  },

  // ══════════════════════════════════════════════════
  // PSYCH — 精神耐性（左下）
  // ══════════════════════════════════════════════════
  // Tier1
  {
    id: "psy-basic", label: "精神安定", icon: "◉",
    description: "高σ値環境下での心理的安定を維持する基礎訓練。パニック耐性が向上。",
    branch: "psych", tier: 1, requires: ["core-init"], xpCost: 50,
  },
  // Tier2
  {
    id: "psy-barrier", label: "心理障壁", icon: "◉",
    description: "次元的干渉による幻覚・妄想を認識し、現実との境界を保つ。",
    branch: "psych", tier: 2, requires: ["psy-basic"], xpCost: 120,
  },
  {
    id: "psy-focus", label: "超集中", icon: "◉",
    description: "極度のストレス環境下でも認知機能を100%維持できる精神集中法。",
    branch: "psych", tier: 2, requires: ["psy-basic"], xpCost: 120,
  },
  // Tier3
  {
    id: "psy-void-walk", label: "虚域歩行", icon: "◉",
    description: "σ5.0以上の異常領域に短時間入り込み、正気を保ったまま行動できる。",
    branch: "psych", tier: 3, requires: ["psy-barrier"], xpCost: 230,
  },
  {
    id: "psy-entity-read", label: "実体感応", icon: "◉",
    description: "精神を開くことでエンティティの「状態」を直感的に把握できる。",
    branch: "psych", tier: 3, requires: ["psy-barrier"], xpCost: 220,
  },
  {
    id: "psy-trauma-lock", label: "記憶封鎖", icon: "◉",
    description: "極度のトラウマ体験を意識下に封印し、任務継続能力を維持する。",
    branch: "psych", tier: 3, requires: ["psy-focus"], xpCost: 210,
  },
  {
    id: "psy-broadcast", label: "意思伝達", icon: "◉",
    description: "言語が機能しない高次元空間で、意思を非言語的に伝達できる。",
    branch: "psych", tier: 3, requires: ["psy-focus"], xpCost: 230,
  },
  // Tier4
  {
    id: "psy-sigma-contact", label: "SIGMA直接接触", icon: "◉",
    description: "N-VEILを介さずSIGMAと直接「会話」できる。精神的リスクを伴う。",
    branch: "psych", tier: 4, requires: ["psy-void-walk", "psy-entity-read"], xpCost: 500,
  },
  {
    id: "psy-mind-fortress", label: "精神要塞", icon: "◉",
    description: "あらゆる精神的侵害を完全にシャットアウト。SIGMAですら読めない心となる。",
    branch: "psych", tier: 4, requires: ["psy-void-walk", "psy-trauma-lock"], xpCost: 480,
  },
  {
    id: "psy-echo-sense", label: "残響感知", icon: "◉",
    description: "過去にσ異常が起きた場所の「残滓」を感じ取り、何が起きたかを察知する。",
    branch: "psych", tier: 4, requires: ["psy-entity-read", "psy-broadcast"], xpCost: 460,
  },
  {
    id: "psy-transfer-resist", label: "転送抵抗", icon: "◉",
    description: "蒼海計画の意識転送プロトコルに対し、自分の意識を保護する精神的防壁。",
    branch: "psych", tier: 4, requires: ["psy-trauma-lock", "psy-broadcast"], xpCost: 500,
  },

  // ══════════════════════════════════════════════════
  // COVERT — 潜入隠密（左上）
  // ══════════════════════════════════════════════════
  // Tier1
  {
    id: "cvt-basic", label: "隠密基礎", icon: "◫",
    description: "気配を消し、監視カメラの死角を把握し、痕跡を残さず移動する基礎技術。",
    branch: "covert", tier: 1, requires: ["core-init"], xpCost: 50,
  },
  // Tier2
  {
    id: "cvt-disguise", label: "身分偽装", icon: "◫",
    description: "他部門・外部組織の要員になりすますための書類偽造・演技訓練。",
    branch: "covert", tier: 2, requires: ["cvt-basic"], xpCost: 130,
  },
  {
    id: "cvt-infiltrate", label: "施設潜入", icon: "◫",
    description: "機関管理下の制限区域へ正規ルート以外で侵入できる。",
    branch: "covert", tier: 2, requires: ["cvt-basic"], xpCost: 130,
  },
  // Tier3
  {
    id: "cvt-deepcover", label: "深度潜伏", icon: "◫",
    description: "数ヶ月単位で偽の身分を維持し続けられる長期潜伏技術。",
    branch: "covert", tier: 3, requires: ["cvt-disguise"], xpCost: 220,
  },
  {
    id: "cvt-data-theft", label: "情報窃取", icon: "◫",
    description: "対象のデバイスから気づかれずにデータを抽出する技術。",
    branch: "covert", tier: 3, requires: ["cvt-disguise"], xpCost: 210,
  },
  {
    id: "cvt-sigma-dark", label: "SIGMA死角", icon: "◫",
    description: "SIGMAの次元観測から外れた行動パターンを習得。存在を隠せる。",
    branch: "covert", tier: 3, requires: ["cvt-infiltrate"], xpCost: 240,
  },
  {
    id: "cvt-extract", label: "人員回収", icon: "◫",
    description: "機関が公式には関与できない状況で、要員・資産を秘密裏に救出する。",
    branch: "covert", tier: 3, requires: ["cvt-infiltrate"], xpCost: 220,
  },
  // Tier4
  {
    id: "cvt-ghost", label: "存在抹消", icon: "◫",
    description: "機関のデータベースから自分の痕跡を一時的に消去できる。非常事態用。",
    branch: "covert", tier: 4, requires: ["cvt-deepcover", "cvt-data-theft"], xpCost: 480,
  },
  {
    id: "cvt-omega-access", label: "格納庫Ω侵入", icon: "◫",
    description: "封印格納庫Ωへの非公式侵入経路を把握・利用できる。極めて危険。",
    branch: "covert", tier: 4, requires: ["cvt-deepcover", "cvt-sigma-dark"], xpCost: 500,
  },
  {
    id: "cvt-double-agent", label: "二重スパイ", icon: "◫",
    description: "外部組織に潜り込み、機関の利益のために情報を操作する高度工作。",
    branch: "covert", tier: 4, requires: ["cvt-data-theft", "cvt-extract"], xpCost: 460,
  },
  {
    id: "cvt-seabreak-spy", label: "計画内潜伏", icon: "◫",
    description: "蒼海計画のΩ委員会に偽名で潜り込み、内側から情報を収集する。",
    branch: "covert", tier: 4, requires: ["cvt-sigma-dark", "cvt-omega-access"], xpCost: 500,
  },

  // ══════════════════════════════════════════════════
  // CROSS-BRANCH スキル（複数分野の交差点）
  // ══════════════════════════════════════════════════
  {
    id: "cross-obs-cbt", label: "戦術観測", icon: "◈",
    description: "観測と収束戦闘を統合。戦闘中もリアルタイムでσ値を追跡し最適な攻撃タイミングを掴む。",
    branch: "observe", tier: 3, requires: ["obs-pattern", "cbt-speed"], xpCost: 250,
  },
  {
    id: "cross-arc-psy", label: "記憶回収", icon: "◐",
    description: "精神耐性と解析技術を組み合わせ、失われた記憶・改竄された記憶を自力で復元する。",
    branch: "archive", tier: 3, requires: ["arc-crossref", "psy-barrier"], xpCost: 260,
  },
  {
    id: "cross-eng-cvt", label: "工作偽装", icon: "◈",
    description: "機器改造と潜入技術を組み合わせ、監視カメラや警報装置を無効化・偽装する。",
    branch: "engineer", tier: 3, requires: ["eng-sensor-hack", "cvt-infiltrate"], xpCost: 250,
  },
  {
    id: "cross-psy-obs", label: "感応観測", icon: "◉",
    description: "精神感応と観測技術を融合。機器が壊れた状況でも感覚でσ値を推定できる。",
    branch: "psych", tier: 3, requires: ["psy-entity-read", "obs-pattern"], xpCost: 260,
  },
  {
    id: "cross-cbt-eng", label: "戦場整備", icon: "◆",
    description: "戦闘中にCFG-TYPE3の即席修理・再起動ができる。装備損失による任務中断を防ぐ。",
    branch: "combat", tier: 3, requires: ["cbt-basic", "eng-mod"], xpCost: 240,
  },
  {
    id: "cross-arc-cvt", label: "諜報記録", icon: "◐",
    description: "収集した情報を追跡不可能な形式で保存・転送する。諜報員の生命線。",
    branch: "archive", tier: 3, requires: ["arc-cipher", "cvt-data-theft"], xpCost: 260,
  },

  // ══════════════════════════════════════════════════
  // ULTIMATE — 全スキル最終到達点
  // ══════════════════════════════════════════════════
  {
    id: "ult-convergence", label: "次元収束者", icon: "◈",
    description: "観測・戦闘・解析・工作すべてを統合した機関最高峰のエージェント。蒼海計画の鍵を握る存在。",
    branch: "observe", tier: 4, requires: ["obs-master", "cbt-solo", "arc-omniscient", "psy-mind-fortress"], xpCost: 1000,
  },

  // ══════════════════════════════════════════════════
  // SECRET TIER 5 — 蒼海証人（全ブランチTier4完全習得者のみ）
  // ══════════════════════════════════════════════════
  {
    id: "s5-obs-truth-eye", label: "真実の眼", icon: "◎",
    description: "σの向こう側に何があるかを「見た」者だけが得る知覚。肉眼でσ値を0.001精度まで読み取り、次元境界の歪みを直感する。観測技術の最果て。",
    branch: "observe", tier: 4, requires: ["obs-master", "obs-sigma-read"], xpCost: 800,
  },
  {
    id: "s5-cbt-void-edge", label: "虚域刃", icon: "◆",
    description: "収束エネルギーを刃として物理的に振るう技術。CRITICAL級エンティティの物理防御を貫通できる唯一の近接手段。使用者には精神的負荷が残る。",
    branch: "combat", tier: 4, requires: ["cbt-nova", "cbt-rift-seal"], xpCost: 800,
  },
  {
    id: "s5-eng-gate-build", label: "次元門構築", icon: "◈",
    description: "制御された小型次元裂孔を意図的に開く装置を製作できる。蒼海計画が封印した技術の再現。封印部門の許可なき使用は機関規則違反となる。",
    branch: "engineer", tier: 4, requires: ["eng-omega", "eng-suit-upgrade"], xpCost: 850,
  },
  {
    id: "s5-arc-codex-write", label: "機関真典", icon: "◐",
    description: "機関の記録データベースを書き換える権限を得る。歴史を塗り替える力を持つが、その重みを理解している者にのみ付与される。記録部門最高機密。",
    branch: "archive", tier: 4, requires: ["arc-omniscient", "arc-deep-scan"], xpCost: 800,
  },
  {
    id: "s5-psy-beyond", label: "境界越え", icon: "◉",
    description: "肉体と意識を切り離し、次元空間を短時間遊離する。戻れない可能性があるため、機関は使用を推奨しない。N-VEILはこの技術の先を知っているという。",
    branch: "psych", tier: 4, requires: ["psy-sigma-contact", "psy-transfer-resist"], xpCost: 900,
  },
  {
    id: "s5-cvt-null-identity", label: "無存在", icon: "◫",
    description: "機関・蒼海計画のどちらの記録にも存在しない者となる。追跡不可能な究極の隠密。しかし存在を消すことは、帰る場所も消すことを意味する。",
    branch: "covert", tier: 4, requires: ["cvt-ghost", "cvt-seabreak-spy"], xpCost: 850,
  },

  // ══════════════════════════════════════════════════
  // LIAISON — 交渉・連絡ブランチ
  // ══════════════════════════════════════════════════
  {
    id: "lia-basic", label: "部門間通信", icon: "◑",
    description: "他部門への公式照会・報告書転送の手続きを習得。機関の情報流通網の基礎として、すべての横断連携の起点となる。",
    branch: "liaison", tier: 1, requires: ["core-init"], xpCost: 50,
  },
  {
    id: "lia-negotiate", label: "交渉術", icon: "◑",
    description: "NPC（K-ECHOなど）との会話から通常では得られない追加情報を引き出す技術。心理的な圧力と信頼感の使い分けを学ぶ。",
    branch: "liaison", tier: 2, requires: ["lia-basic"], xpCost: 140,
  },
  {
    id: "lia-relay-net", label: "情報網", icon: "◑",
    description: "複数のエージェントから届く断片情報を一本化する能力。ノイズと真実を選別し、行動可能な情報として統合する。",
    branch: "liaison", tier: 2, requires: ["lia-basic"], xpCost: 130,
  },
  {
    id: "lia-npc-trust", label: "NPC信頼", icon: "◑",
    description: "特定NPCとの信頼スコアを積み上げ、限定セリフ・隠し情報が解放される。K-ECHOが語らない「もう一つの観測記録」への鍵となる。",
    branch: "liaison", tier: 3, requires: ["lia-negotiate"], xpCost: 220,
  },
  {
    id: "lia-double-link", label: "二重連絡", icon: "◑",
    description: "機関と外部組織の両方に顔が利く立場を構築する。潜入系スキルとの組み合わせで、二重スパイとして最大限機能する。",
    branch: "liaison", tier: 3, requires: ["lia-negotiate", "lia-relay-net"], xpCost: 240,
  },
  {
    id: "lia-sigma-bridge", label: "SIGMA仲介", icon: "◑",
    description: "SIGMAの意図を解釈し、NPCを介さず直接機関員へ伝達できる。SIGMAは「通訳者」を求めていた——その役割を担う。",
    branch: "liaison", tier: 4, requires: ["lia-npc-trust", "lia-double-link"], xpCost: 480,
  },

  // ══════════════════════════════════════════════════
  // RITUAL — 儀式・知識ブランチ（CLR LV3以上推奨）
  // ══════════════════════════════════════════════════
  {
    id: "rit-theory", label: "海蝕理論", icon: "◊",
    description: "GSI・次元層・裂孔の理論的根拠を学術的に理解する。現象を予測に活かし、対処法を論理的に導き出せるようになる。",
    branch: "ritual", tier: 1, requires: ["core-init"], xpCost: 60,
  },
  {
    id: "rit-ancient-log", label: "古代記録", icon: "◊",
    description: "蒼書以前——機関が設立される前の時代の記録を読み解く。海蝕現象は「新しい脅威」ではなかった可能性が示唆されている。",
    branch: "ritual", tier: 2, requires: ["rit-theory"], xpCost: 150,
  },
  {
    id: "rit-language", label: "階宙語", icon: "◊",
    description: "エンティティが使う非言語コードのパターンを認識・解析する。「言語」ではなく「状態の変化」として理解する特殊な読解法。",
    branch: "ritual", tier: 2, requires: ["rit-theory"], xpCost: 160,
  },
  {
    id: "rit-containment-theory", label: "封印原理", icon: "◊",
    description: "封印プロトコルの理論的根拠を理解し、独自の応用が可能になる。封印部門の機密資料へのアクセス資格が一部付与される。",
    branch: "ritual", tier: 3, requires: ["rit-ancient-log"], xpCost: 230,
  },
  {
    id: "rit-nishido", label: "西堂研究", icon: "◊",
    description: "創設者・西堂の思想と残された暗号を解読し、蒼海計画の真の目的に迫る。N-VEILが恐れ、K-ECHOが知らない情報がここにある。",
    branch: "ritual", tier: 3, requires: ["rit-ancient-log", "rit-language"], xpCost: 260,
  },
  {
    id: "rit-seabreak-decode", label: "蒼書解読", icon: "◊",
    description: "蒼海計画の全容を記した「蒼書」の機密部分を読み解く。CLR LV5推奨。この知識を得た者は、機関にとっての資産であり同時に脅威となる。",
    branch: "ritual", tier: 4, requires: ["rit-containment-theory", "rit-nishido"], xpCost: 600,
  },

  // ══════════════════════════════════════════════════
  // ADAPT — 適応・変容ブランチ（副作用: anomaly_score上昇）
  // ══════════════════════════════════════════════════
  {
    id: "adp-exposure", label: "σ曝露耐性", icon: "◍",
    description: "低濃度のσ曝露を繰り返すことで身体的耐性を獲得する。痛みを感じにくくなり、行動範囲が広がる。【副作用: anomaly +0.5】",
    branch: "adapt", tier: 1, requires: ["core-init"], xpCost: 70,
  },
  {
    id: "adp-regen", label: "異常再生", icon: "◍",
    description: "軽傷が通常の2倍速で回復する。次元的な影響による代謝変化と考えられているが、長期的な影響は未解明。【副作用: anomaly +1.0】",
    branch: "adapt", tier: 2, requires: ["adp-exposure"], xpCost: 160,
  },
  {
    id: "adp-sense-expand", label: "感覚拡張", icon: "◍",
    description: "人間の可聴域を超えた次元周波数を知覚できるようになる。エンティティ接近の予知に有効だが、頭痛を伴うことがある。【副作用: anomaly +1.0】",
    branch: "adapt", tier: 2, requires: ["adp-exposure"], xpCost: 170,
  },
  {
    id: "adp-rift-walk", label: "裂孔通過", icon: "◍",
    description: "小規模次元裂孔を一時的に通り抜けることができる。生体への影響は未解明。封印部門は研究対象として管理を要求している。【副作用: anomaly +3.0】",
    branch: "adapt", tier: 3, requires: ["adp-regen"], xpCost: 280,
  },
  {
    id: "adp-entity-mimicry", label: "実体擬態", icon: "◍",
    description: "エンティティの動作パターンを模倣し、攻撃対象として認識されなくなる。技術なのか本能なのか、習得者本人にも分からない。【副作用: anomaly +2.0】",
    branch: "adapt", tier: 3, requires: ["adp-sense-expand"], xpCost: 260,
  },
  {
    id: "adp-partial-merge", label: "部分融合", icon: "◍",
    description: "次元境界を越えて、指先だけを隣の次元に触れさせる技術。物理的に不可能なはずの接触ができる。機関はこの先を封印している。【副作用: anomaly +5.0】",
    branch: "adapt", tier: 4, requires: ["adp-rift-walk", "adp-entity-mimicry"], xpCost: 500,
  },

  // ══════════════════════════════════════════════════
  // 新規クロスブランチ（未実装だった9ペア）
  // ══════════════════════════════════════════════════
  {
    id: "cross-obs-arc", label: "現象記録", icon: "◐",
    description: "観測データをリアルタイムで永続記録として構造化する。観測精度と記録正確性を同時に最大化した機関標準の記録技術。",
    branch: "archive", tier: 3, requires: ["obs-basic", "arc-basic"], xpCost: 230,
  },
  {
    id: "cross-obs-cvt", label: "ステルス観測", icon: "◎",
    description: "自分の存在を隠しながらσ計測を行う技術。監視されている状況でも正確なデータを収集できる。諜報活動中の観測に不可欠。",
    branch: "observe", tier: 3, requires: ["obs-basic", "cvt-basic"], xpCost: 240,
  },
  {
    id: "cross-cbt-arc", label: "戦闘記録", icon: "◐",
    description: "戦闘中にリアルタイムで詳細な戦闘ログを同時生成する。後の分析・報告書作成を大幅に簡略化し、次の戦闘への学習を加速する。",
    branch: "archive", tier: 3, requires: ["cbt-basic", "arc-basic"], xpCost: 220,
  },
  {
    id: "cross-cbt-psy", label: "戦闘瞑想", icon: "◆",
    description: "極度の危機状態で時間感覚が引き伸びる特殊な精神状態に入る。脅威への反応速度が向上し、即死を回避できる可能性が高まる。",
    branch: "combat", tier: 3, requires: ["cbt-basic", "psy-focus"], xpCost: 250,
  },
  {
    id: "cross-cbt-cvt", label: "奇襲収束", icon: "◆",
    description: "潜伏状態から展開する収束フィールドは周囲に検知されない。敵対エンティティの意識外から封鎖を成立させる高度な戦術技術。",
    branch: "combat", tier: 3, requires: ["cbt-basic", "cvt-basic"], xpCost: 250,
  },
  {
    id: "cross-eng-psy", label: "機器感応", icon: "◈",
    description: "感覚でデバイスの故障・異常を予知できる。計器が壊れている状況で特に力を発揮し、直感的な整備判断が可能になる。",
    branch: "engineer", tier: 3, requires: ["eng-basic", "psy-basic"], xpCost: 220,
  },
  {
    id: "cross-eng-arc", label: "設計解読", icon: "◈",
    description: "図面や回路図を見ただけで構造の弱点と改造可能点を把握する。解析と工作を一体化した技術で、逆工学の基盤となる。",
    branch: "engineer", tier: 3, requires: ["eng-basic", "arc-basic"], xpCost: 220,
  },
  {
    id: "cross-psy-cvt", label: "精神カモフラージュ", icon: "◉",
    description: "自分への注目を無意識に逸らす精神的な存在感の圧縮技術。物理的な隠密と組み合わせることで、感知される確率が大幅に下がる。",
    branch: "psych", tier: 3, requires: ["psy-basic", "cvt-basic"], xpCost: 240,
  },
  {
    id: "cross-lia-arc", label: "諜報整理", icon: "◑",
    description: "連絡網から集めた情報を追跡不可能な形式で記録・転送する技術。交渉と記録の融合により、情報の安全な流通が確立される。",
    branch: "liaison", tier: 3, requires: ["lia-relay-net", "arc-basic"], xpCost: 230,
  },
  {
    id: "cross-rit-psy", label: "共鳴儀式", icon: "◊",
    description: "海蝕理論の知識と精神耐性を融合させ、次元的干渉に理論的根拠を持って対処する。未知の現象への恐怖が消え、分析的に対応できる。",
    branch: "ritual", tier: 3, requires: ["rit-theory", "psy-basic"], xpCost: 240,
  },
  {
    id: "cross-adp-obs", label: "σ直感", icon: "◍",
    description: "身体に取り込んだσへの感応と観測技術を統合し、機器なしで高精度のGSI推定ができる。ただし長期使用で感覚の境界が曖昧になる。",
    branch: "adapt", tier: 3, requires: ["adp-exposure", "obs-basic"], xpCost: 250,
  },
];

// ─────────────────────────────────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────────────────────────────────

export function getBranchColor(branchId: BranchId): string {
  return BRANCHES.find(b => b.id === branchId)?.color ?? "#00c8ff";
}

export function getSkillsByBranch(branchId: BranchId): Skill[] {
  return SKILLS.filter(s => s.branch === branchId);
}

export function canUnlock(skillId: string, unlockedIds: Set<string>): boolean {
  const skill = SKILLS.find(s => s.id === skillId);
  if (!skill) return false;
  return skill.requires.every(req => unlockedIds.has(req));
}
