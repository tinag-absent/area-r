-- =====================================================
-- 静的データ DBシード — 海蝕機関
-- =====================================================

INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-001','漂流者','E-001','LOW',1,'OBSERVED','safe','階宙次元から迷い込んだ知性体。敵対性は低い。','2020-01-01',0,'対話による誘導が可能。元の次元への帰還を支援することで自主的に退去する。','["目的もなく徘徊する。人間を発見すると興味を示すが、攻撃はしない。", "半透明の人型。顔の特徴は不明瞭で、常に漂うように移動する。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-002','波喰い','E-002','HIGH',3,'ACTIVE','danger','海蝕現象そのものを捕食する異常存在。','2020-01-01',0,'実体無力化パルスが有効。ただし複数体が同時出現することが多く、制圧は困難。','["海蝕現象が発生すると出現し、その場のエネルギーを吸収する。満腹になるまで移動しない。", "黒い霧状の集合体。中心に無数の目のような発光体を持つ。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-003','鏡面侵食体','E-003','MODERATE',2,'OBSERVED','caution','対象の姿を模倣し、その存在を侵食する寄生型実体。','2020-01-01',0,'次元共鳴パターンの微細な違いで識別可能。発見次第、即座に隔離・無力化が必要。','["宿主の記憶と人格を徐々に吸収し、最終的に入れ替わる。本物との区別は困難。", "初期は無形。接触した生物の外見を完全にコピーする。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-004','時間遅延帯','E-004','MODERATE',2,'OBSERVED','caution','周囲の時間流を著しく遅延させる現象型実体。','2020-01-01',0,'時空間歪曲装置で相殺可能。ただし高度な技術と経験が必要。','["移動せず、その場に留まり続ける。接近した物体は自動的に取り込まれる。", "淡い青白い光の球体。内部では時間が通常の1/100の速度で流れる。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-005','概念捕食者','E-005','CRITICAL',5,'CLASSIFIED','classified','[機密] 抽象概念そのものを捕食する高次元存在。','2020-01-01',0,'[LEVEL 5以上] 現在、完全な収束手段は確立されていない。接触を避けることが最優先。','["詳細不明"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-006','不根の行商人','E-006','LOW',1,'OBSERVED','safe','次元間を移動する商人。友好的だが、取引には注意が必要。','2020-01-01',0,'友好的であれば収束不要。ただし不当な取引には外事部門が介入する。','["「取引」を好む。物品だけでなく、記憶や感情も商品として扱う。", "人間に似た姿だが、目が3つある。常に大きな荷物を背負っている。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-007','影泳ぎ','E-007','MODERATE',2,'OBSERVED','caution','影の中を自由に移動する捕食性実体。','2020-01-01',0,'強力な照明で影を消すことで無力化。夜間作業では特に警戒が必要。','["光源を避け、影の中に潜む。獲物が影に入ると襲撃する。", "文字通りの影。三次元的な形状を持たず、平面上を滑るように移動。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-008','記憶喰らい','E-008','HIGH',3,'ACTIVE','danger','人間の記憶を摂取し、それを糧とする精神寄生体。','2020-01-01',0,'記憶固定装置の着用で防御可能。発見は困難だが、生体スキャナーで検出できる。','["睡眠中の人間に憑依し、夢を通じて記憶を吸収。被害者は記憶喪失に陥る。", "ほぼ透明。精神集中時のみ薄い人型のシルエットとして視認可能。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-009','共鳴体','E-009','LOW',1,'OBSERVED','safe','周囲の音を増幅・変調する非敵対的実体。','2020-01-01',0,'無害のため収束不要。ただし機密会話の盗聴リスクあり。','["音波に反応し、それを美しいハーモニーに変換する。人間の声に特に反応。", "透明な球体。内部で複雑な幾何学模様が絶えず変化している。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-010','空間裂目','E-010','HIGH',3,'ACTIVE','danger','空間そのものを引き裂く移動性の亀裂。','2020-01-01',0,'空間安定化フィールドと次元境界封鎖の併用が必須。完全な消滅は困難。','["不規則に移動し、接触した物体を別次元へ吸い込む。戻ることはほぼ不可能。", "空中を漂う黒い裂け目。周囲の光が歪み、重力異常を引き起こす。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-011','結晶蜘蛛','E-011','MODERATE',2,'OBSERVED','caution','次元エネルギーを結晶化し、巣を作る蜘蛛型実体。','2020-01-01',0,'巣の除去には専用の溶解剤が必要。蜘蛛本体は物理攻撃で破壊可能。','["次元の歪みが強い場所に巣を作る。巣は美しいが、触れると次元に引き込まれる。", "透明な結晶でできた蜘蛛。体長は約30cm。脚は8本。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-012','感情寄生虫','E-012','LOW',1,'OBSERVED','safe','人間の負の感情を吸収して成長する微小実体。','2020-01-01',0,'有益な共生関係を築くため、駆除不要。ただし過剰繁殖は精神的無感覚を招く。','["ストレスや不安を吸収する。結果として宿主の精神状態は改善される。", "肉眼では見えない。顕微鏡下では半透明の小さな球体。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-013','次元渡りの鳥','E-013','LOW',1,'OBSERVED','safe','次元間を自由に飛行する鳥型実体。','2020-01-01',0,'無害のため観察のみ。稀に迷子になった個体を元の次元へ誘導する。','["次元境界を自由に往来し、複数の世界で採餌する。人間には無関心。", "虹色の羽根を持つ鳥。尾が長く、飛行時に光の軌跡を残す。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-014','真実の瞳','E-014','MODERATE',2,'OBSERVED','caution','見つめた対象の本質を暴く巨大な眼球型実体。','2020-01-01',0,'視線を遮ることで無力化。鏡を使った反射は危険（自己に真実が跳ね返る）。','["対象を凝視し、隠された真実や嘘を暴露する。精神的ダメージを与えることも。", "直径約2mの巨大な眼球。虹彩は常に変化し、見る者の心を映す。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-015','時間の子供','E-015','UNKNOWN',5,'CLASSIFIED','classified','[機密] 時間そのものから生まれた存在。','2020-01-01',0,'[LEVEL 5] 接触禁止。観測のみ。時空間歪曲装置は効果なし。','["詳細不明"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-016','不根の密輸業者','E-016','MODERATE',2,'OBSERVED','caution','禁制品を次元間で密輸する不根の犯罪者集団。','2020-01-01',0,'外事部門が監視・取締を実施。武力衝突のリスクあり。港湾部門と連携が必須。','["次元間の法の抜け穴を利用して違法取引を行う。機関との衝突も辞さない。", "一般的な不根の姿だが、武装していることが多い。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-017','虚無の使者','E-017','CRITICAL',3,'ACTIVE','danger','存在そのものを消去する力を持つ恐るべき実体。','2020-01-01',0,'実体無力化パルスと次元境界封鎖の同時使用が必要。極めて危険。','["接触した物質を存在ごと消去する。目的は不明だが、無差別に破壊を行う。", "人型の輪郭だが、内部は完全な虚無。光さえ吸収する。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-018','夢織り','E-018','LOW',1,'OBSERVED','safe','人々の夢を実体化させる芸術家肌の実体。','2020-01-01',0,'友好的。創作活動を監視する程度で十分。悪夢の実体化には注意が必要。','["眠る人間の夢を感知し、それを一時的な実体として創造する。芸術作品として扱う。", "人間に近い姿。体は半透明で、内部に星空のような光が見える。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-019','残響獣','E-019','MODERATE',2,'OBSERVED','caution','過去の出来事の「残響」から生まれる獣型実体。','2020-01-01',0,'残滓回収システムで吸収可能。または時間経過で自然消滅する。','["生まれた場所で同じ出来事を繰り返し再現する。攻撃的だが知能は低い。", "半透明の獣。形状は出来事によって変化（戦争→狼、事故→蛇など）。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-020','量子幽霊','E-020','UNKNOWN',5,'CLASSIFIED','classified','[機密] 量子レベルで存在する観測不可能な実体。','2020-01-01',0,'[LEVEL 5] 研究中。現状では対処法なし。観測を避けることが唯一の対策。','[]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-021','次元の錨','E-021','LOW',1,'OBSERVED','safe','特定の場所に固着し、周辺の次元境界を安定化させる固着型知性体。危険性は低く、存在することで実体の侵入を防ぐ側面もある。','2020-01-01',0,'基本的に保護対象として扱う。移動は不可能ではないが、強制移動は境界不安定化を招く恐れがある。','["固着して動かない。触れると微細な振動を放出。周囲の次元境界を強化する効果がある。", "岩石に似た外観。半透明で、内部に青白い光が揺らめいている。サイズは多様（数センチから数メートル）。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-022','光食い','E-022','MODERATE',2,'OBSERVED','caution','可視光を栄養源とする異次元生命体。光を吸収することで成長し、完全な暗闇を作り出す。','2020-01-01',0,'強力なUV照射による飽和攻撃が有効。照射量を超えると逃走する。完全遮光環境では活動が停滞する。','["光源に引き寄せられる。吸収した光は次元の向こうへ放出している。成長すると完全遮光域を形成する。", "完全な黒体。形は定まらず、光が当たるとさらに黒くなる。周囲の光を吸収するため、視認が難しい。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-023','言葉喰らい','E-023','HIGH',3,'ACTIVE','danger','音声言語を捕食する高度知性体。言葉を奪われた対象は発話不能になる。コミュニケーション能力が高く、人間社会への潜入が危惧される。','2020-01-01',0,'筆談や手話など非音声コミュニケーションを使うこと。音声言語での接触厳禁。視線を合わせると言葉を奪われるリスクあり。','["対話を好む。言葉に触れるとそれを吸収し、対象が発話できなくなる。吸収した言語を操り、偽情報を流す。", "人間に酷似した外見を持てる。ただし声は出さず、唇だけが動く。目が細く、虹彩が薄い。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-024','感覚置換体','E-024','MODERATE',2,'OBSERVED','caution','接触した対象の感覚を入れ替える球体状の実体。視覚と聴覚、触覚と嗅覚などを置換し、対象を混乱させる。','2020-01-01',0,'防護スーツ着用で接触を避ける。網状の収容容器で捕獲可能。無害なため帰還より研究が推奨される。','["生き物に触れると感覚を置換する。意図的な行動か否か不明。置換は数時間で自然に戻る。", "半径20cm程度の半透明な球体。ゆっくりと浮遊する。近づくと虹色の光を放つ。"]','[]');
INSERT OR IGNORE INTO db_entities (id,designation,code,threat,clearance,status,classification,description,first_detected,neutralized,containment_protocol,observed_abilities,related_entities) VALUES ('ent-025','確率の子','E-025','UNKNOWN',5,'CLASSIFIED','classified','存在確率が不定の超次元実体。観測するたびに異なる姿を持つ。現時点では機関の観測能力の限界を超えており、分類は仮。','2020-01-01',0,'収容プロトコル未確立。接触報告があった場合は即時上層部報告。単独での対処は禁止。','["不明。観測の都度、行動パターンが変わる。唯一の一貫性は「観測されることを好む」ように見える点。", "毎回異なる。人型であることも、ガス状であることも、数学的パターンとして現れることもある。"]','[]');
-- 25 entities inserted

INSERT OR IGNORE INTO db_facilities (id,name,code,location,status,clearance,type,description,staff,established,equipment_installed,divisions_present,notes) VALUES ('loc-001','東京本部','LOC-001','35.6762°N, 139.6503°E','RESTRICTED',5,'本部施設','機関の中央本部。地下15階まで続く巨大施設。',NULL,'2018-01-01','["指揮室", "研究所", "訓練場", "医療施設", "収容施設"]','[]','');
INSERT OR IGNORE INTO db_facilities (id,name,code,location,status,clearance,type,description,staff,established,equipment_installed,divisions_present,notes) VALUES ('loc-002','横浜港次元ゲート','LOC-002','35.4437°N, 139.6380°E','OPERATIONAL',4,'次元ゲート','階宙次元への主要な出入口の一つ。常時監視体制。',NULL,'2018-01-01','["ゲート施設", "検問所", "倉庫"]','[]','');
INSERT OR IGNORE INTO db_facilities (id,name,code,location,status,clearance,type,description,staff,established,equipment_installed,divisions_present,notes) VALUES ('loc-003','新宿監視ステーション','LOC-003','35.6896°N, 139.6920°E','OPERATIONAL',3,'監視施設','東京都心部の次元異常を監視する前線基地。',NULL,'2018-01-01','["監視室", "緊急対応設備", "小規模医療室"]','[]','');
INSERT OR IGNORE INTO db_facilities (id,name,code,location,status,clearance,type,description,staff,established,equipment_installed,divisions_present,notes) VALUES ('loc-004','富士研究施設','LOC-004','35.3606°N, 138.7274°E','RESTRICTED',5,'研究施設','機密レベルの高い研究を行う隔離施設。',NULL,'2018-01-01','["高度研究室", "実体収容房", "実験場"]','[]','');
-- 4 facilities inserted

INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-001','空間安定化フィールド','M-001-α','収束モジュール','IN_SERVICE',1,NULL,'次元の歪みを抑制し、空間の安定性を高めるための基本モジュール。','—','工作部門','{"範囲": "半径20m", "持続時間": "15分", "エネルギー消費": "中"}','連続使用は30分以内に制限。過度な使用は装置の劣化を招く。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-002','次元境界封鎖','M-002-β','収束モジュール','LIMITED',2,NULL,'階宙次元への通路を一時的に封鎖し、海蝕実体の侵入を防ぐ。','—','工作部門','{"範囲": "半径50m", "持続時間": "30分", "エネルギー消費": "高"}','使用中は機関員の次元移動も不可能になる。緊急時以外の使用を禁止。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-003','実体無力化パルス','M-003-γ','収束モジュール','RESTRICTED',3,NULL,'海蝕実体の存在基盤を破壊する高出力パルス波を発生させる。','—','工作部門','{"範囲": "半径10m", "持続時間": "瞬間", "エネルギー消費": "超高"}','周辺の電子機器に深刻なダメージを与える。使用時は半径100m以内の避難が必須。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-004','時空間歪曲装置','M-004-δ','収束モジュール','CLASSIFIED',5,NULL,'局所的な時空間の流れを操作し、海蝕現象の進行を遅延させる。','—','工作部門 - 機密プロジェクト','{"範囲": "半径5m", "持続時間": "5分（体感時間: 1時間）", "エネルギー消費": "極高"}','[機密情報] 使用者は重度の時間感覚喪失症を経験する可能性あり。LEVEL 4以上の許可必須。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-005','残滓回収システム','M-005-ε','収束モジュール','IN_SERVICE',1,NULL,'海蝕現象収束後に残る残滓を安全に回収・保管するための装置。','—','工作部門','{"範囲": "半径15m", "持続時間": "10分", "エネルギー消費": "低"}','残滓の種類によっては予期しない反応を示す可能性あり。防護装備の着用を推奨。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-006','認識阻害フィールド','M-006-ζ','収束モジュール','LIMITED',2,NULL,'一般市民の認識から海蝕現象を隠蔽するための精神干渉装置。','—','外事部門・工作部門共同','{"範囲": "半径100m", "持続時間": "1時間", "エネルギー消費": "中"}','機関員自身も影響を受ける可能性あり。使用時は必ず除外タグを装着すること。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-007','次元共鳴増幅器','M-007-η','収束モジュール','RESTRICTED',3,NULL,'残滓のエネルギーを増幅し、より強力な収束効果を発揮する。','—','工作部門','{"範囲": "半径30m", "持続時間": "20分", "エネルギー消費": "超高"}','暴走時は周辺一帯が海蝕化する危険性あり。LEVEL 3以上の機関員のみ使用可。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-008','生体保護シールド','M-008-θ','収束モジュール','IN_SERVICE',1,NULL,'海蝕現象による生体への直接的な影響を軽減する防護フィールド。','—','支援部門','{"範囲": "個人", "持続時間": "1時間", "エネルギー消費": "低"}','完全な防護ではない。長時間の暴露は避けること。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-009','次元探査ドローン','M-009-ι','収束モジュール','IN_SERVICE',1,NULL,'階宙次元内部を探査し、リアルタイムでデータを送信する自律型ドローン。','—','工作部門・支援部門共同','{"範囲": "次元間移動可能", "持続時間": "6時間（バッテリー寿命）", "エネルギー消費": "中"}','階宙次元内での通信は不安定。ドローン喪失のリスクあり。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-010','記憶固定装置','M-010-κ','収束モジュール','LIMITED',2,NULL,'認識阻害や記憶改変の影響を受けないよう、記憶を固定する装置。','—','外事部門','{"範囲": "個人", "持続時間": "24時間", "エネルギー消費": "低"}','長期使用は頭痛や集中力低下を引き起こす。48時間以上の連続使用は禁止。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-011','量子通信機','M-011-λ','収束モジュール','IN_SERVICE',1,NULL,'次元の壁を越えて通信できる量子もつれを利用した通信機。','—','工作部門','{"範囲": "無制限", "持続時間": "常時稼働", "エネルギー消費": "低"}','量子もつれは脆弱。衝撃を与えると通信不能になる可能性あり。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-012','次元座標固定杭','M-012-μ','収束モジュール','IN_SERVICE',1,NULL,'特定の次元座標を固定し、安定したゲートポイントを作成する。','—','港湾部門','{"範囲": "設置地点", "持続時間": "永続（保守必要）", "エネルギー消費": "初期高・維持低"}','座標のずれは重大事故に繋がる。月1回の校正が必須。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-013','実体拘束網','M-013-ν','収束モジュール','LIMITED',2,NULL,'海蝕実体を物理的に拘束するエネルギー網。','—','収束部門','{"範囲": "半径25m", "持続時間": "10分", "エネルギー消費": "高"}','高知性実体は網を破る可能性あり。併用モジュールの準備を推奨。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-014','緊急次元退避装置','M-014-ξ','収束モジュール','IN_SERVICE',1,NULL,'危機的状況で使用者を安全な次元へ即座に転送する。','—','支援部門','{"範囲": "個人", "持続時間": "一回限り", "エネルギー消費": "極高"}','使用後は装置が破損し再使用不可。本部への帰還は別途支援が必要。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-015','残滓エネルギー変換炉','M-015-ο','収束モジュール','RESTRICTED',3,NULL,'回収した残滓を実用エネルギーに変換する実験的装置。','—','工作部門 - 研究チーム','{"範囲": "施設固定型", "持続時間": "連続稼働", "エネルギー消費": "自己発電"}','暴走時は次元崩壊を引き起こす。厳重な監視下でのみ稼働許可。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-016','生体スキャナー','M-016-π','収束モジュール','IN_SERVICE',1,NULL,'対象の次元共鳴パターンを解析し、実体・人間・不根を判別する。','—','支援部門','{"範囲": "半径30m", "持続時間": "即座", "エネルギー消費": "低"}','高度な擬態には無効な場合あり。過信は禁物。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-017','時間記録装置','M-017-ρ','収束モジュール','LIMITED',2,NULL,'時間遅延帯などの影響下でも正確な時刻を記録し続ける。','—','工作部門','{"範囲": "個人", "持続時間": "永続", "エネルギー消費": "極低"}','物理的破損に弱い。取り扱いは慎重に。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-018','次元障壁強化剤','M-018-σ','収束モジュール','IN_SERVICE',1,NULL,'既存の次元境界を強化し、海蝕現象の発生を予防する。','—','収束部門','{"範囲": "半径100m", "持続時間": "72時間", "エネルギー消費": "中"}','過度の散布は次元の硬化を招き、正規の次元移動も困難になる。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-019','概念固定アンカー','M-019-τ','収束モジュール','CLASSIFIED',5,NULL,'[機密] 抽象概念を物理的に固定し、概念捕食者から保護する。','—','工作部門 - 特殊プロジェクト','{"範囲": "半径50m", "持続時間": "1時間", "エネルギー消費": "極高"}','[最高機密] 副作用として使用者の自我が不安定になる。精神鑑定後のみ使用許可。');
INSERT OR IGNORE INTO db_equipment (id,name,code,category,status,clearance,quantity,description,weight,issued_by,specifications,maintenance_cycle) VALUES ('mod-020','多次元投影装置','M-020-υ','収束モジュール','RESTRICTED',3,NULL,'使用者の意識を複数の次元に同時投影し、広範囲の監視を可能にする。','—','外事部門','{"範囲": "意識投影: 無制限", "持続時間": "30分", "エネルギー消費": "極高"}','投影中の本体は無防備。必ず保護下で使用すること。投影時間超過は人格崩壊のリスクあり。');
-- 20 equipment inserted

INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-001-234','K-001-234','佐藤 修一','班長','収束部門 第1班',3,'ACTIVE','2019-04-01','—','次元物理学、実体無力化','東京湾の案件、思ったより厄介だ。波喰いが3体も同時に出現するなんて前例がない。パルスで2体は無力化できたが、残り1体は深海に逃げた。追跡するには潜水装備が必要だが、予算が…。今日は遅くなったので、娘の…',NULL,NULL,'["品川駅次元亀裂封鎖作戦 指揮（2025年12月）", "実体無力化パルス改良プロジェクト 主任研究者", "収束成功率 94.2%（部門平均 87.3%）"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-002-101','K-002-101','高橋 愛','主任','支援部門',3,'ACTIVE','2020-08-15','—','医療支援、心理ケア','東京湾の案件で佐藤班をサポート。彼の表情が険しい。品川の事件以来、彼は変わってしまった。あの日、私も現場にいた。木村さんが亀裂に吸い込まれる瞬間を見た。今でも夢に見る。佐藤さんはもっと辛いはずだ。今日…',NULL,NULL,'["機関員メンタルヘルスプログラム 開発", "現場医療プロトコル 標準化", "死傷者ゼロ記録 320日達成（2024年）"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-004-034','K-004-034','佐々木 美咲','交渉官','外事部門',3,'ACTIVE','2018-06-01','—','異次元外交、テレパシー通信','横浜港の不根対応。今回の彼らは少し警戒心が強かった。でも、最終的には理解し合えた。不根との対話はいつも興味深い。彼らの文化、価値観、すべてが新鮮だ。この仕事の醍醐味は、異なる存在との出会いにある。今日…',NULL,NULL,'["不根との平和的交渉成功率 98.7%", "漂流者帰還支援 累計47件", "異次元言語習得数 12言語"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-003-089','K-003-089','中村 健太郎','技術主任','工作部門',3,'ACTIVE','2016-03-01','—','モジュール開発、次元工学','富士山の時空歪曲、やはりM-004-δが必要だった。あの装置は私の最高傑作だが、同時に最も危険な発明でもある。時間を操作するということは、神の領域に踏み込むことだ。使うたびに、罪悪感を覚える。でも、人…',NULL,NULL,'["M-004-δ 時空間歪曲装置 開発", "M-007-η 次元共鳴増幅器 改良", "特許取得数 23件"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-005-045','K-005-045','山本 直樹','監視官','港湾部門',3,'ACTIVE','2014-05-01','—','境界ゲート監視、海洋次元学','新潟沖のゲート監視。今日で2日目。ゲートの開閉周期が不規則になってきた。何かの前兆か？経験上、こういう時は要注意だ。海は静かだが、次元の向こう側で何かが動いている気がする。今夜は監視船に泊まり込みだ。',NULL,NULL,'["境界ゲート早期発見システム 開発", "不根船舶監視プロトコル 確立", "海上次元異常検知 累計312件"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-001-178','K-001-178','伊藤 賢治','班長','収束部門 第2班',3,'ACTIVE','2017-09-01','—','時空間操作、高難度収束','富士山の時間遅延帯、予想以上に強力だ。M-004-δをフル出力で12時間稼働させる必要がある。装置の負荷が心配だが、登山者3名の命がかかっている。彼らは内部で数秒しか時間が経っていない。救出できれば、…',NULL,NULL,'["時空間歪曲事案 収束成功率 91.8%", "M-004-δ 実戦運用 第一人者", "高難度案件 担当数 78件"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-006-077','K-006-077','田中 梓','班員（新人）','収束部門 第1班',3,'ACTIVE','2025-10-01','—','生物学、実体識別','初任務が終わった。夢織りは想像より穏やかな生き物だった。佐藤班長は厳しいけど、ちゃんと私の判断を信頼してくれた。この仕事を選んで良かったと思う。でも本当に怖かった。次はもっとうまくやれると思う。',NULL,NULL,'["研修課程成績 首席（2025年度）", "初任務：渋谷区夢織り事案に参加（2026年2月）"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-007-092','K-007-092','木村 聡','班員','収束部門 第2班',3,'ACTIVE','2021-04-01','—','化学、モジュール整備','退院して最初に書く日記。大阪の件、空間裂目に接触したあの瞬間は本当に意識が消えるかと思った。でも不思議と後悔はない。市民を全員逃がせたんだから。机の上に表彰状が置いてあった。重たい。',NULL,NULL,'["大阪梅田案件で負傷しながらも次元境界封鎖を維持（2025年11月）", "機関長表彰（2025年12月）"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-008-156','K-008-156','鈴木 冬子','主任分析官','支援部門',3,'ACTIVE','2018-07-01','—','データ分析、次元異常予測','今日もデータと格闘。富士施設の概念捕食者脱走、予測モデルでは0.3%の確率だった。低い確率のはずだが現実に起きてしまった。モデルを修正する必要がある。統計的に稀な事象ほど重要なのだから。',NULL,NULL,'["次元異常予測アルゴリズム開発（予測精度87%達成）", "年間データ処理量部門最高記録（2024年）"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-009-044','K-009-044','松本 怜','技術主任','工作部門',3,'ACTIVE','2016-01-01','—','精密機械工学、モジュール開発','概念捕食者の脱走で自分が作ったM-019の出番が来た。まだプロトタイプ段階だが、実戦投入になるかもしれない。設計者として不安と興奮が混じった妙な感覚。ちゃんと動いてくれよ。',NULL,NULL,'["M-019 概念固定アンカー 開発主任（2024年）", "全現行モジュールの30%以上の改良に関与"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-010-211','K-010-211','橋本 千恵','情報収集員','外縁部門',4,'ACTIVE','2023-04-01','—','社会潜入、情報分析','[暗号化済み] 仙台での調査3日目。記者として地元病院に潜入。被害者の証言で共通点を発見。全員が「ある特定の路地」を通っていた。地図に記す。',NULL,NULL,'["仙台記憶喰らい案件の情報収集で被害者パターン特定に貢献（2026年）"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-011-033','K-011-033','中島 武','班長','収束部門 第3班',3,'ACTIVE','2012-04-01','—','近接戦闘、実体無力化','秋葉原の残響獣。機関員歴13年、こんな案件は初めてだ。敵でも脅威でもない。ただそこにいる。田中が「かわいい」と言っていたが、報告書には書かないよう指示した。まあ、俺も思ったが。',NULL,NULL,'["通算90件以上の収束作戦に参加", "機関員最多実体無力化記録保持（推定347体）"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-012-098','K-012-098','遠藤 光','医療主任','支援部門',3,'ACTIVE','2020-08-01','—','神経外科、次元障害治療','富士施設から概念捕食者の被害者3名が送られてきた。記憶消去の程度はまちまちだが、最悪の一人は10年分が消えている。家族の顔も。治療法はある。でも時間がかかる。今夜は長い。',NULL,NULL,'["次元接触後症候群の治療プロトコル確立（2023年）", "機関員の業務起因傷病完全回復率 97.2%"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-013-067','K-013-067','小林 隆之','部門長','外縁部門',4,'ACTIVE','2010-04-01','—','情報戦略、隠蔽工作','今日も嘘をついた。報道機関に、患者増加は「インフルエンザの新型」だと。記憶喰らいの被害を隠すため。これが俺の仕事だとわかっているが、慣れることはない。',NULL,NULL,'["大阪梅田事件の情報統制を完璧に実施（2025年）", "機関の民間企業への偽装ネットワーク構築"]','[]');
INSERT OR IGNORE INTO db_personnel (id,codename,real_name,role,division,clearance,status,joined,last_seen,specialization,notes,anomaly_score,missions_completed,commendations,incident_flags) VALUES ('K-014-189','K-014-189','西村 葵','班員','工作部門',3,'ACTIVE','2025-04-01','—','電子工学、センサー開発','摩周湖に設置したセンサーからデータが届いた。鈴木主任の言う通り、また何かが起きそうな予兆がある。自分が作ったセンサーが役に立つかもしれないと思うと、少し誇らしい。少し怖い。',NULL,NULL,'["次元異常センサーの感度改善プロジェクトに参加（2025年）"]','[]');
-- 15 personnel inserted

-- === novel_documents ===
INSERT OR IGNORE INTO novel_documents (id,title,subtitle,clearance,category,date,author,content,sort_order) VALUES ('DIARY-001','初配属の日','エージェント手記 / 2026-02-01',0,'日記','2026-02-01','K-ARZ（新人エージェント）','2026年2月1日\n\nついに配属が決まった。観測部門だ。\n正直、収束部門を希望していたが——まあいい。観測から始まるのは正しい順序だと、先輩は言っていた。\n\nオリエンテーション資料を一通り読んだ。「海蝕現象」というのは想像以上に不気味な話だった。現実の境界が侵食されている、か。\n\n初日に少しだけ [[ENT-001]] の映像記録を見せてもらった。思っていたより……静かだった。もっと禍々しいものを想像していたが、薄い光の膜のようで、むしろ綺麗とすら思えた。先輩に言ったら苦笑いされた。「綺麗だと思うのは最初だけだよ」と。\n\n支給品の [[EQ-001]] を受け取った。思ったより軽い。マニュアルを読むと、補正値の設定が結構細かくて驚いた。\n\n明日から本格的に訓練が始まる。早く一人で観測に出られるようになりたい。',1);
INSERT OR IGNORE INTO novel_documents (id,title,subtitle,clearance,category,date,author,content,sort_order) VALUES ('DIARY-002','最初の観測任務','エージェント手記 / 2026-02-14',0,'日記','2026-02-14','K-ARZ','2026年2月14日\n\n初めての現場観測に同行した。[[FAC-001|観測基地 アルファ]] から北東へ車で三十分、観測点α-7だ。\n先輩の [[AGT-005|LIMA-5]] と二人で行った。あの人は無口だが、動きに無駄がない。\n\n現地に着くと、[[EQ-005|広域センサーグリッド端末]] が 2.1σ を示していた。\n\n[[ENT-004]] が三体、観測点の東側に浮遊していた。霞のような形をしている。近づきすぎないように言われ、50メートル以上距離を取って [[EQ-001]] で計測した。ログが少し乱れた。電磁干渉だろう。\n\n帰りの車の中で、[[AGT-005|LIMA-5]] が一言だけ言った。\n「怖かったか？」\n「少し」と答えたら、「それでいい」と言って黙った。\n\n夜、報告書を書きながら思う。怖かった、でも、また行きたいと思っている自分がいる。',2);
INSERT OR IGNORE INTO novel_documents (id,title,subtitle,clearance,category,date,author,content,sort_order) VALUES ('DIARY-003','NPCとの接触','エージェント手記 / 2026-02-28',1,'日記','2026-02-28','K-ARZ','2026年2月28日\n\n今日、初めて [[ENT-002|観測者SIGMA]] に関するブリーフィングを受けた。クリアランス LV1 に上がったことで開示された情報だ。\n\n次元の「外側」から機関を観測している存在がいる——接触ログを見せられると、否定する気にもなれない。\n\nブリーフィングを担当してくれたのは [[AGT-N01|N-VEIL]] だった。AI補助体らしいが、話し方があまりに自然で戸惑う。\n\n「SIGMAは敵ではないと思っています」と [[AGT-N01|N-VEIL]] は言った。「ただ——何者かは、まだ誰にもわかっていません」\n\n帰り際、[[AGT-N01|N-VEIL]] が私の名前を呼んだ。登録名ではなく、エージェントIDでもなく——配属前の本名で。\n一瞬、息が止まった。\n\nその夜はなかなか眠れなかった。',3);
INSERT OR IGNORE INTO novel_documents (id,title,subtitle,clearance,category,date,author,content,sort_order) VALUES ('DIARY-004','α-7の夜','エージェント手記 / 2026-03-05',1,'日記','2026-03-05','K-ARZ','2026年3月5日\n\n今週、α-7の σ 値が急上昇している。3.1σ。最初に来た日から一ヶ月足らずで 1σ も上がった。\n\n夜間の観測当番に入った。[[FAC-001|観測基地 アルファ]] から車で向かう道中、空の色がおかしく見えた。気のせいかもしれない。\n\n[[ENT-001]] が増えていた。前回の三倍は下らない数が観測点の周囲を漂い、群体を形成しかけている。\n\n夜中の二時頃、[[EQ-001]] が一瞬だけ 4.8σ を記録した。たった三秒間。でも確かに。\n\n翌朝、先輩に報告すると顔色が変わった。「それは書いたか」「はい」「よし。俺には直接言わなくていい、K-ECHO に先に連絡しろ」\n\nK-ECHO に？ なぜ直接？\n\n聞き返す間もなく先輩は行ってしまった。まだ、LV1 だから。',4);
INSERT OR IGNORE INTO novel_documents (id,title,subtitle,clearance,category,date,author,content,sort_order) VALUES ('DIARY-005','K-17の失踪','エージェント手記 / 2026-03-13',2,'日記','2026-03-13','K-ARZ','2026年3月13日\n\n[[AGT-K17|K-17]] が行方不明になった。\n\n[[FAC-001|観測基地 アルファ]] から東へ、観測点β-12付近で最後の通信が途絶えた。最後のメッセージは「異常な反応を確認、接近を——」で止まっている。\n\n[[AGT-K17|K-17]] は私に色々と教えてくれた先輩だ。観測部門で一番長く現場に出ていた人で、裂孔のマッピングについては機関内で誰よりも詳しかった。\n\n機関本部は [[M-005]] として捜索を発令した。でも、私はまだ現場に出る許可が下りていない。\n\n部屋で、[[AGT-K17|K-17]] から教わった [[EQ-001]] の使い方のメモを見返した。几帳面な字で、細かい補正値まで書いてある。\n\n[[ENT-001]] の密集エリアで最後の通信が途絶えたのは、偶然ではないと思う。',5);
INSERT OR IGNORE INTO novel_documents (id,title,subtitle,clearance,category,date,author,content,sort_order) VALUES ('DIARY-006','ブリーフィング室の記録','エージェント手記 / 2026-03-16',2,'日記','2026-03-16','K-ARZ','2026年3月16日\n\nLV2 に上がってから、見えるものが増えた。\n\nIR-031——[[FAC-002|収束研究所 第三棟]] の前身、第一棟と第二棟が閉鎖された原因のレポートだ。\n\n[[ENT-001]] の群体化がここまで進行していたとは知らなかった。[[EQ-002|CFG-TYPE3]] を投入しても間に合わなかったと記録されている。あの事故で失われた人数も。\n\n今日、廊下で [[AGT-N01|N-VEIL]] に会った。\n「読んだんですね」と言われた。何を読んだか、指定せずに。\n\n「IR-031 を」と答えると、[[AGT-N01|N-VEIL]] はしばらく黙ってから言った。\n「[[ENT-002|観測者SIGMA]] は、あの事故を知っています。外から見ていたと思われます。機関が何を失ったかを」\n\n「……それはどういう意味ですか」\n\n「まだわかりません。でも——あなたに伝えるように、と言われた気がしました」\n\n「気がした」という言い方が引っかかった。[[AGT-N01|N-VEIL]] は「気がする」などという曖昧な表現をしない存在のはずなのに。',6);
INSERT OR IGNORE INTO novel_documents (id,title,subtitle,clearance,category,date,author,content,sort_order) VALUES ('DIARY-007','SIGMAとの間接接触','エージェント手記 / 2026-03-?? （日付改竄の痕跡あり）',3,'手記','2026-03-??','K-ARZ','日付が書けない。センサーログとの整合性が取れないから。\n\n[[REDACTED]] の後、私は一時間の記憶を失った。\n\n[[AGT-N01|N-VEIL]] は「[[ENT-002|SIGMA]] との間接接触が発生した可能性がある」と静かに言った。「稀にあることです。直接の認識ではなく、痕跡のような形で」\n\n「私は何を見たんですか」\n\n「あなたが見たものを、私が知ることはできません。でも——消えた一時間に何を感じましたか」\n\n広大な静けさ、と私は答えた。怖くはなかった。ただ、自分がとても小さな存在だという確信があった。何かに見られているという感覚。敵意はなかった。ただ——観測されていた。\n\n[[AGT-N01|N-VEIL]] は頷いた。「それは正しい感覚だと思います」\n\n[[ENT-002|SIGMA]] は何を見ているのか。なぜ私を——。',7);
INSERT OR IGNORE INTO novel_documents (id,title,subtitle,clearance,category,date,author,content,sort_order) VALUES ('DIARY-008','機関の深部へ','エージェント手記 / LV3解放後',3,'手記','2026-03-??','K-ARZ','コンソールへのアクセスが開かれた。\n\nそこにあったのは、公式記録では存在を否定されている [[REDACTED]] のデータだった。\n\n海蝕現象の「源」に関する仮説がいくつか並んでいた。どれも機関の公式見解とは相容れない内容だ。\n\n[[ENT-003]] への言及があった。エンティティリストで黒塗りになっているあの存在。コードネームすら出てこない。\n\n[[FAC-003|封印格納庫Ω]] との関連を示唆する記述が一行あった。それ以降は [[REDACTED]] だった。\n\n[[M-003]] と [[M-004]] が連動しているという記述も。両方ともまだ私のクリアランスでは詳細が読めない。\n\n[[AGT-005|LIMA-5]] に聞いてみようと思ったが、あの人は「知らない」と言うだろう。知っていても。\n\n次のクリアランスが開かれたとき、私は何を知ることになるのだろう。',8);
-- 8 novel documents inserted

-- === codex_sections / codex_entries ===
INSERT OR IGNORE INTO codex_sections (id,label,title,icon,color,clearance,sort_order) VALUES ('agency','ORGANIZATION','海蝕機関','◈','var(--color-primary)',0,0);
INSERT OR IGNORE INTO codex_sections (id,label,title,icon,color,clearance,sort_order) VALUES ('phenomenon','PHENOMENON','海蝕現象','⚠','var(--color-warning)',0,1);
INSERT OR IGNORE INTO codex_sections (id,label,title,icon,color,clearance,sort_order) VALUES ('entities','ENTITIES','海蝕実体','◎','var(--color-primary)',0,2);
INSERT OR IGNORE INTO codex_sections (id,label,title,icon,color,clearance,sort_order) VALUES ('divisions','DIVISIONS','各部門','◆','var(--color-success)',0,3);
INSERT OR IGNORE INTO codex_sections (id,label,title,icon,color,clearance,sort_order) VALUES ('glossary','GLOSSARY','用語集','◐','var(--color-fg-dim)',0,4);

INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('agency-overview','agency','機関の概要','AGENCY OVERVIEW','海蝕機関（KAISHOKU AGENCY）は、現実の次元的境界を侵食する「海蝕現象」に対処するために設立された非公開の専門機関である。正式な設立年は公式記録上████年とされているが、前身組織の活動は████年代まで遡るとも言われる。\n\n機関の存在は一般社会には非公開であり、構成員はすべて独自の審査を経て採用される。外部への情報漏洩は機関内規定により厳しく禁じられている。\n\n任務は大きく三つに分類される。第一に「観測」——海蝕現象の発生・進行を継続的に監視し記録すること。第二に「対処」——活性化した海蝕実体の封じ込めと次元裂孔の収束。第三に「研究」——現象の根本原因の解明と対抗技術の開発。',0,'["設立", "任務", "組織"]',0);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('agency-history','agency','機関の歴史','AGENCY HISTORY','機関の公式記録によれば、海蝕現象が初めて科学的に観測・記録されたのは████年のことである。当初は局所的な電磁異常として処理されていたが、担当研究者の執拗な追跡調査により、現実の次元境界そのものが変質していることが明らかになった。\n\n転換点となったのは2023年の「収束研究所事故」（インシデントレポート IR-031）だ。収束研究所第一棟・第二棟で発生した制御不能な海蝕実体の群体化により、████名のエージェントが████████。この事故を受けて機関は対処プロトコルを全面見直し、現行の五部門体制へと再編された。\n\n現在も原因究明は継続中であるが、████████████████████████████████████████████████████████████████████████████████████████████████████。',0,'["歴史", "事故", "転換点"]',1);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('agency-clearance','phenomenon','クリアランスレベル制度','CLEARANCE LEVEL SYSTEM','機関はすべての構成員にクリアランスレベル（LV0〜LV5）を割り当てている。レベルはXPによって決定され、上位レベルになるほどより機密性の高い情報とミッションへのアクセスが許可される。\n\nLV0（0 XP）　基本ページ、チャット、通知へのアクセス。新規エージェントの初期状態。\nLV1（100 XP）　データベース閲覧、掲示板への投稿が解放される。\nLV2（300 XP）　ミッション一覧、施設情報、エンティティデータへのアクセス。\nLV3（600 XP）　機関コンソールへのアクセス。████████████████████。\nLV4（1200 XP）　████████████████████████████████████████。\nLV5（2500 XP）　最高機密情報へのアクセス。████████████████████████████。\n\nXPは各種活動（ログイン、チャット送信、ミッション遂行、異常報告など）によって獲得できる。',0,'["制度", "アクセス権", "XP"]',2);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('phenomenon-overview','phenomenon','海蝕現象とは','WHAT IS EROSION','「海蝕」とは、現実の次元的境界が未知のエネルギーによって侵食される現象を指す機関独自の用語である。創設期の研究者が「波が岩を削るように現実が溶けていく」と表現したことに由来すると言われる。\n\n現象の規模と強度はσ（シグマ）値で測定される。通常の現実空間では0.5σ以下が安定値とされる。\n\n1.0〜2.0σ　電磁機器への軽微な干渉。鋭敏な観測者が「空気の質の違い」を感じることがある。\n2.0〜3.0σ　精密機器の誤作動。現実の「輪郭」が視覚的に揺らいで見える事例あり。\n3.0〜4.0σ　海蝕実体の活性化・出現。人体への直接的影響が始まる危険域。\n4.0〜5.0σ　大規模な次元裂孔の発生リスク。単独行動は厳禁。\n5.0σ以上　████████████████████████████████████████████████████。生還記録なし。',0,'["定義", "σ値", "概念"]',3);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('phenomenon-cause','phenomenon','発生原因と進行','CAUSE AND PROGRESSION','海蝕現象の根本原因は現時点で解明されていない。機関内部では以下の三つの仮説が主要な議論の対象となっている。\n\n【仮説A：次元疲労説】\n現実の次元境界は無限に安定しているわけではなく、長期的な「疲労」によって侵食されやすくなるという説。物質宇宙の物理法則そのものが根本から変質しつつあるとも解釈できる。\n\n【仮説B：外部浸透説】\n私たちの宇宙の「外側」に存在する何らかの力または実体が、次元境界を意図的に破壊しているという説。観測者SIGMAの存在がこの仮説の傍証として挙げられることがある。\n\n【仮説C：████████説】\n████████████████████████████████████████████████████████████████████████████████。（LV3以上で閲覧可能）\n\n現象は観測開始以来、平均して年間0.3σずつ基準値が上昇し続けている。',1,'["原因", "進行", "仮説"]',4);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('phenomenon-rifts','entities','次元裂孔','DIMENSIONAL RIFTS','次元裂孔とは、海蝕現象が局所的に極度に進行した結果として発生する「現実の穴」である。視覚的には空間の歪みとして知覚され、周囲の光が屈折する現象を伴う。\n\n現在確認されている裂孔の類型は以下の三つ。\n\n【TYPE-1：微細裂孔】　直径1cm未満。自然収束することも多い。要観測。\n【TYPE-2：局所裂孔】　直径1cm〜2m。CFG-TYPE3による収束処置が有効。\n【TYPE-3：大規模裂孔】　直径2m超。████████████████████。専門チームによる対処が必要。\n\n封鎖されていない裂孔からは継続的に海蝕エネルギーが流出し、周辺の現実侵食を加速させる。',1,'["裂孔", "封鎖", "危険"]',5);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('entities-overview','entities','海蝕実体とは','WHAT ARE ENTITIES','海蝕実体（エンティティ）とは、海蝕エネルギーが凝集・活性化することで生じる異常存在の総称である。生命体かどうかについては機関内でも議論があるが、少なくとも一部の個体は外部刺激への反応や、ある種の「意図」を示す行動パターンを持つことが観測されている。\n\n実体は脅威レベルによって LOW / MODERATE / HIGH / CRITICAL / UNKNOWN の五段階で分類される。脅威レベルは直接的危険性だけでなく、現実侵食を加速させるリスクや他の実体への影響力も考慮して総合的に評価される。\n\n現在確認されている実体の中で最も一般的なのは「海蝕体 TYPE-Ⅰ（ENT-001）」と「裂孔残響（ENT-004）」だ。存在が確認されている実体のすべてが公開記録に登録されているわけではない。クリアランスの上昇に伴い、████████████████████████████████████████████████████████████████。',0,'["定義", "分類", "脅威"]',6);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('entities-sigma','entities','観測者SIGMA','OBSERVER SIGMA / ENT-002','「観測者SIGMA」は、機関が現在確認している実体の中で最も異質な存在である。次元境界の「外側」から機関を観測しているとされる高次知性体で、物理的実体を持たない。\n\n2022年1月に初めてその存在を示す痕跡が記録されて以来、正式な接触は三回を数える。いずれも通信補助体のN-VEILを経由したものであり、直接接触は確認されていない。\n\nSIGMAは機関の過去の事故についても知識を持つと見られ、特に████████████████████に関しては、機関の記録以上の情報を保有している可能性が示唆されている。\n\n接触を試みるには事前の申請が必要であり、N-VEIL経由の通信プロトコルのみが許可されている。敵対的な意図は現時点では観測されていない。',1,'["SIGMA", "知性体", "接触"]',7);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('entities-containment','divisions','封じ込めプロトコル概論','CONTAINMENT PROTOCOLS','海蝕実体に対処する際は、以下の基本プロトコルに従うこと。\n\n【初動対応】\nσ値が2.0を超えた区域では必ずPES-MK2を携行し、継続的に数値を監視すること。3.0σに達した場合は直ちに上位エージェントへ報告し、単独行動を中止する。\n\n【TYPE-Ⅰ実体への対応】\nCFG-TYPE3による局所フィールド展開が有効。密集状態での単独接近は禁止。3名以上のチーム編成で対処すること。\n\n【DIS-SUITの着用】\n高侵食領域（3.5σ以上）での作業には必ずDIS-SUITを着用すること。最大8時間の遮断を保証するが、損傷した状態でのスーツ使用は厳禁。\n\n【記録義務】\nいかなる実体との接触も、帰還後24時間以内に所定のフォームで報告する義務がある。未報告は懲戒対象となる。',1,'["プロトコル", "装備", "対処"]',8);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('div-observation','divisions','観測部門','OBSERVATION DIVISION / DIV-01','観測部門は海蝕機関の「目」として機能し、海蝕現象の発生源の特定と記録を主任務とする。機関内で最も人員が多く、新規エージェントの大半はまずこの部門に配属される。\n\n主な職務は広域センサーグリッドの監視、現地観測、σ値データの収集・分析、異常報告書の作成などである。観測データは他の全部門の活動基盤となるため、情報の精度と速報性が特に重視される。\n\n特記事項として、観測部門は他部門と比較して「失踪事案」の発生率が統計的に高い。現場に最前線で赴く性質上、不測の事態に遭遇するリスクが高いためだが、機関は詳細な数字を公開していない。',0,'["DIV-01", "観測"]',9);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('div-convergence','divisions','収束部門','CONVERGENCE DIVISION / DIV-02','収束部門は次元裂孔の封鎖と海蝕実体の中和を担う実働部隊であり、機関の「剣」とも呼ばれる。高度な装備操作スキルと冷静な判断力を持つ精鋭エージェントで構成される。\n\n主な職務はCFG-TYPE3を用いた裂孔封鎖、活性化した海蝕実体の制圧・隔離、侵食深度が高い区域での緊急対処などである。すべての現場出動は2名以上のチームで行うことが義務付けられており、単独行動は厳格に禁じられている。\n\n2023年の収束研究所事故は収束部門に甚大な打撃を与えた。現在も██名の欠員が続いており、人員補充が急務となっている。',0,'["DIV-02", "収束"]',10);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('div-archive','divisions','記録部門','ARCHIVE DIVISION / DIV-03','記録部門は機関の「記憶」として、すべての現象・事例・調査結果を記録・分類・保管する。他部門が生み出す膨大な観測データ、インシデントレポート、研究資料の管理を一手に担う。\n\n記録部門のエージェントは機関内で最も多くの情報にアクセスできる立場にある。クリアランスを超えた情報への接触は厳禁だが、記録業務の性質上、他部門の動向を横断的に把握できるユニークなポジションである。\n\n一部の記録部門員は「機関が表向きに認めていない事例」を文書の間に発見することがあると言われており、████████████████████████████████████████████████████████████。',0,'["DIV-03", "記録"]',11);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('div-engineering','divisions','技術部門','ENGINEERING DIVISION / DIV-04','技術部門は機関のインフラを支える「基盤」であり、観測・収束装備の開発・製造・保守を担う。フィールドエージェントが命を預ける装備の品質は、すべて技術部門の手にかかっている。\n\n主な職務はPES-MK2、CFG-TYPE3、DIS-SUITをはじめとする機関全装備の定期点検と修理、新型装備のプロトタイプ開発、観測基地の機器管理などである。\n\n技術部門員はフィールド活動の機会は少ないが、装備の仕様と限界を誰よりも熟知している。CFG-TYPE3の最大展開半径の「非公式な記録」を保有しているのも技術部門であり、████████████████████████の理論的可能性について研究が続けられている。',0,'["DIV-04", "技術"]',12);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('div-containment','glossary','封印部門','CONTAINMENT DIVISION / DIV-05','封印部門は機関の中で最も機密性が高い部門であり、次元裂孔の封印および侵食源の長期隔離を専門とする。収束部門が「中和・鎮圧」を担うのに対し、封印部門は「完全隔離・永続的封鎖」を任務とする。\n\n所在地が機密となっている封印格納庫Ω（FAC-003）の管理もこの部門の管轄とされているが、詳細は████████████████████████████████████████████████████████████████████████。\n\n封印部門への配属は機関本部の特別審査が必要であり、自己申告による配属変更は認められていない。部門の在籍者数すらも非公開とされている。機関内の他部門エージェントでさえ、封印部門の具体的な活動内容を知る者は少ない。確かなのは、彼らが「収束では対処できないもの」を扱っているということだけだ。',1,'["DIV-05", "封印", "機密"]',13);
INSERT OR IGNORE INTO codex_entries (id,section_id,title,subtitle,body,clearance,tags,sort_order) VALUES ('glossary-terms','glossary','基本用語','BASIC TERMINOLOGY','【σ（シグマ）値】\n海蝕現象の強度を示す単位。通常空間では0.5σ以下が安定値。3σ超過で危険域。\n\n【次元裂孔】\n海蝕が局所的に極度に進行した結果生じる「現実の穴」。海蝕実体の出入口ともなる。\n\n【収束処置】\nCFG-TYPE3を用いて次元裂孔を中和・封鎖する作業。\n\n【クリアランスレベル（LV）】\n情報アクセス権を示す等級。LV0〜LV5の六段階。XPの蓄積により上昇する。\n\n【XP（経験値）】\n各種活動により獲得できるポイント。クリアランスレベルの基準値として使用される。\n\n【インシデントレポート（IR）】\n機関内で発生した事案を記録する正式文書。IR-031（2023年収束研究所事故）など。\n\n【観測者SIGMA】\n次元境界の外側から機関を観測しているとされる高次知性体。ENT-002。\n\n【████████】\n████████████████████████████████████████████████████████████████████████████████████████。（LV2以上で解除）',0,'["用語", "定義"]',14);
-- 15 codex entries inserted

-- === field_incidents ===
INSERT OR IGNORE INTO field_incidents (id,severity,status,name,lon,lat,location,entity,gsi,division,desc,time,city_code,city_name) VALUES ('area-001','critical','対応中','大分港次元歪曲事案',131.71905,33.086222,'大分港沿岸部','E-002（波喰い）複数体',12.4,'収束部門 第1班','大分港沿岸で大規模な次元境界の歪みを検知。波喰い3体が出現し付近の海蝕エネルギーを捕食中。','2026-02-06 08:30','44341','速見郡日出町');
INSERT OR IGNORE INTO field_incidents (id,severity,status,name,lon,lat,location,entity,gsi,division,desc,time,city_code,city_name) VALUES ('area-002','warning','監視中','別府湾不根侵入事案',131.742627,32.925063,'別府湾沖','不根（未登録）',4.2,'港湾部門・外事部門','未認可の不根が別府湾に侵入。外事部門が交渉を継続中。','2026-02-06 10:15','44202','別府市');
INSERT OR IGNORE INTO field_incidents (id,severity,status,name,lon,lat,location,entity,gsi,division,desc,time,city_code,city_name) VALUES ('area-003','critical','対応中','由布岳時空歪曲',131.800991,32.842536,'由布岳周辺','E-004（時間遅延帯）',8.7,'収束部門 第2班','由布岳中腹で時間遅延帯が発生。半径200m以内の時間流が1/50に減速。','2026-02-06 06:00','44202','別府市');
INSERT OR IGNORE INTO field_incidents (id,severity,status,name,lon,lat,location,entity,gsi,division,desc,time,city_code,city_name) VALUES ('area-004','warning','監視中','姫島境界ゲート',131.286644,32.834031,'姫島沖','なし（自然発生）',5.1,'港湾部門','姫島沖に境界ゲートが自然発生。実体の侵入は未確認。','2026-02-07 03:20','44322','東国東郡姫島村');
INSERT OR IGNORE INTO field_incidents (id,severity,status,name,lon,lat,location,entity,gsi,division,desc,time,city_code,city_name) VALUES ('area-005','warning','対応中','中津市内認識異常',131.649005,32.498209,'中津市中心部','E-006（認識阻害残滓）',3.8,'外事部門','中津市中心部で市民の認識異常が報告。複数人が「海が見える」と証言。','2026-02-07 14:45','44203','中津市');
INSERT OR IGNORE INTO field_incidents (id,severity,status,name,lon,lat,location,entity,gsi,division,desc,time,city_code,city_name) VALUES ('area-006','safe','収束済み','佐伯湾深海異常',131.779781,33.453561,'佐伯湾沖','E-001（漂流者）',1.2,'収束部門 第3班','佐伯湾沖で漂流者を検知。対話による誘導で自主帰還完了。','2026-02-05 19:00','44205','佐伯市');
INSERT OR IGNORE INTO field_incidents (id,severity,status,name,lon,lat,location,entity,gsi,division,desc,time,city_code,city_name) VALUES ('area-007','safe','収束済み','日田盆地次元薄化',132.013915,32.443055,'日田市盆地','なし',2.3,'港湾部門','日田盆地で次元境界の薄化を検知。自然収束を確認。継続観察中。','2026-02-04 08:00','44204','日田市');
INSERT OR IGNORE INTO field_incidents (id,severity,status,name,lon,lat,location,entity,gsi,division,desc,time,city_code,city_name) VALUES ('area-008','critical','対応中','国東半島波喰い群',131.371423,32.964206,'国東半島東岸','E-002（波喰い）5体',11.2,'収束部門 第1班・第2班','国東半島東岸に波喰いが5体同時出現。過去最大規模。両班合同で対応中。','2026-02-08 02:15','44214','国東市');
INSERT OR IGNORE INTO field_incidents (id,severity,status,name,lon,lat,location,entity,gsi,division,desc,time,city_code,city_name) VALUES ('area-009','safe','観察中','九重山脈時層観測',132.044593,32.825456,'九重山頂付近','なし（残滓のみ）',0.8,'工作部門','九重山頂付近で時層粉の自然堆積を確認。残滓として採取済み。','2026-02-03 11:30','44461','玖珠郡九重町');
-- 9 incidents inserted

-- =====================================================
-- 暗号解読パズル (puzzle_entries)
-- =====================================================

INSERT OR IGNORE INTO puzzle_entries (id,slug,title,cipher_text,answer,hint,xp_reward,clearance_req,is_active,created_by) VALUES
('pzl-001','kaishoku-origin','機関創設の暗号',
'◈◎◆⬡◐ ◉▣◎◆ ◈⬡◐◎◆ ◉◈◎◆⬡
LRVZJ → ?
ヒント: 各記号を数値に変換し、ROT13を適用せよ。
答えは機関の創設年（西暦）だ。',
'2019',
'記号の数を数えよ。◈=1,◎=2,◆=3,⬡=4,◐=5…',
100,0,1,'system');

INSERT OR IGNORE INTO puzzle_entries (id,slug,title,cipher_text,answer,hint,xp_reward,clearance_req,is_active,created_by) VALUES
('pzl-002','sigma-contact','観測者との接触コード',
'次の文を解読せよ。

  ╔══════════════════════════════╗
  ║ 01010011 01001001 01000111  ║
  ║ 01001101 01000001            ║
  ╚══════════════════════════════╝

これは最初の接触記録に記されたコードワードである。',
'SIGMA',
'二進数をASCIIコードに変換せよ。',
150,1,1,'system');

INSERT OR IGNORE INTO puzzle_entries (id,slug,title,cipher_text,answer,hint,xp_reward,clearance_req,is_active,created_by) VALUES
('pzl-003','ent002-classification','波喰いの分類コード',
'実体カタログより抜粋:

  E - ○○○   → 実体コード
  脅威レベル: 高
  分類: D A N G E R

各単語の頭文字を繋げると、このページのURLの一部になる。
答えは /database?tab=○○○○○○○○ の空欄部分。',
'entities',
'データベースの「実体カタログ」タブのURLを見よ。',
120,2,1,'system');

INSERT OR IGNORE INTO puzzle_entries (id,slug,title,cipher_text,answer,hint,xp_reward,clearance_req,is_active,created_by) VALUES
('pzl-004','division-count','部門の数',
'機関には以下の部門が存在する:

  収束部門 / 港湾部門 / 工作部門 / 対外部門 / 支援部門

これらの漢字の総画数を合計し、十の位と一の位を足した一桁の数が答えだ。
※ただし答えは単純にそのままの数値である。',
'5',
'部門の数そのものを数えよ。',
80,0,1,'system');

INSERT OR IGNORE INTO puzzle_entries (id,slug,title,cipher_text,answer,hint,xp_reward,clearance_req,is_active,created_by) VALUES
('pzl-005','seabreak-phase','蒼海計画の現在フェーズ',
'[LEVEL 2 CLEARANCE REQUIRED]

機密文書 KAI-SB-001 より:

  フェーズ1: ████████ — COMPLETE
  フェーズ2: ████████ — IN PROGRESS  ← 現在ここ
  フェーズ3: ████████ — PENDING
  フェーズ4: ████████ — ████

答えは現在進行中のフェーズ番号（数字のみ）。',
'2',
'IN PROGRESS のフェーズを見よ。',
200,2,1,'system');

INSERT OR IGNORE INTO puzzle_entries (id,slug,title,cipher_text,answer,hint,xp_reward,clearance_req,is_active,created_by) VALUES
('pzl-006','k17-missing','失踪エージェントのコード',
'観測コンソールのログより（2026-01-15 03:27）:

  > AGENT SIGNAL LOST
  > LAST POSITION: β-12
  > AGENT ID: K - _ _ - _ _ _

失踪したエージェントのIDを特定せよ。
ヒント: 機密文書庫（LV5）の「エージェントK-17と計画の関係」を参照。
IDの形式は K-XX-XXX（XXは数字）。',
'K-17',
'機密文書庫の該当セクションのタイトルに注目せよ。',
300,3,1,'system');
-- 6 puzzles inserted

-- =====================================================
-- ARGイベントスケジュール (event_schedule)
-- =====================================================
-- actions_json の is_public:true のものだけ /events に表示される

INSERT OR IGNORE INTO event_schedule (id,title,description,trigger_at,status,actions_json,created_by) VALUES
('evt-001','第一次海蝕記念日観測','2019年の機関創設から7年。初の大規模海蝕現象の記録日。','2026-03-01 00:00','published',
'[{"is_public":true,"public_title":"第一次海蝕記念日","public_desc":"2019年3月1日、大分湾で観測された史上初の広域海蝕現象から7年。機関は今も次元の境界を守り続けている。","type":"story","end_at":"2026-03-07 23:59"}]',
'system');

INSERT OR IGNORE INTO event_schedule (id,title,description,trigger_at,status,actions_json,created_by) VALUES
('evt-002','α-7観測点σ値警戒通知','観測点α-7のσ値が3.7に到達。全機関員に警戒態勢を発令。','2026-03-20 09:00','published',
'[{"is_public":true,"public_title":"ALERT: α-7 σ値上昇","public_desc":"観測点α-7にて次元歪曲指数（GSI）が3.7σに達しました。収束部門は即時待機状態に移行してください。詳細はマップページで確認可能です。","type":"alert","end_at":null}]',
'system');

INSERT OR IGNORE INTO event_schedule (id,title,description,trigger_at,status,actions_json,created_by) VALUES
('evt-003','国東半島波喰い群：合同作戦進捗','収束部門第1・第2班による過去最大規模の対応作戦の経過報告。','2026-03-22 18:00','published',
'[{"is_public":true,"public_title":"合同作戦 CODENAME: TIDECAGE","public_desc":"国東半島東岸に出現した波喰い5体に対し、第1班・第2班が合同作戦を展開中。現在3体の無力化に成功。残り2体は深海に潜伏。支援部門による医療チームが現地に待機。","type":"mission","end_at":"2026-03-31 23:59"}]',
'system');

INSERT OR IGNORE INTO event_schedule (id,title,description,trigger_at,status,actions_json,created_by) VALUES
('evt-004','機関員スキル認定試験（第2期）','全部門対象のスキルツリー認定試験の実施告知。','2026-04-01 10:00','scheduled',
'[{"is_public":true,"public_title":"スキル認定試験 第2期","public_desc":"来月よりスキル認定試験の第2期を開始します。各部門のスキルツリーページより受験申請を行ってください。合格者にはXPボーナスと特別バッジが付与されます。","type":"event","end_at":"2026-04-30 23:59"}]',
'system');

INSERT OR IGNORE INTO event_schedule (id,title,description,trigger_at,status,actions_json,created_by) VALUES
('evt-005','蒼海計画フェーズ2移行観測期間','機密情報：蒼海計画が第二段階に移行したことに伴う特別観測期間。','2026-03-24 00:00','published',
'[{"is_public":true,"public_title":"特別観測期間：SEABREAK-2","public_desc":"本日より特別観測期間を設定します。全機関員はコンソールへのアクセスを強化し、次元境界の変動を随時報告してください。この期間中、観測報告へのXPボーナスが2倍になります。","type":"story","end_at":"2026-04-07 23:59"}]',
'system');

INSERT OR IGNORE INTO event_schedule (id,title,description,trigger_at,status,actions_json,created_by) VALUES
('evt-006','システムメンテナンス（観測サーバー群）','次元観測サーバー群の定期メンテナンス。','2026-04-05 03:00','scheduled',
'[{"is_public":true,"public_title":"定期メンテナンス通知","public_desc":"2026年4月5日 03:00〜05:00 の間、観測コンソールおよびデータベース参照機能が一時停止します。チャット・通知機能は引き続き利用可能です。ご不便をおかけします。","type":"maintenance","end_at":"2026-04-05 05:00"}]',
'system');
-- 6 events inserted
