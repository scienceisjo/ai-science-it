/* 선생님 수업 화면 예시 수업(?demo=1) · NET ZERO ECO-CITY
   「1학년 3반(가상) · 2차시 진행 중」 학생 28명. 연구회 선생님들이 화면을 둘러보도록 만든 가상 기록이며 실제 학생 기록이 아니다.
   답의 수치는 앱 자료(data/snapshot.json 2026-09-25 저장본, data/cities.json)에서 가져왔다.
   수준 A(근거·수치를 잘 씀) · B(보통) · C(도움이 필요함)는 예시를 고르게 만들려는 구분일 뿐 채점 기준이 아니다. */
(function () {
  'use strict';
  const L = window.EcoLearning;
  if (!L) return;
  const INIT = L.initialChoices;   // [쓰면 없어짐, 절약 필요 없음, 연료·환경 때문에 절약, 모르겠음]
  const LIT = ['이 자료로 바로 확인할 수 있다', '자료가 더 있어야 판단할 수 있다'];
  const AIC = ['받아들인다', '보류한다 · 판단할 자료가 더 필요하다', '받아들이지 않는다'];
  const SRC = 'Our World in Data(2026-09-25 저장본)';
  const ev = (id, label, value, unit, year) => '[' + id + '] ' + label + ': ' + value + ' ' + unit + ' (' + year + ') · 실제 자료\n출처: ' + SRC;

  // 답 모음: 칸마다 수준별 예시. 같은 수준 학생끼리 겹치지 않게 수준 안 순서(rank)로 돌려 쓴다. 빈 글은 아직 안 쓴 칸
  const bank = {
    l1pattern: {
      A: ['세계 연간 CO₂ 배출량이 1950년 5,930.4백만 t에서 2024년 38,598.6백만 t로 약 6.5배 늘었다. 2000년(25,511.5백만 t) 뒤에도 계속 늘었다.',
        '1950년부터 2024년까지 배출량이 거의 계속 늘었다. 2000년 25,511.5백만 t에서 2024년 38,598.6백만 t로 24년 동안 약 13,087백만 t 늘었다.',
        '1950년 5,930.4백만 t → 2024년 38,598.6백만 t. 70여 년 동안 6배 넘게 늘었고, 중간에 잠깐 줄어든 해가 있어도 전체 흐름은 증가다.',
        '2000년 이후만 봐도 25,511.5백만 t에서 38,598.6백만 t로 1.5배쯤 늘었다.'],
      B: ['1950년보다 2024년 배출량이 훨씬 많다. 2000년 뒤로도 계속 늘었다.', '배출량이 꾸준히 늘었고 1950년에 비해 2024년이 6배 넘게 많다.',
        '옛날보다 지금 CO₂를 훨씬 많이 내보낸다. 2024년이 제일 높다.', '1950년 약 59억 t에서 2024년 약 386억 t으로 늘었다.',
        '계속 늘어나는 모양이다. 특히 2000년 이후 기울기가 더 가파르다.'],
      C: ['배출량이 늘었다.', '그래프가 위로 올라간다.', 'CO₂가 많아졌다.', '계속 늘어남']
    },
    l1energy: {
      A: ['저탄소 비율은 2000년 14.0%에서 2024년 18.7%로 늘었지만 1차에너지 사용량이 110,416TWh에서 176,737TWh로 더 크게 늘었다. 석탄·석유·가스 사용량을 합하면 약 94,467TWh에서 142,421TWh로 늘어 CO₂ 배출도 늘었다.',
        '비율만 보면 저탄소가 늘었지만 전체 에너지 사용량이 1.6배쯤 늘어서 화석연료 사용량 자체도 늘었다. 비율과 양은 다르다.',
        '14.0%→18.7%는 비율이고, 실제로 태운 화석연료 양은 94,467TWh에서 142,421TWh로 늘었다. 배출은 비율이 아니라 태운 양에 따라 정해진다.',
        '전체 에너지 사용량이 110,416TWh에서 176,737TWh로 약 1.6배가 되면서 화석연료 증가량이 저탄소 증가량보다 훨씬 컸다.'],
      B: ['비율은 늘었지만 전체 에너지를 쓰는 양이 늘어서 화석연료도 더 많이 썼기 때문이다.', '에너지 쓰는 양이 늘었기 때문이다. 저탄소 에너지도 늘었지만 화석연료가 더 많이 늘었다.',
        '저탄소가 늘었어도 사람들이 쓰는 에너지가 더 많아져서 화석연료 사용도 늘었다.', '비율이랑 양이 다르다. 비율은 늘었는데 화석연료 양도 늘었다.',
        '에너지를 더 많이 쓰게 돼서 석탄, 석유도 더 썼다.'],
      C: ['저탄소 에너지가 아직 적어서.', '비율이 늘었으니 배출은 줄어야 하는데 이상하다.', '잘 모르겠다. 저탄소가 늘면 줄어야 하는 거 아닌가?', '공장이 많아져서.']
    },
    l1check: {
      A: ['2024년 한국은 전기의 저탄소 비율이 39.9%인데 1차에너지 전체에서는 17.5%이다. 전기는 전체 에너지의 일부라 전기 비율만 보고 에너지 전체가 저탄소로 바뀌었다고 말하면 안 된다.',
        '한국 전기의 저탄소 비율은 39.9%(2024)지만 1차에너지 전체로 보면 17.5%밖에 안 된다. 수송·난방에 쓰는 석유, 가스는 전기에 안 들어가서 차이가 난다.',
        '전기 39.9%, 전체 에너지 17.5%. 전기만 보면 절반 가까이 저탄소 같지만 전체로는 다섯 중 하나도 안 된다.'],
      B: ['전기에서는 저탄소 비율이 높지만 전체 에너지에서는 낮다. 둘은 분모가 다르다.', '전기는 39.9%, 전체 에너지는 17.5%라 두 배 넘게 차이 난다.', '전기에서 비율이 높아도 전체 에너지에서는 낮을 수 있다.'],
      C: ['전기가 더 높다.', '39.9%가 더 크다.', '전기 쪽이 저탄소가 많다.']
    },
    l1literacyWhy: {
      A: ['가는 그래프에서 2024년 전기 저탄소 비율 39.9%를 바로 읽을 수 있다. 나는 비율이 늘어난 것은 보이지만 무엇 때문에 늘었는지는 그래프에 없어서 발전원별 발전량 자료가 더 필요하다.',
        '가는 그래프에 나온 숫자로 확인되는 말이다. 나는 원인(원자력과 재생에너지 중 무엇이 늘었는지)을 말하는데 그건 이 그래프에 없다.',
        '가는 비율 값만 말해서 그래프로 바로 확인된다. 나는 「왜」를 말하고 있어서 발전원별 자료가 있어야 판단할 수 있다.'],
      B: ['나는 원인을 말하는데 그래프에는 원인이 나와 있지 않다.', '가는 숫자를 읽으면 되고 나는 이유를 말해서 다른 자료가 필요하다.', '나는 그래프에 없는 내용이다.'],
      C: ['둘 다 맞는 말 같다.', '가가 맞고 나는 틀렸다.', '잘 모르겠다.']
    },
    l1claim: {
      A: ['화석연료 사용량 자체를 줄여야 탄소 배출이 줄어든다.', '저탄소 비율보다 화석연료를 태우는 양을 줄이는 게 먼저다.', '에너지 사용량이 늘면 저탄소 비율이 올라도 배출은 늘 수 있으므로 사용량을 관리해야 한다.'],
      B: ['탄소 배출을 줄이려면 저탄소 에너지를 늘려야 한다.', '에너지를 덜 쓰고 저탄소 에너지를 늘려야 한다.', '화석연료를 덜 써야 한다.', '재생에너지를 늘려야 한다.'],
      C: ['에너지를 아껴야 한다.', '환경을 지켜야 한다.', '전기를 아껴 쓴다.']
    },
    l1evidence: {
      A: ['배출량과 화석연료 사용량이 둘 다 늘었다.\n\n' + ev('E001', '세계 연간 CO₂ 배출', '5,930.4', '백만 tCO₂/년', 1950) + '\n' + ev('E002', '세계 연간 CO₂ 배출', '38,598.6', '백만 tCO₂/년', 2024),
        '화석연료 사용량이 2000년 94,467TWh에서 2024년 142,421TWh로 늘었다.\n\n' + ev('E003', '세계 화석연료 사용량', '94,467', 'TWh', 2000) + '\n' + ev('E004', '세계 화석연료 사용량', '142,421', 'TWh', 2024),
        '배출량이 1950년보다 6.5배 늘었다.\n\n' + ev('E001', '세계 연간 CO₂ 배출', '5,930.4', '백만 tCO₂/년', 1950) + '\n' + ev('E002', '세계 연간 CO₂ 배출', '38,598.6', '백만 tCO₂/년', 2024)],
      B: ['1950년 5,930백만 t, 2024년 38,598백만 t', '화석연료 2000년 94,467TWh, 2024년 142,421TWh', '세계 CO₂ 배출 1950년 5930.4, 2024년 38598.6', '저탄소 비율 14.0%에서 18.7%'],
      C: ['그래프가 올라갔다.', '배출량 그래프', '']
    },
    l1reason: {
      A: ['에너지는 보존되지만 쓸모 있는 형태로 쓰려면 연료를 계속 써야 하고, 화석연료를 태우면 CO₂가 나온다. 그래서 사용량이 늘면 비율이 좋아져도 배출이 늘 수 있다.',
        '배출량은 태운 연료의 양에 따라 정해지는데 화석연료 사용량이 늘었으니까 저탄소 비율이 올라도 배출이 늘었다.',
        '에너지 총량이 늘어나는 속도가 저탄소 에너지가 느는 속도보다 빨라서 화석연료로 쓰는 양도 커졌다.'],
      B: ['화석연료를 많이 쓰면 CO₂가 많이 나오니까.', '화석연료를 태우면 CO₂가 나오는데 그걸 더 많이 썼다.', '저탄소만 늘리면 안 되고 전체 사용량을 줄여야 해서.'],
      C: ['', '그래야 환경이 좋아지니까.', '']
    },
    l1next: {
      A: ['한국의 발전원별 발전량(원자력·재생·석탄)을 2020~2024년으로 보고 싶다. 전기 저탄소 비율이 늘어난 까닭을 확인하려고.', '전기 말고 수송·난방에 쓰는 에너지의 저탄소 비율도 보고 싶다.', '2020년에 배출량이 잠깐 줄었는지 연도별로 확인하고 싶다.'],
      B: ['다른 나라 자료도 보고 싶다.', '한국 배출량 변화도 보고 싶다.', '재생에너지가 얼마나 늘었는지.'],
      C: ['', '없음', '']
    },
    // 2차시: 첫 판단(l2initial)과 바뀐 점(l2revision)은 같은 순서끼리 짝
    l2initial: {
      A: ['스톡홀름의 지역난방 전환이 배출을 많이 줄였을 것 같다.', '코펜하겐처럼 자전거 도로를 넓히는 정책이 효과가 클 것 같다.', '건물 난방을 바꾸는 정책이 오래 효과를 낼 것 같다.'],
      B: ['코펜하겐이 배출량이 가장 적어서 유망해 보인다.', '대중교통을 늘린 도시가 좋아 보인다.', '스톡홀름이 많이 줄인 것 같다.'],
      C: ['자전거를 많이 타는 도시.', '나무를 많이 심는 도시', '잘 모르겠다.']
    },
    l2revision: {
      A: ['처음에는 스톡홀름 난방 정책이 답이라고 생각했는데, 교통 배출이 크게 남은 것을 보고 난방과 교통을 함께 봐야 한다고 고쳤다.',
        '처음 판단을 유지한다. 2017년 교통 배출이 세 부문 가운데 가장 커서 자전거·대중교통 정책이 맞다고 더 확신하게 됐다.',
        '처음엔 난방 정책이 오래 간다고 생각했지만 난방은 이미 많이 줄었고 지금은 교통이 더 크다. 교통으로 바꿨다.'],
      B: ['처음엔 배출량이 적은 도시만 봤는데 줄어든 양을 봐야 한다는 걸 알았다.', '처음 판단을 유지한다. 교통이 가장 크니 대중교통이 맞다.', '처음 판단을 유지한다. 스톡홀름이 많이 줄였다.'],
      C: ['', '', '']
    },
    l2trend: {
      A: ['스톡홀름 총배출은 1990년 3,669,000 tCO₂e에서 2017년 2,193,000 tCO₂e로 약 40% 줄었다. 하지만 이 그래프만으로 정책 때문이라고 단정할 수는 없다.',
        '1990년 3,669,000에서 2017년 2,193,000 tCO₂e로 줄었다(약 40%). 같은 기간 인구 변화는 그래프에 없어서 1인당으로는 모른다.',
        '총배출이 1,476,000 tCO₂e 줄었다. 줄어든 건 맞지만 어떤 정책 때문인지는 부문별 자료를 봐야 안다.'],
      B: ['스톡홀름 배출이 계속 줄었다. 정책 효과인 것 같다.', '1990년보다 2017년이 많이 줄었다.', '꾸준히 줄어드는 그래프다.'],
      C: ['줄었다.', '내려간다.', '많이 줄었음']
    },
    l2infer: {
      A: ['2017년 부문별로 교통이 1,036,000 tCO₂e로 가장 크고, 난방은 2000년 1,848,000에서 742,000으로 크게 줄었다. 다음에는 교통 배출을 줄이는 정책이 먼저다.',
        '난방 배출은 2000년 1,848,000에서 2017년 742,000 tCO₂e로 60%쯤 줄었는데 교통은 1,036,000으로 가장 크다. 다음 정책은 교통이다.',
        '도로 교통만 863,000 tCO₂e(2017)라 교통 배출 대부분이 도로에서 나온다. 자동차 이용을 줄이는 정책이 필요하다.'],
      B: ['교통 배출이 많으니 대중교통을 늘려야 한다.', '난방은 많이 줄었고 이제 교통이 문제다.', '교통이 제일 커서 교통부터 줄여야 한다.'],
      C: ['난방.', '교통', '전기']
    },
    l2ai: {
      A: ['스톡홀름은 2017년, 코펜하겐은 2024년 값이라 연도가 다르고 도시 크기(인구)도 다르다. 총량이 적다고 가장 친환경적이라고 할 수 없어서 받아들이지 않는다.',
        'AI가 두 도시의 연도(2017, 2024)가 다른 걸 무시했다. 인구도 달라서 1인당 배출로 비교해야 한다.',
        '총량만 비교했다. 도시 크기가 다르면 총량은 당연히 다르다.'],
      B: ['연도가 달라서 비교하기 어렵다.', '자료가 더 있어야 할 것 같다.', '연도랑 인구가 다르다.'],
      C: ['배출량이 가장 적으니 맞다.', 'AI가 말했으니까 맞다.', '모르겠다.']
    },
    l2problem: { A: ['스톡홀름의 교통 배출(2017년 1,036,000 tCO₂e)이 세 부문 가운데 가장 크다.', '교통 배출이 1,036,000 tCO₂e로 난방(742,000)보다 많다.', '도로 교통 배출 863,000 tCO₂e'], B: ['교통 배출이 크다.', '자동차 배출', '교통'], C: [''] },
    l2evidence: { A: ['총배출 추이(1990~2017)와 2017년 부문별 배출, 도로 교통 배출량 863,000 tCO₂e(2017)', '2017년 부문별 배출: 교통 1,036,000, 난방 742,000 tCO₂e', '난방 2000년 1,848,000 → 2017년 742,000 tCO₂e, 총배출 추이'], B: ['부문별 배출 자료', '총배출 그래프', '교통 배출 값'], C: [''] },
    l2policy: { A: ['대중교통·자전거 이용 확대', '대중교통 확대', '자전거 도로 확대'], B: ['대중교통', '버스 늘리기', '자전거'], C: [''] },
    l2transfer: { A: ['우리 도시에도 대중교통 전환을 가져오되, 통행 거리와 외곽 배차를 먼저 확인해야 한다.', '자전거 도로. 학교와 역 사이 거리가 짧아야 효과가 있다.', '버스 전용 차로. 버스가 자주 다녀야 사람들이 차 대신 탄다.'], B: ['자전거 도로를 늘린다.', '버스를 늘린다.', '대중교통 요금을 내린다.'], C: [''] },
    l3prediction: { A: ['태양광은 발전량을, 단열은 소비량을 바꿀 것이다.', '태양광 패널은 낮 발전량을 늘리고 단열은 난방에 드는 에너지를 줄인다.'], B: ['태양광이 발전량을 늘린다.', '단열하면 에너지를 덜 쓴다.'], C: [''] }
  };
  // 처음 생각 → 지금 생각에 맞춘 「바뀐 점」(l1revision)
  function revText(tier, firstI, nowI, r) {
    if (tier === 'C') return firstI === nowI ? ['그대로이다.', '처음이랑 같다.'][r % 2] : '처음엔 몰랐는데 연료 때문에 아껴야 한다.';
    if (firstI === nowI) return tier === 'A' ? '처음 생각을 유지한다. 비율이 좋아져도 사용량이 늘면 배출이 는다는 걸 수치로 확인해서 까닭이 더 분명해졌다.' : '처음 생각과 같다. 연료를 태우는 양이 문제라는 점을 더 알게 됐다.';
    if (firstI === 0) return tier === 'A' ? '처음에는 에너지가 쓰면 없어진다고 생각했는데, 에너지는 보존되고 열로 흩어져 쓸모가 줄어드는 것이었다. 아껴야 하는 까닭을 연료 사용과 배출로 고쳤다.' : '처음엔 에너지가 없어진다고 생각했는데 보존된다는 걸 알았다. 그래도 연료를 써야 하니까 아껴야 한다.';
    return tier === 'A' ? '처음엔 잘 몰랐는데, 에너지는 보존돼도 연료를 태워야 쓸 수 있고 그때 CO₂가 나와서 아껴야 한다고 정리했다.' : '처음엔 몰랐는데 화석연료 때문에 절약해야 한다는 걸 알았다.';
  }
  const choice = {
    l1literacyA: { A: LIT[0], B: LIT[0], C: LIT[1] },
    l1literacyB: { A: LIT[1], B: LIT[1], C: LIT[0] },
    l2aiChoice: { A: AIC[2], B: AIC[1], C: AIC[0] },
    l3balancePrediction: { A: '아니요, 밤에는 전기를 사 와야 해요.', B: '네, 하루 합계가 같으니 사 올 필요가 없어요.', C: '아직 잘 모르겠어요.' }
  };

  // [이름, 수준, 차시, 지금 단계, 처음 생각, 지금 생각, 상태(help 손 듦·away 연결 끊김)]
  const plan = [
    ['김하늘', 'A', 2, 4, 0, 2], ['이도윤', 'B', 2, 2, 3, 2], ['박서연', 'A', 3, 1, 2, 2], ['최지호', 'B', 2, 3, 0, 2],
    ['정하린', 'C', 1, 4, 0, 0, 'help'], ['강민준', 'B', 2, 1, 0, 0], ['조유나', 'A', 2, 4, 3, 2], ['윤시우', 'C', 1, 3, 3, 3, 'away'],
    ['장예린', 'B', 2, 3, 2, 2], ['임건우', 'B', 2, 2, 0, 2], ['한소율', 'A', 3, 0, 2, 2], ['오준서', 'C', 2, 0, 1, 1, 'help'],
    ['서다은', 'B', 2, 4, 3, 2], ['신우진', 'C', 1, 4, 0, 0], ['권나연', 'A', 2, 3, 0, 2], ['황태윤', 'B', 2, 1, 2, 2],
    ['안채원', 'B', 2, 2, 0, 0], ['송현우', 'C', 2, 1, 3, 3], ['전지안', 'A', 2, 4, 2, 2], ['홍승민', 'B', 1, 4, 3, 2, 'away'],
    ['유서아', 'B', 2, 3, 0, 2], ['고은호', 'C', 2, 0, 0, 0], ['문가은', 'A', 3, 1, 0, 2], ['양도현', 'B', 2, 2, 2, 2],
    ['손지유', 'C', 1, 2, 3, 3], ['배재윤', 'B', 2, 1, 0, 2], ['백하은', 'B', 2, 3, 3, 3], ['허주원', 'A', 2, 4, 2, 2]
  ];
  const pick = (arr, i) => Array.isArray(arr) ? arr[i % arr.length] : arr;
  const rank = plan.map((p, i) => plan.slice(0, i).filter(q => q[1] === p[1]).length);
  const own = v => String(v || '').replace(/\[(E\d{3})\][^\n]*\n출처:[^\n]*/g, '').replace(/\s/g, '');
  const t0 = Date.now() - 60 * 60000;   // 기록 시각은 한 시간 전부터
  const iso = m => new Date(t0 + m * 60000).toISOString();

  function build(p, i) {
    const [name, tier, lesson, step, firstI, nowI, status] = p;
    const r = rank[i];
    const answers = {}, done = [], active = {};
    const keysOf = (l, s) => L.lessons[l - 1].steps[s].keys;
    const fill = k => {
      if (k === 'l1initial') { answers[k] = INIT[nowI]; return; }
      if (choice[k]) { answers[k] = choice[k][tier]; if (k === 'l1literacyB' && tier === 'B' && i % 3 === 0) answers[k] = LIT[0]; return; }
      if (k === 'l1revision') { answers[k] = revText(tier, firstI, nowI, r); return; }
      const b = bank[k]; if (!b) return;
      const v = pick(b[tier], r); if (v) answers[k] = v;
    };
    let minute = 0;
    for (let l = 1; l <= lesson; l++) for (let s = 0; s < 5; s++) {
      if (l === lesson && s > step) break;
      const keys = keysOf(l, s).concat(l === 2 && s === 3 ? ['l2aiChoice'] : []);
      const partial = l === lesson && s === step;
      (partial ? keys.slice(0, Math.max(1, Math.ceil(keys.length / 2))) : keys).forEach(fill);
      const all = keysOf(l, s).every(k => answers[k] && String(answers[k]).trim());
      if (!partial && all) done.push(l + '-' + s);
      const m = partial ? 2 + (i * 7 + s) % 5 : ({ A: 7, B: 6, C: 9 })[tier] + (i * 2 + s * 3 + l) % 5;
      active[l + '-' + s] = m * 60 + (i * 13) % 50;
      minute += m;
    }
    // 고친 기록: 처음 생각을 바꿨으면 그 기록, A·B 는 l1energy 를 한 번 다듬음
    const revisions = [{ time: iso(2), key: 'l1initial', before: '', after: INIT[firstI] }];
    if (firstI !== nowI) revisions.push({ time: iso(40), key: 'l1initial', before: INIT[firstI], after: INIT[nowI] });
    if (answers.l1energy && tier !== 'C') {
      const draft = tier === 'A' ? pick(bank.l1energy.B, r) : '전체 에너지를 쓰는 양이 늘어서.';
      revisions.push({ time: iso(18), key: 'l1energy', before: '', after: draft }, { time: iso(24), key: 'l1energy', before: draft, after: answers.l1energy });
    }
    if (answers.l2revision && tier === 'A') revisions.push({ time: iso(70), key: 'l2infer', before: '난방을 더 줄이는 정책.', after: answers.l2infer });
    const evidence = [];
    const addEv = (label, value, unit, year, lessonNo) => evidence.push({ id: 'E' + String(evidence.length + 1).padStart(3, '0'), label, value, unit, year, kind: '실제 자료', source: SRC, lesson: lessonNo, time: iso(10 + evidence.length * 3) });
    if (tier !== 'C' || i % 2) addEv('세계 연간 CO₂ 배출', 5930.4, '백만 tCO₂/년', 1950, 1);
    if (tier !== 'C') addEv('세계 연간 CO₂ 배출', 38598.6, '백만 tCO₂/년', 2024, 1);
    if (tier === 'A') { addEv('세계 화석연료 사용량', 94467, 'TWh', 2000, 1); addEv('세계 화석연료 사용량', 142421, 'TWh', 2024, 1); }
    if (lesson >= 2 && tier !== 'C') addEv('스톡홀름 총배출', 2193000, 'tCO₂e/년', 2017, 2);
    const nRev = revisions.filter(r => r.before && r.before !== r.after).length;
    const help = ({ A: 1, B: 3, C: 6 })[tier] + i % 3, tb = ({ A: 2, B: 3, C: 5 })[tier];
    const research = {
      v: 1, active, steps: done,
      chars: Object.values(answers).reduce((a, v) => a + own(v).length, 0),
      revisions: nRev, revisedKeys: new Set(revisions.filter(r => r.before && r.before !== r.after).map(r => r.key)).size,
      first: { l1initial: INIT[firstI] },
      evidence: evidence.length, evidenceReal: evidence.length, inserted: tier === 'A' ? 2 : tier === 'B' ? 1 : 0,
      textbookOpen: tb, textbookSec: tb * (40 + i % 30), help, recall: tier === 'C' ? 2 : 1, ai: 0, trials: lesson >= 3 ? 2 : 0
    };
    const per = [1, 2, 3, 4].map(l => done.filter(k => k.startsWith(l + '-')).length);
    const steps = [0, 0, 0, 0]; steps[lesson - 1] = step;
    for (let l = 1; l < lesson; l++) steps[l - 1] = 4;
    const record = {
      schema: 1, lesson: lesson - 1, steps, done: [lesson > 1, lesson > 2, false, false], answers, revisions, evidence,
      events: [], chat: [], seconds: [3000, 3000, 3000, 3000], mode: 'guided', example: true, research
    };
    const places = lesson === 1 ? ['inquiry', 'inquiry', 'step-' + (step + 1)] : ['inquiry', 'step-' + (step + 1), 'researcher', 'inquiry'];
    return {
      no: '103' + String(i + 1).padStart(2, '0'), name, group: (i % 7) + 1, lesson, step, place: places[i % places.length],
      help: status === 'help', away: status === 'away', tier,
      record, progress: { done: done.length, total: 20, lessons: per, finished: record.done, answers: Object.keys(answers).length, evidence: evidence.length }
    };
  }
  const students = plan.map(build);

  // 채점: 1차시를 마친 학생의 ①② 를 선생님이 확정한 상태, ③ 은 일부만. ① 에는 AI 제안이 있고 몇 명은 선생님과 다르다
  const levelFor = (tier, i, el) => ({ A: ['A', 'A', 'B'], B: ['B', 'C', 'B'], C: ['D', 'E', 'D'] })[tier][(i + el) % 3];
  const scores = [], ai = [];
  students.forEach((s, i) => {
    const l1done = s.lesson > 1 || (s.lesson === 1 && s.step === 4);
    if (!l1done || s.away) return;
    scores.push({ no: s.no, el: 'N1', level: levelFor(s.tier, i, 0) }, { no: s.no, el: 'N2', level: levelFor(s.tier, i, 1),
      note: s.tier === 'A' && i % 2 === 0 ? '수치 두 개를 주장과 연결함. 처음 생각을 고친 까닭이 분명함.' : s.tier === 'C' && i % 2 === 0 ? '수치 없이 「늘었다」만 씀. 연도·단위를 다시 확인하도록 안내.' : '' });
    if (s.tier === 'A' && i < 12) scores.push({ no: s.no, el: 'N3', level: 'B' });
    const teacher = levelFor(s.tier, i, 0), off = [3, 14, 23].includes(i);
    const q = String(s.record.answers.l1energy || s.record.answers.l1pattern || '').slice(0, 40);
    ai.push({ no: s.no, el: 'N1', level: off ? (teacher === 'A' ? 'B' : String.fromCharCode(teacher.charCodeAt(0) - 1)) : teacher,
      evidence: (q ? '「' + q + '…」 ' : '') + ({ A: '대상·연도·단위를 갖춘 수치로 비율과 사용량을 구분함', B: '비율과 사용량을 구분하지만 수치가 빠짐', C: '수치 없이 변화의 인상만 씀', D: '변화 방향만 씀', E: '자료와 맞지 않는 설명' })[off ? 'B' : teacher] });
  });

  // AI 정리(답 묶기) 예시: 1-3 l1energy
  const by = t => students.filter(s => s.tier === t && s.record.answers.l1energy).map(s => s.no);
  const notes = [{
    scope: 'answers:answers/l1energy', n_answers: by('A').length + by('B').length + by('C').length,
    result: { groups: [
      { title: '사용량 증가를 수치로 설명', summary: '저탄소 비율은 늘었지만 1차에너지 사용량과 화석연료 사용량이 더 크게 늘었다고 수치를 들어 설명한 답입니다.', members: by('A'), example: by('A')[0] },
      { title: '사용량 증가를 말로 설명', summary: '전체 에너지 사용량이 늘어서 화석연료도 더 썼다고 설명했지만 수치는 들지 않은 답입니다.', members: by('B'), example: by('B')[0] },
      { title: '비율과 양을 나누지 않음', summary: '저탄소 에너지가 적어서, 공장이 늘어서처럼 자료 밖의 까닭을 들거나 비율이 늘면 배출이 줄어야 한다고 본 답입니다.', members: by('C'), example: by('C')[0] }
    ], unclear: [], teacher_check: '「비율이 늘면 배출이 준다」고 본 학생에게 비율의 분모가 무엇인지 다시 물어보세요.' }
  }];

  window.ASI_SAMPLES = window.ASI_SAMPLES || {};
  window.ASI_SAMPLES.netzero = {
    title: '예시 수업 · 1학년 3반(가상)', school: '연구회 예시', openLessons: [1, 2, 3],
    scene: '2차시 진행 중', students, scores, ai, notes
  };
})();
