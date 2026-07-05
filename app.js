/**
 * 便利屋かんたん概算見積もりシミュレーター
 * メインアプリロジック (app.js)
 */

// ============================================================
// グローバル状態
// ============================================================
let currentService = null;
let currentAnswers = {};
let currentEstimate = null;

// ============================================================
// 初期化
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderServiceGrid();
});

// ============================================================
// Step 1: サービスグリッドの描画
// ============================================================
function renderServiceGrid() {
  const data = AppData.get();
  const grid = document.getElementById('serviceGrid');
  const activeServices = data.services
    .filter(s => s.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  grid.innerHTML = activeServices.map(service => `
    <button class="service-card" onclick="selectService('${service.id}')" data-service="${service.id}">
      <span class="service-icon">${service.icon}</span>
      <span class="service-name">${service.name}</span>
      <span class="service-desc">${service.description}</span>
      ${service.requires_site_visit ? '<span class="visit-badge">要現地確認</span>' : ''}
    </button>
  `).join('');
}

// ============================================================
// Step 1 → Step 2: サービス選択
// ============================================================
function selectService(serviceId) {
  const data = AppData.get();
  const service = data.services.find(s => s.id === serviceId);
  if (!service) return;

  currentService = service;
  currentAnswers = {};

  // カードのアクティブ状態
  document.querySelectorAll('.service-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.service === serviceId);
  });

  // 質問を描画
  renderQuestions(serviceId, data);

  // ステップ遷移
  showStep(2);
  setTimeout(() => {
    document.getElementById('step2').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
  document.getElementById('step2Title').textContent = `${service.icon} ${service.name}の条件を選んでください`;
  document.getElementById('selectedServiceLabel').innerHTML = `
    <span class="service-chip">${service.icon} ${service.name}</span>
  `;

  // ステップインジケーター更新
  updateStepIndicator(2);
}

// ============================================================
// 質問項目の描画
// ============================================================
function renderQuestions(serviceId, data) {
  const questions = data.questions[serviceId];
  const area = document.getElementById('questionsArea');

  if (!questions || questions.length === 0) {
    area.innerHTML = `<p class="no-question">条件入力は不要です。そのまま料金を計算できます。</p>`;
    return;
  }

  area.innerHTML = questions.map((q, idx) => {
    return `
      <div class="question-block" data-question-id="${q.id}">
        <label class="question-label">
          ${q.label}
          ${q.required ? '<span class="required">必須</span>' : ''}
        </label>
        ${renderInput(q, idx)}
      </div>
    `;
  }).join('');
}

function renderInput(q, idx) {
  switch (q.type) {
    case 'select':
      return `
        <div class="select-options">
          ${q.options.map(opt => `
            <button class="option-btn" 
              data-field="${q.id}" 
              data-value="${opt.value}"
              onclick="selectOption(this, '${q.id}', '${opt.value}')">
              ${opt.label}
            </button>
          `).join('')}
        </div>
      `;

    case 'number':
      return `
        <div class="number-input-wrap">
          <button class="num-btn" onclick="changeNumber('${q.id}', -1)">−</button>
          <input type="number" 
            class="number-input" 
            id="num_${q.id}"
            min="${q.min || 1}" 
            max="${q.max || 999}" 
            placeholder="${q.placeholder || ''}"
            value=""
            onchange="setNumber('${q.id}', this.value)">
          <button class="num-btn" onclick="changeNumber('${q.id}', 1)">＋</button>
        </div>
      `;

    case 'checkbox':
      return `
        <div class="checkbox-options">
          ${q.options.map(opt => `
            <label class="checkbox-label">
              <input type="checkbox" 
                class="checkbox-input"
                data-field="${q.id}"
                value="${opt.value}"
                onchange="toggleCheckbox('${q.id}')">
              <span class="checkbox-text">${opt.label}</span>
            </label>
          `).join('')}
        </div>
      `;

    default:
      return '';
  }
}

// ============================================================
// 入力ハンドラ
// ============================================================
function selectOption(btn, fieldId, value) {
  // 同グループの選択解除
  const siblings = document.querySelectorAll(`[data-field="${fieldId}"]`);
  siblings.forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  currentAnswers[fieldId] = value;
}

function changeNumber(fieldId, delta) {
  const input = document.getElementById(`num_${fieldId}`);
  const current = parseInt(input.value) || 0;
  const min = parseInt(input.min) || 1;
  const max = parseInt(input.max) || 999;
  const newVal = Math.min(max, Math.max(min, current + delta));
  input.value = newVal;
  currentAnswers[fieldId] = newVal;
}

function setNumber(fieldId, value) {
  currentAnswers[fieldId] = parseInt(value) || 0;
}

function toggleCheckbox(fieldId) {
  const checkboxes = document.querySelectorAll(`input[data-field="${fieldId}"]:checked`);
  currentAnswers[fieldId] = Array.from(checkboxes).map(cb => cb.value);
}

// ============================================================
// Step 2 → Step 3: 料金計算
// ============================================================
function calculateEstimate() {
  if (!currentService) return;

  // バリデーション
  const data = AppData.get();
  const questions = data.questions[currentService.id] || [];
  const requiredQuestions = questions.filter(q => q.required);

  for (const q of requiredQuestions) {
    if (q.type === 'number') {
      const val = document.getElementById(`num_${q.id}`)?.value;
      if (!val || parseInt(val) < 1) {
        alert(`「${q.label}」を入力してください。`);
        return;
      }
      currentAnswers[q.id] = parseInt(val);
    } else if (q.type === 'select' && !currentAnswers[q.id]) {
      alert(`「${q.label}」を選択してください。`);
      return;
    } else if (q.type === 'checkbox' && (!currentAnswers[q.id] || currentAnswers[q.id].length === 0)) {
      // checkboxは任意にする
    }
  }

  // 料金計算
  const result = calcPrice(currentService.id, currentAnswers, data);
  currentEstimate = result;

  // 結果表示
  renderResult(result, data);
  showStep(3);
  updateStepIndicator(3);

  // フォームに内容を引き継ぎ
  populateForm(result);

  // スクロール
  document.getElementById('step3').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// 料金計算ロジック
// ============================================================
function calcPrice(serviceId, answers, data) {
  const pricing = data.pricing[serviceId];
  const service = data.services.find(s => s.id === serviceId);
  if (!pricing || !service) return { min: 0, max: 0, requires_site_visit: true, breakdown: [] };

  let basePrice = 0;
  let requiresSiteVisit = service.requires_site_visit;
  let breakdown = [];
  let isConsult = false;

  switch (serviceId) {
    case 'kusa': {
      const area = parseInt(answers.area) || 50;
      const grassH = answers.grass_height || 'normal';
      const disposal = answers.disposal || 'none';
      const workCond = answers.work_condition || 'easy';

      const areaPrice = area * pricing.area_unit_price;
      const grassAdd = pricing.grass_height[grassH] || 0;
      const disposalAdd = pricing.disposal[disposal] || 0;
      const condAdd = pricing.work_condition[workCond] || 0;

      basePrice = pricing.base + areaPrice + grassAdd + disposalAdd + condAdd;
      breakdown = [
        { label: '基本料金', amount: pricing.base },
        { label: `面積（${area}㎡ × ${pricing.area_unit_price}円）`, amount: areaPrice },
        grassAdd > 0 && { label: '草の高さ加算', amount: grassAdd },
        disposalAdd > 0 && { label: 'ゴミ処分費', amount: disposalAdd },
        condAdd > 0 && { label: '作業条件加算', amount: condAdd },
      ].filter(Boolean);
      break;
    }

    case 'bassai': {
      const treeH = answers.tree_height || 'under3';
      const count = parseInt(answers.tree_count) || 1;
      const trunk = answers.trunk_size || 'normal';
      const disposal = answers.disposal || 'none';
      const highWork = answers.high_work || 'none';

      if (treeH === 'over8' || highWork === 'consult') {
        requiresSiteVisit = true;
        isConsult = true;
      }
      if (pricing.requires_site_visit_conditions?.includes(treeH)) requiresSiteVisit = true;
      if (pricing.requires_site_visit_conditions?.includes(highWork)) requiresSiteVisit = true;

      const heightAdd = (pricing.tree_height[treeH] || 0) * count;
      const trunkAdd = pricing.trunk_size[trunk] || 0;
      const disposalAdd = pricing.disposal[disposal] || 0;
      const highAdd = pricing.high_work[highWork] || 0;

      basePrice = pricing.base + heightAdd + trunkAdd + disposalAdd + highAdd;
      breakdown = [
        { label: '基本料金', amount: pricing.base },
        { label: `高さ別料金（${count}本）`, amount: heightAdd },
        trunkAdd > 0 && { label: '幹の太さ加算', amount: trunkAdd },
        disposalAdd > 0 && { label: '処分費', amount: disposalAdd },
        highAdd > 0 && { label: '高所作業費', amount: highAdd },
      ].filter(Boolean);
      break;
    }

    case 'fuyo': {
      const volume = answers.volume || 'small';
      const heavy = answers.heavy || 'none';
      const stairs = answers.stairs || 'none';
      const sorting = answers.sorting || 'none';

      const volBase = pricing.volume_base[volume] || 15000;
      const heavyAdd = pricing.heavy[heavy] || 0;
      const stairsAdd = pricing.stairs[stairs] || 0;
      const sortAdd = pricing.sorting[sorting] || 0;

      basePrice = volBase + heavyAdd + stairsAdd + sortAdd;
      breakdown = [
        { label: `量別基本料金（${getLabelByValue(volume, 'fuyo', 'volume', data)}）`, amount: volBase },
        heavyAdd > 0 && { label: '重量物加算', amount: heavyAdd },
        stairsAdd > 0 && { label: '階段作業加算', amount: stairsAdd },
        sortAdd > 0 && { label: '分別・袋詰め', amount: sortAdd },
      ].filter(Boolean);
      break;
    }

    case 'kazai': {
      const fp = answers.floor_plan || '1k';
      const stuff = answers.stuff_amount || 'normal';
      const cleaning = answers.cleaning || 'none';
      const carry = answers.carry_out || 'easy';

      const fpBase = pricing.floor_plan_base[fp] || 30000;
      const stuffAdd = pricing.stuff_amount[stuff] || 0;
      const cleanAdd = pricing.cleaning[cleaning] || 0;
      const carryAdd = pricing.carry_out[carry] || 0;

      basePrice = fpBase + stuffAdd + cleanAdd + carryAdd;
      breakdown = [
        { label: '間取り基本料金', amount: fpBase },
        stuffAdd > 0 && { label: '荷物量加算', amount: stuffAdd },
        cleanAdd > 0 && { label: '簡易清掃費', amount: cleanAdd },
        carryAdd > 0 && { label: '搬出条件加算', amount: carryAdd },
      ].filter(Boolean);
      break;
    }

    case 'kaitai': {
      const buildingType = answers.building_type || 'wood';
      const tsubo = parseInt(answers.tsubo) || 10;
      const leftover = answers.leftover || 'none';
      const road = answers.road_condition || 'easy';
      const extras = answers.extra_work || [];

      const unitPrice = pricing.building_unit[buildingType] || 40000;
      const buildBase = unitPrice * tsubo;
      const leftoverAdd = pricing.leftover[leftover] || 0;
      const roadAdd = pricing.road_condition[road] || 0;
      const extraAdd = extras.reduce((sum, e) => sum + (pricing.extra_work[e] || 0), 0);

      if (road === 'hard') requiresSiteVisit = true;

      basePrice = buildBase + leftoverAdd + roadAdd + extraAdd;
      breakdown = [
        { label: `解体費（${tsubo}坪 × ${unitPrice.toLocaleString()}円）`, amount: buildBase },
        leftoverAdd > 0 && { label: '残置物処分費', amount: leftoverAdd },
        roadAdd > 0 && { label: '作業環境加算', amount: roadAdd },
        extraAdd > 0 && { label: '付帯工事費', amount: extraAdd },
      ].filter(Boolean);
      break;
    }

    case 'akiya': {
      const mgmt = answers.management_content || 'exterior';
      const visits = parseInt(answers.visit_count) || 1;
      const report = answers.photo_report || 'none';
      const area = answers.area || 'local';

      const mgmtBase = pricing.management_base[mgmt] || 5000;
      const reportAdd = pricing.photo_report[report] || 0;
      const areaAdd = pricing.area[area] || 0;

      basePrice = (mgmtBase + reportAdd + areaAdd) * visits;
      breakdown = [
        { label: `管理プラン（月${visits}回）`, amount: mgmtBase * visits },
        reportAdd > 0 && { label: `写真レポート（月${visits}回）`, amount: reportAdd * visits },
        areaAdd > 0 && { label: `エリア加算（月${visits}回）`, amount: areaAdd * visits },
      ].filter(Boolean);
      break;
    }

    case 'sentei': {
      const treeH = answers.tree_height || 'low';
      const count = parseInt(answers.tree_count) || 1;
      const branch = answers.branch_amount || 'normal';
      const disposal = answers.disposal || 'none';

      const treeUnitPrice = pricing.tree_height_unit[treeH] || 3000;
      const treeAdd = treeUnitPrice * count;
      const branchAdd = pricing.branch_amount[branch] || 0;
      const disposalAdd = pricing.disposal[disposal] || 0;

      basePrice = pricing.base + treeAdd + branchAdd + disposalAdd;
      breakdown = [
        { label: '基本料金', amount: pricing.base },
        { label: `剪定費（${count}本）`, amount: treeAdd },
        branchAdd > 0 && { label: '枝葉量加算', amount: branchAdd },
        disposalAdd > 0 && { label: '枝葉処分費', amount: disposalAdd },
      ].filter(Boolean);
      break;
    }

    case 'cleaning': {
      const places = answers.clean_place || [];
      const dirt = answers.dirt_level || 'normal';

      const placesTotal = places.reduce((sum, p) => sum + (pricing.place_base[p] || 0), 0);
      const dirtAdd = pricing.dirt_level[dirt] || 0;

      if (places.length === 0) {
        alert('清掃場所を1つ以上選択してください。');
        return null;
      }

      basePrice = placesTotal + dirtAdd;
      breakdown = [
        { label: '清掃場所合計', amount: placesTotal },
        dirtAdd > 0 && { label: '汚れ程度加算', amount: dirtAdd },
      ].filter(Boolean);
      break;
    }

    case 'toilet': {
      const symptom = answers.symptom || 'slow';
      const timeZone = answers.time_zone || 'normal';
      const parts = answers.parts || 'none';

      if (parts === 'maybe') requiresSiteVisit = true;
      if (pricing.requires_site_visit_conditions?.includes(symptom)) requiresSiteVisit = true;
      if (pricing.requires_site_visit_conditions?.includes(parts)) requiresSiteVisit = true;

      const symptomAdd = pricing.symptom[symptom] || 0;
      const timeAdd = pricing.time_zone[timeZone] || 0;
      const partsAdd = pricing.parts[parts] || 0;

      basePrice = pricing.base + symptomAdd + timeAdd + partsAdd;
      breakdown = [
        { label: '基本料金', amount: pricing.base },
        symptomAdd > 0 && { label: '症状加算', amount: symptomAdd },
        timeAdd > 0 && { label: '時間帯加算', amount: timeAdd },
        partsAdd > 0 && { label: '部品交換（概算）', amount: partsAdd },
      ].filter(Boolean);
      break;
    }

    case 'tatami': {
      const count = parseInt(answers.count) || 1;
      const workType = answers.work_type || 'surface';
      const grade = answers.grade || 'standard';

      const unitPrice = pricing.work_type_unit[workType] || 6000;
      const gradeAdd = pricing.grade[grade] || 0;

      basePrice = (unitPrice + gradeAdd) * count;
      breakdown = [
        { label: `${getLabelByValue(workType, 'tatami', 'work_type', data)}（${count}枚）`, amount: unitPrice * count },
        gradeAdd > 0 && { label: 'グレード加算', amount: gradeAdd * count },
      ].filter(Boolean);
      break;
    }

    case 'shoji': {
      const count = parseInt(answers.count) || 1;
      const size = answers.size || 'middle';
      const paper = answers.paper_type || 'standard';

      const sizeUnit = pricing.size_unit[size] || 3000;
      const paperAdd = pricing.paper_type[paper] || 0;

      basePrice = (sizeUnit + paperAdd) * count;
      breakdown = [
        { label: `サイズ別単価（${count}枚）`, amount: sizeUnit * count },
        paperAdd > 0 && { label: '紙種加算', amount: paperAdd * count },
      ].filter(Boolean);
      break;
    }

    case 'reform': {
      const reformType = answers.reform_type || 'wallpaper';
      const size = parseInt(answers.size) || 20;
      const grade = answers.grade || 'standard';

      if (pricing.requires_site_visit_types?.includes(reformType)) {
        requiresSiteVisit = true;
        isConsult = true;
      }

      let reformBase = 0;
      if (reformType === 'wallpaper') {
        reformBase = size * pricing.wallpaper_unit;
        breakdown = [{ label: `クロス張替（${size}㎡）`, amount: reformBase }];
      } else if (reformType === 'floor') {
        reformBase = size * pricing.floor_unit;
        breakdown = [{ label: `床張替（${size}㎡）`, amount: reformBase }];
      } else if (reformType === 'partial') {
        reformBase = pricing.partial_base;
        breakdown = [{ label: '部分補修', amount: reformBase }];
      } else {
        reformBase = 0;
        breakdown = [{ label: '要現地確認', amount: 0 }];
      }

      const gradeMultiplier = pricing.grade[grade] || 1.0;
      basePrice = reformBase * gradeMultiplier;
      if (gradeMultiplier > 1.0) {
        const gradeAdd = reformBase * (gradeMultiplier - 1.0);
        breakdown.push({ label: 'グレード加算', amount: Math.round(gradeAdd) });
      }
      break;
    }

    case 'gaiko': {
      const workType = answers.work_type || 'other';
      const scale = answers.scale || 'small';

      const workBase = pricing.work_type_base[workType] || 20000;
      const scaleMultiplier = pricing.scale[scale] || 1.0;

      basePrice = Math.round(workBase * scaleMultiplier);
      breakdown = [
        { label: '作業種別基本料金', amount: workBase },
        scaleMultiplier > 1.0 && { label: '規模加算', amount: Math.round(workBase * (scaleMultiplier - 1.0)) },
      ].filter(Boolean);
      break;
    }

    case 'other': {
      const workTime = answers.work_time || '1h';
      basePrice = pricing.work_time_base[workTime] || 8000;
      breakdown = [{ label: '作業時間別基本料金', amount: basePrice }];
      break;
    }
  }

  // 価格幅を計算
  const minMultiplier = service.price_range_multiplier_min || 1.0;
  const maxMultiplier = service.price_range_multiplier_max || 1.3;
  const minPrice = Math.round(basePrice * minMultiplier / 1000) * 1000;
  const maxPrice = Math.round(basePrice * maxMultiplier / 1000) * 1000;

  return {
    serviceId,
    serviceName: service.name,
    serviceIcon: service.icon,
    answers,
    basePrice,
    minPrice,
    maxPrice,
    requiresSiteVisit,
    isConsult,
    breakdown,
  };
}

// ============================================================
// 結果の描画
// ============================================================
function renderResult(result, data) {
  document.getElementById('resultServiceName').innerHTML = `
    <span class="result-icon">${result.serviceIcon}</span> ${result.serviceName}
  `;

  // 選択条件のサマリー
  const conditionLines = buildConditionSummary(result.serviceId, result.answers, data);
  document.getElementById('resultConditions').innerHTML = conditionLines.map(c =>
    `<span class="condition-chip">✓ ${c}</span>`
  ).join('');

  // 料金表示
  const priceArea = document.getElementById('resultPriceArea');
  if (result.isConsult && (result.minPrice === 0 || result.requiresSiteVisit)) {
    priceArea.innerHTML = `
      <div class="price-consult">
        <span class="consult-badge">🔍 要現地確認</span>
        <p class="consult-text">現地の状況により料金が大きく変わるため、無料現地見積もりをご依頼ください。</p>
      </div>
    `;
  } else {
    priceArea.innerHTML = `
      <div class="price-display">
        <span class="price-label">概算料金</span>
        <div class="price-range">
          <span class="price-num">${result.minPrice.toLocaleString()}円</span>
          <span class="price-wave">〜</span>
          <span class="price-num">${result.maxPrice.toLocaleString()}円</span>
        </div>
        ${result.requiresSiteVisit ? '<div class="visit-required-badge">⚠️ 現地確認が必要な項目があります</div>' : ''}
      </div>
      <div class="price-breakdown">
        <div class="breakdown-title">料金の内訳（目安）</div>
        ${result.breakdown.map(b => `
          <div class="breakdown-item">
            <span class="bd-label">${b.label}</span>
            <span class="bd-amount">${b.amount.toLocaleString()}円</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // LINE ボタンにメッセージを設定
  const lineText = buildLineMessage(result, conditionLines);
  const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(lineText)}`;
  document.getElementById('lineBtn').href = lineUrl;
}

// ============================================================
// 選択条件のサマリー文字列生成
// ============================================================
function buildConditionSummary(serviceId, answers, data) {
  const questions = data.questions[serviceId] || [];
  const lines = [];

  questions.forEach(q => {
    const val = answers[q.id];
    if (!val && val !== 0) return;

    if (q.type === 'select') {
      const opt = q.options?.find(o => o.value === val);
      if (opt) lines.push(`${q.label}：${opt.label}`);
    } else if (q.type === 'number') {
      lines.push(`${q.label}：${val}`);
    } else if (q.type === 'checkbox' && Array.isArray(val) && val.length > 0) {
      const labels = val.map(v => q.options?.find(o => o.value === v)?.label).filter(Boolean);
      if (labels.length > 0) lines.push(`${q.label}：${labels.join('、')}`);
    }
  });

  return lines;
}

// ============================================================
// LINEメッセージ生成
// ============================================================
function buildLineMessage(result, conditionLines) {
  const priceText = (result.isConsult && result.minPrice === 0)
    ? '要現地確認'
    : `${result.minPrice.toLocaleString()}円〜${result.maxPrice.toLocaleString()}円`;

  return `便利屋サービスの概算見積もりについて相談したいです。\n` +
    `依頼内容：${result.serviceName}\n` +
    `選択条件：${conditionLines.join('、')}\n` +
    `概算料金：${priceText}\n\n` +
    `※正式なお見積もりをご希望です。よろしくお願いします。`;
}

// ============================================================
// フォームへの引き継ぎ
// ============================================================
function populateForm(result) {
  if (!result) return;
  const data = AppData.get();
  const conditionLines = buildConditionSummary(result.serviceId, result.answers, data);

  const priceText = (result.isConsult && result.minPrice === 0)
    ? '要現地確認'
    : `${result.minPrice.toLocaleString()}円〜${result.maxPrice.toLocaleString()}円`;

  const content = [
    `【依頼内容】${result.serviceName}`,
    `【選択条件】`,
    ...conditionLines.map(l => `　・${l}`),
    `【概算料金】${priceText}`,
  ].join('\n');

  document.getElementById('estimateContent').value = content;
}

// ============================================================
// フォーム送信
// ============================================================
function submitForm() {
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();

  if (!name) { alert('お名前を入力してください。'); return; }
  if (!phone) { alert('電話番号を入力してください。'); return; }

  // 実際の送信処理（ここに実際のAPI呼び出しを実装）
  console.log('送信データ:', {
    name,
    phone,
    email: document.getElementById('customerEmail').value,
    estimate: document.getElementById('estimateContent').value,
    message: document.getElementById('customerMessage').value,
  });

  // 送信完了モーダルを表示
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

// ============================================================
// ステップ遷移
// ============================================================
function showStep(stepNum) {
  ['step1', 'step2', 'step3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (i + 1 === stepNum) {
      el.classList.remove('hidden');
      el.classList.add('step-visible');
    } else {
      el.classList.add('hidden');
      el.classList.remove('step-visible');
    }
  });

  // step1は常に表示
  if (stepNum > 1) {
    document.getElementById('step1').classList.remove('hidden');
  }
}

function updateStepIndicator(activeStep) {
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`step-indicator-${i}`);
    if (!el) continue;
    el.classList.toggle('active', i === activeStep);
    el.classList.toggle('done', i < activeStep);
  }
}

// 戻るボタン
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('backToStep1').addEventListener('click', () => {
    showStep(1);
    updateStepIndicator(1);
    document.getElementById('step1').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('backToStep2').addEventListener('click', () => {
    document.getElementById('step3').classList.add('hidden');
    document.getElementById('step2').scrollIntoView({ behavior: 'smooth' });
    updateStepIndicator(2);
  });

  document.getElementById('formScrollBtn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('inquiryForm').scrollIntoView({ behavior: 'smooth' });
  });
});

// ============================================================
// ユーティリティ
// ============================================================
function getLabelByValue(value, serviceId, questionId, data) {
  const questions = data.questions[serviceId] || [];
  const question = questions.find(q => q.id === questionId);
  if (!question) return value;
  const opt = question.options?.find(o => o.value === value);
  return opt ? opt.label : value;
}
