/* 선생님 수업 화면 · 화석 수사대 설정
   질문 목록은 탐구 16개 화면의 입력 칸 이름(state.records['차시-단계'][칸 이름])을 2026-11-10 화면에서 뽑은 것.
   탐구 화면의 칸 이름을 바꾸면 여기도 맞춘다. 루브릭은 아래 rubric(P1~P8). */
(function () {
  'use strict';
  const lessons = ['다섯 번의 침묵', '시간이 뒤섞인 방', '표본실의 거짓말', '지구의 기억을 연결하라'];
  const steps = [
    ['침묵의 구간 찾기', '원인 가설 회의', '증거 심사', '조사 결과 보고'],
    ['진짜 기록 찾기', '시간의 길이 복구', '두 개의 단서함', '시간 기록 승인'],
    ['관찰 훈련', '네 표본 조사', '복원 기록 검증', '잘못된 보고서 수정'],
    ['지구 기록 통합', '변화의 연결 고리', '동료 검증', '개인 탐구 이야기']
  ];
  const fields = {
    '1-0': ['대상', '감소 구간', '감소 구간과 원인'],
    '1-1': ['집중 사건', '잠정 가설', '가설 선택 이유'],
    '1-2': ['심사 사건', '자료의 관찰 사실', '자료의 해석', '판단', '판단 이유'],
    '1-3': ['확인한 사실', '잠정 설명', '추가 확인'],
    '2-0': ['자료 0', '자료 1', '자료 2', '분류 이유'],
    '2-1': ['순서 0', '순서 1', '순서 2', '순서 3', '길이 0', '길이 1', '길이 2', '길이 3', '비율 해석'],
    '2-2': ['자료 A', '자료 B', '분류 근거'],
    '2-3': ['수정 문장', '추가 자료'],
    '3-0': ['관찰 문장', '추론 문장', '구분 근거'],
    '3-1': ['삼엽충 관찰', '암모나이트 관찰', '양치식물 관찰', '조개 관찰', '상세 표본', '환경 추론', '관찰 한계'],
    '3-2': ['대응 구조', '추론 요소', '미확인 요소'],
    '3-3': ['수정 보고서', '검증 계획', '복원의 가치'],
    '4-0': ['집중 경계', '공통 연결', '선캄브리아시대 기록', '고생대 기록', '중생대 기록', '신생대 기록'],
    '4-1': ['시작 시대', '다음 시대', '환경 변화', '생물 변화', '인과 근거', '설명 상태', '설명의 한계'],
    '4-2': ['동료의 지지', '동료 질문', '설명 수정'],
    '4-3': ['탐구 제목', '시대 선정', '환경 특징', '화석 근거', '변천 설명', '결론', '마지막 문장']
  };
  const questions = Object.entries(fields).flatMap(([k, names]) => {
    const [l, s] = k.split('-').map(Number);
    return names.map(name => ({ key: k + '|' + name, lesson: l, step: s, stepName: steps[l - 1][s], label: name, path: ['records', k, name] }));
  });
  const labels = Object.fromEntries(questions.map(q => [q.key, q.stepName + ' · ' + q.label]));
  const place = (id, lesson) => {
    if (!id) return '아직 신호 없음';
    const m = /^step-(\d)$/.exec(id);
    if (m) { const n = +m[1] - 1, name = lesson && steps[lesson - 1] && steps[lesson - 1][n]; return (name || (+m[1]) + '단계') + ' 앞'; }
    return ({ start: '처음 자리', guide: 'ECHO 옆', portal: '시간 관문', inquiry: '탐구 화면', map: '지도 위' })[id] || id;
  };
  // 루브릭 P1~P8(모은 선생님 초안) — fossil-rubric.js
  const rubric = window.ASI_FOSSIL_RUBRIC || [];

  window.ASI_PROGRAMS = window.ASI_PROGRAMS || {};
  window.ASI_PROGRAMS.fossil = {
    id: 'fossil', name: '화석 수사대', studentPath: './', total: 50,
    lessons, steps, questions, labels, rubric, place, stepCount: 4,
    // 화석은 학습하기 쪽 대신 사건 이야기 장면을 띄운다(학생 앱이 CHAPTERS[차시].intro 를 그림)
    learnName: '사건 이야기',
    textbook: null,
    places: [
      { id: 'guide', label: 'ECHO' }, { id: 'portal', label: '시간 관문' }, { id: 'start', label: '처음 자리' },
      { id: 'step-1', step: 0 }, { id: 'step-2', step: 1 }, { id: 'step-3', step: 2 }, { id: 'step-4', step: 3 }
    ],
    stepSuffix: ' 장소',
    slideURL: (lesson, page) => 'teacher.html?lesson=' + lesson + '&s=1&k=last&p=' + (page + 1),
    // 체험 화면(?demo=1)의 가짜 학생 기록
    demoRecord(i, lesson, step) {
      const pick = arr => arr[i % arr.length];
      const records = {
        '1-0': { '대상': pick(['과(family)의 수', '종의 수', '과(family)의 수']), '감소 구간': pick(['페름기 말에 400여 과에서 200과 정도로 줄었다.', '세 번째 화살표 부근에서 크게 줄었다.', '']), '감소 구간과 원인': pick(['감소 구간은 총 5구간으로, 감소한 원인은 화산 활동으로 추정된다.', '감소 구간은 총 5구간이고 원인은 아직 모르겠다.', '']) },
        '1-1': { '집중 사건': '페름기 말', '가설 선택 이유': pick(['시베리아 트랩 자료가 같은 시기라서.', '해수 온도 자료가 함께 바뀌어서.', '']) }
      };
      return { schema: 1, chapter: lesson, accepted: { 1: true }, done: step > 0 ? { '1-0': true } : {}, records, demo: true };
    },
    ownText(v) { return v == null ? '' : typeof v === 'string' ? v.trim() : typeof v === 'object' ? JSON.stringify(v) : String(v); },
    evidenceCount() { return 0; }
  };
})();
