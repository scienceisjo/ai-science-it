/* 선생님 수업 화면 · NET ZERO ECO-CITY 설정
   질문 목록은 assets/learning/curriculum.js(EcoLearning)의 단계·답 칸에서 만든다.
   답 칸 이름(labels)은 index.html 의 answerLabels 를 옮겨 둔 것. 학생 화면 문구를 바꾸면 여기도 맞춘다.
   루브릭(2026-11-14): 1~3차시 = 노동규 선생님 「심플 데이터 탐구 — 예시답안과 3단계 평가 루브릭」(11-11) 1-1~3-6 을 이 RPG 판 질문에 맞춰 옮김
   (숫자·AI 문장은 RPG 판 자료로 바꿈), 4차시 = 연구회 「4차시 활동 평가 루브릭(초안)」(11-06) ④⑤⑥ 의 4차시 부분을 3단계로. 상3·중2·하1·무응답0, 21요소 63점 */
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
  const el = (no, name, area, keys, hi, mid, lo) => ({ id: 'N' + no, no, name, area: AREA[area], points: PTS, keys, levels: { A: hi, B: mid, C: lo, D: NONE } });
  const rubric = [
    // 1차시 WHY
    el('1-1', '시계열 그래프 읽기', 'A', ['l1pattern'],
      '두 연도의 값을 단위와 함께 정확히 쓰고, 변화량·배수와 전체 추세를 함께 설명한다.',
      '두 연도의 값은 쓰지만 변화량·추세 중 하나가 빠지거나 단위가 없다.',
      '‘늘었다’처럼 수치 없이 느낌만 쓴다.'),
    el('1-2', '두 데이터 비교', 'A', ['l1energy', 'l1check'],
      '저탄소 비율 증가와 전체 에너지·화석연료 사용량(또는 CO₂ 배출량) 증가를 수치로 함께 제시하고, ‘비율이 늘어도 배출이 줄지 않은 이유’를 연결해 설명한다.',
      '두 자료 중 하나만 수치로 제시하거나, CO₂ 변화와의 관계를 설명하지 못한다.',
      '‘저탄소 에너지가 늘어 문제가 해결되고 있다’처럼 데이터와 맞지 않는 결론을 낸다.'),
    el('1-3', '새 데이터에 따른 설명 수정', 'D', ['l1initial', 'l1revision'],
      '새 데이터의 수치를 근거로 처음 설명을 유지하거나 구체적으로 고쳤다.',
      '유지·수정을 밝혔으나 이유가 일반적이다.',
      '이유를 쓰지 않거나 첫 설명을 그대로 옮겼다.'),
    el('1-4', 'AI 설명의 주장 구분', 'C', ['l1literacyA', 'l1literacyB', 'l1literacyWhy'],
      'AI 설명 가(2024년 우리나라 전기의 저탄소 비율)는 이 자료로 바로 확인할 수 있고, 나(비율 증가가 재생에너지 지원 정책 덕분)는 자료가 더 있어야 한다고 맞게 구분하며, 나를 판단하는 데 필요한 자료(예: 원자력·재생에너지별 발전량 변화, 정책 시행 시기)를 말할 수 있다.',
      '두 설명 중 하나만 맞게 구분한다.',
      '둘 다 ‘바로 확인할 수 있다’로 골라 AI 설명을 그대로 받아들인다.'),
    el('1-5', 'CER 근거의 수치성', 'A', ['l1evidence'],
      '서로 다른 데이터의 수치 2개 이상을 단위·연도와 함께 제시한다.',
      '수치 2개를 제시하지만 같은 데이터에서만 가져왔거나 단위가 빠졌다.',
      '수치가 1개 이하이다.'),
    el('1-6', 'CER 추론의 과학성', 'B', ['l1claim', 'l1reason'],
      '에너지 보존·에너지 전환(효율)·화석연료 연소 개념으로 ‘보존되는데도 줄여야 하는 이유’를 설명한다.',
      '화석연료와 CO₂의 관계는 설명하나 에너지 보존·효율 개념이 없다.',
      '근거를 다시 쓰거나 개념 없이 주장만 반복한다.'),
    // 2차시 HOW
    el('2-1', '변수를 밝힌 첫 판단', 'A', ['l2initial', 'l2trend'],
      '판단에 쓴 변수(총배출량 등)를 밝히고, 고른 도시의 시작·끝 연도 값과 변화율을 기간과 함께 제시한다.',
      '수치 하나만 제시하거나 기간·변화율 중 하나가 빠진다.',
      '수치 없이 ‘더 많이 줄었다’고만 쓴다.'),
    el('2-2', '부문 구성 해석', 'A', ['l2infer'],
      '부문별 배출(또는 추가 지표)을 수치로 읽고, 남아 있는 큰 배출원과 줄어든 부문을 구분해 우선할 정책과 연결한다.',
      '부문 수치를 읽었으나 그 의미나 정책과의 연결을 말하지 못한다.',
      '부문 자료를 읽지 않고 총배출 내용을 반복한다.'),
    el('2-3', '비교 조건의 한계 인식', 'B', ['l2revision', 'l2ai'],
      '도시마다 기간·산정 범위(기준연도, 인구, 회계 방식)가 다르다는 점을 근거로 첫 판단을 조정하거나 보류한다.',
      '한계를 언급하지만 판단에 반영하지 않는다.',
      '도시를 단순 순위로 단정한다.'),
    el('2-4', 'AI 판단 검증', 'C', ['l2aiChoice', 'l2ai'],
      'AI가 든 수치(최근 배출량)가 표와 맞는지 확인하고, 수치는 맞아도 총배출 한 가지로는 ‘가장 친환경적’이라 할 수 없음을 기간·변화율 등 다른 자료로 설명하며 보류하거나 받아들이지 않는다.',
      '보류·거부를 골랐으나 근거가 한 가지 수치에 머문다.',
      '그대로 받아들이거나 근거 없이 거부한다.'),
    el('2-5', '정책 역추론', 'B', ['l2infer', 'l2policy'],
      '데이터 변화에서 정책을 추론하고, 공식 정책과 대조해 맞은 점·다른 점을 적는다.',
      '정책을 추론했으나 데이터와의 연결이 약하다.',
      '공식 정책 문장을 그대로 옮겨 적는다.'),
    el('2-6', '가져올 전략과 근거', 'D', ['l2problem', 'l2evidence', 'l2transfer'],
      '전략 1개를 분명히 고르고, 그 효과를 보여 주는 수치를 함께 쓴다.',
      '전략은 골랐으나 근거가 일반적이다.',
      '전략이 여러 개이거나 근거가 없다.'),
    // 3차시 WHAT
    el('3-1', '시간별 수급 그래프 읽기', 'A', ['l3balancePrediction', 'l3balance'],
      '발전>소비 시간대와 하루 합계(발전·소비·수지)를 모두 수치로 제시한다.',
      '시간대 또는 하루 합계 중 하나만 제시한다.',
      '한낮 한 시점만 보고 Energy Zero라고 판단한다.'),
    el('3-2', 'Energy Zero의 의미와 한계', 'B', ['l3balance'],
      '하루 합으로는 수지가 0 이상이어도 밤 시간 부족분(전력망·저장)이 남음을 수치와 함께 설명한다. 태양광 용량을 키워도 밤 부족분은 거의 줄지 않는다는 점을 알아차린다.',
      '밤 시간 부족을 언급하지만 수치나 해결 조건이 없다.',
      '수지가 0이면 에너지 문제가 모두 해결된다고 본다.'),
    el('3-3', 'Energy Zero와 Carbon Zero 구분', 'B', ['l3carbon'],
      '전력이 아닌 부문(건물 연료·교통·폐기물·산업·재료)이 연료 연소와 공정에서 탄소를 내는 원리를 설명하고, 전력 부문을 빼도 남는 양(가상도시 800 tCO₂e/년, 80%)을 제시한다.',
      '남는 부문을 나열하지만 왜 남는지 설명이 부족하다.',
      '건물이 Energy Zero면 도시도 Carbon Zero라고 답한다.'),
    el('3-4', '우선 부문 선택의 근거', 'A', ['planProblem'],
      '부문의 배출량·비중을 근거로 선택하고, 가장 큰 부문이 아니면 다른 타당한 이유(예: 감축 수단의 실현성)를 데이터로 설명한다.',
      '부문을 골랐으나 근거가 수치 없이 일반적이다.',
      '근거를 쓰지 않는다.'),
    el('3-5', 'AI 추천의 선택적 수용', 'C', ['l3decision'],
      '풍속 자료 없이 나온 풍력 추천을 그대로 채택하지 않고, 필요한 자료(풍속 등)와 부문 데이터(풍력이 줄이는 것은 전력 부문뿐)로 ‘근거 추가 후 채택’ 또는 거부의 이유를 설명한다.',
      '판단은 타당하나 이유를 자료로 설명하지 못한다.',
      '추천을 그대로 채택하거나 이유가 없다.'),
    el('3-6', 'PLAN의 일관성', 'B', ['planProblem', 'planEnergy', 'planBuilding', 'planTransport', 'planWaste', 'planGreen', 'planConditions'],
      '문제–우선 부문–기술–근거–한계가 서로 이어지고, 기술이 우선 부문과 맞는다.',
      '항목은 채웠으나 기술과 우선 부문의 연결이 약하다. 또는 교육용 가정값(태양광 곡선·가상 Carbon Budget)을 실측값처럼 쓴다.',
      '근거 없는 기술을 나열하거나 한계를 쓰지 않는다.'),
    // 4차시 CREATE & VERIFY — 노동규 선생님 루브릭에 없어 연구회 초안 ④⑤⑥ 의 4차시 부분을 3단계로 옮김
    el('4-1', '정책 조합 비교와 선택', 'B', ['l4priority', 'l4tradeoff', 'l4equity'],
      '조건이 실제로 다른 두 정책 조합을 비교하여 편익·시민 부담·적용 조건을 근거로 선택한다. 보류한 분야는 보류 이유를 밝힌다.',
      '두 조합을 비교하지만 편익·부담·적용 조건 중 일부만 고려하거나, 탄소 계산값이 낮다는 이유만으로 선택한다.',
      '비교가 없거나 같은 조합을 설명만 바꾸어 제시한다. 선택 근거가 없다.'),
    el('4-2', 'AI 생성물 검증과 수정', 'C', ['cityPrompt', 'promptRevision', 'l4model', 'l4error', 'l4fix'],
      '계획–프롬프트–3D 결과를 요소별로 대조하여 누락·임의 추가·과학적으로 부적절한 표현을 1개 이상 찾고, 수정 내용과 이유를 데이터로 설명한다.',
      '3D 결과의 문제를 지적하지만 외관 위주이거나 수정 이유의 데이터 근거가 부족하다.',
      '생성 결과를 검증 없이 그대로 받아들이거나 검증 기록이 없다.'),
    el('4-3', '설계 표현과 발표', 'D', ['l4model', 'l4speech', 'l4peerQA'],
      '각 정책의 공간 배치를 데이터 근거와 연결하여 설명하고, 외관만으로 확인할 수 없는 성능과 남은 불확실성을 전달한다. 동료 질문에 근거로 답한다.',
      '설계 내용을 전달하지만 근거·한계 설명이 짧거나 일부 요소의 근거 연결이 빠진다.',
      '외관 묘사 위주이거나 발표 내용이 기록과 맞지 않는다.')
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
    choiceKeys: ['l1initial', 'l1literacyA', 'l1literacyB', 'l2aiChoice', 'l3balancePrediction', 'l3passivePrediction'],
    transitionKey: 'l1initial',
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
