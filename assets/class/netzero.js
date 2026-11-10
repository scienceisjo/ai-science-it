/* 선생님 수업 화면 · NET ZERO ECO-CITY 설정
   질문 목록은 assets/learning/curriculum.js(EcoLearning)의 단계·답 칸에서 만든다.
   답 칸 이름(labels)은 index.html 의 answerLabels 를 옮겨 둔 것. 학생 화면 문구를 바꾸면 여기도 맞춘다.
   루브릭: 「NET ZERO ECO-CITY 4차시 활동 평가 루브릭(초안)」(연구회, 2026-11-06) ①~⑥ 50점 */
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
    l4fix: '수정한 점과 남은 한계', l4speech: '발표 · 우리 도시를 데이터로 설명하기', l4peerQA: '친구가 한 질문과 내 대답'
  };
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
  const rubric = [
    { id: 'N1', no: '①', name: '자료 읽기·해석', area: 'Ⅰ. 데이터 해석과 근거', points: { A: 10, B: 8, C: 6, D: 4, E: 2 },
      keys: ['l1pattern', 'l1energy', 'l1check', 'l2trend', 'l2infer', 'l3balance', 'l4priority'],
      levels: {
        A: '수치의 대상·연도·단위·산정 범위를 정확히 읽는다. 비율과 절대량, 전력과 전체 에너지, 연간 배출과 누적 배출, kW와 kWh를 구분하여 해석한다. 자료가 보여 주지 않는 범위까지 스스로 밝힌다.',
        B: '수치와 단위를 대체로 정확히 읽고 주요 구분(비율/절대량, 전력/전체 에너지 등)을 적용한다. 자료 범위의 한계 언급은 일부에 그친다.',
        C: '수치를 옮겨 적지만 연도·단위·대상 중 일부가 빠지거나 지표의 뜻을 혼동하는 경우가 있다.',
        D: '수치를 일부 옮기지만 연도·단위·대상이 대부분 빠져 있고, 지표의 뜻을 잘못 해석한 부분이 있다.',
        E: '수치 없이 그래프의 인상만 서술하거나, 단위·지표를 잘못 읽어 해석이 자료와 맞지 않는다.' } },
    { id: 'N2', no: '②', name: '근거 기반 주장과 판단 수정', area: 'Ⅰ. 데이터 해석과 근거', points: { A: 10, B: 8, C: 6, D: 4, E: 2 },
      keys: ['l1initial', 'l1claim', 'l1evidence', 'l1reason', 'l1revision', 'l1next', 'l2revision', 'l3passivePrediction', 'l3passive'],
      levels: {
        A: '주장에 출처가 분명한 실제 수치 2개 이상을 연결하고, 근거가 주장을 지지하는 이유를 과학 개념으로 설명한다. 새 자료를 본 뒤 처음 생각을 수정하거나 유지한 이유와 추가로 확인할 자료를 구체적으로 밝힌다.',
        B: '수치 근거 2개와 주장을 연결하지만 추론의 연결이 일부 약하다. 수정·유지 이유는 있으나 근거 제시가 간략하다.',
        C: '주장과 근거가 있으나 수치가 1개이거나 주장과의 관련성이 약하다. 수정·유지 여부만 밝히고 이유가 모호하다.',
        D: '주장과 근거를 제시하지만 수치 근거가 없거나 주장과 연결되지 않는다. 처음 생각과의 비교가 형식적이다.',
        E: '근거 없는 주장이거나 자료와 무관한 일반론이다. 처음 생각과의 비교가 없다.' } },
    { id: 'N3', no: '③', name: '과학 개념과 모형의 구분', area: 'Ⅱ. 과학개념·설계 타당성', points: { A: 8, B: 6, C: 5, D: 3, E: 2 },
      keys: ['l1initial', 'l2trend', 'l3balance', 'l3carbon', 'l4tradeoff'],
      levels: {
        A: '에너지 보존과 효율·연료 사용 감축을 모순 없이 설명한다. 하루 에너지 수지와 시간별 부족량, Energy Zero와 Carbon Zero를 구분한다. 관찰과 추론, 실측값과 가정값, 정책 시행 후 감소와 정책 효과를 구분하여 서술한다.',
        B: '핵심 개념을 대체로 바르게 적용하며, 실측/가정 또는 관찰/추론 구분이 일부에서 흐려진다.',
        C: '개념 용어는 사용하지만 에너지 수지 0을 탄소중립으로 보거나, 가정 모형 결과를 실제 효과로 해석하는 등의 혼동이 나타난다.',
        D: '핵심 개념을 일부만 언급하며 개념 혼동이 여러 곳에서 나타난다.',
        E: '과학 개념과의 연결이 거의 없거나 개념 오류가 결론을 좌우한다.' } },
    { id: 'N4', no: '④', name: '비교 설계와 의사결정', area: 'Ⅱ. 과학개념·설계 타당성', points: { A: 7, B: 5, C: 4, D: 2, E: 1 },
      keys: ['l2problem', 'l2policy', 'l2transfer', 'l3trialReason', 'planConditions', 'l4tradeoff', 'l4equity'],
      levels: {
        A: '3차시 A·B 실험에서 고정할 조건과 바꿀 변인을 명확히 통제하고 결과 차이를 예상과 비교한다. 4차시에 조건이 실제로 다른 두 정책 조합을 비교하여 편익·시민 부담·적용 조건을 근거로 선택한다. 보류한 분야는 보류 이유를 밝힌다.',
        B: '변인 통제와 두 대안 비교를 수행하지만 편익·부담·적용 조건 중 일부만 고려한다.',
        C: '비교는 하지만 여러 조건을 동시에 바꾸거나, 탄소 계산값이 낮다는 이유만으로 선택한다.',
        D: '비교를 시도하지만 두 대안의 조건 차이나 변인을 구분하지 못한다. 선택 근거가 매우 약하다.',
        E: '비교가 없거나 같은 조합을 설명만 바꾸어 제시한다. 선택 근거가 없다.' } },
    { id: 'N5', no: '⑤', name: 'AI 제안·생성물 검증과 수정', area: 'Ⅲ. AI·3D 비판적 검증', points: { A: 10, B: 8, C: 6, D: 4, E: 2 },
      keys: ['l1literacyA', 'l1literacyB', 'l1literacyWhy', 'l2ai', 'l3decision', 'cityPrompt', 'promptRevision', 'l4model', 'l4error', 'l4fix'],
      levels: {
        A: 'AI 추천(“가장 친환경적인 도시”, 근거 없는 풍력 추천 등)을 두 종류 이상의 자료로 검증하여 채택·보류·거부를 판단한다. 계획–프롬프트–3D 결과를 요소별로 대조하여 누락·임의 추가·과학적으로 부적절한 표현을 1개 이상 찾고, 수정 내용과 이유를 데이터로 설명한다.',
        B: 'AI 제안을 자료로 검증하고 3D 결과의 오류를 찾아 수정하지만, 수정 이유의 데이터 근거가 일부 부족하다.',
        C: 'AI 제안의 문제를 지적하지만 근거가 막연하다. 3D 결과는 외관 위주로 검토하여 계획과의 불일치를 충분히 찾지 못한다.',
        D: 'AI 제안이나 3D 결과에 의문을 제기하지만 구체적인 오류를 찾거나 근거를 제시하지 못한다.',
        E: 'AI 제안이나 생성 결과를 검증 없이 그대로 수용하거나, 검증 기록이 없다.' } },
    { id: 'N6', no: '⑥', name: '설계 표현과 발표', area: 'Ⅳ. 표현과 의사소통', points: { A: 5, B: 4, C: 3, D: 2, E: 1 },
      keys: ['l4model', 'l4speech', 'l4peerQA'],
      levels: {
        A: '각 정책의 공간 배치를 데이터 근거와 연결하여 설명하고, 외관만으로 확인할 수 없는 성능과 남은 불확실성을 분명히 전달한다. 동료 질문(“근거가 어디 있나요?”)에 근거로 답한다.',
        B: '설계의 근거와 한계를 전달하지만 일부 요소의 근거 연결이 생략된다.',
        C: '설계 내용을 나열하는 수준이며 근거·한계 설명이 짧다.',
        D: '설계 일부를 소개하지만 근거·한계 설명이 거의 없다.',
        E: '외관 묘사 위주이거나 발표 내용이 기록과 맞지 않는다.' } }
  ];

  window.ASI_PROGRAMS = window.ASI_PROGRAMS || {};
  window.ASI_PROGRAMS.netzero = {
    id: 'netzero', name: 'NET ZERO ECO-CITY', studentPath: './', total: 50,
    lessons: lessonNames, steps, questions, labels, textbook, rubric, place,
    // 학생을 옮길 수 있는 곳. lessons 가 있으면 그 차시에만 있는 곳
    places: [
      { id: 'researcher', label: '연구원' }, { id: 'guide', label: '에코' }, { id: 'portal', label: '포탈' },
      { id: 'archive', label: '기록관 안', lessons: [1] }, { id: 'record', label: '기록 벤치', lessons: [1] }, { id: 'start', label: '처음 자리' },
      { id: 'step-1', step: 0 }, { id: 'step-2', step: 1 }, { id: 'step-3', step: 2 }, { id: 'step-4', step: 3 }, { id: 'step-5', step: 4 }
    ],
    stepCount: 5, stepSuffix: ' 시설',
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
      return { schema: 1, lesson: lesson - 1, steps: [step, 0, 0, 0], answers, evidence: [], demo: true };
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
