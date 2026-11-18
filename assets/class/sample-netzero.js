/* 선생님 수업 화면 예시 수업(?demo=1) · NET ZERO ECO-CITY
   「1학년 3반(가상) · 2차시 진행 중」 학생 28명. 연구회 선생님들이 화면을 둘러보도록 만든 가상 기록이며 실제 학생 기록이 아니다.
   2026-11-15 탐구 단계가 노동규 선생님 「심플 데이터 탐구」로 바뀌어 답 칸(l1_… 키)과 예시 답도 그 화면에 맞췄다.
   답의 수치는 그 화면의 자료(OWID 2024 스냅샷, 스톡홀름·코펜하겐 공식 보고서, BDG2, 교육용 가정값)에서 가져왔다.
   수준 A(근거·수치를 잘 씀) · B(보통) · C(도움이 필요함)는 예시를 고르게 만들려는 구분일 뿐 채점 기준이 아니다. */
(function () {
  'use strict';
  const L = window.EcoLearning, NZ = window.NZSimple;
  if (!L || !NZ) return;

  // 그 화면이 DATA PASSPORT 에 저장하는 근거 문장(저장 버튼이 만드는 것과 같은 꼴)
  const EV = {
    l1a: ['세계 CO₂ 배출량 1990년 22,732.1 → 2024년 38,598.6 백만 t (1.70배)', '대한민국 CO₂ 배출량 1990년 250.5 → 2024년 583.7 백만 t (2.33배)'],
    l1b: ['세계 1차에너지 중 저탄소 비율 1990년 12.6% → 2024년 18.7%, 화석연료 87.4% → 81.3%', '대한민국 1차에너지 중 저탄소 비율 1990년 14.9% → 2024년 17.5%, 화석연료 85.1% → 82.5%'],
    l2a: city => '총배출량: 스톡홀름 1990→2017 -40.2%, 코펜하겐 2005→2024 -73.0% (첫 판단: ' + city + ', 변수: 총배출량 감소율)',
    l2b: '부문 구성: 스톡홀름(2017) 교통 47%·건물 난방·전기 53% / 코펜하겐(2024) 교통 41%·건물 난방·전기 45%, 친환경 통행 71%',
    l3a: '건물 하루 소비 355 kWh, 태양광 50 kW일 때 발전 380 kWh (수지 +25), 그래도 전력망에서 185 kWh 필요',
    l3b: '가상 도시 Carbon Budget 1000 → 건물 Energy Zero 후 850 (85% 남음). 먼저 줄일 부문: 건물 연료'
  };

  // 답 모음: 칸마다 수준별 예시. 같은 수준 학생끼리 겹치지 않게 수준 안 순서(rank)로 돌려 쓴다. 빈 글은 아직 안 쓴 칸
  const bank = {
    l1_notice: {
      A: ['세계 CO₂ 배출량은 1990년 22,732.1백만 t에서 2024년 38,598.6백만 t로 약 1.70배 늘었다. 2020년 무렵 잠깐 줄었지만 전체로는 계속 늘었다.',
        '1990년 22,732백만 t → 2024년 38,599백만 t로 15,866백만 t 늘어 약 1.7배가 되었다. 2009년과 2020년에 잠깐 줄었어도 추세는 증가다.',
        '대한민국은 1990년 250.5백만 t에서 2024년 583.7백만 t로 약 2.33배 늘었다. 2018년쯤 가장 높고 그 뒤로 조금 줄었다.',
        '세계 배출량이 1990년 22,732.1에서 2024년 38,598.6백만 t로 1.7배 늘었다. 34년 동안 거의 쉬지 않고 올라갔다.'],
      B: ['세계 CO₂ 배출량이 1990년보다 2024년에 훨씬 많다. 약 1.7배 늘었다.', '1990년 22,732백만 t에서 2024년 38,599백만 t로 늘었다.',
        '대한민국 배출량이 1990년보다 2배 넘게 늘었다.', '배출량이 계속 늘었고 2024년이 가장 많다.', '1990년에 비해 2024년 배출량이 1.7배다.'],
      C: ['배출량이 늘었다.', '그래프가 위로 올라간다.', 'CO₂가 많아졌다.', '계속 늘어남']
    },
    l1_compare: {
      A: ['저탄소 에너지 비율은 1990년 12.6%에서 2024년 18.7%로 늘었지만 화석연료가 여전히 81.3%이다. 비율이 조금 줄어도 에너지 사용량 자체가 늘어서 화석연료를 태운 양이 줄지 않았을 것이다.',
        '화석연료 87.4% → 81.3%, 저탄소 12.6% → 18.7%. 저탄소가 6.1%p 늘었지만 에너지의 80% 넘게를 여전히 화석연료에서 얻어서 CO₂가 계속 늘었다.',
        '대한민국은 화석연료 85.1% → 82.5%, 저탄소 14.9% → 17.5%로 구성이 거의 바뀌지 않았다. 그래서 배출량이 2.3배로 늘었다.',
        '저탄소 비율이 18.7%까지 늘었어도 화석연료가 81.3%라서, 쓰는 에너지가 늘면 배출도 같이 는다.'],
      B: ['저탄소 비율은 늘었지만 화석연료가 아직 80%가 넘는다.', '재생에너지가 조금 늘었는데 화석연료가 대부분이라 배출이 줄지 않았다.',
        '저탄소가 12.6%에서 18.7%로 늘었다. 그래도 화석연료가 더 많다.', '화석연료 비율이 조금 줄었지만 여전히 높다.'],
      C: ['재생에너지가 늘어서 문제가 해결되고 있다.', '저탄소가 늘었으니 배출도 곧 줄 것이다.', '화석연료가 많다.', '']
    },
    l1_revise: {
      A: ['CO₂가 1.7배 늘어난 것은 시간이 지나서가 아니라 에너지의 약 81%를 여전히 화석연료에서 얻기 때문이다. 저탄소 비율이 6.1%p 늘었지만 배출을 줄이기에는 부족했다.',
        '처음엔 배출이 늘었다고만 썼는데, 화석연료 비율이 81.3%로 여전히 높아서 늘었다는 원인까지 고쳐 썼다.',
        '에너지 구성 데이터도 화석연료가 80% 넘게 남아 있다는 것을 보여 줘서, 배출이 계속 늘었다는 처음 설명을 유지한다.'],
      B: ['화석연료를 아직 많이 써서 배출이 늘었다고 고쳤다.', '처음 설명과 같다. 에너지 구성도 같은 방향이다.', '저탄소가 늘었지만 화석연료가 많아서라고 덧붙였다.'],
      C: ['그대로 둔다.', '처음이랑 같다.', '']
    },
    l1_claim: {
      A: ['도시는 화석연료에 기대는 에너지 사용을 줄이는 NET ZERO CITY로 바뀌어야 한다.', '도시는 에너지 효율을 높이고 화석연료를 저탄소 에너지로 바꿔야 한다.', '화석연료를 태우는 양 자체를 줄이는 도시가 필요하다.'],
      B: ['화석연료를 덜 써야 한다.', '저탄소 에너지를 늘려야 한다.', '에너지를 아끼고 재생에너지를 늘려야 한다.'],
      C: ['에너지를 아껴야 한다.', '환경을 지켜야 한다.', '']
    },
    l1_reason: {
      A: ['에너지는 보존되지만 화석연료를 태울 때 화학 에너지가 열로 바뀌며 CO₂가 생기고, 다시 쓰기 어려운 형태로 흩어진다. 저탄소 비율이 늘어도 화석연료가 80% 이상이고 사용량도 늘어 배출이 계속 늘었다. 그래서 효율을 높여 사용량을 줄이고 저탄소 에너지로 바꿔야 한다.',
        '에너지 총량은 보존돼도 쓸모 있는 에너지는 줄어든다(효율). 화석연료 연소로 CO₂가 나오므로 화석연료 사용량을 줄이는 도시가 필요하다.',
        '에너지는 사라지지 않지만 연료를 태우면 다시 모으기 어려운 열로 흩어지고 CO₂가 나온다. 화석연료가 81%라서 사용량을 줄여야 배출이 준다.'],
      B: ['화석연료를 태우면 CO₂가 나오기 때문이다.', '화석연료 비율이 높아서 배출이 늘었기 때문이다.', '재생에너지는 CO₂가 안 나와서이다.'],
      C: ['환경이 나빠지니까.', '지구가 더워지니까.', '']
    },
    l2_why1: {
      A: ['코펜하겐은 2005년 248만 t에서 2024년 67만 t로 73.0% 줄었다. 스톡홀름은 1990년 367만 t에서 2017년 219만 t로 40.2% 줄었다. 더 짧은 기간(19년)에 더 많이 줄였다.',
        '감소율로 보면 코펜하겐 -73.0%(2005→2024), 스톡홀름 -40.2%(1990→2017)라 코펜하겐이 더 가까워 보인다.',
        '스톡홀름을 골랐다. 1990년 367만 t에서 2017년 219만 t로 40.2% 줄였고, 27년 동안 꾸준히 줄여서 변화가 안정적으로 보인다.'],
      B: ['코펜하겐이 73%나 줄였다.', '코펜하겐이 더 많이 줄었다.', '최근 배출량이 코펜하겐이 더 적다.', '스톡홀름보다 코펜하겐 감소율이 크다.'],
      C: ['코펜하겐이 더 작다.', '더 많이 줄었다.', '']
    },
    l2_compare: {
      A: ['스톡홀름은 난방 배출을 2000년 184.8만 t에서 2017년 74.2만 t로 60% 줄였지만, 2017년에도 교통이 47%로 거의 절반이다. 코펜하겐은 2024년 건물 난방·전기 45%, 교통 41%이고 친환경 통행 비율이 71%이다.',
        '두 도시 모두 난방·전력을 먼저 바꿨고 교통이 40% 넘게 남아 있다(스톡홀름 47%, 코펜하겐 41%).',
        '스톡홀름 난방 184.8만 t → 74.2만 t로 크게 줄었는데 교통은 47%가 남았다. 남은 과제는 교통이다.'],
      B: ['두 도시 다 교통이 많이 남아 있다.', '스톡홀름은 교통이 절반이다.', '난방은 줄었는데 교통이 많다.'],
      C: ['교통이 많다.', '두 도시가 비슷하다.', '']
    },
    l2_why2: {
      A: ['감소율은 코펜하겐이 크지만 두 도시의 기간(1990–2017 vs 2005–2024)과 산정 범위가 달라 같은 조건에서 비교할 수 없다. 대신 두 도시 모두 난방 전환이 효과가 있었다는 점은 말할 수 있다.',
        '부문을 보니 두 도시 모두 교통이 40% 넘게 남아 있어서 한 가지 지표로 순위를 매기기 어렵다.',
        '스톡홀름의 2017년 이후 자료가 없어서 같은 해로 비교할 수 없다. 판단을 보류한다.'],
      B: ['코펜하겐이 여전히 더 많이 줄였다.', '그래도 코펜하겐이 낫다.', '부문 구성은 비슷하지만 감소율은 코펜하겐이 크다.'],
      C: ['그대로다.', '같다.', '']
    },
    l2_aiwhy: {
      A: ['73% 감소는 데이터와 맞다. 하지만 스톡홀름은 2017년까지의 자료라 기간이 다르고, 코펜하겐은 재생에너지 크레딧 보정 전 합계라 산정 방식도 다르다.',
        '수치는 맞지만 두 도시 모두 교통 배출이 40% 넘게 남아 있어서 더 친환경적이라고 순위를 매기기는 어렵다.',
        '73%는 맞다. 그런데 비교 기간(2005–2024 vs 1990–2017)이 달라서 결론까지 받아들일 수는 없다.'],
      B: ['73%는 맞는데 기간이 다르다.', '숫자가 맞으니 믿는다.', '코펜하겐이 많이 줄인 건 맞다.'],
      C: ['AI가 맞다.', '그대로 믿는다.', '']
    },
    l2_prob: { A: ['2017년 기준 교통(47%)과 건물 난방·전기(53%)가 배출의 대부분이다.', '교통 41%와 건물 난방·전기 45%가 큰 배출원이다.'], B: ['교통 배출이 많다.', '난방과 교통'], C: [''] },
    l2_policy: { A: ['석유 보일러를 지역난방으로 바꾸고 연료를 재생연료로 바꿨을 것이다.', '지역난방과 전력을 바꾸고 자전거·대중교통을 늘렸을 것이다.'], B: ['난방을 바꿨을 것이다.', '자전거 도로를 늘렸을 것이다.'], C: [''] },
    l2_limit: { A: ['난방 배출은 60% 줄었지만 교통은 크게 줄지 않았다. 도시 밖 생산 배출은 이 자료로 알 수 없다. 공식 계획과 대조하니 지역난방·히트펌프 전환이 맞았다.', '교통이 41% 남아 있고, 보정 전·후 회계가 달라 탄소중립 달성으로 볼 수 없다.'], B: ['교통이 남아 있다.', '아직 다 줄이지 못했다.'], C: [''] },
    l2_take: { A: ['지역난방·히트펌프 전환. 스톡홀름 난방 배출이 17년 동안 184.8만 t에서 74.2만 t로 줄었다.', '자전거·대중교통. 코펜하겐 친환경 통행 비율이 2024년 71%이다.'], B: ['지역난방을 가져온다.', '자전거 도로를 만든다.'], C: [''] },
    l3_note: { A: ['50 kW에서 하루 발전 380 kWh가 소비 355 kWh보다 25 kWh 많아 하루 합으로는 Energy Zero가 된다. 그래도 밤과 아침에는 185 kWh를 전력망에서 받아야 한다.', '45 kW에서는 수지가 -13 kWh였고 50 kW에서 처음 +25 kWh가 됐다. 발전이 소비보다 큰 시간은 9시–17시뿐이라 밤에는 전력망이 필요하다.'], B: ['50 kW에서 수지가 0보다 커졌다.', '패널을 키우면 하루 합은 넘는다.'], C: ['낮에 발전이 많다.'] },
    l3_why: { A: ['건물이 Energy Zero가 되어도 줄어드는 것은 전력 부문(200 → 50)뿐이다. 건물 난방 연료(350), 자동차 연료(250), 폐기물(100), 산업·재료(100)는 연료를 태우거나 공정에서 탄소를 내서 850(85%)이 남는다.', '전력 외 부문은 건물 태양광과 상관없이 연료 연소로 CO₂를 낸다. 1000에서 850이 남는다.'], B: ['교통이랑 난방에서 탄소가 나온다.', '전기 말고 다른 데서 나온다.'], C: [''] },
    l3_firstwhy: { A: ['남은 배출 850 가운데 건물 연료가 350으로 41%를 차지해 가장 크다.', '교통 250(29%)을 골랐다. 대중교통 전환은 2차시 코펜하겐 사례(친환경 통행 71%)로 실현성을 확인했다.'], B: ['건물 연료가 가장 크다.', '교통이 많아서.'], C: [''] }
  };
  const choice = {
    l1_pick: { A: '에너지원 구성(화석연료·저탄소 비율)', B: '에너지원 구성(화석연료·저탄소 비율)', C: '인구 수' },
    l1_qa: { A: '직접 확인 가능', B: '직접 확인 가능', C: '직접 확인 가능' },
    l1_qb: { A: '추가 자료 필요', B: '추가 자료 필요', C: '직접 확인 가능' },
    l2_var: { A: '총배출량 감소율', B: '총배출량 감소율', C: '최근 배출량의 크기' },
    l2_chk: { A: '73%라는 수치가 데이터와 맞는가, 두 도시의 비교 기간이 같은가, 두 도시의 산정 범위가 같은가, 부문 구성까지 보았는가', B: '73%라는 수치가 데이터와 맞는가, 두 도시의 비교 기간이 같은가', C: '73%라는 수치가 데이터와 맞는가' },
    l2_ai: { A: '일부만 수용', B: '일부만 수용', C: '그대로 수용' },
    l2_city: { A: '스톡홀름', B: '코펜하겐', C: '코펜하겐' },
    l3_p: { A: '50 kW', B: '50 kW', C: '55 kW' },
    l3_first: { A: '건물 연료', B: '건물 연료', C: '교통' }
  };

  // [이름, 수준, 차시, 지금 단계, 처음 설명 유지(0)/수정(1), 2차시 판단(0 같다·1 바뀌었다·2 보류), 상태(help 손 듦·away 연결 끊김)]
  const plan = [
    ['김하늘', 'A', 2, 4, 1, 2], ['이도윤', 'B', 2, 2, 1, 0], ['박서연', 'A', 3, 1, 1, 2], ['최지호', 'B', 2, 3, 0, 0],
    ['정하린', 'C', 1, 4, 0, 0, 'help'], ['강민준', 'B', 2, 1, 0, 0], ['조유나', 'A', 2, 4, 1, 1], ['윤시우', 'C', 1, 3, 0, 0, 'away'],
    ['장예린', 'B', 2, 3, 1, 0], ['임건우', 'B', 2, 2, 1, 1], ['한소율', 'A', 3, 0, 0, 2], ['오준서', 'C', 2, 0, 0, 0, 'help'],
    ['서다은', 'B', 2, 4, 1, 0], ['신우진', 'C', 1, 4, 0, 0], ['권나연', 'A', 2, 3, 1, 2], ['황태윤', 'B', 2, 1, 0, 0],
    ['안채원', 'B', 2, 2, 0, 1], ['송현우', 'C', 2, 1, 0, 0], ['전지안', 'A', 2, 4, 1, 2], ['홍승민', 'B', 1, 4, 1, 0, 'away'],
    ['유서아', 'B', 2, 3, 1, 0], ['고은호', 'C', 2, 0, 0, 0], ['문가은', 'A', 3, 1, 0, 1], ['양도현', 'B', 2, 2, 1, 0],
    ['손지유', 'C', 1, 2, 0, 0], ['배재윤', 'B', 2, 1, 1, 0], ['백하은', 'B', 2, 3, 0, 0], ['허주원', 'A', 2, 4, 1, 2]
  ];
  const SAME = ['처음 판단과 같다', '판단이 바뀌었다', '판단을 보류한다'];
  const pick = (arr, i) => Array.isArray(arr) ? arr[i % arr.length] : arr;
  const rank = plan.map((p, i) => plan.slice(0, i).filter(q => q[1] === p[1]).length);
  const t0 = Date.now() - 60 * 60000;   // 기록 시각은 한 시간 전부터
  const iso = m => new Date(t0 + m * 60000).toISOString();

  function build(p, i) {
    const [name, tier, lesson, step, revise, judge, status] = p;
    const r = rank[i], korea = tier === 'A' && r % 4 === 2;
    const firstCity = tier === 'A' && r % 3 === 2 ? '스톡홀름' : (tier === 'C' && r % 2 ? '스톡홀름' : '코펜하겐');
    const answers = {}, done = [], active = {}, ev = [];
    const keysOf = (l, s) => L.lessons[l - 1].steps[s].keys;
    const fill = k => {
      if (k === 'l1_keep') { answers[k] = revise ? '수정' : '유지'; return; }
      if (k === 'l1_revise') { const b = bank.l1_revise[tier]; const v = tier === 'A' ? b[revise ? r % 2 : 2] : pick(b, r); if (v) answers[k] = v; return; }
      if (k === 'l2_first') { answers[k] = firstCity; return; }
      if (k === 'l2_same') { answers[k] = SAME[judge]; return; }
      if (k === 'l1_use') { const u = tier === 'C' ? [EV.l1a[0]] : [EV.l1a[korea ? 1 : 0], EV.l1b[korea ? 1 : 0]]; if (tier !== 'C' || r % 2) answers[k] = u.join('\n'); return; }
      if (k === 'l2_use') { answers[k] = [EV.l2a(firstCity), EV.l2b].join('\n'); return; }
      if (choice[k]) { answers[k] = choice[k][tier]; if (k === 'l1_qb' && tier === 'B' && i % 3 === 0) answers[k] = '직접 확인 가능'; return; }
      if (k === 'l1_notice' && korea) { answers[k] = bank.l1_notice.A[2]; return; }
      if (k === 'l1_compare' && korea) { answers[k] = bank.l1_compare.A[2]; return; }
      const b = bank[k]; if (!b) return;
      const v = pick(b[tier], r); if (v) answers[k] = v;
    };
    let minute = 0;
    for (let l = 1; l <= lesson; l++) for (let s = 0; s < 5; s++) {
      if (l === lesson && s > step) break;
      const keys = keysOf(l, s);
      const partial = l === lesson && s === step;
      (partial ? keys.slice(0, Math.max(1, Math.ceil(keys.length / 2))) : keys).forEach(fill);
      const all = keys.every(k => answers[k] && String(answers[k]).trim());
      if (!partial && all) done.push(l + '-' + s);
      const m = partial ? 2 + (i * 7 + s) % 5 : ({ A: 7, B: 6, C: 9 })[tier] + (i * 2 + s * 3 + l) % 5;
      active[l + '-' + s] = m * 60 + (i * 13) % 50;
      minute += m;
    }
    // DATA PASSPORT 근거(저장 버튼을 누른 단계만)
    if (answers.l1_notice && (tier !== 'C' || i % 2)) ev.push({ id: 'l1a', l: 1, text: EV.l1a[korea ? 1 : 0] });
    if (answers.l1_compare && tier !== 'C') ev.push({ id: 'l1b', l: 1, text: EV.l1b[korea ? 1 : 0] });
    if (answers.l2_why1) ev.push({ id: 'l2a', l: 2, text: EV.l2a(firstCity) });
    if (answers.l2_compare) ev.push({ id: 'l2b', l: 2, text: EV.l2b });
    if (answers.l3_note) ev.push({ id: 'l3a', l: 3, text: EV.l3a });
    // 고친 기록: 처음 설명 유지 → 수정, A·B 는 1-1 을 한 번 다듬음
    const revisions = [];
    if (answers.l1_notice && tier !== 'C') {
      const draft = tier === 'A' ? pick(bank.l1_notice.B, r) : '배출량이 늘었다.';
      revisions.push({ time: iso(6), key: 'l1_notice', before: '', after: draft }, { time: iso(9), key: 'l1_notice', before: draft, after: answers.l1_notice });
    }
    if (answers.l1_keep) {
      revisions.push({ time: iso(20), key: 'l1_keep', before: '', after: revise && i % 3 === 0 ? '유지' : answers.l1_keep });
      if (revise && i % 3 === 0) revisions.push({ time: iso(23), key: 'l1_keep', before: '유지', after: '수정' });
    }
    if (answers.l2_same) revisions.push({ time: iso(48), key: 'l2_same', before: '', after: answers.l2_same });
    const nRev = revisions.filter(x => x.before && x.before !== x.after).length;
    const help = ({ A: 1, B: 3, C: 6 })[tier] + i % 3, tb = ({ A: 2, B: 3, C: 5 })[tier];
    const first = {};
    revisions.forEach(x => { if (NZ.choiceKeys.includes(x.key) && !(x.key in first)) first[x.key] = x.before || x.after; });
    const research = {
      v: 1, active, steps: done,
      chars: Object.values(answers).reduce((a, v) => a + String(v).replace(/\s/g, '').length, 0),
      revisions: nRev, revisedKeys: new Set(revisions.filter(x => x.before && x.before !== x.after).map(x => x.key)).size, first,
      evidence: ev.length, evidenceReal: ev.filter(e => !/^l3/.test(e.id)).length, inserted: 0,
      textbookOpen: tb, textbookSec: tb * (40 + i % 30), help, recall: tier === 'C' ? 2 : 1, ai: 0, trials: 0
    };
    const per = [1, 2, 3, 4].map(l => done.filter(k => k.startsWith(l + '-')).length);
    const steps = [0, 0, 0, 0]; steps[lesson - 1] = step;
    for (let l = 1; l < lesson; l++) steps[l - 1] = 4;
    const record = {
      schema: 1, lesson: lesson - 1, steps, done: [lesson > 1, lesson > 2, false, false], answers, revisions, evidence: [],
      simple: { mode: 'coach', ev, out: {}, log: [] },
      events: [], chat: [], seconds: [3000, 3000, 3000, 3000], mode: 'guided', example: true, research
    };
    const places = lesson === 1 ? ['inquiry', 'inquiry', 'step-' + (step + 1)] : ['inquiry', 'step-' + (step + 1), 'researcher', 'inquiry'];
    return {
      no: '103' + String(i + 1).padStart(2, '0'), name, group: (i % 7) + 1, lesson, step, place: places[i % places.length],
      help: status === 'help', away: status === 'away', tier,
      record, progress: { done: done.length, total: 20, lessons: per, finished: record.done, answers: Object.keys(answers).length, evidence: ev.length }
    };
  }
  const students = plan.map(build);

  // 채점(3단계 루브릭, A=상 B=중 C=하): 1차시를 마친 학생의 1-1·1-2 를 선생님이 확정한 상태, 1-5 는 일부만.
  // 1-1 에는 AI 제안이 있고 몇 명은 선생님과 다르다
  const levelFor = (tier, i, el) => ({ A: ['A', 'A', 'B'], B: ['B', 'B', 'C'], C: ['C', 'C', 'B'] })[tier][(i + el) % 3];
  const scores = [], ai = [];
  students.forEach((s, i) => {
    const l1done = s.lesson > 1 || (s.lesson === 1 && s.step === 4);
    if (!l1done || s.away) return;
    scores.push({ no: s.no, el: 'N1-1', level: levelFor(s.tier, i, 0) }, { no: s.no, el: 'N1-2', level: levelFor(s.tier, i, 1),
      note: s.tier === 'A' && i % 2 === 0 ? '저탄소 비율과 화석연료 비율을 수치로 함께 들고, 비율이 늘어도 배출이 줄지 않은 이유를 연결함.' : s.tier === 'C' && i % 2 === 0 ? '「재생에너지가 늘어 해결되고 있다」로 씀. 화석연료 비율을 다시 읽도록 안내.' : '' });
    if (s.tier === 'A' && i < 12) scores.push({ no: s.no, el: 'N1-5', level: 'A' });
    const teacher = levelFor(s.tier, i, 0), off = [3, 14, 23].includes(i);
    const q = String(s.record.answers.l1_notice || '').slice(0, 40);
    const aiLevel = off ? (teacher === 'A' ? 'B' : String.fromCharCode(teacher.charCodeAt(0) - 1)) : teacher;
    ai.push({ no: s.no, el: 'N1-1', level: aiLevel,
      evidence: (q ? '「' + q + '…」 ' : '') + ({ A: '두 연도의 값을 단위와 함께 쓰고 배수와 전체 추세를 설명함', B: '두 연도의 값은 썼지만 변화량이나 추세 설명이 빠짐', C: '수치 없이 「늘었다」고만 씀' })[aiLevel] });
  });

  // AI 정리(답 묶기) 예시: 1차시 2단계 l1_compare
  const by = t => students.filter(s => s.tier === t && s.record.answers.l1_compare).map(s => s.no);
  const notes = [{
    scope: 'answers:answers/l1_compare', n_answers: by('A').length + by('B').length + by('C').length,
    result: { groups: [
      { title: '두 비율을 수치로 함께 읽음', summary: '저탄소 비율이 늘었지만 화석연료가 여전히 80% 넘게 남아 배출이 줄지 않았다고 두 비율을 수치로 함께 든 답입니다.', members: by('A'), example: by('A')[0] },
      { title: '화석연료가 많다고 말로 설명', summary: '저탄소가 늘었어도 화석연료가 대부분이라 배출이 줄지 않았다고 설명했지만 수치는 하나만 들거나 들지 않은 답입니다.', members: by('B'), example: by('B')[0] },
      { title: '비율 증가를 해결로 봄', summary: '재생에너지·저탄소 비율이 늘었으니 문제가 해결되고 있다고 보거나, 화석연료가 많다고만 쓴 답입니다.', members: by('C'), example: by('C')[0] }
    ], unclear: [], teacher_check: '「저탄소가 늘었으니 해결되고 있다」고 본 학생에게 화석연료 비율(81.3%)을 다시 읽게 해 보세요.' }
  }];

  window.ASI_SAMPLES = window.ASI_SAMPLES || {};
  window.ASI_SAMPLES.netzero = {
    title: '예시 수업 · 1학년 3반(가상)', school: '연구회 예시', openLessons: [1, 2, 3],
    scene: '2차시 진행 중', students, scores, ai, notes
  };
})();
