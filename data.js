/**
 * 便利屋かんたん概算見積もりシミュレーター
 * データ管理ファイル (data.js)
 * 
 * このファイルの料金データはlocalStorageで管理されます。
 * 管理画面から変更した料金は自動的にlocalStorageに保存されます。
 */

// ============================================================
// デフォルトデータ定義（初回起動時・リセット時に使用）
// ============================================================

const DEFAULT_DATA = {

  // ============ サービス一覧 ============
  services: [
    { id: 'kusa', name: '草刈り', icon: '🌿', description: '庭・空き地・法面などの草刈り', requires_site_visit: false, is_active: true, display_order: 1, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.3 },
    { id: 'bassai', name: '木の伐採', icon: '🌲', description: '庭木・雑木の伐採・撤去', requires_site_visit: false, is_active: true, display_order: 2, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.5 },
    { id: 'fuyo', name: '不用品回収', icon: '📦', description: '家具・家電・雑品などの回収', requires_site_visit: false, is_active: true, display_order: 3, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.35 },
    { id: 'kazai', name: '家財整理', icon: '🏡', description: '空き家・実家の家財道具整理', requires_site_visit: false, is_active: true, display_order: 4, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.45 },
    { id: 'kaitai', name: '解体', icon: '🏗️', description: '建物・倉庫・ブロック塀の解体', requires_site_visit: true, is_active: true, display_order: 5, price_range_multiplier_min: 0.9, price_range_multiplier_max: 1.35 },
    { id: 'akiya', name: '空き家管理', icon: '🔑', description: '定期巡回・換気・清掃レポート', requires_site_visit: false, is_active: true, display_order: 6, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.2 },
    { id: 'sentei', name: '庭木の剪定', icon: '✂️', description: '庭木・生け垣の剪定・整形', requires_site_visit: false, is_active: true, display_order: 7, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.3 },
    { id: 'cleaning', name: 'ハウスクリーニング', icon: '🧹', description: 'キッチン・浴室・エアコンなど', requires_site_visit: false, is_active: true, display_order: 8, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.4 },
    { id: 'toilet', name: 'トイレの詰まり', icon: '🚽', description: 'トイレ詰まり・排水トラブル', requires_site_visit: false, is_active: true, display_order: 9, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.3 },
    { id: 'tatami', name: '畳の張替', icon: '🪵', description: '和室畳の表替え・裏返し・新調', requires_site_visit: false, is_active: true, display_order: 10, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.2 },
    { id: 'shoji', name: '障子の張替', icon: '🏮', description: '障子紙の張替え・補修', requires_site_visit: false, is_active: true, display_order: 11, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.2 },
    { id: 'reform', name: 'リフォーム', icon: '🔨', description: 'クロス・床・水回りリフォーム', requires_site_visit: true, is_active: true, display_order: 12, price_range_multiplier_min: 0.9, price_range_multiplier_max: 1.5 },
    { id: 'gaiko', name: '外構・庭まわり', icon: '🌸', description: 'フェンス・駐車場・花壇など', requires_site_visit: false, is_active: true, display_order: 13, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.4 },
    { id: 'other', name: 'その他の作業', icon: '🔧', description: '上記以外の便利屋作業', requires_site_visit: false, is_active: true, display_order: 14, price_range_multiplier_min: 1.0, price_range_multiplier_max: 1.5 },
  ],

  // ============ 質問項目 ============
  questions: {
    kusa: [
      { id: 'area', label: '作業面積', type: 'select', required: true, options: [
        { label: '30㎡くらい', value: '30' },
        { label: '50㎡くらい', value: '50' },
        { label: '100㎡くらい', value: '100' },
        { label: '200㎡くらい', value: '200' },
        { label: 'それ以上（要相談）', value: '300' },
      ]},
      { id: 'grass_height', label: '草の高さ', type: 'select', required: true, options: [
        { label: '低い（〜20cm程度）', value: 'low' },
        { label: '普通（20〜50cm）', value: 'normal' },
        { label: '高い（50cm〜1m）', value: 'high' },
        { label: 'かなり伸びている（1m以上）', value: 'very_high' },
      ]},
      { id: 'disposal', label: 'ゴミ処分', type: 'select', required: true, options: [
        { label: 'なし（自分で処分する）', value: 'none' },
        { label: 'あり（処分してほしい）', value: 'yes' },
      ]},
      { id: 'work_condition', label: '作業場所の状況', type: 'select', required: true, options: [
        { label: '作業しやすい（平坦・広い）', value: 'easy' },
        { label: 'やや作業しにくい', value: 'normal' },
        { label: '傾斜・狭い場所など', value: 'hard' },
      ]},
    ],

    bassai: [
      { id: 'tree_height', label: '木の高さ', type: 'select', required: true, options: [
        { label: '3m未満', value: 'under3' },
        { label: '3m〜5m', value: '3to5' },
        { label: '5m〜8m', value: '5to8' },
        { label: '8m以上（要現地確認）', value: 'over8' },
      ]},
      { id: 'tree_count', label: '本数', type: 'number', required: true, min: 1, max: 50, placeholder: '例：3' },
      { id: 'trunk_size', label: '幹の太さ', type: 'select', required: true, options: [
        { label: '細い（直径15cm未満）', value: 'thin' },
        { label: '普通（15〜30cm）', value: 'normal' },
        { label: '太い（30cm以上）', value: 'thick' },
      ]},
      { id: 'disposal', label: '枝・幹の処分', type: 'select', required: true, options: [
        { label: 'なし（自分で処分する）', value: 'none' },
        { label: 'あり（処分してほしい）', value: 'yes' },
      ]},
      { id: 'high_work', label: '高所作業・電線付近', type: 'select', required: true, options: [
        { label: 'なし', value: 'none' },
        { label: 'あり', value: 'yes' },
        { label: '電線付近・要相談', value: 'consult' },
      ]},
    ],

    fuyo: [
      { id: 'volume', label: '不用品の量', type: 'select', required: true, options: [
        { label: '少量（段ボール数箱程度）', value: 'small' },
        { label: '軽トラ半分程度', value: 'half' },
        { label: '軽トラ1台程度', value: 'full' },
        { label: '2トン車相当（多量）', value: '2ton' },
      ]},
      { id: 'heavy', label: '重い物の有無', type: 'select', required: true, options: [
        { label: 'なし', value: 'none' },
        { label: '少しある（冷蔵庫・洗濯機など）', value: 'some' },
        { label: '多い', value: 'many' },
      ]},
      { id: 'stairs', label: '階段作業', type: 'select', required: true, options: [
        { label: 'なし（1階から搬出）', value: 'none' },
        { label: '2階から搬出', value: '2f' },
        { label: '3階以上・階段あり', value: '3f' },
      ]},
      { id: 'sorting', label: '分別・袋詰め', type: 'select', required: true, options: [
        { label: '不要', value: 'none' },
        { label: '少し必要', value: 'some' },
        { label: 'かなり必要', value: 'many' },
      ]},
    ],

    kazai: [
      { id: 'floor_plan', label: '間取り', type: 'select', required: true, options: [
        { label: '1K〜1DK', value: '1k' },
        { label: '1LDK〜2DK', value: '1ldk' },
        { label: '2LDK〜3DK', value: '2ldk' },
        { label: '一戸建て', value: 'house' },
      ]},
      { id: 'stuff_amount', label: '荷物の量', type: 'select', required: true, options: [
        { label: '少ない', value: 'small' },
        { label: '普通', value: 'normal' },
        { label: '多い', value: 'many' },
      ]},
      { id: 'cleaning', label: '簡易清掃', type: 'select', required: true, options: [
        { label: 'なし', value: 'none' },
        { label: 'あり', value: 'yes' },
      ]},
      { id: 'carry_out', label: '搬出条件', type: 'select', required: true, options: [
        { label: '搬出しやすい', value: 'easy' },
        { label: '階段・距離あり', value: 'normal' },
        { label: 'かなり大変（4F以上・狭路など）', value: 'hard' },
      ]},
    ],

    kaitai: [
      { id: 'building_type', label: '建物の種類', type: 'select', required: true, options: [
        { label: '木造', value: 'wood' },
        { label: '鉄骨', value: 'steel' },
        { label: 'RC・鉄筋コンクリート', value: 'rc' },
      ]},
      { id: 'tsubo', label: '坪数（目安）', type: 'number', required: true, min: 1, max: 200, placeholder: '例：20' },
      { id: 'leftover', label: '残置物', type: 'select', required: true, options: [
        { label: 'なし', value: 'none' },
        { label: '少しある', value: 'some' },
        { label: '多い', value: 'many' },
      ]},
      { id: 'road_condition', label: '前面道路・作業環境', type: 'select', required: true, options: [
        { label: '作業しやすい', value: 'easy' },
        { label: 'やや狭い', value: 'normal' },
        { label: '重機が入りにくい', value: 'hard' },
      ]},
      { id: 'extra_work', label: '付帯工事（複数選択可）', type: 'checkbox', required: false, options: [
        { label: 'ブロック塀', value: 'block' },
        { label: 'カーポート', value: 'carport' },
        { label: '物置', value: 'shed' },
        { label: '庭木撤去', value: 'garden' },
      ]},
    ],

    akiya: [
      { id: 'management_content', label: '管理内容', type: 'select', required: true, options: [
        { label: '外観確認のみ', value: 'exterior' },
        { label: '外観確認＋換気', value: 'ventilation' },
        { label: '外観確認＋換気＋簡易清掃', value: 'cleaning' },
        { label: '庭確認・草木確認も含む', value: 'garden' },
      ]},
      { id: 'visit_count', label: '月の訪問回数', type: 'select', required: true, options: [
        { label: '月1回', value: '1' },
        { label: '月2回', value: '2' },
        { label: '週1回（月4回）', value: '4' },
      ]},
      { id: 'photo_report', label: '写真レポート', type: 'select', required: true, options: [
        { label: '不要', value: 'none' },
        { label: '必要', value: 'yes' },
      ]},
      { id: 'area', label: '対応エリア', type: 'select', required: true, options: [
        { label: '古河市内', value: 'local' },
        { label: '周辺市町村', value: 'near' },
        { label: '少し遠方', value: 'far' },
      ]},
    ],

    sentei: [
      { id: 'tree_height', label: '木の高さ', type: 'select', required: true, options: [
        { label: '低木（〜2m）', value: 'low' },
        { label: '中木（2〜4m）', value: 'middle' },
        { label: '高木（4m以上）', value: 'high' },
      ]},
      { id: 'tree_count', label: '本数', type: 'number', required: true, min: 1, max: 100, placeholder: '例：5' },
      { id: 'branch_amount', label: '枝葉の量', type: 'select', required: true, options: [
        { label: '少ない', value: 'small' },
        { label: '普通', value: 'normal' },
        { label: '多い', value: 'many' },
      ]},
      { id: 'disposal', label: '剪定後の枝葉処分', type: 'select', required: true, options: [
        { label: 'なし（自分で処分する）', value: 'none' },
        { label: 'あり（処分してほしい）', value: 'yes' },
      ]},
    ],

    cleaning: [
      { id: 'clean_place', label: '清掃場所（複数選択可）', type: 'checkbox', required: true, options: [
        { label: 'キッチン', value: 'kitchen' },
        { label: '浴室', value: 'bath' },
        { label: 'トイレ', value: 'toilet' },
        { label: '洗面所', value: 'wash' },
        { label: '換気扇', value: 'fan' },
        { label: 'エアコン', value: 'aircon' },
        { label: '空室全体', value: 'whole' },
      ]},
      { id: 'dirt_level', label: '汚れの程度', type: 'select', required: true, options: [
        { label: '軽い（定期的に掃除していた）', value: 'light' },
        { label: '普通', value: 'normal' },
        { label: '強い（長期間清掃なし）', value: 'heavy' },
      ]},
    ],

    toilet: [
      { id: 'symptom', label: '症状', type: 'select', required: true, options: [
        { label: '水の流れが悪い', value: 'slow' },
        { label: '完全に詰まっている', value: 'full' },
        { label: '異物を落とした', value: 'foreign' },
        { label: '水があふれそう', value: 'overflow' },
      ]},
      { id: 'time_zone', label: '作業時間帯', type: 'select', required: true, options: [
        { label: '通常時間（8:00〜20:00）', value: 'normal' },
        { label: '夜間・早朝', value: 'night' },
        { label: '緊急対応（今すぐ来てほしい）', value: 'emergency' },
      ]},
      { id: 'parts', label: '部品交換', type: 'select', required: true, options: [
        { label: '不要', value: 'none' },
        { label: '必要かもしれない', value: 'maybe' },
      ]},
    ],

    tatami: [
      { id: 'count', label: '枚数', type: 'number', required: true, min: 1, max: 50, placeholder: '例：6' },
      { id: 'work_type', label: '作業内容', type: 'select', required: true, options: [
        { label: '表替え（表面のゴザのみ交換）', value: 'surface' },
        { label: '裏返し（表面を裏返して再利用）', value: 'reverse' },
        { label: '新調（畳ごと新品）', value: 'new' },
      ]},
      { id: 'grade', label: '畳の種類・グレード', type: 'select', required: true, options: [
        { label: '一般品', value: 'standard' },
        { label: '中級品', value: 'middle' },
        { label: '高級品', value: 'premium' },
      ]},
    ],

    shoji: [
      { id: 'count', label: '枚数', type: 'number', required: true, min: 1, max: 30, placeholder: '例：4' },
      { id: 'size', label: 'サイズ', type: 'select', required: true, options: [
        { label: '小（〜半間）', value: 'small' },
        { label: '中（一般的なサイズ）', value: 'middle' },
        { label: '大（大型・特殊）', value: 'large' },
      ]},
      { id: 'paper_type', label: '障子紙の種類', type: 'select', required: true, options: [
        { label: '一般紙', value: 'standard' },
        { label: '強化紙', value: 'strong' },
        { label: '破れにくい紙（プラスチック入り）', value: 'tough' },
      ]},
    ],

    reform: [
      { id: 'reform_type', label: 'リフォーム内容', type: 'select', required: true, options: [
        { label: 'クロス張替', value: 'wallpaper' },
        { label: '床張替', value: 'floor' },
        { label: '水回り（要現地確認）', value: 'water' },
        { label: '外壁（要現地確認）', value: 'exterior' },
        { label: '屋根（要現地確認）', value: 'roof' },
        { label: '部分補修', value: 'partial' },
      ]},
      { id: 'size', label: '広さ（㎡）', type: 'number', required: false, min: 1, max: 500, placeholder: '例：20' },
      { id: 'grade', label: '材料グレード', type: 'select', required: true, options: [
        { label: '標準', value: 'standard' },
        { label: '中級', value: 'middle' },
        { label: '高級', value: 'premium' },
      ]},
    ],

    gaiko: [
      { id: 'work_type', label: '作業内容', type: 'select', required: true, options: [
        { label: 'フェンス設置', value: 'fence' },
        { label: '駐車場整備', value: 'parking' },
        { label: '花壇・植栽', value: 'garden' },
        { label: '砂利敷き', value: 'gravel' },
        { label: 'ブロック積み', value: 'block' },
        { label: 'その他', value: 'other' },
      ]},
      { id: 'scale', label: '規模', type: 'select', required: true, options: [
        { label: '小規模（〜10㎡）', value: 'small' },
        { label: '中規模（10〜30㎡）', value: 'middle' },
        { label: '大規模（30㎡以上）', value: 'large' },
      ]},
    ],

    other: [
      { id: 'work_detail', label: '作業内容', type: 'select', required: true, options: [
        { label: 'ちょっとした修理・補修', value: 'repair' },
        { label: '荷物の移動・運搬', value: 'moving' },
        { label: '掃除・片付け', value: 'cleaning' },
        { label: '電球交換・棚取付など', value: 'handyman' },
        { label: 'その他', value: 'other' },
      ]},
      { id: 'work_time', label: '作業時間の目安', type: 'select', required: true, options: [
        { label: '1〜2時間程度', value: '1h' },
        { label: '半日程度（3〜4時間）', value: 'half' },
        { label: '1日程度', value: '1day' },
        { label: '複数日', value: 'multi' },
      ]},
    ],
  },

  // ============ 料金ルール ============
  pricing: {
    kusa: {
      base: 8000,
      area_unit_price: 200, // 1㎡あたり
      grass_height: { low: 0, normal: 0, high: 5000, very_high: 8000 },
      disposal: { none: 0, yes: 5000 },
      work_condition: { easy: 0, normal: 5000, hard: 10000 },
    },

    bassai: {
      base: 10000,
      tree_height: { under3: 5000, '3to5': 15000, '5to8': 30000, over8: 50000 },
      trunk_size: { thin: 0, normal: 0, thick: 10000 },
      disposal: { none: 0, yes: 12000 },
      high_work: { none: 0, yes: 15000, consult: 20000 },
      requires_site_visit_conditions: ['over8', 'consult'],
    },

    fuyo: {
      volume_base: { small: 15000, half: 25000, full: 40000, '2ton': 80000 },
      heavy: { none: 0, some: 5000, many: 15000 },
      stairs: { none: 0, '2f': 5000, '3f': 12000 },
      sorting: { none: 0, some: 8000, many: 20000 },
    },

    kazai: {
      floor_plan_base: { '1k': 30000, '1ldk': 60000, '2ldk': 100000, house: 160000 },
      stuff_amount: { small: 0, normal: 0, many: 50000 },
      cleaning: { none: 0, yes: 15000 },
      carry_out: { easy: 0, normal: 15000, hard: 30000 },
    },

    kaitai: {
      building_unit: { wood: 40000, steel: 60000, rc: 80000 }, // 坪あたり
      leftover: { none: 0, some: 100000, many: 250000 },
      road_condition: { easy: 0, normal: 0, hard: 150000 },
      extra_work: { block: 80000, carport: 60000, shed: 40000, garden: 50000 },
    },

    akiya: {
      management_base: { exterior: 5000, ventilation: 10000, cleaning: 15000, garden: 25000 }, // 月1回あたり
      photo_report: { none: 0, yes: 2000 },
      area: { local: 0, near: 3000, far: 6000 },
    },

    sentei: {
      base: 8000,
      tree_height_unit: { low: 3000, middle: 8000, high: 20000 }, // 1本あたり
      branch_amount: { small: 0, normal: 0, many: 10000 },
      disposal: { none: 0, yes: 10000 },
    },

    cleaning: {
      place_base: { kitchen: 15000, bath: 15000, toilet: 8000, wash: 8000, fan: 12000, aircon: 10000, whole: 30000 },
      dirt_level: { light: 0, normal: 0, heavy: 10000 },
    },

    toilet: {
      base: 8000,
      symptom: { slow: 3000, full: 8000, foreign: 15000, overflow: 10000 },
      time_zone: { normal: 0, night: 5000, emergency: 8000 },
      parts: { none: 0, maybe: 5000 },
      requires_site_visit_conditions: ['foreign', 'maybe'],
    },

    tatami: {
      work_type_unit: { surface: 6000, reverse: 4000, new: 12000 }, // 1枚あたり
      grade: { standard: 0, middle: 2000, premium: 5000 }, // 1枚あたり追加
    },

    shoji: {
      size_unit: { small: 2000, middle: 3000, large: 4000 }, // 1枚あたり
      paper_type: { standard: 0, strong: 1000, tough: 1500 }, // 1枚あたり追加
    },

    reform: {
      wallpaper_unit: 1500, // 1㎡
      floor_unit: 5000, // 1㎡
      partial_base: 10000,
      water_base: 0, // 要現地確認
      exterior_base: 0,
      roof_base: 0,
      grade: { standard: 1.0, middle: 1.2, premium: 1.5 },
      requires_site_visit_types: ['water', 'exterior', 'roof'],
    },

    gaiko: {
      work_type_base: { fence: 30000, parking: 50000, garden: 20000, gravel: 15000, block: 40000, other: 20000 },
      scale: { small: 1.0, middle: 1.5, large: 2.5 },
    },

    other: {
      work_time_base: { '1h': 8000, half: 15000, '1day': 28000, multi: 50000 },
    },
  },

};

// ============================================================
// データアクセス（localStorageから取得、なければデフォルト使用）
// ============================================================

function getAppData() {
  try {
    const stored = localStorage.getItem('benriya_data');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveAppData(data) {
  localStorage.setItem('benriya_data', JSON.stringify(data));
}

function resetToDefault() {
  localStorage.removeItem('benriya_data');
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

// グローバル変数として公開
window.AppData = {
  get: getAppData,
  save: saveAppData,
  reset: resetToDefault,
  DEFAULT: DEFAULT_DATA,
};
