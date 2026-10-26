(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CityCouncilModel = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const VERSION = 'council-20261011-v1';
  const BASE = Object.freeze({ building: 350, transport: 250, electricity: 200, waste: 100, materials: 100 });
  const DEFAULT = Object.freeze({ solar: 0, retrofit: 0, mobility: 'none', flex: false });
  const CONTEXTS = Object.freeze({
    standard: { name: '기본 가정', sun: 1, uptake: .7, rebound: .1 },
    cloudy: { name: '발전 조건 감소', sun: .6, uptake: .7, rebound: .1 },
    participation: { name: '추가 접근자의 전환율 감소', sun: 1, uptake: .35, rebound: .1 },
    rebound: { name: '절감분 재사용 증가', sun: 1, uptake: .7, rebound: .35 }
  });
  const MOBILITY = Object.freeze({
    none: { name: '기존 노선 유지', cost: 0, center: 70, outer: 25, embodied: 0 },
    express: { name: '중심 급행망', cost: 2, center: 90, outer: 35, embodied: 20 },
    local: { name: '외곽 연결망', cost: 3, center: 85, outer: 80, embodied: 28 }
  });
  const LABELS = { solar: '태양광', retrofit: '단열', mobility: '교통망', flex: '시간대 조정' };
  const clone = x => JSON.parse(JSON.stringify(x));
  const round = x => Math.round(x * 1000) / 1000;
  function settings(p) {
    if (!p || Object.keys(p).length !== 4 || ![0, 1, 2].includes(p.solar) || ![0, 1, 2].includes(p.retrofit) || !Object.hasOwn(MOBILITY, p.mobility) || typeof p.flex !== 'boolean') throw Error('설계 조건 형식 오류');
    return { solar: p.solar, retrofit: p.retrofit, mobility: p.mobility, flex: p.flex };
  }
  function calculate(input, context = 'standard') {
    const p = settings(input);
    if (!Object.hasOwn(CONTEXTS, context)) throw Error('비교 조건 형식 오류');
    const c = CONTEXTS[context], m = MOBILITY[p.mobility];
    const access = .6 * m.center + .4 * m.outer;
    // Hypothetical equal trip activity per person: only newly accessible residents can shift.
    const transportReduction = (access - 52) / 100 * c.uptake;
    const sectors = {
      building: round(BASE.building * (1 - .2 * p.retrofit * (1 - c.rebound))),
      transport: round(BASE.transport * (1 - transportReduction)),
      electricity: round(BASE.electricity * (1 - .2 * p.solar * c.sun)),
      waste: BASE.waste, materials: BASE.materials
    };
    const annual = round(Object.values(sectors).reduce((a, b) => a + b, 0));
    const embodied = 18 * p.solar + 24 * p.retrofit + m.embodied + (p.flex ? 5 : 0);
    const cost = 2 * p.solar + 2 * p.retrofit + m.cost + (p.flex ? 1 : 0);
    return { version: VERSION, settings: p, context, sectors, annual, saved: round(1000 - annual), embodied,
      firstYear: round(annual + embodied), cost, feasible: cost <= 8, remaining: 8 - cost,
      access: round(access), center: m.center, outer: m.outer, gap: Math.abs(m.center - m.outer),
      // Evening peak excludes solar, and demand shifting is not annual energy conservation.
      peak: round(100 * (1 - .1 * p.retrofit) * (p.flex ? .85 : 1)) };
  }
  function compare(a, b) {
    const left = calculate(a.settings, a.context), right = calculate(b.settings, b.context);
    const changed = Object.keys(DEFAULT).filter(k => left.settings[k] !== right.settings[k]).map(k => LABELS[k]);
    const ca = CONTEXTS[a.context], cb = CONTEXTS[b.context];
    for (const [k, label] of [['sun', '발전 조건'], ['uptake', '전환율'], ['rebound', '절감분 재사용']]) if (ca[k] !== cb[k]) changed.push(label);
    return { changed, controlled: changed.length === 1, identical: changed.length === 0,
      annual: round(right.annual - left.annual), access: round(right.access - left.access), cost: right.cost - left.cost,
      firstYear: round(right.firstYear - left.firstYear), peak: round(right.peak - left.peak) };
  }
  function comparisonReference(trials, index) {
    const ref = trials[index]?.referenceTrial;
    return Number.isInteger(ref) && ref >= 0 && ref < index ? ref : null;
  }
  function referenceLabel(trials, index) {
    if (index === 0) return '최초 예상 (비교 기준 없음)';
    const ref = comparisonReference(trials, index);
    return ref === null ? '기준 미기록 / 추가 비교 필요' : `실험 ${ref + 1}`;
  }
  function isSensitivityComparison(a, b) {
    if (!a || !b) return false;
    const ca = CONTEXTS[a.context], cb = CONTEXTS[b.context];
    return !!ca && !!cb && Object.keys(DEFAULT).every(k => a.settings[k] === b.settings[k]) &&
      ca.uptake === cb.uptake && Number(ca.sun !== cb.sun) + Number(ca.rebound !== cb.rebound) === 1;
  }
  function hasSensitivityTrial(e) {
    return e.trials.some((t, i) => {
      const ref = comparisonReference(e.trials, i);
      return ref !== null && isSensitivityComparison(e.trials[ref], t);
    });
  }
  const EPISODES = [
    { title: '첫 예산, 어느 쪽부터?', speaker: '서하 · 기록관 연구원',
      story: '도시 설계 초안에 “태양광만 늘리면 해결된다”는 문장이 남아 있어. 오늘 모은 자료로 이 주장을 검토했지? 첫 예산 2점을 어디에 쓸지 제안해 줘. 발전을 바꾸는 일과 소비를 줄이는 일은 같은 효과일까?',
      surprise: '예산 담당자가 묻는다. “운영 중 배출만 보셨나요? 패널이나 단열재를 만드는 과정도 있습니다.” 운영 배출과 첫해에 한 번 생기는 배출을 나누어 보자.',
      options: [['solar', '태양광부터', '공급 측 변화 · 자원 2점'], ['retrofit', '단열부터', '수요 측 변화 · 자원 2점']],
      context: 'standard', time: '정리 시간 중 약 5분', next: '다음에는 실제 도시의 정책이 누구에게 닿는지 조사한다.' },
    { title: '도시의 평균 밖에 있는 사람', speaker: '민준 · 도시 정책 연구원',
      story: '실제 도시의 사례 카드를 읽은 주민들이 새 노선을 제안했어. 중심부를 빠르게 잇는 급행망과 외곽까지 연결하는 노선이 있어. 이전 회의에서 배정한 자원도 초안에 반영돼 있어. 아직 건설 전이니, 우리 도시에 가져올 조건을 따져 보자.',
      surprise: '외곽 주민이 묻는다. “평균 접근성이 좋아진다는데, 저도 병원과 학교에 갈 수 있나요?” 중심과 외곽을 나누어 보니 평균만으로는 보이지 않던 차이가 드러난다.',
      options: [['express', '중심 급행망', '자원 2점 · 중심 90%, 외곽 35%'], ['local', '외곽 연결망', '자원 3점 · 중심 85%, 외곽 80%'], ['hold', '지금은 유지', '추가 자원 0점 · 추가 감축 없음']],
      context: 'participation', time: '정리 시간 중 약 5분', next: '다음에는 설계의 결과가 이용 조건에 따라 달라지는지 실험한다.' },
    { title: '같은 설계, 다른 조건', speaker: '지우 · 건물 에너지 연구원',
      story: '건물 실험에서 발전량과 소비량을 비교했지? 운영팀이 설계 조건을 다시 확인하자고 해. 남은 예산으로 공급, 수요, 시간대 중 무엇을 바꿀까? 한 가지 조건만 바꾸었을 때도 판단이 유지되는지 확인하자.',
      surprise: '운영팀의 추가 질문이다. “같은 설비라도 발전 조건이 나빠지거나, 절약한 에너지를 다시 쓰면요?” 이번에는 다른 정책을 동시에 바꾸지 않고 결과를 비교한다.',
      options: [['solar', '태양광 1단계 추가', '자원 2점 · 최대 2단계'], ['retrofit', '단열 1단계 추가', '자원 2점 · 최대 2단계'], ['flex', '사용 시간대 조정', '자원 1점 · 저녁 최대수요 완화'], ['hold', '여유 자원 유지', '추가 자원 0점']],
      context: 'cloudy', time: '정리 시간 중 약 5분', next: '마지막에는 같은 예산의 대안을 비교하고, 도시 모형이 표현하지 못한 것까지 설명한다.' },
    { title: '완벽한 도시 대신, 설명할 수 있는 도시', speaker: '하린 · 도시 설계자',
      story: '설계 발표 날이야. 주민들은 멋진 3D 그림뿐 아니라 선택의 이유를 듣고 싶어 해. 누적된 설계와 대안을 같은 조건에서 비교하자. 줄어든 배출, 남은 문제, 더 확인할 자료를 모두 발표해 줘.',
      surprise: '발표장에 새 의뢰가 도착했다. “우리 마을은 외곽에 사는 주민이 70%이고 대중교통 이용 시간도 다릅니다. 이 설계를 그대로 써도 될까요?” 지금 모형은 중심 60%, 외곽 40%인 도시만 계산한다.',
      options: [['keep', '누적 설계로 검토 시작', '앞선 판단을 출발점으로 두 대안 비교']],
      context: 'standard', time: '탄소 설계 12분 안에 통합', next: '최종 조건은 도시계획·프롬프트·3D 검증에 반영한다. 이 모형만으로 넷제로 달성을 선언하지 않는다.' }
  ];
  function optionPlan(base, lesson, id) {
    const p = settings(base);
    if (!EPISODES[lesson]?.options.some(o => o[0] === id)) throw Error('선택 항목 오류');
    if (lesson === 0 || lesson === 2) {
      if (id === 'solar' || id === 'retrofit') p[id]++;
      if (id === 'flex') { if (p.flex) throw Error('이미 시간대를 조정하고 있습니다.'); p.flex = true; }
    } else if (lesson === 1 && id !== 'hold') p.mobility = id;
    settings(p);
    if (!calculate(p).feasible) throw Error('자원 8점을 초과합니다. 다른 선택이나 유지를 검토하세요.');
    return p;
  }
  function ending(p) {
    const r = calculate(p), risks = [], benefits = [], clouds = calculate(p, 'cloudy'), low = calculate(p, 'participation'), rebound = calculate(p, 'rebound');
    if (r.saved > 0) benefits.push(`가정한 운영 배출은 연간 1,000에서 ${r.annual} tCO2e로 줄었다.`);
    if (r.outer > 25) benefits.push(`외곽의 서비스 접근성은 25%에서 ${r.outer}%로 높아졌다.`);
    if (r.peak < 100) benefits.push(`저녁 최대수요 지수는 100에서 ${r.peak}로 낮아졌다. 정전 확률을 계산한 값은 아니다.`);
    if (r.outer < 80) risks.push(`외곽 접근성은 ${r.outer}%에 머문다. 평균 ${r.access}%와 별도로 확인해야 한다.`);
    if (clouds.annual !== r.annual) risks.push(`발전 조건을 60%로 낮추면 운영 배출은 ${clouds.annual} tCO2e/년이다.`);
    if (low.annual !== r.annual) risks.push(`추가 접근자의 교통수단 전환율을 70%에서 35%로 바꾸면 ${low.annual} tCO2e/년이다.`);
    if (rebound.annual !== r.annual) risks.push(`절감분 재사용률을 10%에서 35%로 바꾸면 운영 배출은 ${rebound.annual} tCO2e/년이다.`);
    risks.push(`설비·노선 건설의 일회성 배출 ${r.embodied} tCO2e는 운영 배출과 별도다. 폐기와 교체는 계산하지 않았다.`);
    risks.push(`폐기물·산업 재료의 운영 배출 200 tCO2e/년이 남는다. GDP·고용·요금·생물다양성은 이 모형으로 판단할 수 없다.`);
    return { title: p.mobility === 'express' ? '중심의 변화, 외곽의 숙제' : p.mobility === 'local' ? '닿는 길을 넓힌 도시' : p.retrofit > p.solar ? '덜 쓰는 도시의 다음 질문' : p.solar ? '발전과 생활 사이' : '결정을 미룬 도시의 질문', benefits, risks, result: r };
  }
  function emptyRecord() { return { schema: 1, version: VERSION, episodes: [null, null, null, null] }; }
  function baseFor(record, lesson) {
    for (let i = lesson - 1; i >= 0; i--) if (record.episodes[i]?.final) return { settings: clone(record.episodes[i].final.settings), from: i + 1 };
    return { settings: clone(DEFAULT), from: 0 };
  }
  const text = (x, max = 3000) => typeof x === 'string' && x.length <= max;
  function validateRecord(r) {
    if (r == null) return true;
    try {
      if (r.schema !== 1 || r.version !== VERSION || !Array.isArray(r.episodes) || r.episodes.length !== 4 || JSON.stringify(r).length > 300000) return false;
      for (const [i, e] of r.episodes.entries()) {
        if (e == null) continue;
        if (!e || e.lesson !== i || !text(e.opened, 40) || !Number.isFinite(Date.parse(e.opened)) || !Array.isArray(e.trials) || e.trials.length > 12) return false;
        settings(e.base.settings);
        if (!Number.isInteger(e.base.from) || e.base.from < 0 || e.base.from > i) return false;
        const draft = e.draft;
        if (!draft || !text(draft.choice, 30) || !text(draft.prediction) || !text(draft.reason) || !text(draft.limit) || !text(draft.transfer) || !text(draft.evidenceNote) || !text(draft.trialPrediction) || ![0,1,2,3,4,5].includes(draft.confidence) || ![0,1,2,3,4,5].includes(draft.afterConfidence) || !Array.isArray(draft.evidence) || draft.evidence.length > 20 || draft.evidence.some(id => !text(id, 100))) return false;
        if (draft.plan) settings(draft.plan);
        if (draft.finalTrial !== undefined && (!Number.isInteger(draft.finalTrial) || draft.finalTrial < 0 || draft.finalTrial >= e.trials.length)) return false;
        if (draft.referenceTrial != null && (!Number.isInteger(draft.referenceTrial) || draft.referenceTrial < 0 || draft.referenceTrial >= e.trials.length)) return false;
        if (draft.context && !Object.hasOwn(CONTEXTS, draft.context)) return false;
        if (e.initial) {
          const a = e.initial;
          if (!text(a.at, 40) || !Number.isFinite(Date.parse(a.at)) || !text(a.prediction) || !a.prediction.trim() || !text(a.evidenceNote) || !a.evidenceNote.trim() || ![1,2,3,4,5].includes(a.confidence) || !EPISODES[i].options.some(o => o[0] === a.choice) || !Array.isArray(a.evidence) || a.evidence.length > 20 || a.evidence.some(x => !text(x.id,100) || !text(x.label,500) || !text(x.source,2000) || !text(x.kind,100) || !text(x.unit,100) || !text(x.year,100) || !Number.isFinite(x.value))) return false;
          const expected = optionPlan(e.base.settings, i, a.choice);
          if (JSON.stringify(settings(a.settings)) !== JSON.stringify(expected) || !calculate(a.settings).feasible) return false;
          if (!draft.plan || !e.trials.length || e.trials[0].context !== 'standard' || JSON.stringify(settings(e.trials[0].settings)) !== JSON.stringify(expected) || e.trials[0].prediction !== a.prediction) return false;
        }
        for (const [j, t] of e.trials.entries()) {
          if (!e.initial || !text(t.at,40) || !Number.isFinite(Date.parse(t.at)) || !text(t.prediction) || !t.prediction.trim() || !calculate(t.settings,t.context).feasible) return false;
          if (t.referenceTrial != null && comparisonReference(e.trials, j) === null) return false;
        }
        if (e.final) {
          const f = e.final;
          if (!e.initial || !text(f.at,40) || !Number.isFinite(Date.parse(f.at)) || !text(f.reason) || !f.reason.trim() || !text(f.limit) || !f.limit.trim() || !text(f.transfer) || ![1,2,3,4,5].includes(f.confidence) || !Number.isInteger(f.trial) || f.trial < 0 || f.trial >= e.trials.length || JSON.stringify(settings(f.settings)) !== JSON.stringify(settings(e.trials[f.trial].settings))) return false;
          if (f.comparisonVersion !== undefined && f.comparisonVersion !== 1) return false;
          // Preserve legacy finals as records; only new finals certify the stricter comparison task.
          if (i === 2 && (f.comparisonVersion === 1 ? !hasSensitivityTrial(e) : !e.trials.some((t,j)=>j && compare(e.trials[0],t).controlled))) return false;
          if (i === 3 && (!f.transfer.trim() || !e.trials.some(t=>t.context==='standard'&&Object.keys(DEFAULT).some(k=>t.settings[k]!==e.initial.settings[k])))) return false;
        }
      }
      return true;
    } catch { return false; }
  }
  function isContinuation(previous, next) {
    if (!validateRecord(next)) return false;
    if (!previous) return true;
    if (!next || !validateRecord(previous)) return false;
    return previous.episodes.every((e,i) => {
      if (!e) return true;
      const t=next.episodes[i];if (!t) return false;
      if (i === 2 && !e.final && t.final && !hasSensitivityTrial(t)) return false;
      if (Number.isInteger(e.draft.referenceTrial)) {
        const added = t.trials[e.trials.length];
        if ((added ? added.referenceTrial : t.draft.referenceTrial) !== e.draft.referenceTrial) return false;
      }
      for (const key of ['base','opened']) if (JSON.stringify(e[key]) !== JSON.stringify(t[key])) return false;
      for (const key of ['initial','final']) if (e[key] && JSON.stringify(e[key]) !== JSON.stringify(t[key])) return false;
      return e.trials.every((trial,j)=>JSON.stringify(trial)===JSON.stringify(t.trials[j]));
    });
  }
  function csvCell(v) {
    let s = String(v ?? '');
    if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function csv(record, anonymousId) {
    if (!validateRecord(record)) throw Error('회의 기록 형식 오류');
    const rows = [['anonymous_id','model_version','lesson','phase','time','choice','prediction','reason','limit','transfer','confidence','evidence_ids','context','solar','retrofit','mobility','flex','resource_points','annual_tCO2e','embodied_once_tCO2e','first_year_tCO2e','access_percent','outer_percent','evening_peak_index','reference_trial','reference_status','sensitivity_comparison']];
    const add = (lesson, phase, x, p, context, initial, episode, trialIndex = null) => {
      const r = calculate(p, context);
      const ref = trialIndex === null ? null : comparisonReference(episode.trials, trialIndex);
      rows.push([anonymousId, VERSION, lesson + 1, phase, x.at, initial.choice, x.prediction || '', x.reason || x.evidenceNote || '', x.limit || '', x.transfer || '', x.confidence ?? '', initial.evidence.map(v=>v.id).join('|'), context,p.solar,p.retrofit,p.mobility,p.flex,r.cost,r.annual,r.embodied,r.firstYear,r.access,r.outer,r.peak,
        ref === null ? '' : ref + 1, trialIndex === null ? '해당 없음' : referenceLabel(episode.trials, trialIndex),
        lesson !== 2 || phase === 'initial' || trialIndex === 0 ? '해당 없음' :
          (phase === 'final' ? hasSensitivityTrial(episode) : ref !== null && isSensitivityComparison(episode.trials[ref], x)) ? '조건 민감도 비교 기록 있음' : '추가 비교 필요']);
    };
    record?.episodes.forEach((e,i) => { if (!e?.initial) return; add(i,'initial',e.initial,e.initial.settings,'standard',e.initial,e); e.trials.forEach((t,j)=>add(i,'trial_'+(j+1),t,t.settings,t.context,e.initial,e,j)); if(e.final)add(i,'final',e.final,e.final.settings,'standard',e.initial,e); });
    return '\ufeff' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
  }
  return { VERSION, BASE, DEFAULT, CONTEXTS, MOBILITY, LABELS, EPISODES, calculate, compare, comparisonReference, referenceLabel, isSensitivityComparison, hasSensitivityTrial, optionPlan, ending, emptyRecord, baseFor, validateRecord, isContinuation, csv, clone };
});
