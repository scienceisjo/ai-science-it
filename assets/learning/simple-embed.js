/* 지도의 단계 시설 → 노동규 선생님 「심플 데이터 탐구」의 그 단계 하나(2026-11-15)
   탐구 화면(inquiry.html)의 본문 자리에 netzero-simple/?embed=1&lesson=&step= 을 띄운다.
   그 화면의 기록은 S.simple 에 저장하고, 선생님 화면용으로 S.answers(l1_… 키)에도 옮긴다(simple-steps.js 의 flatten).
   단계 마침 조건은 app.js 의 stepIssue 가 NZSimple.gate 로 넘긴다. app.js 다음에 불러온다. */
(() => {
  'use strict';
  const NZ = window.NZSimple;
  if (!NZ || !NZ.active) return;
  document.documentElement.classList.add('nz-simple');
  // 지도 쪽 단계 이름(시설 안내·위쪽 단계 표시)과 답 칸 이름
  try { NZ.steps.forEach((row, l) => { if (LESSONS[l]) LESSONS[l].steps = row.map(d => d.name); }); } catch (e) {}
  try { Object.assign(answerLabels, NZ.labels); } catch (e) {}
  // 지도 시설 이름표: 1차시 기록관 전시대와 3·4차시 건물 이름을 바뀐 단계에 맞춘다(자리·모양은 그대로)
  try {
    const EX = [['탄소 시간의 벽', '두 해의 CO₂ 배출량을 수치로 비교하기'], ['에너지 비교 단말기', '화석연료와 저탄소 에너지 비율 비교하기'], ['생각 다시 보기', '처음 설명을 유지할지 수정할지 정하기'], ['데이터 검증대', 'AI 설명의 두 주장 확인하기'], ['설계 근거 제출대', 'CER 카드로 주장·근거·추론 정리하기']];
    EX.forEach(([n, m], i) => { if (ARCHIVE_EXHIBITS[i]) Object.assign(ARCHIVE_EXHIBITS[i], { name: n, mission: String(i + 1).padStart(2, '0') + ' ' + n + ' · ' + m }); });
    const ST = { 2: ['하루 수급 실험실', '도시 탄소 관측소', 'AI 추천 검토실', '기술 설계실', '기록 보관소'], 3: ['근거 보관소', '탄소 설계실', '프롬프트 작업실', '도시 모형 검증실', '산출물 보관소'] };
    Object.entries(ST).forEach(([l, names]) => { if (CAMPUS[l] && Array.isArray(CAMPUS[l].stations) && CAMPUS[l].stations.length === 5) CAMPUS[l].stations = names; });
  } catch (e) {}

  const state = () => (S.simple && typeof S.simple === 'object') ? S.simple : null;
  let timer = 0;
  // 평평한 답 칸으로 옮기기(바뀐 칸만 answer() 로 → 고친 기록이 남는다)
  function mirror() {
    clearTimeout(timer); timer = 0;
    const flat = NZ.flatten(state() || {});
    for (const k of NZ.keys) {
      const v = flat[k] || '', cur = typeof S.answers[k] === 'string' ? S.answers[k] : '';
      if (v !== cur) answer(k, v);
    }
    save();
  }
  window.__NZ_SIMPLE = {
    get: () => state() ? JSON.parse(JSON.stringify(state())) : null,
    put(v) {
      S.simple = v;
      try { save(); } catch (e) {}
      clearTimeout(timer); timer = setTimeout(mirror, 600);
    },
    // RPG 기록의 비교집단(comparison) = 이 화면의 비교집단 모드(AI 코치 질문·피드백 없음)
    mode: () => S.mode === 'comparison' ? 'control' : 'coach',
    resize(h) { const f = document.getElementById('simple-step'); if (f) f.style.height = Math.max(260, Math.ceil(h) + 6) + 'px'; },
    flash(msg) { try { toast(msg); } catch (e) { alert(msg); } },
    ready() { const f = document.getElementById('simple-step'); if (f) f.classList.add('ready'); }
  };
  // 다른 화면으로 넘어가기 전에 옮기기를 마친다
  if (typeof flushLearningInputs === 'function') {
    const oldFlush = flushLearningInputs;
    flushLearningInputs = function () { if (timer) mirror(); return oldFlush.apply(this, arguments); };
  }
  window.addEventListener('pagehide', () => { if (timer) mirror(); });

  // 탐구 본문: 단계 하나를 띄운다. 지도 화면(숨은 패널)에서는 띄우지 않는다
  const baseContent = getContent;
  getContent = function (l, s) {
    if (!NZ.steps[l] || !NZ.steps[l][s]) return baseContent(l, s);
    if (typeof INQUIRY_PAGE === 'undefined' || !INQUIRY_PAGE) return '<p class="muted">' + esc(NZ.steps[l][s].name) + ' · 탐구 화면에서 엽니다.</p>';
    const d = NZ.steps[l][s];
    return '<section class="simple-step" aria-label="' + esc((l + 1) + '차시 ' + (s + 1) + '단계 ' + d.name) + '">'
      + '<iframe id="simple-step" src="netzero-simple/?embed=1&lesson=' + (l + 1) + '&step=' + s + '" title="' + esc((l + 1) + '차시 ' + (s + 1) + '단계 ' + d.name) + '" allow="clipboard-write"></iframe></section>';
  };

  // 근거 수: RPG 근거 + 심플 탐구 DATA PASSPORT 근거
  const simpleEv = () => ((state() && state().ev) || []);
  function counts() {
    const pc = document.getElementById('proof-count');
    if (pc) pc.textContent = (S.evidence || []).length + simpleEv().length;
    const ss = document.getElementById('step-status');
    if (ss && Number.isInteger(S.lesson)) {
      const l = S.lesson, s = (S.steps || [])[l] || 0;
      ss.textContent = (s + 1) + ' / 5 단계 · 근거 ' + ((S.evidence || []).filter(e => e.lesson === l + 1).length + simpleEv().filter(e => e.l === l + 1).length) + '개';
    }
  }
  const baseSave = save;
  save = function () { const r = baseSave.apply(this, arguments); try { counts(); } catch (e) {} return r; };
  const baseRender = render;
  render = function () { const r = baseRender.apply(this, arguments); try { counts(); } catch (e) {} return r; };

  const css = document.createElement('style');
  css.textContent = '.nz-simple .simple-step{margin:0}'
    + '.nz-simple #simple-step{display:block;width:100%;height:640px;border:0;background:transparent}'
    + '.nz-simple #coach,.nz-simple .learning-task,.nz-simple #learning-core-save,.nz-simple .council-invite{display:none!important}'
    + '.nz-simple .inquiry-page:not(.textbook-mode) .inquiry-coach{display:none!important}'
    + '.nz-simple .inquiry-page:not(.textbook-mode) .workspace{grid-template-columns:minmax(0,1fr)!important}';
  document.head.appendChild(css);

  // 처음 들어온 기록에 S.simple 이 이미 있으면 답 칸도 맞춰 둔다(다른 기기에서 이어 할 때)
  try { if (state()) mirror(); } catch (e) {}
})();
