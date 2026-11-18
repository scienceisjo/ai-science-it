/* 선생님 수업 화면 · NET ZERO ECO-CITY 설정
   질문 목록은 assets/learning/curriculum.js(EcoLearning)의 단계·답 칸에서 만든다.
   답 칸 이름(labels)은 index.html 의 answerLabels 를 옮겨 둔 것. 학생 화면 문구를 바꾸면 여기도 맞춘다.
   2026-11-15 탐구 단계가 노동규 선생님 「심플 데이터 탐구」로 바뀜(assets/learning/simple-steps.js). 답 칸은 l1_… 키, 이름은 NZSimple.labels.
   루브릭: 1~3차시 = 노동규 선생님 3단계 루브릭(11-11) 1-1~3-6 원문, 4차시 = 연구회 초안 ④⑤⑥ 을 이 탐구의 4차시 활동에 맞춰 3단계로. 상3·중2·하1·무응답0, 21요소 63점 */
(function () {
  'use strict';
  const L = window.EcoLearning;
  const labels = {
    l1initial: '처음 생각: 에너지가 보존되는데 왜 절약해야 할까요?', l1pattern: '어떤 변화가 눈에 들어왔나요?',
    l1energy: '저탄소 비율이 늘었는데 CO₂ 배출량도 늘어난 까닭', l1check: '전기와 전체 에너지의 저탄소 비율로 점검한 판단',
    l1literacyA: 'AI 설명 가(2024년 전기 저탄소 비율)에 대한 판단', l1literacyB: 'AI 설명 나(증가 원인)에 대한 판단',
    l1literacyWhy: 'AI 설명을 그렇게 판단한 까닭과 더 필요한 자료', l1claim: '주장 · 어떤 변화가 필요한가?',
    l1evidence: '근거 · 실제 데이터 수치 2개 이상', l1reason: '추론 · 왜 이 근거가 주장을 뒷받침하는가?',
    l1revision: '처음 생각과 달라진 점 또는 그대로인 이유', l1next: '더 확인하고 싶은 자료와 까닭',
    l2initial: '어느 도시의 어떤 전략이 유망해 보이나요?', l2trend: '배출 변화에 대한 설명',
    l2infer: '이 도시가 우선해야 할 정책은 무엇일까요?', l2ai: 'AI 추천 문장을 판단한 이유', l2revision: '첫 판단의 수정과 근거',
    l2problem: '문제 · 선택한 도시의 우선 과제', l2evidence: '증거 · 서로 다른 자료 2종 이상', l2policy: '적용 기술·정책',
    l2transfer: '우리 도시에 가져올 전략 1개와 이유', l3prediction: '어떤 기술이 소비량과 발전량 중 무엇을 바꿀까요?',
    l3balancePrediction: '에너지 수지 실험 전 예상', l3balance: '하루 에너지 수지 해석', l3passivePrediction: '효율 실험 전 예상',
    l3passive: '효율 조건의 효과와 검증', l3trialReason: '통제 실험 비교와 해석', l3carbon: '에너지 수지가 0이어도 탄소배출이 남는 이유',
    l3decision: 'AI 추천을 그렇게 판단한 이유', planProblem: '해결할 문제와 핵심 데이터', planEnergy: '에너지 생산·공급 계획',
    planBuilding: '에너지 효율·건축 계획', planTransport: '교통 계획', planWaste: '폐기물·자원순환 계획', planGreen: '녹지·흡수 계획',
    planConditions: '기술 선택의 근거·필요 조건·예상 한계', l4priority: '최종 도시에서 우선할 문제와 근거',
    l4tradeoff: '최종 조합의 선택 이유와 포기한 것', l4equity: '시민의 편익·부담과 추가 자료', cityPrompt: '도시 전체 설계 프롬프트',
    promptRevision: '프롬프트에서 수정한 내용과 이유', l4model: '계획의 어떤 요소를 어떻게 표현했나요?', l4error: '발견한 오류·누락·한계',
    l4fix: '수정한 점과 남은 한계', l4speech: '발표 · 우리 도시를 데이터로 설명하기', l4peerQA: '친구가 한 질문과 내 대답',
    l2aiChoice: 'AI 추천 문장에 대한 판단'
  };
  if (window.NZSimple) Object.assign(labels, window.NZSimple.labels);   // 심플 데이터 탐구 답 칸 이름
  const minutes = r => Math.round(Object.values((r && r.active) || {}).reduce((a, b) => a + (Number(b) || 0), 0) / 60);
  const lessonNames = ['왜 필요한가', '도시의 전략', '에너지와 탄소', '설계와 검증'];
  const steps = L ? L.lessons.map(l => l.steps.map(s => s.name)) : [[], [], [], []];
  const questions = L ? L.lessons.flatMap((l, li) => l.steps.flatMap((s, si) => s.keys.map(k => ({
    key: k, lesson: li + 1, step: si, stepName: s.name, label: labels[k] || k, path: ['answers', k]
  })))) : [];
  const textbook = [
    ['에너지 보존과 효율', '배출 그래프 읽기', '비율과 사용량', '전력과 전체 에너지', 'CER로 설명하기'],
    ['도시 비교의 기준', '변화량과 원인', '두 종류의 근거', '목표와 실적', '조건부 제안'],
    ['수요와 공급', '하루 에너지 수지', '통제 비교', '에너지와 탄소', '기술 선택의 근거'],
    ['근거의 연결', '정책의 상충관계', '검증 가능한 프롬프트', '모형과 생성물', '제안과 검증']
  ];
  const place = (id, lesson) => {
    if (!id) return '아직 신호 없음';
    const m = /^step-(\d)$/.exec(id);
    if (m) { const n = +m[1] - 1, name = lesson && steps[lesson - 1] && steps[lesson - 1][n]; return (name || (+m[1]) + '단계') + ' 시설'; }
    return ({ researcher: '연구원 옆', guide: '에코 옆', portal: '포탈 옆', record: '기록 벤치', archive: '기록관 안', 'archive-door': '기록관 입구',
      start: '처음 자리', inquiry: '탐구 화면', council: '설계회의 화면', map: '지도 위' })[id] || id;
  };
  // 단계: A=상(3) B=중(2) C=하(1) D=무응답(0). 영역 A 데이터 해석과 근거 · B 과학 개념과 설계 타당성 · C AI 응답의 비판적 검증 · D 표현과 의사소통
  const AREA = { A: 'A. 데이터 해석과 근거', B: 'B. 과학 개념과 설계 타당성', C: 'C. AI 응답의 비판적 검증', D: 'D. 표현과 의사소통' };
  const PTS = { A: 3, B: 2, C: 1, D: 0 };
  const NONE = '응답이 없다.';
  const el = (no, name, area, keys, hi, mid, lo, focus) => Object.assign({ id: 'N' + no, no, name, area: AREA[area], points: PTS, keys, levels: { A: hi, B: mid, C: lo, D: NONE } }, focus ? { focus } : {});
  // 1~3차시: 노동규 선생님 「심플 데이터 탐구 — 예시답안과 3단계 평가 루브릭」(2026-11-11) 원문. 탐구 단계가 그 화면 그대로라 문장을 바꾸지 않는다
  const rubric = [
    el('1-1', '시계열 그래프 읽기', 'A', ['l1_notice'],
      '두 연도의 값을 단위와 함께 정확히 쓰고, 변화량·배수와 전체 추세를 함께 설명한다.',
      '두 연도의 값은 쓰지만 변화량·추세 중 하나가 빠지거나 단위가 없다.',
      '‘늘었다’처럼 수치 없이 느낌만 쓴다.'),
    el('1-2', '두 데이터 비교', 'A', ['l1_pick', 'l1_compare'],
      '저탄소 비율 증가와 화석연료 비율을 함께 제시하고, ‘비율이 늘어도 배출이 줄지 않은 이유’를 연결해 설명한다.',
      '두 비율 중 하나만 제시하거나, CO₂ 변화와의 관계를 설명하지 못한다.',
      '‘재생에너지가 늘어 문제가 해결되고 있다’처럼 데이터와 맞지 않는 결론을 낸다.'),
    el('1-3', '새 데이터에 따른 설명 수정', 'D', ['l1_notice', 'l1_keep', 'l1_revise'],
      '새 데이터의 수치를 근거로 처음 설명을 유지하거나 구체적으로 고쳤다.',
      '유지·수정을 골랐으나 이유가 일반적이다.',
      '이유를 쓰지 않거나 첫 설명을 그대로 복사했다.',
      '처음 설명(1-1)과 유지·수정 이유를 함께 비교합니다.'),
    el('1-4', 'AI 설명의 주장 구분', 'C', ['l1_qa', 'l1_qb'],
      '주장 A·B를 모두 맞게 구분하고, B에 필요한 자료(부문별 배출)를 말할 수 있다.',
      '두 주장 중 하나만 맞게 구분한다.',
      '둘 다 ‘직접 확인 가능’으로 골라 AI 설명을 그대로 받아들인다.'),
    el('1-5', 'CER 근거의 수치성', 'A', ['l1_use'],
      '서로 다른 데이터의 수치 2개 이상을 단위·연도와 함께 제시한다.',
      '수치 2개를 제시하지만 같은 데이터에서만 가져왔거나 단위가 빠졌다.',
      '수치가 1개 이하이다.'),
    el('1-6', 'CER 추론의 과학성', 'B', ['l1_claim', 'l1_reason'],
      '에너지 보존·에너지 전환(효율)·화석연료 연소 개념으로 ‘보존되는데도 줄여야 하는 이유’를 설명한다.',
      '화석연료와 CO₂의 관계는 설명하나 에너지 보존·효율 개념이 없다.',
      '근거를 다시 쓰거나 개념 없이 주장만 반복한다.'),
    el('2-1', '변수를 밝힌 첫 판단', 'A', ['l2_first', 'l2_var', 'l2_why1'],
      '판단에 쓴 변수를 밝히고, 두 도시의 시작·끝 값과 감소율을 모두 제시한다.',
      '한 도시의 수치만 제시하거나 감소율만 쓴다.',
      '수치 없이 ‘더 많이 줄었다’고만 쓴다.',
      '첫 판단에서 스톡홀름을 골라도 감점하지 않습니다. 변수를 밝히고 두 번째 데이터로 다시 보았는지를 봅니다.'),
    el('2-2', '부문 구성 해석', 'A', ['l2_compare'],
      '두 도시의 부문 비중을 비교하고, 남아 있는 배출원(교통)과 줄어든 부문(난방)을 수치로 구분한다.',
      '한 도시만 해석하거나 비중을 읽었으나 의미를 말하지 못한다.',
      '부문 데이터를 읽지 않고 1단계 내용을 반복한다.'),
    el('2-3', '비교 조건의 한계 인식', 'B', ['l2_same', 'l2_why2'],
      '기간·산정 범위가 다르다는 점을 근거로 판단을 조정하거나 보류한다.',
      '한계를 언급하지만 판단에 반영하지 않는다.',
      '두 도시를 단순 순위로 단정한다.'),
    el('2-4', 'AI 판단 검증', 'C', ['l2_chk', 'l2_ai', 'l2_aiwhy'],
      'AI 수치(73%)가 맞는지 확인하고, 수치는 맞아도 결론은 데이터 두 종류로 보아 다를 수 있음을 설명하며 ‘일부만 수용’한다.',
      '일부 수용·거부를 골랐으나 근거가 한 가지 데이터에 머문다.',
      '그대로 수용하거나 근거 없이 거부한다.'),
    el('2-5', '정책 역추론', 'B', ['l2_policy', 'l2_limit'],
      '데이터 변화에서 정책을 추론하고, 공식 계획과 대조해 일치·불일치를 적는다.',
      '정책을 추론했으나 데이터와의 연결이 약하다.',
      '공식 계획 문장을 그대로 옮겨 적는다.'),
    el('2-6', '가져올 전략과 근거', 'D', ['l2_take'],
      '전략 1개를 분명히 고르고, 그 효과를 보여 주는 수치를 함께 쓴다.',
      '전략은 골랐으나 근거가 일반적이다.',
      '전략이 여러 개이거나 근거가 없다.'),
    el('3-1', '시간별 수급 그래프 읽기', 'A', ['l3_p', 'l3_note'],
      '발전>소비 시간대와 하루 합계(발전·소비·수지)를 모두 수치로 제시한다.',
      '시간대 또는 하루 합계 중 하나만 제시한다.',
      '한낮 한 시점만 보고 Energy Zero라고 판단한다.',
      '패널 용량을 55 kW 이상으로 골라도 맞습니다.'),
    el('3-2', 'Energy Zero의 의미와 한계', 'B', ['l3_note'],
      '하루 합으로는 수지가 0 이상이어도 밤 시간 부족분(전력망·저장)이 남음을 수치와 함께 설명한다.',
      '밤 시간 부족을 언급하지만 수치나 해결 조건이 없다.',
      '수지 0이면 에너지 문제가 모두 해결된다고 본다.',
      '용량을 키워도 밤 부족분은 거의 줄지 않는다는 점을 알아차렸는지 봅니다.'),
    el('3-3', 'Energy Zero와 Carbon Zero 구분', 'B', ['l3_why'],
      '전력 외 부문(연료·교통·폐기물·산업)이 탄소를 내는 원리를 설명하고 남은 양(850, 85%)을 제시한다.',
      '남는 부문을 나열하지만 왜 남는지 설명이 부족하다.',
      '건물이 Energy Zero면 도시도 Carbon Zero라고 답한다.'),
    el('3-4', '우선 부문 선택의 근거', 'A', ['l3_first', 'l3_firstwhy'],
      '부문의 배출량·비중을 근거로 선택하고, 가장 큰 부문이 아니면 다른 타당한 이유(예: 감축 수단의 실현성)를 데이터로 설명한다.',
      '부문을 골랐으나 근거가 수치 없이 일반적이다.',
      '근거를 쓰지 않는다.'),
    el('3-5', 'AI 추천의 선택적 수용', 'C', ['l3_r_wind', 'l3_rw_wind', 'l3_r_ins', 'l3_rw_ins'],
      '두 추천을 서로 다르게 판단하고, 각 판단을 자료 유무와 부문 데이터로 설명한다.',
      '판단은 타당하나 한 추천의 이유만 데이터로 설명한다.',
      '두 추천을 모두 그대로 채택하거나 이유가 없다.'),
    el('3-6', 'PLAN의 일관성', 'B', ['l3_prob', 'l3_tech', 'l3_techwhy', 'l3_lim'],
      '문제–우선 부문–기술–근거–한계가 서로 이어지고, 기술이 우선 부문과 맞는다.',
      '항목은 채웠으나 기술과 우선 부문의 연결이 약하다.',
      '근거 없는 기술을 나열하거나 한계를 쓰지 않는다.',
      '태양광 곡선과 Carbon Budget은 교육용 가정값이므로, 이를 실측값처럼 쓰면 중 이하로 봅니다.'),
    // 4차시: 노동규 선생님 루브릭에 없어 연구회 초안 ④⑤⑥ 의 4차시 부분을 이 탐구의 4차시 활동(시뮬레이터·3D 프롬프트·검증)에 맞춰 3단계로 옮김
    el('4-1', '정책 선택과 근거 연결', 'B', ['l4_pol', 'l4_link'],
      '정책마다 DATA PASSPORT 근거를 연결하고, 근거와 정책이 줄이는 부문이 맞으며, 시뮬레이터 결과(감축률·남은 배출)를 고려해 고른다.',
      '정책을 골라 근거를 연결했지만 일부 근거가 정책과 맞지 않거나 시뮬레이터 결과를 고려하지 않는다.',
      '근거를 연결하지 않거나 근거 없는 정책을 고른다.'),
    el('4-2', 'AI 생성물 검증과 수정', 'C', ['l4_prompt', 'l4_reviews', 'l4_self', 'l4_ver', 'l4_added', 'l4_wrong'],
      '계획–프롬프트–3D 결과를 요소별로 대조하여 누락·임의 추가·과학적으로 부적절한 표현을 1개 이상 찾고, 수정 방법을 프롬프트에 반영한다.',
      '3D 결과의 문제를 지적하지만 외관 위주이거나 수정 방법의 데이터 근거가 부족하다.',
      '생성 결과를 검증 없이 그대로 받아들이거나 검증 기록이 없다.'),
    el('4-3', '설계 표현과 발표', 'D', ['l4_prompt', 'l4_wrong'],
      '각 정책의 공간 배치를 데이터 근거와 연결하여 설명하고, 외관만으로 확인할 수 없는 성능과 남은 불확실성을 전달한다. 동료 질문에 근거로 답한다.',
      '설계 내용을 전달하지만 근거·한계 설명이 짧거나 일부 요소의 근거 연결이 빠진다.',
      '외관 묘사 위주이거나 발표 내용이 기록과 맞지 않는다.',
      '발표는 수업 중에 보고 정합니다. 기록에는 프롬프트와 검증 내용만 있습니다.')
  ];

  window.ASI_PROGRAMS = window.ASI_PROGRAMS || {};
  window.ASI_PROGRAMS.netzero = {
    id: 'netzero', name: 'NET ZERO ECO-CITY', studentPath: './', total: 63,
    // 채점 단계: 서버에는 A~D 로 저장하고 화면에는 상·중·하·무응답으로 보인다
    levels: ['A', 'B', 'C', 'D'], levelNames: { A: '상', B: '중', C: '하', D: '무응답' },
    lessons: lessonNames, steps, questions, labels, textbook, rubric, place,
    // 학생을 옮길 수 있는 곳. lessons 가 있으면 그 차시에만 있는 곳
    places: [
      { id: 'researcher', label: '연구원' }, { id: 'guide', label: '에코' }, { id: 'portal', label: '포탈' },
      { id: 'archive', label: '기록관 안', lessons: [1] }, { id: 'record', label: '기록 벤치', lessons: [1] }, { id: 'start', label: '처음 자리' },
      { id: 'step-1', step: 0 }, { id: 'step-2', step: 1 }, { id: 'step-3', step: 2 }, { id: 'step-4', step: 3 }, { id: 'step-5', step: 4 }
    ],
    stepCount: 5, stepSuffix: ' 시설',
    otherDemo: { label: '화석 수사대 예시 수업', href: 'fossil-detectives/dashboard.html?demo=1' },
    // 연구 지표(학생별 기록·반 전체 지표). 횟수·시간은 점수에 넣지 않는다(루브릭 운영 유의사항)
    recordRoot: ['answers'],
    answerOf: (root, key) => root ? root[key] : undefined,
    choiceKeys: window.NZSimple ? window.NZSimple.choiceKeys.slice() : ['l1initial', 'l1literacyA', 'l1literacyB', 'l2aiChoice', 'l3balancePrediction', 'l3passivePrediction'],
    transitionKey: window.NZSimple ? null : 'l1initial',
    // 심플 데이터 탐구에서 처음 설명·판단을 고친 학생(1차시 「수정」 또는 2차시 「판단이 바뀌었다」)
    changeStat: window.NZSimple ? { label: '처음 설명·판단을 고친 학생', sub: '1차시 설명 수정 또는 2차시 판단 변경', keys: ['l1_keep', 'l2_same'], test: a => a.l1_keep === '수정' || a.l2_same === '판단이 바뀌었다' } : null,
    columns: [
      { id: 'time', label: '학습 시간', unit: '분', get: minutes, title: '화면이 보이고 조작이 있던 시간(선생님이 멈춘 시간 빼고)' },
      { id: 'chars', label: '직접 쓴 글자', get: r => r.chars, title: '가져온 근거 덩어리를 뺀 학생 글자 수' },
      { id: 'revisions', label: '답 고친 횟수', get: r => r.revisions, title: '이미 쓴 답을 다시 고친 횟수' },
      { id: 'evidenceReal', label: '실제 수치 근거', get: r => r.evidenceReal, title: '담은 근거 가운데 실제 자료' },
      { id: 'inserted', label: '근거 가져오기', get: r => r.inserted, title: '담은 수치를 답 칸에 가져온 횟수' },
      { id: 'help', label: '학습하기·도움', get: r => (r.textbookOpen || 0) + (r.help || 0), title: '학습하기를 연 횟수 + 도움말을 연 횟수' },
      { id: 'ai', label: 'AI 코치 질문', get: r => r.ai, title: 'AI 코치에게 물은 횟수(서버에 AI 가 연결된 경우만)' }
    ],
    slideURL: (lesson, page) => 'teacher.html?lesson=' + lesson + '&s=1&k=last&p=' + (page + 1),
    // 체험 화면(?demo=1)의 가짜 학생 기록
    demoRecord(i, lesson, step) {
      const sample = {
        l1initial: ['에너지가 보존돼도 연료 사용과 환경 영향을 줄이려고 절약한다고 생각해요.', '에너지는 쓰면 없어지므로 아껴야 한다고 생각해요.', '아직 잘 모르겠어요.'],
        l1pattern: ['1950년보다 2024년 배출량이 훨씬 많다. 2000년 뒤로 더 가파르게 늘었다.', '저탄소 비율은 조금 늘었는데 배출량은 계속 늘었다.', ''],
        l1energy: ['비율은 늘었지만 전체 에너지 사용량이 더 많이 늘어서 화석연료 사용량도 늘었다.', '분모(전체 에너지)가 커졌기 때문이다. 화석연료 TWh 를 보면 늘었다.', ''],
        l1claim: ['화석연료 사용량 자체를 줄여야 한다.', '저탄소 비율만 볼 게 아니라 배출 총량을 줄여야 한다.', ''],
        l2ai: ['AI 문장은 2017년 한 해만 보고 판단했다. 같은 해 자료로 비교해야 한다.', '근거가 없어서 보류한다.', '']
      };
      const answers = {};
      for (const [k, arr] of Object.entries(sample)) { const v = arr[(i + k.length) % arr.length]; if (v) answers[k] = v; }
      const lit = ['이 자료로 바로 확인할 수 있다', '자료가 더 있어야 판단할 수 있다'];
      answers.l1literacyA = lit[i % 3 === 0 ? 1 : 0]; if (i % 4) answers.l1literacyB = lit[i % 5 === 0 ? 0 : 1];
      if (i % 2) answers.l2aiChoice = ['받아들인다', '보류한다 · 판단할 자료가 더 필요하다', '받아들이지 않는다'][i % 3];
      const done = [], active = {};
      for (let s = 0; s <= step; s++) { if (s < step || i % 2) done.push('1-' + s); active['1-' + s] = 180 + ((i * 37 + s * 53) % 420); }
      if (lesson === 2) { for (let s = 0; s < 5; s++) done.push('1-' + s); done.push('2-0'); active['2-0'] = 240; }
      const initial = sample.l1initial[(i + 9 + (i % 3 === 1 ? 1 : 0)) % 3];   // 세 명 중 한 명은 처음 생각을 고친 것으로
      return { schema: 1, lesson: lesson - 1, steps: [step, 0, 0, 0], answers, evidence: [], demo: true,
        research: { v: 1, active, steps: done, chars: 60 + (i * 47) % 400, revisions: i % 4, revisedKeys: i % 3, first: { l1initial: initial },
          evidence: 1 + i % 4, evidenceReal: i % 4, inserted: i % 3, textbookOpen: i % 5, textbookSec: (i % 5) * 40, help: (i * 3) % 7, recall: i % 2, ai: 0, trials: i % 3 } };
    },
    // 화면에 띄울 학생 답: 가져온 근거 덩어리를 빼고 학생이 직접 쓴 글만
    ownText(v) {
      if (v == null) return '';
      if (typeof v !== 'string') return typeof v === 'object' ? JSON.stringify(v) : String(v);
      return v.replace(/\[(E\d{3})\][^\n]*\n출처:[^\n]*/g, '').replace(/\n{3,}/g, '\n\n').trim();
    },
    evidenceCount(v) { return typeof v === 'string' ? (v.match(/\[E\d{3}\][^\n]*\n출처:/g) || []).length : 0; }
  };
})();
