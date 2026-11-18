/* RPG 탐구 단계 = 노동규 선생님 「심플 데이터 탐구」(netzero-simple/index.html)의 단계 (2026-11-15)
   지도의 단계 시설마다 그 단계 화면 하나를 띄우고(simple-embed.js), 기록은 RPG 기록 S.simple 에 함께 저장한다.
   선생님 화면이 읽을 수 있게 S.simple 을 평평한 답 칸(S.answers 의 l1_… 키)으로도 옮겨 둔다.
   지도 화면·탐구 화면(index.html)과 선생님 화면(dashboard.html)이 같이 읽는다. curriculum.js 다음에 불러온다. */
(function () {
  'use strict';
  const C = window.EcoLearning;
  const POL = { solar: '태양광 전력 전환', insulation: '건물 단열·차양', transit: '대중교통·보행 전환', circular: '폐기물·자원순환', materials: '저탄소 재료', green: '녹지·물순환' };
  const PF = [['problem', '해결할 환경 문제'], ['data', '데이터 근거'], ['goal', '탄소감축 목표'], ['energy', '에너지 시스템'], ['zeb', '제로에너지 건축'], ['traffic', '교통'], ['circ', '자원순환'], ['green', '녹지/탄소흡수'], ['space', '공간 배치']];
  const SELF = ['모든 칸을 채웠다', '시뮬레이터에서 고른 정책이 프롬프트에 모두 들어 있다', '근거 데이터가 없는 기술을 넣지 않았다', '[데이터 근거]에 수치가 있다', '감축 목표가 시뮬레이터 결과와 맞다'];
  const PICK = { energy: '에너지원 구성(화석연료·저탄소 비율)', pop: '인구 수', temp: '기온 변화' };
  const CHK = { num: '73%라는 수치가 데이터와 맞는가', period: '두 도시의 비교 기간이 같은가', bound: '두 도시의 산정 범위가 같은가', sector: '부문 구성까지 보았는가' };

  // 단계 이름·하는 일·선생님 화면 답 칸(차시마다 5단계, 3·4차시 다섯 번째는 DATA PASSPORT)
  const STEPS = [
    [
      { name: 'CO₂ 그래프 읽기', action: '두 해를 골라 연간 CO₂ 배출량을 비교하고, 두 수치를 근거로 저장합니다.', keys: ['l1_notice'] },
      { name: '에너지 구성 비교', action: '화석연료·저탄소 에너지 비율을 보고 CO₂ 변화와 비교한 점을 근거로 저장합니다.', keys: ['l1_pick', 'l1_compare'] },
      { name: '처음 설명 다시 보기', action: '새 데이터까지 보고 처음 설명을 유지할지 수정할지 정합니다.', keys: ['l1_keep', 'l1_revise'] },
      { name: 'AI 설명 확인', action: 'AI가 만든 설명을 두 주장으로 나누어 직접 확인할 수 있는지 판단합니다.', keys: ['l1_qa', 'l1_qb'] },
      { name: 'CER 카드', action: '주장·근거·추론으로 넷제로 도시가 필요한 이유를 정리합니다.', keys: ['l1_claim', 'l1_use', 'l1_reason'] }
    ],
    [
      { name: '두 도시 총배출량', action: '두 도시의 총배출량 변화를 보고 첫 판단과 사용한 변수를 저장합니다.', keys: ['l2_first', 'l2_var', 'l2_why1'] },
      { name: '부문별 배출 구성', action: '두 도시의 부문별 배출 구성을 비교한 점을 근거로 저장합니다.', keys: ['l2_compare'] },
      { name: '처음 판단 다시 보기', action: '부문 데이터까지 보고 처음 판단이 그대로인지 바뀌었는지 씁니다.', keys: ['l2_same', 'l2_why2'] },
      { name: 'AI 판단 검증', action: 'AI의 판단을 데이터 두 개로 검증하고 받아들일지 정합니다.', keys: ['l2_chk', 'l2_ai', 'l2_aiwhy'] },
      { name: 'CASE CARD', action: '문제·데이터 증거·정책·효과와 한계를 정리하고 내 도시에 가져올 전략을 고릅니다.', keys: ['l2_city', 'l2_prob', 'l2_use', 'l2_policy', 'l2_limit', 'l2_take'] }
    ],
    [
      { name: 'Energy Zero 건물', action: '태양광 패널 용량을 바꾸며 건물 하루 전체의 에너지 수지를 계산하고 저장합니다.', keys: ['l3_p', 'l3_note'] },
      { name: '도시 Carbon Budget', action: '건물이 모두 Energy Zero여도 도시에 탄소가 남는 이유를 찾고 먼저 줄일 부문을 고릅니다.', keys: ['l3_why', 'l3_first', 'l3_firstwhy'] },
      { name: 'AI 추천 고르기', action: 'AI의 두 기술 추천을 채택·근거 추가 후 채택·거부 가운데 하나로 정하고 이유를 씁니다.', keys: ['l3_r_wind', 'l3_rw_wind', 'l3_r_ins', 'l3_rw_ins'] },
      { name: 'ECO-CITY PLAN', action: '데이터에 맞는 기술을 골라 내 도시 계획을 저장합니다.', keys: ['l3_prob', 'l3_tech', 'l3_techwhy', 'l3_lim'] },
      { name: 'DATA PASSPORT', action: '1~3차시에 저장한 근거와 산출물을 한곳에서 확인합니다.', keys: [] }
    ],
    [
      { name: 'DATA PASSPORT', action: '1~3차시에 저장한 근거가 4차시 설계의 기본 데이터입니다.', keys: [] },
      { name: '정책 시뮬레이터', action: '정책을 최대 3개 고르고, 정책마다 DATA PASSPORT 근거를 연결합니다.', keys: ['l4_pol', 'l4_link'] },
      { name: '3D 프롬프트·AI Critic', action: '3D 프롬프트를 쓰고 AI Critic(또는 스스로 점검)으로 데이터와 맞는지 확인합니다.', keys: ['l4_prompt', 'l4_reviews', 'l4_self'] },
      { name: '3D 결과 검증', action: '3D 결과를 계획과 대조하고 AI가 잘못 표현한 곳과 고칠 방법을 씁니다.', keys: ['l4_ver', 'l4_added', 'l4_wrong'] },
      { name: '최종 산출물', action: 'DATA PASSPORT에서 최종 산출물과 탐구 기록을 확인하고 내려받습니다.', keys: [] }
    ]
  ];

  const LABELS = {
    l1_notice: '내가 찾은 가장 눈에 띄는 변화(숫자 포함)', l1_pick: '원인을 확인하려고 고른 데이터', l1_compare: '두 데이터를 비교해 알게 된 점',
    l1_keep: '처음 설명 유지·수정', l1_revise: '수정한 설명 또는 유지하는 이유',
    l1_qa: 'AI 주장 A(1950년보다 약 6.5배 증가) 판단', l1_qb: 'AI 주장 B(주된 원인은 자동차) 판단',
    l1_claim: 'CER · Claim 주장', l1_use: 'CER · Evidence 체크한 근거', l1_reason: 'CER · Reasoning 추론',
    l2_first: '넷제로에 더 가까워 보이는 도시', l2_var: '판단에 사용한 변수', l2_why1: '판단 이유(수치 포함)',
    l2_compare: '부문 데이터로 알게 된 점', l2_same: '처음 판단과 같은가', l2_why2: '처음 판단에 대한 이유',
    l2_chk: 'AI 판단에서 확인한 것', l2_ai: 'AI 판단을 받아들인 정도', l2_aiwhy: 'AI 판단에 대한 근거',
    l2_city: 'CASE CARD 도시', l2_prob: '문제(가장 큰 배출원)', l2_use: 'CASE CARD 데이터 증거', l2_policy: '데이터로 추론한 정책',
    l2_limit: '효과와 한계', l2_take: '내 도시에 가져올 전략 1개와 데이터 근거',
    l3_p: '하루 수지를 0 이상으로 만든 패널 용량', l3_note: '패널 용량과 그래도 남는 문제',
    l3_why: '탄소가 남은 이유', l3_first: '가장 먼저 줄일 부문', l3_firstwhy: '그 부문을 고른 데이터 근거',
    l3_r_wind: 'AI 추천 「대형 풍력발전 단지」 판단', l3_rw_wind: '풍력 추천 판단 이유', l3_r_ins: 'AI 추천 「건물 단열·차양」 판단', l3_rw_ins: '단열 추천 판단 이유',
    l3_prob: 'PLAN · 해결할 문제', l3_tech: 'PLAN · 적용 기술', l3_techwhy: 'PLAN · 기술 선택의 데이터 근거', l3_lim: 'PLAN · 예상 한계',
    l4_pol: '고른 정책', l4_link: '정책별로 연결한 근거', l4_prompt: '3D 프롬프트', l4_reviews: 'AI Critic 검토 횟수', l4_self: '스스로 점검(비교집단)',
    l4_ver: '3D 결과 대조(표현됨·누락·잘못 표현)', l4_added: 'AI가 임의로 추가한 요소', l4_wrong: '과학적으로 부적절한 표현과 수정 방법'
  };

  const str = v => v == null ? '' : String(v);
  // S.simple → 평평한 답 칸. 비어 있는 칸은 넣지 않는다
  function flatten(st) {
    st = st || {};
    const a = {}, put = (k, v) => { v = str(v); if (v.trim()) a[k] = v; };
    const evText = id => ((st.ev || []).find(e => e.id === id) || {}).text;
    const hasEv = id => (st.ev || []).some(e => e.id === id);
    const l1 = st.l1 || {}, l2 = st.l2 || {}, l3 = st.l3 || {}, l4 = st.l4 || {};
    put('l1_notice', l1.notice); put('l1_pick', PICK[l1.pick] || l1.pick); put('l1_compare', l1.compare);
    put('l1_keep', l1.keep); put('l1_revise', l1.revise); put('l1_qa', l1.qa); put('l1_qb', l1.qb);
    put('l1_claim', l1.claim); put('l1_use', (l1.use || []).map(evText).filter(Boolean).join('\n')); put('l1_reason', l1.reason);
    put('l2_first', l2.first); put('l2_var', l2.var); put('l2_why1', l2.why1); put('l2_compare', l2.compare);
    put('l2_same', l2.same); put('l2_why2', l2.why2); put('l2_chk', (l2.chk || []).map(k => CHK[k] || k).join(', '));
    put('l2_ai', l2.ai); put('l2_aiwhy', l2.aiwhy);
    if (st.out && st.out.l2 || l2.city) put('l2_city', l2.city || '코펜하겐');
    put('l2_prob', l2.prob); put('l2_use', (l2.use || []).map(evText).filter(Boolean).join('\n')); put('l2_policy', l2.policy); put('l2_limit', l2.limit); put('l2_take', l2.take);
    if (hasEv('l3a')) put('l3_p', str(l3.p) + ' kW');
    put('l3_note', l3.note); put('l3_why', l3.why); put('l3_first', l3.first); put('l3_firstwhy', l3.firstwhy);
    put('l3_r_wind', l3.r_wind); put('l3_rw_wind', l3.rw_wind); put('l3_r_ins', l3.r_ins); put('l3_rw_ins', l3.rw_ins);
    put('l3_prob', l3.prob); put('l3_tech', (l3.tech || []).join(', ')); put('l3_techwhy', l3.techwhy); put('l3_lim', l3.lim);
    const pol = Array.isArray(l4.pol) ? l4.pol : [];
    put('l4_pol', pol.map(id => POL[id] || id).join(', '));
    put('l4_link', pol.map(id => (POL[id] || id) + ' ← ' + (evText((l4.link || {})[id]) || '근거 미연결')).join('\n'));
    const pf = l4.pf || {};
    if (PF.some(([k]) => str(pf[k]).trim())) put('l4_prompt', PF.map(([k, n]) => '[' + n + '] ' + str(pf[k])).join('\n'));
    if (l4.reviews) put('l4_reviews', l4.reviews + '회');
    put('l4_self', (l4.self || []).map(i => SELF[+i] || i).join(', '));
    const items = pol.map(id => POL[id] || id).concat(['에너지 시스템', '교통', '공간 배치']);
    put('l4_ver', Object.entries(l4.ver || {}).filter(([, v]) => v).map(([i, v]) => (items[+i] || ('요소 ' + (+i + 1))) + ': ' + v).join('\n'));
    put('l4_added', l4.added); put('l4_wrong', l4.wrong);
    return a;
  }

  // 단계 마침 조건(노동규 선생님 화면의 저장 버튼과 같은 조건). 마쳤으면 null, 아니면 {step, message}
  function gate(st, l, s) {
    st = st || {};
    const ev = id => (st.ev || []).some(e => e.id === id), out = n => !!(st.out && st.out['l' + n]);
    const L = st['l' + (l + 1)] || {}, t = v => str(v).trim();
    const need = (ok, message) => ok ? null : { step: s, message };
    if (l === 0) return [
      () => need(ev('l1a'), '눈에 띄는 변화를 쓰고 「이 두 수치를 근거로 저장」을 눌러 주세요.'),
      () => need(ev('l1b'), '비교해서 알게 된 점을 쓰고 「이 비교를 근거로 저장」을 눌러 주세요.'),
      () => need(L.keep && t(L.revise), '처음 설명을 유지할지 수정할지 고르고, 그 이유나 수정한 설명을 써 주세요.'),
      () => need(L.qa && L.qb, 'AI 설명의 주장 A와 B를 각각 판단해 주세요.'),
      () => need(out(1), 'CER 카드를 채우고 「CER 카드 저장」을 눌러 주세요.')
    ][s]();
    if (l === 1) return [
      () => need(ev('l2a'), '도시와 변수를 고르고 「첫 판단 저장」을 눌러 주세요.'),
      () => need(ev('l2b'), '부문 데이터로 알게 된 점을 쓰고 「이 비교를 근거로 저장」을 눌러 주세요.'),
      () => need(L.same && t(L.why2), '처음 판단과 같은지 고르고 이유를 써 주세요.'),
      () => need(L.ai && t(L.aiwhy), 'AI 판단을 어떻게 받아들일지 고르고 근거를 써 주세요.'),
      () => need(out(2), 'CASE CARD를 채우고 「CASE CARD 저장」을 눌러 주세요.')
    ][s]();
    if (l === 2) return [
      () => need(ev('l3a'), '하루 수지가 0 이상이 되게 패널 용량을 맞추고 「Energy Zero 결과 저장」을 눌러 주세요.'),
      () => need(ev('l3b'), '먼저 줄일 부문을 고르고 「Carbon Budget 판단 저장」을 눌러 주세요.'),
      () => need(L.r_wind && L.r_ins, 'AI 추천 두 개를 각각 판단해 주세요.'),
      () => need(out(3), '적용 기술을 고르고 「PLAN 저장」을 눌러 주세요.'),
      () => need(out(3), '3차시 PLAN을 먼저 저장해 주세요.')
    ][s]();
    const pol = Array.isArray(L.pol) ? L.pol : [], pf = L.pf || {};
    return [
      () => null,
      () => need(pol.length && pol.every(id => (L.link || {})[id]), '정책을 1개 이상 고르고, 정책마다 근거를 연결해 주세요.'),
      () => need(PF.some(([k]) => t(pf[k])) && ((L.reviews || 0) > 0 || (L.self || []).length > 0), '프롬프트 칸을 채우고 AI Critic 검토(또는 스스로 점검)를 해 주세요.'),
      () => need(out(4), '과학적으로 부적절한 표현을 찾아 쓰고 「최종 산출물 저장」을 눌러 주세요.'),
      () => need(out(4), '3D 결과 검증 단계에서 최종 산출물을 먼저 저장해 주세요.')
    ][s]();
  }

  // 커리큘럼의 단계 이름·하는 일·답 칸을 바꾼다(지도 이름표·선생님 화면 질문 목록이 여기서 나온다)
  if (C && Array.isArray(C.lessons)) STEPS.forEach((row, l) => row.forEach((d, s) => { const st = C.lessons[l] && C.lessons[l].steps[s]; if (st) Object.assign(st, { name: d.name, action: d.action, keys: d.keys.slice() }); }));

  window.NZSimple = {
    active: true, steps: STEPS, labels: LABELS, flatten, gate, keys: Object.keys(LABELS),
    choiceKeys: ['l1_pick', 'l1_keep', 'l1_qa', 'l1_qb', 'l2_first', 'l2_var', 'l2_same', 'l2_ai', 'l3_first', 'l3_r_wind', 'l3_r_ins'],
    POL, PF
  };
})();
