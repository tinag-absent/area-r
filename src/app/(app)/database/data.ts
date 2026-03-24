// ─────────────────────────────────────────────────────────────────────
// 海蝕機関 — データベース共通データ
// ─────────────────────────────────────────────────────────────────────

export type StatusKey =
  | "ACTIVE" | "OPERATIONAL" | "IN_SERVICE" | "CONTAINED" | "OBSERVED"
  | "PENDING" | "DEGRADED" | "LIMITED" | "MISSING" | "LOCKED"
  | "RESTRICTED" | "CLASSIFIED";

export interface Mission {
  id: string;
  title: string;
  phase: number;
  status: StatusKey;
  xp: number;
  level: number;
  category: string;
  description: string;
  objectives: string[];
  assigned_division: string;
  issued_by: string;
  issued_at: string;
  // DBから返されるAPIフィールド（静的データとの互換性）
  required_level?: number;
  xp_reward?: number;
}

export interface Facility {
  id: string;
  name: string;
  code: string;
  location: string;
  status: StatusKey;
  clearance: number;
  type: string;
  description: string;
  staff: number | null;
  established: string;
  equipment_installed: string[];
  divisions_present: string[];
  notes: string;
}

export interface Entity {
  id: string;
  designation: string;
  code: string;
  threat: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNKNOWN";
  clearance: number;
  status: StatusKey;
  classification: string;
  description: string;
  first_detected: string;
  neutralized: number | null;
  containment_protocol: string;
  observed_abilities: string[];
  related_entities: string[];
}

export interface Equipment {
  id: string;
  name: string;
  code: string;
  category: string;
  status: StatusKey;
  clearance: number;
  quantity: number | null;
  description: string;
  weight: string;
  issued_by: string;
  specifications: Record<string, string>;
  maintenance_cycle: string;
}

export interface Personnel {
  id: string;
  codename: string;
  real_name: string;
  role: string;
  division: string;
  clearance: number;
  status: StatusKey;
  joined: string;
  last_seen: string;
  specialization: string;
  notes: string;
  anomaly_score: number | null;
  missions_completed: number | null;
  commendations: string[];
  incident_flags: string[];
}

// ─────────────────────────────────────────────────────────────────────
// ミッション
// ─────────────────────────────────────────────────────────────────────

export const MISSIONS: Mission[] = [
  {
    id: "MISSION-2026-001",
    title: "東京湾次元歪曲事案",
    phase: 1,
    status: "ACTIVE",
    xp: 200,
    level: 4,
    category: "HIGH",
    description: "東京湾沿岸で大規模な次元境界の歪みを検知。複数の波喰いが出現し、付近の海蝕現象を捕食中。",
    objectives: ["波喰い3体確認", "M-001-α 空間安定化フィールド展開", "M-003-γ 実体無力化パルス使用 - 2体消滅"],
    assigned_division: "収束部門 第1班",
    issued_by: "収束部門 第1班",
    issued_at: "2026-02-06",
  },
  {
    id: "MISSION-2026-002",
    title: "横浜港不根侵入事案",
    phase: 1,
    status: "OBSERVED",
    xp: 100,
    level: 2,
    category: "MODERATE",
    description: "未認可の不根が横浜港に接近中。外事部門が交渉を試みている。",
    objectives: ["交渉チーム接触成功"],
    assigned_division: "港湾部門",
    issued_by: "港湾部門",
    issued_at: "2026-02-06",
  },
  {
    id: "MISSION-2026-003",
    title: "富士山麓時空歪曲収束作戦",
    phase: 1,
    status: "ACTIVE",
    xp: 200,
    level: 4,
    category: "HIGH",
    description: "富士山西麓で時間遅延帯が発生。半径500m以内の時間流が通常の1/50に減速。",
    objectives: ["装置起動 - 時間流の調整開始"],
    assigned_division: "収束部門 第2班",
    issued_by: "収束部門 第2班",
    issued_at: "2026-02-06",
  },
  {
    id: "MISSION-2026-004",
    title: "新潟沖境界ゲート監視任務",
    phase: 1,
    status: "OBSERVED",
    xp: 100,
    level: 2,
    category: "MODERATE",
    description: "新潟沖に境界ゲートが自然発生。現時点で実体の侵入は確認されていない。",
    objectives: ["24時間監視体制確立"],
    assigned_division: "港湾部門",
    issued_by: "港湾部門",
    issued_at: "2026-02-06",
  },
  {
    id: "MISSION-2026-005",
    title: "名古屋市内鏡面侵食体捜索",
    phase: 1,
    status: "ACTIVE",
    xp: 100,
    level: 2,
    category: "MODERATE",
    description: "市民複数名が「知らない人物が自分のふりをしている」と通報。鏡面侵食体の可能性。",
    objectives: ["次元共鳴パターン検査開始", "容疑者3名を特定"],
    assigned_division: "支援部門",
    issued_by: "支援部門",
    issued_at: "2026-02-06",
  },
  {
    id: "MISSION-2025-347",
    title: "大阪湾海蝕現象収束作戦",
    phase: 1,
    status: "IN_SERVICE",
    xp: 100,
    level: 2,
    category: "MODERATE",
    description: "大阪湾で発生した海蝕現象。漂流者3体が迷い込んだが、友好的に対話し帰還を支援。",
    objectives: ["漂流者3体確認 - 友好的", "外事部門による対話開始", "元の次元への帰還支援"],
    assigned_division: "収束部門 第3班",
    issued_by: "収束部門 第3班",
    issued_at: "2026-02-05",
  },
  {
    id: "MISSION-2026-006",
    title: "札幌市郊外漂流者帰還支援",
    phase: 1,
    status: "ACTIVE",
    xp: 50,
    level: 1,
    category: "LOW",
    description: "迷い込んだ漂流者を発見。友好的で、元の次元への帰還を希望している。",
    objectives: ["漂流者発見", "対話により帰還希望を確認"],
    assigned_division: "外事部門",
    issued_by: "外事部門",
    issued_at: "2026-02-06",
  },
  {
    id: "MISSION-2026-007",
    title: "福岡次元境界安定化作業",
    phase: 1,
    status: "OBSERVED",
    xp: 100,
    level: 2,
    category: "MODERATE",
    description: "境界ゲートの安定性が低下。24時間監視体制を敷いている。",
    objectives: ["M-001-α 予防的展開"],
    assigned_division: "港湾部門",
    issued_by: "港湾部門",
    issued_at: "2026-02-06",
  },
  {
    id: "MISSION-2026-008",
    title: "仙台市街地概念侵食対応",
    phase: 1,
    status: "ACTIVE",
    xp: 200,
    level: 4,
    category: "HIGH",
    description: "[機密情報] 概念捕食者の出現が疑われる。付近住民の記憶に異常な欠損が確認されている。",
    objectives: ["[機密] 概念捕食者と推定", "[機密] 隔離エリア設定"],
    assigned_division: "収束部門 全班",
    issued_by: "収束部門 全班",
    issued_at: "2026-02-06",
  },
  {
    id: "MISSION-2026-009",
    title: "沖縄海域不根商人対応",
    phase: 1,
    status: "IN_SERVICE",
    xp: 50,
    level: 1,
    category: "LOW",
    description: "定期的に訪れる不根の行商人と物資交換を実施。",
    objectives: ["物資交換開始"],
    assigned_division: "外事部門",
    issued_by: "外事部門",
    issued_at: "2026-02-06",
  },
  {
    id: "MISSION-2026-010",
    title: "新宿駅地下概念侵食事案",
    phase: 1,
    status: "ACTIVE",
    xp: 200,
    level: 4,
    category: "HIGH",
    description: "新宿駅地下街において、乗客の「記憶」や「方向感覚」が失われる事案が多発。調査の結果、概念捕食者の潜伏を確認。",
    objectives: ["概念捕食者の存在確認", "認識阻害フィールド展開、一般市民の避難開始"],
    assigned_division: "収束部門 第2班",
    issued_by: "収束部門 第2班",
    issued_at: "2026-02-12",
  },
  {
    id: "MISSION-2026-011",
    title: "横浜みなとみらい量子幽霊群発事案",
    phase: 1,
    status: "ACTIVE",
    xp: 100,
    level: 2,
    category: "MODERATE",
    description: "みなとみらいの商業施設において量子幽霊の群発を確認。実害は低いが、電子機器への干渉が問題となっている。",
    objectives: ["量子幽霊7体確認"],
    assigned_division: "収束部門 第3班",
    issued_by: "収束部門 第3班",
    issued_at: "2026-02-14",
  },
  {
    id: "MISSION-2026-012",
    title: "富士研究施設内実体脱走事案",
    phase: 1,
    status: "ACTIVE",
    xp: 200,
    level: 4,
    category: "HIGH",
    description: "富士研究施設の収容房から概念捕食者が脱走。施設内職員の一部が記憶消去被害に。全館封鎖中。",
    objectives: ["施設全館封鎖・全員待機命令", "職員3名が記憶消去被害", "実体を研究棟B-12区画に封じ込め"],
    assigned_division: "収束部門 第1班",
    issued_by: "収束部門 第1班",
    issued_at: "2026-02-16",
  },
  {
    id: "MISSION-2026-013",
    title: "渋谷区夢織り遭遇事案",
    phase: 1,
    status: "IN_SERVICE",
    xp: 100,
    level: 2,
    category: "MODERATE",
    description: "渋谷区内で多数の住民が同一の夢を見る「共鳴夢」現象が発生。夢織りによる無意識への干渉と判断。",
    objectives: ["収束部門 第4班が夢織りを発見・追跡開始", "実体を特定建物内に誘導成功", "次元退避装置を用いた強制帰還開始"],
    assigned_division: "収束部門 第4班",
    issued_by: "収束部門 第4班",
    issued_at: "2026-02-10",
  },
  {
    id: "MISSION-2026-014",
    title: "品川区時間遅延帯出現事案",
    phase: 1,
    status: "IN_SERVICE",
    xp: 100,
    level: 2,
    category: "MODERATE",
    description: "天王洲アイル付近で時間の流れが著しく遅くなる空間が出現。直径約50mの範囲が影響域。",
    objectives: ["調査班派遣。時間遅延帯を確認", "空間安定化フィールド展開", "時間遅延帯の縮小確認"],
    assigned_division: "収束部門 第2班",
    issued_by: "収束部門 第2班",
    issued_at: "2026-02-08",
  },
  {
    id: "MISSION-2026-015",
    title: "秋葉原電気街残響獣徘徊事案",
    phase: 1,
    status: "PENDING",
    xp: 50,
    level: 1,
    category: "LOW",
    description: "秋葉原の深夜、誰もいない路地で正体不明の「音の残像」を複数の警備員が目撃。残響獣と判断し観察中。",
    objectives: ["第3班が現地確認。残響獣を特定"],
    assigned_division: "収束部門 第3班",
    issued_by: "収束部門 第3班",
    issued_at: "2026-02-17",
  },
  {
    id: "MISSION-2025-348",
    title: "大阪市中心部空間裂目出現事案",
    phase: 1,
    status: "IN_SERVICE",
    xp: 200,
    level: 4,
    category: "HIGH",
    description: "梅田地下街において大規模な空間裂目が出現。収束に2日を要した大型案件。",
    objectives: ["大阪府警との連携体制確立（表向きはガス漏れ対応）", "次元境界封鎖モジュール群を展開", "空間裂目の縮小開始"],
    assigned_division: "収束部門 第1班",
    issued_by: "収束部門 第1班",
    issued_at: "2025-11-23",
  },
  {
    id: "MISSION-2025-349",
    title: "北海道・摩周湖鏡面侵食体大量発生事案",
    phase: 1,
    status: "IN_SERVICE",
    xp: 100,
    level: 2,
    category: "MODERATE",
    description: "摩周湖の湖面から鏡面侵食体が大量発生。観光客が巻き込まれそうになるも全員無事。",
    objectives: ["観光地閉鎖（表向きは野鳥調査）", "実体無力化パルスで大量処理開始"],
    assigned_division: "収束部門 第2班",
    issued_by: "収束部門 第2班",
    issued_at: "2025-12-01",
  },
  {
    id: "MISSION-2026-016",
    title: "六本木ヒルズ影泳ぎ複数体事案",
    phase: 1,
    status: "IN_SERVICE",
    xp: 100,
    level: 2,
    category: "MODERATE",
    description: "六本木ヒルズ周辺で影の中に潜む謎の生命体が目撃。警備員数名が一時的に行動不能に。",
    objectives: ["影泳ぎ5体を確認", "ライトトラップ展開。影の消去作戦開始"],
    assigned_division: "収束部門 第4班",
    issued_by: "収束部門 第4班",
    issued_at: "2026-01-29",
  },
  {
    id: "MISSION-2026-017",
    title: "仙台市記憶喰らい連続被害事案",
    phase: 1,
    status: "ACTIVE",
    xp: 100,
    level: 2,
    category: "MODERATE",
    description: "仙台市内で過去2週間にわたり、長期記憶が突然失われる患者が続出。記憶喰らいによる被害と断定。",
    objectives: ["外縁部門の情報収集班が被害パターンを分析"],
    assigned_division: "収束部門 第3班",
    issued_by: "収束部門 第3班",
    issued_at: "2026-02-18",
  },
];

// ─────────────────────────────────────────────────────────────────────
// 施設（外部データ統合版）
// ─────────────────────────────────────────────────────────────────────

export const FACILITIES: Facility[] = [
  {
    id: "loc-001",
    name: "東京本部",
    code: "LOC-001",
    location: "35.6762°N, 139.6503°E",
    status: "RESTRICTED",
    clearance: 5,
    type: "本部施設",
    description: "機関の中央本部。地下15階まで続く巨大施設。",
    staff: null,
    established: "2018-01-01",
    equipment_installed: ["指揮室", "研究所", "訓練場", "医療施設", "収容施設"],
    divisions_present: [],
    notes: "",
  },
  {
    id: "loc-002",
    name: "横浜港次元ゲート",
    code: "LOC-002",
    location: "35.4437°N, 139.6380°E",
    status: "OPERATIONAL",
    clearance: 4,
    type: "次元ゲート",
    description: "階宙次元への主要な出入口の一つ。常時監視体制。",
    staff: null,
    established: "2018-01-01",
    equipment_installed: ["ゲート施設", "検問所", "倉庫"],
    divisions_present: [],
    notes: "",
  },
  {
    id: "loc-003",
    name: "新宿監視ステーション",
    code: "LOC-003",
    location: "35.6896°N, 139.6920°E",
    status: "OPERATIONAL",
    clearance: 3,
    type: "監視施設",
    description: "東京都心部の次元異常を監視する前線基地。",
    staff: null,
    established: "2018-01-01",
    equipment_installed: ["監視室", "緊急対応設備", "小規模医療室"],
    divisions_present: [],
    notes: "",
  },
  {
    id: "loc-004",
    name: "富士研究施設",
    code: "LOC-004",
    location: "35.3606°N, 138.7274°E",
    status: "RESTRICTED",
    clearance: 5,
    type: "研究施設",
    description: "機密レベルの高い研究を行う隔離施設。",
    staff: null,
    established: "2018-01-01",
    equipment_installed: ["高度研究室", "実体収容房", "実験場"],
    divisions_present: [],
    notes: "",
  },
];

// ─────────────────────────────────────────────────────────────────────
// エンティティ（外部データ統合版）
// ─────────────────────────────────────────────────────────────────────

export const ENTITIES: Entity[] = [
  {
    id: "ent-001",
    designation: "漂流者",
    code: "E-001",
    threat: "LOW",
    clearance: 1,
    status: "OBSERVED",
    classification: "safe",
    description: "階宙次元から迷い込んだ知性体。敵対性は低い。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "対話による誘導が可能。元の次元への帰還を支援することで自主的に退去する。",
    observed_abilities: ["目的もなく徘徊する。人間を発見すると興味を示すが、攻撃はしない。", "半透明の人型。顔の特徴は不明瞭で、常に漂うように移動する。"],
    related_entities: [],
  },
  {
    id: "ent-002",
    designation: "波喰い",
    code: "E-002",
    threat: "HIGH",
    clearance: 3,
    status: "ACTIVE",
    classification: "danger",
    description: "海蝕現象そのものを捕食する異常存在。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "実体無力化パルスが有効。ただし複数体が同時出現することが多く、制圧は困難。",
    observed_abilities: ["海蝕現象が発生すると出現し、その場のエネルギーを吸収する。満腹になるまで移動しない。", "黒い霧状の集合体。中心に無数の目のような発光体を持つ。"],
    related_entities: [],
  },
  {
    id: "ent-003",
    designation: "鏡面侵食体",
    code: "E-003",
    threat: "MODERATE",
    clearance: 2,
    status: "OBSERVED",
    classification: "caution",
    description: "対象の姿を模倣し、その存在を侵食する寄生型実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "次元共鳴パターンの微細な違いで識別可能。発見次第、即座に隔離・無力化が必要。",
    observed_abilities: ["宿主の記憶と人格を徐々に吸収し、最終的に入れ替わる。本物との区別は困難。", "初期は無形。接触した生物の外見を完全にコピーする。"],
    related_entities: [],
  },
  {
    id: "ent-004",
    designation: "時間遅延帯",
    code: "E-004",
    threat: "MODERATE",
    clearance: 2,
    status: "OBSERVED",
    classification: "caution",
    description: "周囲の時間流を著しく遅延させる現象型実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "時空間歪曲装置で相殺可能。ただし高度な技術と経験が必要。",
    observed_abilities: ["移動せず、その場に留まり続ける。接近した物体は自動的に取り込まれる。", "淡い青白い光の球体。内部では時間が通常の1/100の速度で流れる。"],
    related_entities: [],
  },
  {
    id: "ent-005",
    designation: "概念捕食者",
    code: "E-005",
    threat: "CRITICAL",
    clearance: 5,
    status: "CLASSIFIED",
    classification: "classified",
    description: "[機密] 抽象概念そのものを捕食する高次元存在。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "[LEVEL 5以上] 現在、完全な収束手段は確立されていない。接触を避けることが最優先。",
    observed_abilities: ["詳細不明"],
    related_entities: [],
  },
  {
    id: "ent-006",
    designation: "不根の行商人",
    code: "E-006",
    threat: "LOW",
    clearance: 1,
    status: "OBSERVED",
    classification: "safe",
    description: "次元間を移動する商人。友好的だが、取引には注意が必要。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "友好的であれば収束不要。ただし不当な取引には外事部門が介入する。",
    observed_abilities: ["「取引」を好む。物品だけでなく、記憶や感情も商品として扱う。", "人間に似た姿だが、目が3つある。常に大きな荷物を背負っている。"],
    related_entities: [],
  },
  {
    id: "ent-007",
    designation: "影泳ぎ",
    code: "E-007",
    threat: "MODERATE",
    clearance: 2,
    status: "OBSERVED",
    classification: "caution",
    description: "影の中を自由に移動する捕食性実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "強力な照明で影を消すことで無力化。夜間作業では特に警戒が必要。",
    observed_abilities: ["光源を避け、影の中に潜む。獲物が影に入ると襲撃する。", "文字通りの影。三次元的な形状を持たず、平面上を滑るように移動。"],
    related_entities: [],
  },
  {
    id: "ent-008",
    designation: "記憶喰らい",
    code: "E-008",
    threat: "HIGH",
    clearance: 3,
    status: "ACTIVE",
    classification: "danger",
    description: "人間の記憶を摂取し、それを糧とする精神寄生体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "記憶固定装置の着用で防御可能。発見は困難だが、生体スキャナーで検出できる。",
    observed_abilities: ["睡眠中の人間に憑依し、夢を通じて記憶を吸収。被害者は記憶喪失に陥る。", "ほぼ透明。精神集中時のみ薄い人型のシルエットとして視認可能。"],
    related_entities: [],
  },
  {
    id: "ent-009",
    designation: "共鳴体",
    code: "E-009",
    threat: "LOW",
    clearance: 1,
    status: "OBSERVED",
    classification: "safe",
    description: "周囲の音を増幅・変調する非敵対的実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "無害のため収束不要。ただし機密会話の盗聴リスクあり。",
    observed_abilities: ["音波に反応し、それを美しいハーモニーに変換する。人間の声に特に反応。", "透明な球体。内部で複雑な幾何学模様が絶えず変化している。"],
    related_entities: [],
  },
  {
    id: "ent-010",
    designation: "空間裂目",
    code: "E-010",
    threat: "HIGH",
    clearance: 3,
    status: "ACTIVE",
    classification: "danger",
    description: "空間そのものを引き裂く移動性の亀裂。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "空間安定化フィールドと次元境界封鎖の併用が必須。完全な消滅は困難。",
    observed_abilities: ["不規則に移動し、接触した物体を別次元へ吸い込む。戻ることはほぼ不可能。", "空中を漂う黒い裂け目。周囲の光が歪み、重力異常を引き起こす。"],
    related_entities: [],
  },
  {
    id: "ent-011",
    designation: "結晶蜘蛛",
    code: "E-011",
    threat: "MODERATE",
    clearance: 2,
    status: "OBSERVED",
    classification: "caution",
    description: "次元エネルギーを結晶化し、巣を作る蜘蛛型実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "巣の除去には専用の溶解剤が必要。蜘蛛本体は物理攻撃で破壊可能。",
    observed_abilities: ["次元の歪みが強い場所に巣を作る。巣は美しいが、触れると次元に引き込まれる。", "透明な結晶でできた蜘蛛。体長は約30cm。脚は8本。"],
    related_entities: [],
  },
  {
    id: "ent-012",
    designation: "感情寄生虫",
    code: "E-012",
    threat: "LOW",
    clearance: 1,
    status: "OBSERVED",
    classification: "safe",
    description: "人間の負の感情を吸収して成長する微小実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "有益な共生関係を築くため、駆除不要。ただし過剰繁殖は精神的無感覚を招く。",
    observed_abilities: ["ストレスや不安を吸収する。結果として宿主の精神状態は改善される。", "肉眼では見えない。顕微鏡下では半透明の小さな球体。"],
    related_entities: [],
  },
  {
    id: "ent-013",
    designation: "次元渡りの鳥",
    code: "E-013",
    threat: "LOW",
    clearance: 1,
    status: "OBSERVED",
    classification: "safe",
    description: "次元間を自由に飛行する鳥型実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "無害のため観察のみ。稀に迷子になった個体を元の次元へ誘導する。",
    observed_abilities: ["次元境界を自由に往来し、複数の世界で採餌する。人間には無関心。", "虹色の羽根を持つ鳥。尾が長く、飛行時に光の軌跡を残す。"],
    related_entities: [],
  },
  {
    id: "ent-014",
    designation: "真実の瞳",
    code: "E-014",
    threat: "MODERATE",
    clearance: 2,
    status: "OBSERVED",
    classification: "caution",
    description: "見つめた対象の本質を暴く巨大な眼球型実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "視線を遮ることで無力化。鏡を使った反射は危険（自己に真実が跳ね返る）。",
    observed_abilities: ["対象を凝視し、隠された真実や嘘を暴露する。精神的ダメージを与えることも。", "直径約2mの巨大な眼球。虹彩は常に変化し、見る者の心を映す。"],
    related_entities: [],
  },
  {
    id: "ent-015",
    designation: "時間の子供",
    code: "E-015",
    threat: "UNKNOWN",
    clearance: 5,
    status: "CLASSIFIED",
    classification: "classified",
    description: "[機密] 時間そのものから生まれた存在。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "[LEVEL 5] 接触禁止。観測のみ。時空間歪曲装置は効果なし。",
    observed_abilities: ["詳細不明"],
    related_entities: [],
  },
  {
    id: "ent-016",
    designation: "不根の密輸業者",
    code: "E-016",
    threat: "MODERATE",
    clearance: 2,
    status: "OBSERVED",
    classification: "caution",
    description: "禁制品を次元間で密輸する不根の犯罪者集団。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "外事部門が監視・取締を実施。武力衝突のリスクあり。港湾部門と連携が必須。",
    observed_abilities: ["次元間の法の抜け穴を利用して違法取引を行う。機関との衝突も辞さない。", "一般的な不根の姿だが、武装していることが多い。"],
    related_entities: [],
  },
  {
    id: "ent-017",
    designation: "虚無の使者",
    code: "E-017",
    threat: "CRITICAL",
    clearance: 3,
    status: "ACTIVE",
    classification: "danger",
    description: "存在そのものを消去する力を持つ恐るべき実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "実体無力化パルスと次元境界封鎖の同時使用が必要。極めて危険。",
    observed_abilities: ["接触した物質を存在ごと消去する。目的は不明だが、無差別に破壊を行う。", "人型の輪郭だが、内部は完全な虚無。光さえ吸収する。"],
    related_entities: [],
  },
  {
    id: "ent-018",
    designation: "夢織り",
    code: "E-018",
    threat: "LOW",
    clearance: 1,
    status: "OBSERVED",
    classification: "safe",
    description: "人々の夢を実体化させる芸術家肌の実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "友好的。創作活動を監視する程度で十分。悪夢の実体化には注意が必要。",
    observed_abilities: ["眠る人間の夢を感知し、それを一時的な実体として創造する。芸術作品として扱う。", "人間に近い姿。体は半透明で、内部に星空のような光が見える。"],
    related_entities: [],
  },
  {
    id: "ent-019",
    designation: "残響獣",
    code: "E-019",
    threat: "MODERATE",
    clearance: 2,
    status: "OBSERVED",
    classification: "caution",
    description: "過去の出来事の「残響」から生まれる獣型実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "残滓回収システムで吸収可能。または時間経過で自然消滅する。",
    observed_abilities: ["生まれた場所で同じ出来事を繰り返し再現する。攻撃的だが知能は低い。", "半透明の獣。形状は出来事によって変化（戦争→狼、事故→蛇など）。"],
    related_entities: [],
  },
  {
    id: "ent-020",
    designation: "量子幽霊",
    code: "E-020",
    threat: "UNKNOWN",
    clearance: 5,
    status: "CLASSIFIED",
    classification: "classified",
    description: "[機密] 量子レベルで存在する観測不可能な実体。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "[LEVEL 5] 研究中。現状では対処法なし。観測を避けることが唯一の対策。",
    observed_abilities: ["[観測不可能] 理論上は存在するが視認できない。"],
    related_entities: [],
  },
  {
    id: "ent-021",
    designation: "次元の錨",
    code: "E-021",
    threat: "LOW",
    clearance: 1,
    status: "OBSERVED",
    classification: "safe",
    description: "特定の場所に固着し、周辺の次元境界を安定化させる固着型知性体。危険性は低く、存在することで実体の侵入を防ぐ側面もある。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "基本的に保護対象として扱う。移動は不可能ではないが、強制移動は境界不安定化を招く恐れがある。",
    observed_abilities: ["固着して動かない。触れると微細な振動を放出。周囲の次元境界を強化する効果がある。", "岩石に似た外観。半透明で、内部に青白い光が揺らめいている。サイズは多様（数センチから数メートル）。"],
    related_entities: [],
  },
  {
    id: "ent-022",
    designation: "光食い",
    code: "E-022",
    threat: "MODERATE",
    clearance: 2,
    status: "OBSERVED",
    classification: "caution",
    description: "可視光を栄養源とする異次元生命体。光を吸収することで成長し、完全な暗闇を作り出す。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "強力なUV照射による飽和攻撃が有効。照射量を超えると逃走する。完全遮光環境では活動が停滞する。",
    observed_abilities: ["光源に引き寄せられる。吸収した光は次元の向こうへ放出している。成長すると完全遮光域を形成する。", "完全な黒体。形は定まらず、光が当たるとさらに黒くなる。周囲の光を吸収するため、視認が難しい。"],
    related_entities: [],
  },
  {
    id: "ent-023",
    designation: "言葉喰らい",
    code: "E-023",
    threat: "HIGH",
    clearance: 3,
    status: "ACTIVE",
    classification: "danger",
    description: "音声言語を捕食する高度知性体。言葉を奪われた対象は発話不能になる。コミュニケーション能力が高く、人間社会への潜入が危惧される。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "筆談や手話など非音声コミュニケーションを使うこと。音声言語での接触厳禁。視線を合わせると言葉を奪われるリスクあり。",
    observed_abilities: ["対話を好む。言葉に触れるとそれを吸収し、対象が発話できなくなる。吸収した言語を操り、偽情報を流す。", "人間に酷似した外見を持てる。ただし声は出さず、唇だけが動く。目が細く、虹彩が薄い。"],
    related_entities: [],
  },
  {
    id: "ent-024",
    designation: "感覚置換体",
    code: "E-024",
    threat: "MODERATE",
    clearance: 2,
    status: "OBSERVED",
    classification: "caution",
    description: "接触した対象の感覚を入れ替える球体状の実体。視覚と聴覚、触覚と嗅覚などを置換し、対象を混乱させる。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "防護スーツ着用で接触を避ける。網状の収容容器で捕獲可能。無害なため帰還より研究が推奨される。",
    observed_abilities: ["生き物に触れると感覚を置換する。意図的な行動か否か不明。置換は数時間で自然に戻る。", "半径20cm程度の半透明な球体。ゆっくりと浮遊する。近づくと虹色の光を放つ。"],
    related_entities: [],
  },
  {
    id: "ent-025",
    designation: "確率の子",
    code: "E-025",
    threat: "UNKNOWN",
    clearance: 5,
    status: "CLASSIFIED",
    classification: "classified",
    description: "存在確率が不定の超次元実体。観測するたびに異なる姿を持つ。現時点では機関の観測能力の限界を超えており、分類は仮。",
    first_detected: "2020-01-01",
    neutralized: 0,
    containment_protocol: "収容プロトコル未確立。接触報告があった場合は即時上層部報告。単独での対処は禁止。",
    observed_abilities: ["不明。観測の都度、行動パターンが変わる。唯一の一貫性は「観測されることを好む」ように見える点。", "毎回異なる。人型であることも、ガス状であることも、数学的パターンとして現れることもある。"],
    related_entities: [],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 装備（modules-data.json 統合版）
// ─────────────────────────────────────────────────────────────────────

export const EQUIPMENT: Equipment[] = [
  {
    id: "mod-001",
    name: "空間安定化フィールド",
    code: "M-001-α",
    category: "収束モジュール",
    status: "IN_SERVICE",
    clearance: 1,
    quantity: null,
    description: "次元の歪みを抑制し、空間の安定性を高めるための基本モジュール。",
    weight: "—",
    issued_by: "工作部門",
    specifications: {"範囲": "半径20m", "持続時間": "15分", "エネルギー消費": "中"},
    maintenance_cycle: "連続使用は30分以内に制限。過度な使用は装置の劣化を招く。",
  },
  {
    id: "mod-002",
    name: "次元境界封鎖",
    code: "M-002-β",
    category: "収束モジュール",
    status: "LIMITED",
    clearance: 2,
    quantity: null,
    description: "階宙次元への通路を一時的に封鎖し、海蝕実体の侵入を防ぐ。",
    weight: "—",
    issued_by: "工作部門",
    specifications: {"範囲": "半径50m", "持続時間": "30分", "エネルギー消費": "高"},
    maintenance_cycle: "使用中は機関員の次元移動も不可能になる。緊急時以外の使用を禁止。",
  },
  {
    id: "mod-003",
    name: "実体無力化パルス",
    code: "M-003-γ",
    category: "収束モジュール",
    status: "RESTRICTED",
    clearance: 3,
    quantity: null,
    description: "海蝕実体の存在基盤を破壊する高出力パルス波を発生させる。",
    weight: "—",
    issued_by: "工作部門",
    specifications: {"範囲": "半径10m", "持続時間": "瞬間", "エネルギー消費": "超高"},
    maintenance_cycle: "周辺の電子機器に深刻なダメージを与える。使用時は半径100m以内の避難が必須。",
  },
  {
    id: "mod-004",
    name: "時空間歪曲装置",
    code: "M-004-δ",
    category: "収束モジュール",
    status: "CLASSIFIED",
    clearance: 5,
    quantity: null,
    description: "局所的な時空間の流れを操作し、海蝕現象の進行を遅延させる。",
    weight: "—",
    issued_by: "工作部門 - 機密プロジェクト",
    specifications: {"範囲": "半径5m", "持続時間": "5分（体感時間: 1時間）", "エネルギー消費": "極高"},
    maintenance_cycle: "[機密情報] 使用者は重度の時間感覚喪失症を経験する可能性あり。LEVEL 4以上の許可必須。",
  },
  {
    id: "mod-005",
    name: "残滓回収システム",
    code: "M-005-ε",
    category: "収束モジュール",
    status: "IN_SERVICE",
    clearance: 1,
    quantity: null,
    description: "海蝕現象収束後に残る残滓を安全に回収・保管するための装置。",
    weight: "—",
    issued_by: "工作部門",
    specifications: {"範囲": "半径15m", "持続時間": "10分", "エネルギー消費": "低"},
    maintenance_cycle: "残滓の種類によっては予期しない反応を示す可能性あり。防護装備の着用を推奨。",
  },
  {
    id: "mod-006",
    name: "認識阻害フィールド",
    code: "M-006-ζ",
    category: "収束モジュール",
    status: "LIMITED",
    clearance: 2,
    quantity: null,
    description: "一般市民の認識から海蝕現象を隠蔽するための精神干渉装置。",
    weight: "—",
    issued_by: "外事部門・工作部門共同",
    specifications: {"範囲": "半径100m", "持続時間": "1時間", "エネルギー消費": "中"},
    maintenance_cycle: "機関員自身も影響を受ける可能性あり。使用時は必ず除外タグを装着すること。",
  },
  {
    id: "mod-007",
    name: "次元共鳴増幅器",
    code: "M-007-η",
    category: "収束モジュール",
    status: "RESTRICTED",
    clearance: 3,
    quantity: null,
    description: "残滓のエネルギーを増幅し、より強力な収束効果を発揮する。",
    weight: "—",
    issued_by: "工作部門",
    specifications: {"範囲": "半径30m", "持続時間": "20分", "エネルギー消費": "超高"},
    maintenance_cycle: "暴走時は周辺一帯が海蝕化する危険性あり。LEVEL 3以上の機関員のみ使用可。",
  },
  {
    id: "mod-008",
    name: "生体保護シールド",
    code: "M-008-θ",
    category: "収束モジュール",
    status: "IN_SERVICE",
    clearance: 1,
    quantity: null,
    description: "海蝕現象による生体への直接的な影響を軽減する防護フィールド。",
    weight: "—",
    issued_by: "支援部門",
    specifications: {"範囲": "個人", "持続時間": "1時間", "エネルギー消費": "低"},
    maintenance_cycle: "完全な防護ではない。長時間の暴露は避けること。",
  },
  {
    id: "mod-009",
    name: "次元探査ドローン",
    code: "M-009-ι",
    category: "収束モジュール",
    status: "IN_SERVICE",
    clearance: 1,
    quantity: null,
    description: "階宙次元内部を探査し、リアルタイムでデータを送信する自律型ドローン。",
    weight: "—",
    issued_by: "工作部門・支援部門共同",
    specifications: {"範囲": "次元間移動可能", "持続時間": "6時間（バッテリー寿命）", "エネルギー消費": "中"},
    maintenance_cycle: "階宙次元内での通信は不安定。ドローン喪失のリスクあり。",
  },
  {
    id: "mod-010",
    name: "記憶固定装置",
    code: "M-010-κ",
    category: "収束モジュール",
    status: "LIMITED",
    clearance: 2,
    quantity: null,
    description: "認識阻害や記憶改変の影響を受けないよう、記憶を固定する装置。",
    weight: "—",
    issued_by: "外事部門",
    specifications: {"範囲": "個人", "持続時間": "24時間", "エネルギー消費": "低"},
    maintenance_cycle: "長期使用は頭痛や集中力低下を引き起こす。48時間以上の連続使用は禁止。",
  },
  {
    id: "mod-011",
    name: "量子通信機",
    code: "M-011-λ",
    category: "収束モジュール",
    status: "IN_SERVICE",
    clearance: 1,
    quantity: null,
    description: "次元の壁を越えて通信できる量子もつれを利用した通信機。",
    weight: "—",
    issued_by: "工作部門",
    specifications: {"範囲": "無制限", "持続時間": "常時稼働", "エネルギー消費": "低"},
    maintenance_cycle: "量子もつれは脆弱。衝撃を与えると通信不能になる可能性あり。",
  },
  {
    id: "mod-012",
    name: "次元座標固定杭",
    code: "M-012-μ",
    category: "収束モジュール",
    status: "IN_SERVICE",
    clearance: 1,
    quantity: null,
    description: "特定の次元座標を固定し、安定したゲートポイントを作成する。",
    weight: "—",
    issued_by: "港湾部門",
    specifications: {"範囲": "設置地点", "持続時間": "永続（保守必要）", "エネルギー消費": "初期高・維持低"},
    maintenance_cycle: "座標のずれは重大事故に繋がる。月1回の校正が必須。",
  },
  {
    id: "mod-013",
    name: "実体拘束網",
    code: "M-013-ν",
    category: "収束モジュール",
    status: "LIMITED",
    clearance: 2,
    quantity: null,
    description: "海蝕実体を物理的に拘束するエネルギー網。",
    weight: "—",
    issued_by: "収束部門",
    specifications: {"範囲": "半径25m", "持続時間": "10分", "エネルギー消費": "高"},
    maintenance_cycle: "高知性実体は網を破る可能性あり。併用モジュールの準備を推奨。",
  },
  {
    id: "mod-014",
    name: "緊急次元退避装置",
    code: "M-014-ξ",
    category: "収束モジュール",
    status: "IN_SERVICE",
    clearance: 1,
    quantity: null,
    description: "危機的状況で使用者を安全な次元へ即座に転送する。",
    weight: "—",
    issued_by: "支援部門",
    specifications: {"範囲": "個人", "持続時間": "一回限り", "エネルギー消費": "極高"},
    maintenance_cycle: "使用後は装置が破損し再使用不可。本部への帰還は別途支援が必要。",
  },
  {
    id: "mod-015",
    name: "残滓エネルギー変換炉",
    code: "M-015-ο",
    category: "収束モジュール",
    status: "RESTRICTED",
    clearance: 3,
    quantity: null,
    description: "回収した残滓を実用エネルギーに変換する実験的装置。",
    weight: "—",
    issued_by: "工作部門 - 研究チーム",
    specifications: {"範囲": "施設固定型", "持続時間": "連続稼働", "エネルギー消費": "自己発電"},
    maintenance_cycle: "暴走時は次元崩壊を引き起こす。厳重な監視下でのみ稼働許可。",
  },
  {
    id: "mod-016",
    name: "生体スキャナー",
    code: "M-016-π",
    category: "収束モジュール",
    status: "IN_SERVICE",
    clearance: 1,
    quantity: null,
    description: "対象の次元共鳴パターンを解析し、実体・人間・不根を判別する。",
    weight: "—",
    issued_by: "支援部門",
    specifications: {"範囲": "半径30m", "持続時間": "即座", "エネルギー消費": "低"},
    maintenance_cycle: "高度な擬態には無効な場合あり。過信は禁物。",
  },
  {
    id: "mod-017",
    name: "時間記録装置",
    code: "M-017-ρ",
    category: "収束モジュール",
    status: "LIMITED",
    clearance: 2,
    quantity: null,
    description: "時間遅延帯などの影響下でも正確な時刻を記録し続ける。",
    weight: "—",
    issued_by: "工作部門",
    specifications: {"範囲": "個人", "持続時間": "永続", "エネルギー消費": "極低"},
    maintenance_cycle: "物理的破損に弱い。取り扱いは慎重に。",
  },
  {
    id: "mod-018",
    name: "次元障壁強化剤",
    code: "M-018-σ",
    category: "収束モジュール",
    status: "IN_SERVICE",
    clearance: 1,
    quantity: null,
    description: "既存の次元境界を強化し、海蝕現象の発生を予防する。",
    weight: "—",
    issued_by: "収束部門",
    specifications: {"範囲": "半径100m", "持続時間": "72時間", "エネルギー消費": "中"},
    maintenance_cycle: "過度の散布は次元の硬化を招き、正規の次元移動も困難になる。",
  },
  {
    id: "mod-019",
    name: "概念固定アンカー",
    code: "M-019-τ",
    category: "収束モジュール",
    status: "CLASSIFIED",
    clearance: 5,
    quantity: null,
    description: "[機密] 抽象概念を物理的に固定し、概念捕食者から保護する。",
    weight: "—",
    issued_by: "工作部門 - 特殊プロジェクト",
    specifications: {"範囲": "半径50m", "持続時間": "1時間", "エネルギー消費": "極高"},
    maintenance_cycle: "[最高機密] 副作用として使用者の自我が不安定になる。精神鑑定後のみ使用許可。",
  },
  {
    id: "mod-020",
    name: "多次元投影装置",
    code: "M-020-υ",
    category: "収束モジュール",
    status: "RESTRICTED",
    clearance: 3,
    quantity: null,
    description: "使用者の意識を複数の次元に同時投影し、広範囲の監視を可能にする。",
    weight: "—",
    issued_by: "外事部門",
    specifications: {"範囲": "意識投影: 無制限", "持続時間": "30分", "エネルギー消費": "極高"},
    maintenance_cycle: "投影中の本体は無防備。必ず保護下で使用すること。投影時間超過は人格崩壊のリスクあり。",
  },
];

// ─────────────────────────────────────────────────────────────────────
// 人事ファイル（外部データ統合版）
// ─────────────────────────────────────────────────────────────────────

export const PERSONNEL: Personnel[] = [
  {
    id: "K-001-234",
    codename: "K-001-234",
    real_name: "佐藤 修一",
    role: "班長",
    division: "収束部門 第1班",
    clearance: 3,
    status: "ACTIVE",
    joined: "2019-04-01",
    last_seen: "—",
    specialization: "次元物理学、実体無力化",
    notes: "東京湾の案件、思ったより厄介だ。波喰いが3体も同時に出現するなんて前例がない。パルスで2体は無力化できたが、残り1体は深海に逃げた。追跡するには潜水装備が必要だが、予算が…。今日は遅くなったので、娘の…",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["品川駅次元亀裂封鎖作戦 指揮（2025年12月）", "実体無力化パルス改良プロジェクト 主任研究者", "収束成功率 94.2%（部門平均 87.3%）"],
    incident_flags: [],
  },
  {
    id: "K-002-101",
    codename: "K-002-101",
    real_name: "高橋 愛",
    role: "主任",
    division: "支援部門",
    clearance: 3,
    status: "ACTIVE",
    joined: "2020-08-15",
    last_seen: "—",
    specialization: "医療支援、心理ケア",
    notes: "東京湾の案件で佐藤班をサポート。彼の表情が険しい。品川の事件以来、彼は変わってしまった。あの日、私も現場にいた。木村さんが亀裂に吸い込まれる瞬間を見た。今でも夢に見る。佐藤さんはもっと辛いはずだ。今日…",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["機関員メンタルヘルスプログラム 開発", "現場医療プロトコル 標準化", "死傷者ゼロ記録 320日達成（2024年）"],
    incident_flags: [],
  },
  {
    id: "K-004-034",
    codename: "K-004-034",
    real_name: "佐々木 美咲",
    role: "交渉官",
    division: "外事部門",
    clearance: 3,
    status: "ACTIVE",
    joined: "2018-06-01",
    last_seen: "—",
    specialization: "異次元外交、テレパシー通信",
    notes: "横浜港の不根対応。今回の彼らは少し警戒心が強かった。でも、最終的には理解し合えた。不根との対話はいつも興味深い。彼らの文化、価値観、すべてが新鮮だ。この仕事の醍醐味は、異なる存在との出会いにある。今日…",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["不根との平和的交渉成功率 98.7%", "漂流者帰還支援 累計47件", "異次元言語習得数 12言語"],
    incident_flags: [],
  },
  {
    id: "K-003-089",
    codename: "K-003-089",
    real_name: "中村 健太郎",
    role: "技術主任",
    division: "工作部門",
    clearance: 3,
    status: "ACTIVE",
    joined: "2016-03-01",
    last_seen: "—",
    specialization: "モジュール開発、次元工学",
    notes: "富士山の時空歪曲、やはりM-004-δが必要だった。あの装置は私の最高傑作だが、同時に最も危険な発明でもある。時間を操作するということは、神の領域に踏み込むことだ。使うたびに、罪悪感を覚える。でも、人…",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["M-004-δ 時空間歪曲装置 開発", "M-007-η 次元共鳴増幅器 改良", "特許取得数 23件"],
    incident_flags: [],
  },
  {
    id: "K-005-045",
    codename: "K-005-045",
    real_name: "山本 直樹",
    role: "監視官",
    division: "港湾部門",
    clearance: 3,
    status: "ACTIVE",
    joined: "2014-05-01",
    last_seen: "—",
    specialization: "境界ゲート監視、海洋次元学",
    notes: "新潟沖のゲート監視。今日で2日目。ゲートの開閉周期が不規則になってきた。何かの前兆か？経験上、こういう時は要注意だ。海は静かだが、次元の向こう側で何かが動いている気がする。今夜は監視船に泊まり込みだ。",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["境界ゲート早期発見システム 開発", "不根船舶監視プロトコル 確立", "海上次元異常検知 累計312件"],
    incident_flags: [],
  },
  {
    id: "K-001-178",
    codename: "K-001-178",
    real_name: "伊藤 賢治",
    role: "班長",
    division: "収束部門 第2班",
    clearance: 3,
    status: "ACTIVE",
    joined: "2017-09-01",
    last_seen: "—",
    specialization: "時空間操作、高難度収束",
    notes: "富士山の時間遅延帯、予想以上に強力だ。M-004-δをフル出力で12時間稼働させる必要がある。装置の負荷が心配だが、登山者3名の命がかかっている。彼らは内部で数秒しか時間が経っていない。救出できれば、…",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["時空間歪曲事案 収束成功率 91.8%", "M-004-δ 実戦運用 第一人者", "高難度案件 担当数 78件"],
    incident_flags: [],
  },
  {
    id: "K-006-077",
    codename: "K-006-077",
    real_name: "田中 梓",
    role: "班員（新人）",
    division: "収束部門 第1班",
    clearance: 3,
    status: "ACTIVE",
    joined: "2025-10-01",
    last_seen: "—",
    specialization: "生物学、実体識別",
    notes: "初任務が終わった。夢織りは想像より穏やかな生き物だった。佐藤班長は厳しいけど、ちゃんと私の判断を信頼してくれた。この仕事を選んで良かったと思う。でも本当に怖かった。次はもっとうまくやれると思う。",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["研修課程成績 首席（2025年度）", "初任務：渋谷区夢織り事案に参加（2026年2月）"],
    incident_flags: [],
  },
  {
    id: "K-007-092",
    codename: "K-007-092",
    real_name: "木村 聡",
    role: "班員",
    division: "収束部門 第2班",
    clearance: 3,
    status: "ACTIVE",
    joined: "2021-04-01",
    last_seen: "—",
    specialization: "化学、モジュール整備",
    notes: "退院して最初に書く日記。大阪の件、空間裂目に接触したあの瞬間は本当に意識が消えるかと思った。でも不思議と後悔はない。市民を全員逃がせたんだから。机の上に表彰状が置いてあった。重たい。",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["大阪梅田案件で負傷しながらも次元境界封鎖を維持（2025年11月）", "機関長表彰（2025年12月）"],
    incident_flags: [],
  },
  {
    id: "K-008-156",
    codename: "K-008-156",
    real_name: "鈴木 冬子",
    role: "主任分析官",
    division: "支援部門",
    clearance: 3,
    status: "ACTIVE",
    joined: "2018-07-01",
    last_seen: "—",
    specialization: "データ分析、次元異常予測",
    notes: "今日もデータと格闘。富士施設の概念捕食者脱走、予測モデルでは0.3%の確率だった。低い確率のはずだが現実に起きてしまった。モデルを修正する必要がある。統計的に稀な事象ほど重要なのだから。",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["次元異常予測アルゴリズム開発（予測精度87%達成）", "年間データ処理量部門最高記録（2024年）"],
    incident_flags: [],
  },
  {
    id: "K-009-044",
    codename: "K-009-044",
    real_name: "松本 怜",
    role: "技術主任",
    division: "工作部門",
    clearance: 3,
    status: "ACTIVE",
    joined: "2016-01-01",
    last_seen: "—",
    specialization: "精密機械工学、モジュール開発",
    notes: "概念捕食者の脱走で自分が作ったM-019の出番が来た。まだプロトタイプ段階だが、実戦投入になるかもしれない。設計者として不安と興奮が混じった妙な感覚。ちゃんと動いてくれよ。",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["M-019 概念固定アンカー 開発主任（2024年）", "全現行モジュールの30%以上の改良に関与"],
    incident_flags: [],
  },
  {
    id: "K-010-211",
    codename: "K-010-211",
    real_name: "橋本 千恵",
    role: "情報収集員",
    division: "外縁部門",
    clearance: 4,
    status: "ACTIVE",
    joined: "2023-04-01",
    last_seen: "—",
    specialization: "社会潜入、情報分析",
    notes: "[暗号化済み] 仙台での調査3日目。記者として地元病院に潜入。被害者の証言で共通点を発見。全員が「ある特定の路地」を通っていた。地図に記す。",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["仙台記憶喰らい案件の情報収集で被害者パターン特定に貢献（2026年）"],
    incident_flags: [],
  },
  {
    id: "K-011-033",
    codename: "K-011-033",
    real_name: "中島 武",
    role: "班長",
    division: "収束部門 第3班",
    clearance: 3,
    status: "ACTIVE",
    joined: "2012-04-01",
    last_seen: "—",
    specialization: "近接戦闘、実体無力化",
    notes: "秋葉原の残響獣。機関員歴13年、こんな案件は初めてだ。敵でも脅威でもない。ただそこにいる。田中が「かわいい」と言っていたが、報告書には書かないよう指示した。まあ、俺も思ったが。",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["通算90件以上の収束作戦に参加", "機関員最多実体無力化記録保持（推定347体）"],
    incident_flags: [],
  },
  {
    id: "K-012-098",
    codename: "K-012-098",
    real_name: "遠藤 光",
    role: "医療主任",
    division: "支援部門",
    clearance: 3,
    status: "ACTIVE",
    joined: "2020-08-01",
    last_seen: "—",
    specialization: "神経外科、次元障害治療",
    notes: "富士施設から概念捕食者の被害者3名が送られてきた。記憶消去の程度はまちまちだが、最悪の一人は10年分が消えている。家族の顔も。治療法はある。でも時間がかかる。今夜は長い。",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["次元接触後症候群の治療プロトコル確立（2023年）", "機関員の業務起因傷病完全回復率 97.2%"],
    incident_flags: [],
  },
  {
    id: "K-013-067",
    codename: "K-013-067",
    real_name: "小林 隆之",
    role: "部門長",
    division: "外縁部門",
    clearance: 4,
    status: "ACTIVE",
    joined: "2010-04-01",
    last_seen: "—",
    specialization: "情報戦略、隠蔽工作",
    notes: "今日も嘘をついた。報道機関に、患者増加は「インフルエンザの新型」だと。記憶喰らいの被害を隠すため。これが俺の仕事だとわかっているが、慣れることはない。",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["大阪梅田事件の情報統制を完璧に実施（2025年）", "機関の民間企業への偽装ネットワーク構築"],
    incident_flags: [],
  },
  {
    id: "K-014-189",
    codename: "K-014-189",
    real_name: "西村 葵",
    role: "班員",
    division: "工作部門",
    clearance: 3,
    status: "ACTIVE",
    joined: "2025-04-01",
    last_seen: "—",
    specialization: "電子工学、センサー開発",
    notes: "摩周湖に設置したセンサーからデータが届いた。鈴木主任の言う通り、また何かが起きそうな予兆がある。自分が作ったセンサーが役に立つかもしれないと思うと、少し誇らしい。少し怖い。",
    anomaly_score: null,
    missions_completed: null,
    commendations: ["次元異常センサーの感度改善プロジェクトに参加（2025年）"],
    incident_flags: [],
  },
];

// ─────────────────────────────────────────────────────────────────────
// 追加データ（外部JSON統合）
// ─────────────────────────────────────────────────────────────────────

export interface Division {
  id: string; name: string; description: string;
  personnel: number; specializations: string[]; equipment: string[];
}

export const DIVISIONS_DATA: Division[] = [
  {
    "id": "div-001",
    "name": "収束部門",
    "description": "海蝕現象の収束と実体の無力化を担当する最前線部隊。",
    "personnel": 156,
    "specializations": [
      "次元収束",
      "実体無力化",
      "緊急対応"
    ],
    "equipment": [
      "M-001-α",
      "M-002-β",
      "M-003-γ",
      "M-008-θ",
      "M-013-ν"
    ]
  },
  {
    "id": "div-002",
    "name": "港湾部門",
    "description": "次元間ゲートの管理と正規の次元移動を監督する部門。",
    "personnel": 89,
    "specializations": [
      "ゲート管理",
      "次元航行",
      "座標固定"
    ],
    "equipment": [
      "M-012-μ",
      "M-011-λ",
      "次元航行船"
    ]
  },
  {
    "id": "div-003",
    "name": "工作部門",
    "description": "収束モジュールの開発・製造・保守を行う技術部門。",
    "personnel": 134,
    "specializations": [
      "モジュール開発",
      "技術革新",
      "装備保守"
    ],
    "equipment": [
      "全モジュールの開発権限",
      "研究施設",
      "製造設備"
    ]
  },
  {
    "id": "div-004",
    "name": "外事部門",
    "description": "不根との外交、情報収集、一般市民への隠蔽工作を担当。",
    "personnel": 102,
    "specializations": [
      "外交交渉",
      "情報工作",
      "記憶操作"
    ],
    "equipment": [
      "M-006-ζ",
      "M-010-κ",
      "M-020-υ"
    ]
  },
  {
    "id": "div-005",
    "name": "支援部門",
    "description": "現場への後方支援、医療、補給を担当する部門。",
    "personnel": 178,
    "specializations": [
      "医療支援",
      "補給管理",
      "通信維持"
    ],
    "equipment": [
      "M-008-θ",
      "M-011-λ",
      "M-009-ι",
      "医療設備"
    ]
  }
];

export interface ModuleData {
  id: string; code: string; name: string; classification: string;
  description: string; range: string; duration: string; energy: string;
  developer: string; details: string; warning: string;
}

export const MODULES_DATA: ModuleData[] = [
  {
    "id": "mod-001",
    "code": "M-001-α",
    "name": "空間安定化フィールド",
    "classification": "safe",
    "description": "次元の歪みを抑制し、空間の安定性を高めるための基本モジュール。",
    "range": "半径20m",
    "duration": "15分",
    "energy": "中",
    "developer": "工作部門",
    "details": "海蝕現象の初期段階で使用される標準的な収束装置。次元境界の揺らぎを検知し、自動的に安定化フィールドを展開する。",
    "warning": "連続使用は30分以内に制限。過度な使用は装置の劣化を招く。"
  },
  {
    "id": "mod-002",
    "code": "M-002-β",
    "name": "次元境界封鎖",
    "classification": "caution",
    "description": "階宙次元への通路を一時的に封鎖し、海蝕実体の侵入を防ぐ。",
    "range": "半径50m",
    "duration": "30分",
    "energy": "高",
    "developer": "工作部門",
    "details": "港湾部門との共同開発により実現した高度な封鎖システム。境界ゲートを強制的に閉鎖することで、未認可の実体侵入を防ぐ。",
    "warning": "使用中は機関員の次元移動も不可能になる。緊急時以外の使用を禁止。"
  },
  {
    "id": "mod-003",
    "code": "M-003-γ",
    "name": "実体無力化パルス",
    "classification": "danger",
    "description": "海蝕実体の存在基盤を破壊する高出力パルス波を発生させる。",
    "range": "半径10m",
    "duration": "瞬間",
    "energy": "超高",
    "developer": "工作部門",
    "details": "残滓から抽出した高純度エネルギーを使用。対象の次元座標を強制的にずらすことで実体を消滅させる。",
    "warning": "周辺の電子機器に深刻なダメージを与える。使用時は半径100m以内の避難が必須。"
  },
  {
    "id": "mod-004",
    "code": "M-004-δ",
    "name": "時空間歪曲装置",
    "classification": "classified",
    "description": "局所的な時空間の流れを操作し、海蝕現象の進行を遅延させる。",
    "range": "半径5m",
    "duration": "5分（体感時間: 1時間）",
    "energy": "極高",
    "developer": "工作部門 - 機密プロジェクト",
    "details": "[データ削除済] 理論上、時間の流れを最大12倍まで減速可能。実験段階のため実戦配備は限定的。",
    "warning": "[機密情報] 使用者は重度の時間感覚喪失症を経験する可能性あり。LEVEL 4以上の許可必須。"
  },
  {
    "id": "mod-005",
    "code": "M-005-ε",
    "name": "残滓回収システム",
    "classification": "safe",
    "description": "海蝕現象収束後に残る残滓を安全に回収・保管するための装置。",
    "range": "半径15m",
    "duration": "10分",
    "energy": "低",
    "developer": "工作部門",
    "details": "特殊な磁場を形成し、残滓を引き寄せて安定化させる。回収された残滓は研究用途に使用される。",
    "warning": "残滓の種類によっては予期しない反応を示す可能性あり。防護装備の着用を推奨。"
  },
  {
    "id": "mod-006",
    "code": "M-006-ζ",
    "name": "認識阻害フィールド",
    "classification": "caution",
    "description": "一般市民の認識から海蝕現象を隠蔽するための精神干渉装置。",
    "range": "半径100m",
    "duration": "1時間",
    "energy": "中",
    "developer": "外事部門・工作部門共同",
    "details": "対象の視覚・聴覚・記憶に微細な干渉を行い、海蝕現象を「ありふれた光景」として認識させる。",
    "warning": "機関員自身も影響を受ける可能性あり。使用時は必ず除外タグを装着すること。"
  },
  {
    "id": "mod-007",
    "code": "M-007-η",
    "name": "次元共鳴増幅器",
    "classification": "danger",
    "description": "残滓のエネルギーを増幅し、より強力な収束効果を発揮する。",
    "range": "半径30m",
    "duration": "20分",
    "energy": "超高",
    "developer": "工作部門",
    "details": "残滓の不安定な性質を利用し、通常の3倍の出力を実現。ただし、制御を失うリスクも3倍。",
    "warning": "暴走時は周辺一帯が海蝕化する危険性あり。LEVEL 3以上の機関員のみ使用可。"
  },
  {
    "id": "mod-008",
    "code": "M-008-θ",
    "name": "生体保護シールド",
    "classification": "safe",
    "description": "海蝕現象による生体への直接的な影響を軽減する防護フィールド。",
    "range": "個人",
    "duration": "1時間",
    "energy": "低",
    "developer": "支援部門",
    "details": "携帯型の小型モジュール。次元の歪みから生体組織を保護し、精神的・肉体的ダメージを最小化する。",
    "warning": "完全な防護ではない。長時間の暴露は避けること。"
  },
  {
    "id": "mod-009",
    "code": "M-009-ι",
    "name": "次元探査ドローン",
    "classification": "safe",
    "description": "階宙次元内部を探査し、リアルタイムでデータを送信する自律型ドローン。",
    "range": "次元間移動可能",
    "duration": "6時間（バッテリー寿命）",
    "energy": "中",
    "developer": "工作部門・支援部門共同",
    "details": "小型化された次元移動装置を搭載。危険な領域の事前調査に使用される。映像・音声・次元座標を記録可能。",
    "warning": "階宙次元内での通信は不安定。ドローン喪失のリスクあり。"
  },
  {
    "id": "mod-010",
    "code": "M-010-κ",
    "name": "記憶固定装置",
    "classification": "caution",
    "description": "認識阻害や記憶改変の影響を受けないよう、記憶を固定する装置。",
    "range": "個人",
    "duration": "24時間",
    "energy": "低",
    "developer": "外事部門",
    "details": "脳内の記憶回路に微弱な電気信号を送り、記憶の書き換えを防止する。機密任務で使用。",
    "warning": "長期使用は頭痛や集中力低下を引き起こす。48時間以上の連続使用は禁止。"
  },
  {
    "id": "mod-011",
    "code": "M-011-λ",
    "name": "量子通信機",
    "classification": "safe",
    "description": "次元の壁を越えて通信できる量子もつれを利用した通信機。",
    "range": "無制限",
    "duration": "常時稼働",
    "energy": "低",
    "developer": "工作部門",
    "details": "階宙次元内でも使用可能な唯一の通信手段。ペア端末間で瞬時に情報を送受信できる。",
    "warning": "量子もつれは脆弱。衝撃を与えると通信不能になる可能性あり。"
  },
  {
    "id": "mod-012",
    "code": "M-012-μ",
    "name": "次元座標固定杭",
    "classification": "safe",
    "description": "特定の次元座標を固定し、安定したゲートポイントを作成する。",
    "range": "設置地点",
    "duration": "永続（保守必要）",
    "energy": "初期高・維持低",
    "developer": "港湾部門",
    "details": "次元間の「アンカー」として機能。複数の杭を設置することで、安定した移動ルートを確立できる。",
    "warning": "座標のずれは重大事故に繋がる。月1回の校正が必須。"
  },
  {
    "id": "mod-013",
    "code": "M-013-ν",
    "name": "実体拘束網",
    "classification": "caution",
    "description": "海蝕実体を物理的に拘束するエネルギー網。",
    "range": "半径25m",
    "duration": "10分",
    "energy": "高",
    "developer": "収束部門",
    "details": "次元エネルギーで編まれた網状フィールド。実体の移動を制限し、収束作業を容易にする。",
    "warning": "高知性実体は網を破る可能性あり。併用モジュールの準備を推奨。"
  },
  {
    "id": "mod-014",
    "code": "M-014-ξ",
    "name": "緊急次元退避装置",
    "classification": "safe",
    "description": "危機的状況で使用者を安全な次元へ即座に転送する。",
    "range": "個人",
    "duration": "一回限り",
    "energy": "極高",
    "developer": "支援部門",
    "details": "全機関員に配布される緊急脱出装置。起動すると最寄りの安全な次元座標へ自動転送される。",
    "warning": "使用後は装置が破損し再使用不可。本部への帰還は別途支援が必要。"
  },
  {
    "id": "mod-015",
    "code": "M-015-ο",
    "name": "残滓エネルギー変換炉",
    "classification": "danger",
    "description": "回収した残滓を実用エネルギーに変換する実験的装置。",
    "range": "施設固定型",
    "duration": "連続稼働",
    "energy": "自己発電",
    "developer": "工作部門 - 研究チーム",
    "details": "残滓の不安定なエネルギーを電力に変換。理論上、無限のエネルギー源となり得る。",
    "warning": "暴走時は次元崩壊を引き起こす。厳重な監視下でのみ稼働許可。"
  },
  {
    "id": "mod-016",
    "code": "M-016-π",
    "name": "生体スキャナー",
    "classification": "safe",
    "description": "対象の次元共鳴パターンを解析し、実体・人間・不根を判別する。",
    "range": "半径30m",
    "duration": "即座",
    "energy": "低",
    "developer": "支援部門",
    "details": "各存在が持つ固有の次元パターンを検出。擬態実体の識別に有効。",
    "warning": "高度な擬態には無効な場合あり。過信は禁物。"
  },
  {
    "id": "mod-017",
    "code": "M-017-ρ",
    "name": "時間記録装置",
    "classification": "caution",
    "description": "時間遅延帯などの影響下でも正確な時刻を記録し続ける。",
    "range": "個人",
    "duration": "永続",
    "energy": "極低",
    "developer": "工作部門",
    "details": "原子時計を基準とした超高精度タイマー。時間異常の影響を受けない唯一の計時装置。",
    "warning": "物理的破損に弱い。取り扱いは慎重に。"
  },
  {
    "id": "mod-018",
    "code": "M-018-σ",
    "name": "次元障壁強化剤",
    "classification": "safe",
    "description": "既存の次元境界を強化し、海蝕現象の発生を予防する。",
    "range": "半径100m",
    "duration": "72時間",
    "energy": "中",
    "developer": "収束部門",
    "details": "境界の「薄い」場所に散布することで、海蝕現象の発生率を80%削減。予防措置として有効。",
    "warning": "過度の散布は次元の硬化を招き、正規の次元移動も困難になる。"
  },
  {
    "id": "mod-019",
    "code": "M-019-τ",
    "name": "概念固定アンカー",
    "classification": "classified",
    "description": "[機密] 抽象概念を物理的に固定し、概念捕食者から保護する。",
    "range": "半径50m",
    "duration": "1時間",
    "energy": "極高",
    "developer": "工作部門 - 特殊プロジェクト",
    "details": "[LEVEL 5] 「存在」「記憶」「認識」といった概念を実体化させ、捕食から守る。理論的には有効だが実績は限定的。",
    "warning": "[最高機密] 副作用として使用者の自我が不安定になる。精神鑑定後のみ使用許可。"
  },
  {
    "id": "mod-020",
    "code": "M-020-υ",
    "name": "多次元投影装置",
    "classification": "danger",
    "description": "使用者の意識を複数の次元に同時投影し、広範囲の監視を可能にする。",
    "range": "意識投影: 無制限",
    "duration": "30分",
    "energy": "極高",
    "developer": "外事部門",
    "details": "最大5つの次元に同時に意識を投影可能。偵察任務で使用されるが、精神的負荷は極めて高い。",
    "warning": "投影中の本体は無防備。必ず保護下で使用すること。投影時間超過は人格崩壊のリスクあり。"
  }
];

export interface Incident {
  id: string; name: string; severity: string; status: string;
  location: string; entity: string; gsi: number | string; division: string;
  desc: string; time: string; lon?: number; lat?: number;
}

export const INCIDENTS: Incident[] = [
  {
    "id": "area-001",
    "severity": "critical",
    "status": "対応中",
    "name": "大分港次元歪曲事案",
    "lon": 131.641,
    "lat": 33.218,
    "location": "大分港沿岸部",
    "entity": "E-002（波喰い）複数体",
    "gsi": 12.4,
    "division": "収束部門 第1班",
    "desc": "大分港沿岸で大規模な次元境界の歪みを検知。波喰い3体が出現し付近の海蝕エネルギーを捕食中。",
    "time": "2026-02-06 08:30"
  },
  {
    "id": "area-002",
    "severity": "warning",
    "status": "監視中",
    "name": "別府湾不根侵入事案",
    "lon": 131.493,
    "lat": 33.286,
    "location": "別府湾沖",
    "entity": "不根（未登録）",
    "gsi": 4.2,
    "division": "港湾部門・外事部門",
    "desc": "未認可の不根が別府湾に侵入。外事部門が交渉を継続中。",
    "time": "2026-02-06 10:15"
  },
  {
    "id": "area-003",
    "severity": "critical",
    "status": "対応中",
    "name": "由布岳時空歪曲",
    "lon": 131.392,
    "lat": 33.282,
    "location": "由布岳周辺",
    "entity": "E-004（時間遅延帯）",
    "gsi": 8.7,
    "division": "収束部門 第2班",
    "desc": "由布岳中腹で時間遅延帯が発生。半径200m以内の時間流が1/50に減速。",
    "time": "2026-02-06 06:00"
  },
  {
    "id": "area-004",
    "severity": "warning",
    "status": "監視中",
    "name": "姫島境界ゲート",
    "lon": 131.665,
    "lat": 33.718,
    "location": "姫島沖",
    "entity": "なし（自然発生）",
    "gsi": 5.1,
    "division": "港湾部門",
    "desc": "姫島沖に境界ゲートが自然発生。実体の侵入は未確認。",
    "time": "2026-02-07 03:20"
  },
  {
    "id": "area-005",
    "severity": "warning",
    "status": "対応中",
    "name": "中津市内認識異常",
    "lon": 131.186,
    "lat": 33.597,
    "location": "中津市中心部",
    "entity": "E-006（認識阻害残滓）",
    "gsi": 3.8,
    "division": "外事部門",
    "desc": "中津市中心部で市民の認識異常が報告。複数人が「海が見える」と証言。",
    "time": "2026-02-07 14:45"
  },
  {
    "id": "area-006",
    "severity": "safe",
    "status": "収束済み",
    "name": "佐伯湾深海異常",
    "lon": 131.916,
    "lat": 32.967,
    "location": "佐伯湾沖",
    "entity": "E-001（漂流者）",
    "gsi": 1.2,
    "division": "収束部門 第3班",
    "desc": "佐伯湾沖で漂流者を検知。対話による誘導で自主帰還完了。",
    "time": "2026-02-05 19:00"
  },
  {
    "id": "area-007",
    "severity": "safe",
    "status": "収束済み",
    "name": "日田盆地次元薄化",
    "lon": 130.941,
    "lat": 33.321,
    "location": "日田市盆地",
    "entity": "なし",
    "gsi": 2.3,
    "division": "港湾部門",
    "desc": "日田盆地で次元境界の薄化を検知。自然収束を確認。継続観察中。",
    "time": "2026-02-04 08:00"
  },
  {
    "id": "area-008",
    "severity": "critical",
    "status": "対応中",
    "name": "国東半島波喰い群",
    "lon": 131.728,
    "lat": 33.576,
    "location": "国東半島東岸",
    "entity": "E-002（波喰い）5体",
    "gsi": 11.2,
    "division": "収束部門 第1班・第2班",
    "desc": "国東半島東岸に波喰いが5体同時出現。過去最大規模。両班合同で対応中。",
    "time": "2026-02-08 02:15"
  },
  {
    "id": "area-009",
    "severity": "safe",
    "status": "観察中",
    "name": "九重山脈時層観測",
    "lon": 131.245,
    "lat": 33.087,
    "location": "九重山頂付近",
    "entity": "なし（残滓のみ）",
    "gsi": 0.8,
    "division": "工作部門",
    "desc": "九重山頂付近で時層粉の自然堆積を確認。残滓として採取済み。",
    "time": "2026-02-03 11:30"
  }
];

export interface Municipality {
  name: string; centLon: number; centLat: number;
}
export const PREFECTURE = "大分県";
export const MUNICIPALITIES: Record<string, Municipality> = {
  "44201": {
    "name": "大分市",
    "centLon": 131.8513,
    "centLat": 33.238
  },
  "44202": {
    "name": "別府市",
    "centLon": 131.4692,
    "centLat": 33.2933
  },
  "44203": {
    "name": "中津市",
    "centLon": 131.1612,
    "centLat": 33.4845
  },
  "44204": {
    "name": "日田市",
    "centLon": 130.9569,
    "centLat": 33.2481
  },
  "44205": {
    "name": "佐伯市",
    "centLon": 131.9495,
    "centLat": 32.8975
  },
  "44206": {
    "name": "臼杵市",
    "centLon": 131.8112,
    "centLat": 33.1203
  },
  "44207": {
    "name": "津久見市",
    "centLon": 131.9152,
    "centLat": 33.0916
  },
  "44208": {
    "name": "竹田市",
    "centLon": 131.3474,
    "centLat": 33.0146
  },
  "44209": {
    "name": "豊後高田市",
    "centLon": 131.5059,
    "centLat": 33.6192
  },
  "44210": {
    "name": "杵築市",
    "centLon": 131.5628,
    "centLat": 33.4446
  },
  "44211": {
    "name": "宇佐市",
    "centLon": 131.3373,
    "centLat": 33.492
  },
  "44212": {
    "name": "豊後大野市",
    "centLon": 131.5081,
    "centLat": 32.9893
  },
  "44213": {
    "name": "由布市",
    "centLon": 131.4009,
    "centLat": 33.2052
  },
  "44214": {
    "name": "国東市",
    "centLon": 131.6602,
    "centLat": 33.5847
  },
  "44322": {
    "name": "姫島村",
    "centLon": 131.6629,
    "centLat": 33.7284
  },
  "44341": {
    "name": "日出町",
    "centLon": 131.5445,
    "centLat": 33.3654
  },
  "44461": {
    "name": "九重町",
    "centLon": 131.2244,
    "centLat": 33.206
  },
  "44462": {
    "name": "玖珠町",
    "centLon": 131.1646,
    "centLat": 33.3053
  }
};

export const LEVEL_MESSAGES = {
  "rankTitles": {
    "0": {
      "title": "見習い機関員",
      "titleEn": "TRAINEE AGENT",
      "color": "#6b7280",
      "colorNote": "グレー",
      "status": "研修中"
    },
    "1": {
      "title": "初級機関員",
      "titleEn": "JUNIOR AGENT",
      "color": "#3b82f6",
      "colorNote": "ブルー",
      "status": "任務遂行中"
    },
    "2": {
      "title": "中級機関員",
      "titleEn": "AGENT",
      "color": "#8b5cf6",
      "colorNote": "パープル",
      "status": "任務遂行中"
    },
    "3": {
      "title": "上級機関員",
      "titleEn": "SENIOR AGENT",
      "color": "#10b981",
      "colorNote": "グリーン",
      "status": "重要任務担当"
    },
    "4": {
      "title": "ベテラン機関員",
      "titleEn": "VETERAN AGENT",
      "color": "#f59e0b",
      "colorNote": "オレンジ",
      "status": "特殊任務担当"
    },
    "5": {
      "title": "エリート機関員",
      "titleEn": "ELITE AGENT",
      "color": "#ef4444",
      "colorNote": "レッド",
      "status": "最高機密任務担当"
    }
  },
  "welcomeMessages": {
    "0": [
      "海蝕機関へようこそ。まずは基礎訓練から始めましょう。",
      "機関員としての第一歩です。システムに慣れてください。",
      "研修期間中です。各部門の情報を確認してください。"
    ],
    "1": {
      "title": "初級機関員として認定されました",
      "message": "基礎訓練を修了し、実務への参加が許可されました。各部門の活動に参加し、経験を積んでください。"
    },
    "2": {
      "title": "中級機関員に昇格",
      "message": "実務経験を評価され、より重要な任務へのアクセスが許可されました。収束装置の運用にも精通してきています。"
    },
    "3": {
      "title": "上級機関員として承認",
      "message": "高度な専門知識と実績が認められました。海蝕現象に関する機密情報へのアクセスが可能になります。"
    },
    "4": {
      "title": "ベテラン機関員の地位を獲得",
      "message": "豊富な経験と卓越した能力により、特殊任務の遂行が認められました。機関の中核を担う存在です。"
    },
    "5": {
      "title": "エリート機関員として最高位に到達",
      "message": "最高レベルのクリアランスを取得しました。機関の最も重要な機密にアクセスできる、限られた存在の一人です。"
    }
  },
  "statusMessages": {
    "0": {
      "main": "基礎研修を受講中",
      "sub": "レベル1で実務への参加が可能になります"
    },
    "1": {
      "main": "各部門の情報にアクセス可能",
      "sub": "より多くの機能を解除するために経験を積みましょう"
    },
    "2": {
      "main": "部門詳細情報へのアクセス許可",
      "sub": "収束装置の運用実績を積んでいます"
    },
    "3": {
      "main": "海蝕現象アーカイブへのアクセス許可",
      "sub": "高度な機密情報の閲覧が可能です"
    },
    "4": {
      "main": "収束案件データベースへのアクセス許可",
      "sub": "特殊任務の遂行権限を持っています"
    },
    "5": {
      "main": "全システムへのフルアクセス許可",
      "sub": "機関の最高機密情報へアクセス可能です"
    }
  },
  "dashboardMessages": {
    "0": {
      "greeting": "ようこそ、研修生",
      "description": "これからあなたは海蝕機関の一員として、現実の歪みと戦うことになります。まずは各部門の情報を確認し、システムに慣れてください。"
    },
    "1": {
      "greeting": "お疲れ様です、初級機関員",
      "description": "基礎訓練を完了し、実務への参加が認められました。各部門と連携しながら、海蝕現象の収束に貢献してください。"
    },
    "2": {
      "greeting": "お帰りなさい、機関員",
      "description": "実績を評価され、中級機関員として承認されました。より重要な任務に参加し、収束技術の習得を進めてください。"
    },
    "3": {
      "greeting": "お疲れ様です、上級機関員",
      "description": "豊富な経験と専門知識により、機密情報へのアクセスが許可されました。海蝕現象の本質に迫る研究に参加できます。"
    },
    "4": {
      "greeting": "ようこそ、ベテラン機関員",
      "description": "特殊任務の遂行が認められた、機関の中核メンバーです。あなたの経験と判断が、多くの収束活動を成功に導いています。"
    },
    "5": {
      "greeting": "お帰りなさい、エリート機関員",
      "description": "最高位のクリアランスを持つ、機関の精鋭です。すべての機密情報へアクセスでき、最重要任務の指揮を執ることができます。"
    }
  },
  "dailyLoginMessages": {
    "0": {
      "title": "研修日誌を記録",
      "description": "日々の学習記録が蓄積されています"
    },
    "1": {
      "title": "活動記録を更新",
      "description": "実務への参加が記録されました"
    },
    "2": {
      "title": "任務報告を提出",
      "description": "継続的な活動が評価されています"
    },
    "3": {
      "title": "機密アクセスログを記録",
      "description": "重要情報への定期的なアクセスを確認"
    },
    "4": {
      "title": "特殊任務ログを更新",
      "description": "ベテラン機関員としての活動を記録"
    },
    "5": {
      "title": "エリート機関員の活動を記録",
      "description": "最高機密レベルのアクセスログ"
    }
  },
  "hintMessages": {
    "0": [
      "チャット機能で他の機関員と交流し、経験値を獲得できます",
      "各部門の情報を閲覧すると経験値が得られます",
      "毎日ログインすることで、着実に成長できます"
    ],
    "1": [
      "部門詳細ページを閲覧して、より深い知識を得ましょう",
      "継続的なログインでストリークボーナスを獲得できます",
      "レベル2で各部門の詳細情報にアクセスできます"
    ],
    "2": [
      "海蝕現象アーカイブへのアクセスまであと少しです",
      "定期的なアクティビティで経験値を獲得しましょう",
      "上級機関員を目指して活動を続けてください"
    ],
    "3": [
      "収束案件データベースへのアクセスが間もなく可能になります",
      "あなたは機関の重要なメンバーです",
      "ベテラン機関員まであと一歩です"
    ],
    "4": [
      "最高レベルまであと少しです",
      "エリート機関員への道が開かれつつあります",
      "あなたの経験と知識は機関にとって貴重です"
    ],
    "5": [
      "すべてのコンテンツにアクセス可能です",
      "最高レベルに到達しました。おめでとうございます",
      "機関の精鋭として、引き続き活躍してください"
    ]
  },
  "levelUpMessages": {
    "1": {
      "title": "初級機関員に昇格",
      "message": "おめでとうございます。実務への参加が許可されました。",
      "unlocked": "各部門情報、機関員チャット"
    },
    "2": {
      "title": "中級機関員に昇格",
      "message": "あなたの実績が認められました。より重要な任務に参加できます。",
      "unlocked": "各部門の詳細情報"
    },
    "3": {
      "title": "上級機関員に昇格",
      "message": "高度な専門知識が評価されました。機密情報へのアクセスが許可されます。",
      "unlocked": "海蝕現象アーカイブ"
    },
    "4": {
      "title": "ベテラン機関員に昇格",
      "message": "卓越した能力により、特殊任務の遂行が認められました。",
      "unlocked": "収束案件データベース"
    },
    "5": {
      "title": "エリート機関員に到達",
      "message": "最高位のクリアランスを取得しました。機関の精鋭です。",
      "unlocked": "機密文書アーカイブ、全システムへのフルアクセス"
    }
  },
  "motivationalMessages": {
    "0": [
      "一歩ずつ、着実に前進しましょう",
      "学ぶことは多いですが、焦らず進んでください",
      "あなたの成長を期待しています"
    ],
    "1": [
      "順調に成長しています",
      "実務経験を積んで、さらなる高みを目指しましょう",
      "あなたの活動が機関を支えています"
    ],
    "2": [
      "中級機関員として順調です",
      "専門性を高めて上級を目指しましょう",
      "あなたの貢献に感謝します"
    ],
    "3": [
      "上級機関員としての実力を発揮しています",
      "機関の重要な戦力です",
      "あなたの知識が多くの任務を成功に導いています"
    ],
    "4": [
      "ベテランとして頼もしい存在です",
      "最高レベルまであと一歩です",
      "あなたの経験は機関の財産です"
    ],
    "5": [
      "エリート機関員として完璧です",
      "最高のパフォーマンスを維持しています",
      "機関の精鋭として、素晴らしい活躍です"
    ]
  }
} as const;

export const PROGRESS_CONFIG = {
  "levelThresholds": {
    "0": 0,
    "1": 100,
    "2": 250,
    "3": 500,
    "4": 1000,
    "5": 2000
  },
  "levelUnlocks": {
    "0": [
      "index.html",
      "login.html",
      "dashboard.html"
    ],
    "1": [
      "divisions.html",
      "chat.html",
      "map.html",
      "details/location-detail.html",
      "history.html"
    ],
    "2": [
      "division-convergence.html",
      "division-support.html",
      "division-engineering.html",
      "division-foreign.html",
      "division-port.html",
      "details/entity-detail.html",
      "details/module-detail.html",
      "entities.html",
      "modules.html"
    ],
    "3": [
      "phenomenon.html"
    ],
    "4": [
      "missions.html",
      "search.html",
      "details/mission-detail.html"
    ],
    "5": [
      "classified.html",
      "details/personnel-detail.html"
    ]
  },
  "xpRewards": {
    "first_login": 50,
    "profile_view": 10,
    "chat_message": 5,
    "division_view": 20,
    "phenomenon_view": 30,
    "mission_complete": 100,
    "daily_login": 25
  },
  "dailyLoginRewards": {
    "1": 25,
    "2": 30,
    "3": 35,
    "4": 40,
    "5": 45,
    "6": 50,
    "7": 100
  }
} as const;

// ─────────────────────────────────────────────────────────────────────
// タブ定義
// ─────────────────────────────────────────────────────────────────────

export const TABS = [
  { id: "missions",   label: "収束案件",       icon: "◆", minLevel: 2 },
  { id: "entities",   label: "実体カタログ",   icon: "◎", minLevel: 2 },
  { id: "modules",    label: "収束モジュール", icon: "⬡", minLevel: 2 },
  { id: "personnel",  label: "機関員一覧",     icon: "◐", minLevel: 2 },
  { id: "facilities", label: "施設",           icon: "⬡", minLevel: 2 },
  { id: "equipment",  label: "装備",           icon: "◈", minLevel: 2 },
  { id: "search",     label: "ID検索",         icon: "◉", minLevel: 2 },
] as const;

export type TabId = typeof TABS[number]["id"];

// ─────────────────────────────────────────────────────────────────────
// API実体型（/api/entities から返される area13 JSON形式）
// ─────────────────────────────────────────────────────────────────────
export interface ApiEntity {
  id: string; code: string; name: string;
  classification: string; description: string;
  threat: string; intelligence: string; origin: string;
  appearance: string; behavior: string; containment: string;
}

// ─────────────────────────────────────────────────────────────────────
// API収束モジュール型（/api/modules から返される area13 JSON形式）
// ─────────────────────────────────────────────────────────────────────
export interface ApiModule {
  id: string; code: string; name: string; classification: string;
  description: string; range: string; duration: string; energy: string;
  developer: string; details: string; warning: string;
}

// ─────────────────────────────────────────────────────────────────────
// API機関員型（/api/personnel から返される area13 JSON形式）
// ─────────────────────────────────────────────────────────────────────
export interface ApiPersonnel {
  id: string; name: string; division: string; rank: string;
  age: number; joinDate: string; specialization: string;
}

export function getRecords(tab: TabId) {
  switch (tab) {
    case "missions":   return MISSIONS;
    case "facilities": return FACILITIES;
    case "entities":   return ENTITIES;
    case "equipment":  return EQUIPMENT;
    case "personnel":  return PERSONNEL;
    default:           return [];
  }
}

export function getRecord(tab: TabId, id: string) {
  return getRecords(tab).find((r: { id: string }) => r.id === id) ?? null;
}

// ステータス色クラス
export const STATUS_COLORS: Record<string, string> = {
  ACTIVE:       "border-[rgba(80,220,120,0.45)] text-success",
  OPERATIONAL:  "border-[rgba(80,220,120,0.45)] text-success",
  IN_SERVICE:   "border-[rgba(80,220,120,0.45)] text-success",
  CONTAINED:    "border-[rgba(80,220,120,0.45)] text-success",
  OBSERVED:     "border-[rgba(0,200,255,0.45)]  text-primary",
  PENDING:      "border-[rgba(255,180,60,0.45)] text-warning",
  DEGRADED:     "border-[rgba(255,180,60,0.45)] text-warning",
  LIMITED:      "border-[rgba(255,180,60,0.45)] text-warning",
  MISSING:      "border-[rgba(255,68,68,0.45)]  text-danger",
  LOCKED:       "border-border text-fg-muted",
  RESTRICTED:   "border-border text-fg-muted",
  CLASSIFIED:   "border-border text-fg-muted",
};

export const THREAT_COLORS: Record<string, string> = {
  LOW:      "text-success",
  MODERATE: "text-warning",
  HIGH:     "text-danger",
  CRITICAL: "text-danger",
  UNKNOWN:  "text-fg-muted",
};
