(function () {
  'use strict';
  const M = window.CityCouncilModel, E = M.EPISODES;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n = x => Number(x).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
  const now = () => new Date().toISOString();
  let bridge, host, selectedA = 0, selectedB = -1;
  function record() {
    const s = bridge.state();
    if (!s.council) s.council = M.emptyRecord();
    if (!M.validateRecord(s.council)) throw Error('회의 기록의 형식이나 모형 버전이 다릅니다. 전체 기록을 먼저 내보내 교사에게 전달하세요. 원본은 유지했습니다.');
    return s.council;
  }
  function episode() {
    const l = bridge.state().lesson, r = record();
    if (!r.episodes[l]) {
      r.episodes[l] = { lesson: l, opened: now(), base: M.baseFor(r,l), initial: null, final: null, trials: [],
        draft: { choice: '', prediction: '', evidenceNote: '', evidence: [], confidence: 0, afterConfidence: 0,
          trialPrediction: '', referenceTrial: null, reason: '', limit: '', transfer: '', context: 'standard', plan: null } };
      bridge.save();
    }
    return r.episodes[l];
  }
  const labelPlan = p => `태양광 ${p.solar}단계 · 단열 ${p.retrofit}단계 · ${M.MOBILITY[p.mobility].name} · 시간대 조정 ${p.flex?'있음':'없음'}`;
  const field = (key, label, value, rows=2) => `<label class="cq-field">${label}<textarea data-cq-draft="${key}" rows="${rows}" maxlength="3000">${esc(value)}</textarea></label>`;
  const confidence = (key, value, label) => `<label class="cq-field">${label}<select data-cq-draft="${key}"><option value="0" ${value===0?'selected':''}>선택하세요</option>${[1,2,3,4,5].map(i=>`<option value="${i}" ${i===value?'selected':''}>${i} · ${['매우 낮음','낮음','보통','높음','매우 높음'][i-1]}</option>`).join('')}</select></label>`;
  const button = (action, text, icon='arrow-right', primary=false) => `<button type="button" data-cq-action="${action}" class="${primary?'primary':''}"><i data-lucide="${icon}"></i>${text}</button>`;
  function assumptions() {
    return `<details class="cq-assumptions"><summary>모형 설명서 · 모든 수치와 식은 수업용 가정</summary>
      <p>실제 도시를 예측하는 모형이 아닙니다. 실제 자료는 선택 이유를 생각할 근거이며, 아래 감축률을 검증한 자료가 아닙니다. 자원 8점은 돈이나 GDP가 아닙니다.</p>
      <p>모든 회의는 건설 전의 설계 단계입니다. 앞선 자원 배정을 수정할 수 있으며, 이미 설치한 설비를 철거하는 상황은 계산하지 않습니다. 건설 배출은 최종 초안의 설비를 한 번 만드는 것으로 계산합니다.</p>
      <p>자원 제약은 이 모형의 네 가지 선택에만 적용합니다. 도시 전체 예산을 계산한 것이 아니며, 녹지·복지·기존 기반시설 등이 무료라는 뜻은 아닙니다.</p>
      <p><b>단위 읽기:</b> tCO2e는 여러 온실가스의 영향을 이산화탄소의 양으로 환산한 톤 단위입니다. 서비스 접근성은 주민 중 대표 필수 시설(학교 또는 병원)에 대중교통으로 30분 이내 도달할 수 있다고 가정한 비율입니다. 실제 교통망을 계산한 값이 아닙니다. 저녁 최대수요 지수는 가장 수요가 큰 저녁 시간의 기준을 100으로 놓은 값으로, 하루 전력량과 다릅니다.</p>
      <div class="cq-table-wrap"><table><caption>기준: 운영 배출 1,000 tCO2e/년. 중심 주민 60%, 외곽 40%.</caption><thead><tr><th>조건</th><th>가정한 계산</th><th>자원 / 일회성 배출</th></tr></thead><tbody>
      <tr><td>태양광 1단계</td><td>전력 200 × 20% × 발전 조건(기본 1)을 감축. 최대 2단계.</td><td>2점 / 18 tCO2e</td></tr>
      <tr><td>단열 1단계</td><td>건물 직접 연료 350 × 20% × (1 − 절감분 재사용률 10%)을 감축. 최대 2단계.</td><td>2점 / 24 tCO2e</td></tr>
      <tr><td>교통망</td><td>접근성 = 중심 비율 × 0.6 + 외곽 비율 × 0.4. 교통 250 × (접근성 − 52)% × 전환율 70%를 감축.</td><td>급행 2점 / 20 tCO2e<br>외곽 3점 / 28 tCO2e</td></tr>
      <tr><td>시간대 조정</td><td>저녁 최대수요 지수에 0.85를 곱함. 연간 에너지·배출은 줄이지 않음.</td><td>1점 / 5 tCO2e</td></tr>
      </tbody></table></div>
      <p>기존 접근성은 중심 70%, 외곽 25%입니다. 새로 접근 가능해진 주민 중 일부가 승용차에서 전환한다고 가정하며, 모두의 통행량·거리·배출은 같다고 단순화했습니다. 접근성은 실제 이용률과 다릅니다. 토지이용·배차간격·장애·요금 장벽은 계산하지 않습니다.</p>
      <p>저녁 최대수요 = 100 × (1 − 단열 단계 × 0.1) × (시간대 조정 시 0.85). 저녁에는 태양광 효과를 0으로 가정했습니다. 발전량과 수요를 시간별로 맞춘 전력망 모형이나 정전 예측이 아닙니다.</p>
      <p>폐기물 100 + 산업·재료 100 tCO2e/년은 그대로 남습니다. 전력 배출과 직접 연료 배출을 분리합니다. 건설 배출은 이 운영 기준 밖에서 한 번만 추가하며, 첫해 합계 = 운영 배출 1년분 + 건설 배출입니다. 수명·교체·폐기·흡수량·누출·실제 화폐 비용은 제외했습니다.</p>
      <p>민감도 비교: 발전 조건 1→0.6, 전환율 70→35%, 절감분 재사용률 10→35%. 이는 불확실성을 살피기 위한 가정이며 발생 확률이나 신뢰구간이 아닙니다.</p>
      <p>관계 검토 자료: <a href="https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-8/" target="_blank" rel="noopener">IPCC 도시 시스템</a>, <a href="https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-5/" target="_blank" rel="noopener">수요·서비스</a>. 이 자료가 위 숫자를 제공하거나 우리 앱의 효과를 입증한 것은 아닙니다.</p>
      <p class="cq-version">모형 ${M.VERSION}</p></details>`;
  }
  function initialView(e, l) {
    const d = e.draft;
    const available = bridge.state().evidence.filter(x=>x.lesson<=l+1).slice(-100);
    return `<section class="cq-section"><h2>1. 먼저 예상하기</h2><p>이번 판단의 근거와 예상 결과를 먼저 남깁니다. 선택 자체에는 정답 점수가 없습니다.</p>
      <fieldset class="cq-options"><legend>이번 회의의 제안</legend>${E[l].options.map(([id,title,desc])=>{
        let error='';try{M.optionPlan(e.base.settings,l,id)}catch(err){error=err.message}
        return `<label><input type="radio" name="cq-choice" data-cq-draft="choice" value="${id}" ${d.choice===id?'checked':''} ${error?'disabled':''}><span><b>${title}</b><small>${esc(error||desc)}</small></span></label>`;
      }).join('')}</fieldset>
      ${field('prediction','어떤 결과가 생길까? 줄어드는 것과 그대로 남는 것을 예상해 보세요.',d.prediction)}
      <details open><summary>DATA PASSPORT 근거 연결</summary>${available.length?`<div class="cq-evidence">${available.map(x=>`<label><input type="checkbox" data-cq-evidence="${esc(x.id)}" ${d.evidence.includes(x.id)?'checked':''}><span>${esc(x.label)} · ${esc(n(x.value))} ${esc(x.unit)} (${esc(x.year)})<small>${esc(x.kind)} · ${esc(x.source)}</small></span></label>`).join('')}</div>`:'<p>아직 담은 수치가 없습니다. 탐구로 돌아가 근거를 담거나, 아래에 현재 아는 내용과 더 필요한 자료를 구분해 적으세요.</p>'}
      ${field('evidenceNote','왜 이 선택인가? 실제 자료로 말할 수 있는 것과 아직 가정인 것을 구분하세요.',d.evidenceNote)}</details>
      ${confidence('confidence',d.confidence,'지금 설명에 대한 확신 정도')}
      ${button('reveal','예상을 남기고 주민 의견 듣기','message-circle',true)}</section>`;
  }
  function outcome(r, title, lesson=3) {
    return `<section class="cq-result"><h3>${esc(title)}</h3><p class="cq-condition">${esc(M.CONTEXTS[r.context].name)} · ${esc(labelPlan(r.settings))}</p><dl>
      <div><dt>운영 배출</dt><dd>${n(r.annual)} <small>tCO2e/년</small></dd></div><div><dt>자원</dt><dd>${r.cost} <small>/ 8점</small></dd></div>
      ${lesson>=1?`<div><dt>서비스 접근성</dt><dd>${n(r.access)}<small>% · 중심 ${r.center}% / 외곽 ${r.outer}%</small></dd></div>`:''}
      ${lesson>=2?`<div><dt>저녁 최대수요</dt><dd>${n(r.peak)}<small>지수 · 기준 100</small></dd></div>`:''}</dl>
      <p>건설 배출: ${r.embodied} tCO2e(한 번) · 첫해 합계: ${n(r.firstYear)} tCO2e</p></section>`;
  }
  function plansForm(p, lesson) {
    return `<div class="cq-controls">${['solar','retrofit'].map(k=>`<label>${M.LABELS[k]}<select data-cq-plan="${k}">${[0,1,2].map(v=>`<option value="${v}" ${p[k]===v?'selected':''}>${v}단계 · ${v*2}점</option>`).join('')}</select></label>`).join('')}
      ${lesson>=1?`<label>교통망<select data-cq-plan="mobility">${Object.entries(M.MOBILITY).map(([k,v])=>`<option value="${k}" ${p.mobility===k?'selected':''}>${v.name} · ${v.cost}점</option>`).join('')}</select></label>`:''}
      ${lesson>=2?`<label class="cq-checkbox"><input type="checkbox" data-cq-plan="flex" ${p.flex?'checked':''}>시간대 조정 · 1점</label>`:''}</div>`;
  }
  function predictionReference(e) {
    const ref=e.draft.referenceTrial;
    if(Number.isInteger(ref))return `예상 기준 A: 실험 ${ref+1} (작성 시작 시 고정)`;
    if(e.draft.trialPrediction.trim())return '기준 미기록 / 추가 비교 필요';
    return `예상 기준 A: 실험 ${Math.min(selectedA,e.trials.length-1)+1} (작성 전)`;
  }
  function referenceNotice(e) {
    const missing=e.trials.some((t,i)=>i>0&&M.comparisonReference(e.trials,i)===null);
    return missing?'<p class="cq-muted">기준 미기록 / 추가 비교 필요: 해당 예상의 비교 기준 A는 알 수 없습니다. 원래 예상과 확정 기록은 그대로 보존합니다.</p>':'';
  }
  function sensitivityNotice(e) {
    if(e.lesson!==2||!e.initial)return '';
    return `<p class="cq-muted">${M.hasSensitivityTrial(e)?'조건 민감도 비교 기록 있음':'추가 비교 필요: 기준 A를 기록하고, 정책을 고정한 채 발전 조건 또는 절감분 재사용률 하나만 바꾼 실험이 필요합니다.'}</p>`;
  }
  function comparison(e) {
    if (e.trials.length < 2) return '<p class="cq-muted">비교 실험을 한 번 기록하면 A와 B의 차이가 표시됩니다.</p>';
    const bi=selectedB<0?e.trials.length-1:Math.min(selectedB,e.trials.length-1), ai=Math.min(selectedA,e.trials.length-1);
    const a=e.trials[ai],b=e.trials[bi],diff=M.compare(a,b), ar=M.calculate(a.settings,a.context),br=M.calculate(b.settings,b.context);
    const options=(s)=>e.trials.map((t,i)=>`<option value="${i}" ${i===s?'selected':''}>${i+1} · ${esc(M.CONTEXTS[t.context].name)} · ${n(M.calculate(t.settings,t.context).annual)} tCO2e/년</option>`).join('');
    return `<section class="cq-section"><h3>현재 선택한 두 결과 비교</h3><div class="cq-controls"><label>A<select data-cq-compare="a">${options(ai)}</select></label><label>B<select data-cq-compare="b">${options(bi)}</select></label></div>
      <p class="cq-comparison-kind">${diff.identical?'같은 조건입니다.':diff.controlled?'한 변인 비교 · 다른 조건을 고정한 모형 안의 비교입니다.':'여러 변인 비교 · 차이를 특정 한 정책의 효과로 해석할 수 없습니다.'}<br>변경: ${esc(diff.changed.join(', ')||'없음')}</p>
      <figure class="cq-bars"><figcaption>운영 배출 · 가로축 0~1,000 tCO2e/년</figcaption>${[[ar,'A'],[br,'B']].map(([r,name])=>`<div><span>${name}</span><div class="cq-track"><div style="width:${r.annual/10}%"></div></div><b>${n(r.annual)}</b></div>`).join('')}<p>B − A: ${diff.annual>0?'+':''}${n(diff.annual)} tCO2e/년</p></figure>
      <div class="cq-table-wrap"><table><thead><tr><th>관점</th><th>A</th><th>B</th></tr></thead><tbody>${[
        ['자원(점)',ar.cost,br.cost],['접근성(%)',ar.access,br.access],['외곽 접근성(%)',ar.outer,br.outer],['저녁 최대수요(지수)',ar.peak,br.peak],['건설 배출(tCO2e, 일회)',ar.embodied,br.embodied],['첫해 합계(tCO2e)',ar.firstYear,br.firstYear]
      ].map(row=>`<tr><th>${row[0]}</th><td>${n(row[1])}</td><td>${n(row[2])}</td></tr>`).join('')}</tbody></table></div>
      <details><summary>A·B의 설정과 실험 전 예상</summary><p>A: ${esc(labelPlan(a.settings))}<br>예상 당시 기준: ${esc(M.referenceLabel(e.trials,ai))}<br>${esc(a.prediction)}</p><p>B: ${esc(labelPlan(b.settings))}<br>예상 당시 기준: ${esc(M.referenceLabel(e.trials,bi))}<br>${esc(b.prediction)}</p></details></section>`;
  }
  function experimentView(e,l) {
    const d=e.draft,p=d.plan;
    return `<section class="cq-section"><h2>2. 결과를 의심하고 비교하기</h2><blockquote><b>${E[l].speaker}</b><p>${E[l].surprise}</p></blockquote>
      <details><summary>처음 예상 보기 · 수정되지 않는 원기록</summary><p>${esc(e.initial.prediction)}</p><p>${esc(e.initial.evidenceNote)}</p><p>확신 ${e.initial.confidence}/5</p></details>
      ${outcome(M.calculate(e.initial.settings),'처음 선택의 모형 결과',l)}
      <h3>비교 실험대</h3><p>${l===0?'관심이 있다면 한 조건을 더 비교하세요.':l===1?'접근 가능해진 사람이 모두 교통수단을 바꾸는 것은 아닙니다. 전환율 조건을 비교해 보세요.':l===2?'정책은 그대로 두고 발전 조건 또는 절감분 재사용률 하나만 바꿔 비교하세요.':'기본 가정 아래 자원 8점 이내의 다른 정책 조합을 적어도 하나 비교하세요.'}</p>
      ${plansForm(p,l)}<div class="cq-controls"><label>비교 조건<select data-cq-draft="context">${Object.entries(M.CONTEXTS).filter(([id])=>l>=2||id==='standard'||l===1&&id==='participation').map(([id,c])=>`<option value="${id}" ${d.context===id?'selected':''}>${c.name}</option>`).join('')}</select></label></div>
      <p id="cq-cost" role="status">현재 설정 자원 ${M.calculate(p).cost}/8점</p>
      <p id="cq-prediction-reference" role="status">${esc(predictionReference(e))}</p>
      ${field('trialPrediction','실험 전 예상 · A에 비해 무엇이 달라질까? 이유는?',d.trialPrediction)}
      <div class="cq-actions">${button('trial','예상 저장 후 계산','flask-conical',true)}${button('restore','처음 선택의 설정으로','rotate-ccw')}</div><p class="cq-muted">실험 기록 ${e.trials.length}/12. 예산 초과 조합은 기록하지 않습니다.</p>
      ${comparison(e)}
      <h2>3. 판단을 유지하거나 수정하기</h2><label class="cq-field">최종 제안으로 삼을 실험<select data-cq-final-trial>${e.trials.map((t,i)=>`<option value="${i}" ${i===(d.finalTrial??0)?'selected':''}>실험 ${i+1} · ${esc(labelPlan(t.settings))}</option>`).join('')}</select></label><p>최종 설계는 모두 <b>기본 가정</b>에서 다시 계산합니다. 다른 조건에서의 결과는 실험 기록에 남습니다.</p>
      ${field('reason','유지 / 수정한 이유 · 비교한 수치와 이득을 얻거나 놓치는 사람을 포함하세요.',d.reason)}
      ${field('limit','이 모형으로 아직 말할 수 없는 것과 더 필요한 자료는?',d.limit)}
      ${l===3?field('transfer','새 마을에 적용하기 · 외곽 주민 70%인 마을에 같은 결론을 써도 될까요? 바꿀 가정과 추가 자료를 쓰세요.',d.transfer,3):''}
      ${confidence('afterConfidence',d.afterConfidence,'검토 후 설명에 대한 확신 정도')}
      ${button('finish',l===3?'최종 제안과 조건부 엔딩 남기기':'판단을 확정하고 다음 질문 남기기','check',true)}
      <p class="cq-muted">확정한 기록은 덮어쓰지 않습니다. 확신이 낮아지거나 처음 선택을 유지해도 감점하지 않습니다.</p></section>`;
  }
  function finalView(e,l) {
    const f=e.final, end=M.ending(f.settings);
    const changed=M.compare({settings:e.initial.settings,context:'standard'},{settings:f.settings,context:'standard'}).changed;
    return `<section class="cq-section"><p class="cq-kicker">${l===3?'조건부 엔딩':'회의 기록 완료'} · 순위나 승패 없음</p><h2>${esc(end.title)}</h2>
      ${outcome(end.result,'확정한 제안 · 기본 가정',l)}
      <h3>모형 안에서 기대한 변화</h3><ul>${end.benefits.map(t=>`<li>${esc(t)}</li>`).join('')||'<li>이번에는 기존 조건을 유지했습니다.</li>'}</ul>
      <h3>함께 남은 과제</h3><ul>${end.risks.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
      <p><b>처음 선택과의 차이:</b> ${esc(changed.join(', ')||'유지')}</p><blockquote><b>나의 설명</b><p>${esc(f.reason)}</p><p>${esc(f.limit)}</p>${f.transfer?`<p>${esc(f.transfer)}</p>`:''}</blockquote>
      <p>${E[l].next}</p>${l===3?'<p class="cq-muted">확정한 제안이 최종 탄소 설계·프롬프트 초안·3D 검증표의 기준으로 연결됩니다. 기존 단순 모형의 감축량과 더하지 않습니다. 이미 작성한 도시계획과 프롬프트 문장은 덮어쓰지 않으니, 조건이 일치하는지 직접 검토하세요.</p>':''}
      <div class="cq-actions">${button('learning','현재 탐구로 돌아가기','book-open',true)}${button('csv','회의 CSV','download')}${button('json','전체 기록 JSON','download')}</div>
      <details><summary>처음 예상과 비교 실험 다시 보기</summary><p>${esc(e.initial.prediction)}</p>${comparison(e)}</details></section>`;
  }
  function render(target) {
    host=target||host;if(!host)return;
    try {
      const l=bridge.state().lesson,e=episode(),q=E[l];
      const image=l===0?'assets/story/story-01-eco-invitation-800.webp':bridge.image(l);
      host.innerHTML=`<div class="cq-root"><div class="cq-topline"><span>${l+1}차시 · 시민 설계회의 · ${q.time}</span><a href="assets/council/teacher.html" target="_blank" rel="noopener">교사 연구 안내</a></div>
        <figure class="cq-scene"><img src="${esc(image)}" alt="도시 조사팀의 이야기 장면"><figcaption>가상의 이야기 장면 · 계산 결과의 증거가 아님</figcaption></figure>
        <h1 tabindex="-1" id="cq-heading">${q.title}</h1><p class="cq-speaker">${q.speaker} · 사전 작성된 대사</p><p>${q.story}</p>
        <div class="cq-base"><b>${e.base.from?e.base.from+'차시에서 가져온 제안':'이전 회의 확정 기록 없음 · 정책 미적용 기준에서 시작'}</b><p>${esc(labelPlan(e.base.settings))}</p><p>미배정 자원 ${8-M.calculate(e.base.settings).cost}/8점 · 건설 전 초안. 실제 통계와 구분한 가상도시입니다.</p></div>
        <nav class="cq-phases" aria-label="회의 진행"><span ${!e.initial?'aria-current="step"':''}>1 예상</span><span ${e.initial&&!e.final?'aria-current="step"':''}>2 비교·검토</span><span ${e.final?'aria-current="step"':''}>3 제안</span></nav>
      ${assumptions()}${referenceNotice(e)}${sensitivityNotice(e)}${e.final?finalView(e,l):e.initial?experimentView(e,l):initialView(e,l)}
        <p id="cq-error" role="alert" tabindex="-1"></p><footer class="cq-footer">${button('learning','탐구 기록으로','book-open')}${button('map','맵으로 돌아가기','map')}${button('json','전체 기록 내보내기','download')}</footer></div>`;
      bridge.icons();
    } catch(err) { host.innerHTML='<p role="alert">'+esc(err.message)+'</p>'+button('json','원본 기록 내보내기','download');bridge.icons(); }
  }
  function error(message){const el=host.querySelector('#cq-error');if(el){el.textContent=message;el.focus()}}
  function requireText(value,message) { if(!value?.trim())throw Error(message); }
  function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function action(id) {
    if(id==='json'){bridge.export();return}
    if(id==='map'){bridge.map();return}
    if(id==='learning'){bridge.learning();return}
    try {
      const e=episode(),l=e.lesson,d=e.draft;
      if(id==='csv'){download(M.csv(record(),bridge.state().id),'text/csv;charset=utf-8','city-council.csv');return}
      if(e.final) return;
      if(id==='reveal') {
        if(e.initial)return;
        if(!d.choice)throw Error('먼저 이번 회의의 제안을 골라 주세요.');
        const p=M.optionPlan(e.base.settings,l,d.choice);
        requireText(d.prediction,'먼저 예상 결과를 적어 주세요.');requireText(d.evidenceNote,'선택 이유와 아직 확인할 자료를 적어 주세요.');
        if(!d.confidence)throw Error('지금 설명에 대한 확신 정도를 선택해 주세요.');
        const ids=new Set(d.evidence);
        e.initial={at:now(),settings:p,choice:d.choice,prediction:d.prediction.trim(),evidenceNote:d.evidenceNote.trim(),confidence:d.confidence,
          evidence:bridge.state().evidence.filter(x=>ids.has(x.id)).map(x=>({id:String(x.id),label:String(x.label),value:x.value,unit:String(x.unit),year:String(x.year),source:String(x.source),kind:String(x.kind)}))};
        e.trials.push({at:now(),settings:M.clone(p),context:'standard',prediction:d.prediction.trim()});
        d.plan=M.clone(p);d.context=E[l].context;d.finalTrial=0;
        bridge.log('council_prediction_locked',{councilLesson:l+1,modelVersion:M.VERSION});
      }
      if(id==='restore'){d.plan=M.clone(e.initial.settings);d.context='standard';}
      if(id==='trial') {
        if(!e.initial)throw Error('먼저 예상을 기록하세요.');
        if(e.trials.length>=12)throw Error('이 회의의 실험 기록은 12개까지입니다. 기존 비교 기록으로 판단을 정리하세요.');
        requireText(d.trialPrediction,'계산하기 전에 이번 실험의 예상과 이유를 적어 주세요.');
        const r=M.calculate(d.plan,d.context);if(!r.feasible)throw Error('자원 8점을 넘었습니다. 조건을 조정하세요.');
        e.trials.push({at:now(),settings:M.clone(d.plan),context:d.context,prediction:d.trialPrediction.trim(),referenceTrial:d.referenceTrial??null});d.trialPrediction='';d.referenceTrial=null;d.finalTrial=e.trials.length-1;selectedB=-1;
        bridge.log('council_trial',{councilLesson:l+1,trial:e.trials.length,modelVersion:M.VERSION});
      }
      if(id==='finish') {
        requireText(d.reason,'유지하거나 수정한 이유를 적어 주세요.');requireText(d.limit,'모형의 한계와 추가로 필요한 자료를 적어 주세요.');
        if(!d.afterConfidence)throw Error('검토 후 설명에 대한 확신 정도를 선택해 주세요.');
        if(l===2&&!M.hasSensitivityTrial(e))throw Error('3차시는 예상 기준 A를 기록하고, 정책은 고정한 채 발전 조건 또는 절감분 재사용률 하나만 바꾼 실험을 기록해 주세요. 기준 미기록 실험은 추가 비교가 필요합니다.');
        if(l===3){requireText(d.transfer,'새 마을에 적용할 때 바꿀 가정과 필요한 자료를 적어 주세요.');if(!e.trials.some(t=>t.context==='standard'&&Object.keys(M.DEFAULT).some(k=>t.settings[k]!==e.initial.settings[k])))throw Error('4차시는 기본 가정에서 다른 정책 조합 하나를 계산하여 비교해 주세요.');}
        const idx=d.finalTrial??0,t=e.trials[idx];if(!t)throw Error('최종 제안으로 삼을 실험을 선택해 주세요.');
        e.final={at:now(),settings:M.clone(t.settings),trial:idx,reason:d.reason.trim(),limit:d.limit.trim(),transfer:d.transfer.trim(),confidence:d.afterConfidence,comparisonVersion:1};
        bridge.log('council_completed',{councilLesson:l+1,modelVersion:M.VERSION});
      }
      bridge.save();render();if(id==='reveal'||id==='finish')host.querySelector('#cq-heading').focus();
    } catch(err){error(err.message)}
  }
  function bind() {
    document.addEventListener('click',event=>{const el=event.target.closest('[data-cq-action]');if(!el)return;event.preventDefault();action(el.dataset.cqAction)});
    document.addEventListener('input',event=>{
      if(!host?.contains(event.target))return;const t=event.target,key=t.dataset.cqDraft;
      if(!key||t.type==='radio'&&!t.checked)return;
      const e=episode();if(e.final)return;
      if(key==='trialPrediction'&&!e.draft.trialPrediction.trim()&&t.value.trim()&&e.draft.referenceTrial==null&&e.trials.length)e.draft.referenceTrial=Math.min(selectedA,e.trials.length-1);
      e.draft[key]=['confidence','afterConfidence'].includes(key)?Number(t.value):t.value;
      if(key==='trialPrediction')host.querySelector('#cq-prediction-reference').textContent=predictionReference(e);
      bridge.save();
    });
    document.addEventListener('change',event=>{
      if(!host?.contains(event.target))return;const t=event.target,e=episode();
      if(t.dataset.cqCompare){if(t.dataset.cqCompare==='a')selectedA=Number(t.value);else selectedB=Number(t.value);render();return}
      if(e.final)return;
      if(t.dataset.cqPlan){const k=t.dataset.cqPlan;e.draft.plan[k]=k==='flex'?t.checked:k==='mobility'?t.value:Number(t.value);const cost=M.calculate(e.draft.plan).cost;host.querySelector('#cq-cost').textContent=`현재 설정 자원 ${cost}/8점${cost>8?' · 예산 초과':''}`;}
      if(t.hasAttribute('data-cq-final-trial'))e.draft.finalTrial=Number(t.value);
      if(t.dataset.cqEvidence){const ids=new Set(e.draft.evidence);t.checked?ids.add(t.dataset.cqEvidence):ids.delete(t.dataset.cqEvidence);if(ids.size>20){t.checked=false;error('근거는 20개까지 연결할 수 있습니다.');return}e.draft.evidence=[...ids]}
      bridge.save();
    });
  }
  function report() {
    const r=bridge.state().council;if(!r||!M.validateRecord(r))return '';
    return '<section><h2>시민 설계회의 · '+M.VERSION+'</h2><p>가상의 계수로 계산한 조건부 결과. 과학적 정확성을 자동 채점하지 않음.</p>'+r.episodes.map((e,l)=>{
      if(!e?.initial)return '';
      return `<h3>${l+1}차시 · ${E[l].title}</h3><p>처음 예상: ${esc(e.initial.prediction)}</p><p>선택 근거: ${esc(e.initial.evidenceNote)}</p><p>연결 근거: ${e.initial.evidence.map(v=>esc(v.id+' '+v.label)).join(', ')||'없음'}</p>`+(e.final?`<p>최종 조건: ${esc(labelPlan(e.final.settings))}</p><p>운영 배출 ${n(M.calculate(e.final.settings).annual)} tCO2e/년 · 가정</p><p>유지/수정 이유: ${esc(e.final.reason)}</p><p>한계: ${esc(e.final.limit)}</p><p>전이: ${esc(e.final.transfer)}</p><p>확신 ${e.initial.confidence}→${e.final.confidence} · 실험 ${e.trials.length}개</p>`:'<p>검토 중 · 확정 전</p>')+referenceNotice(e)+sensitivityNotice(e)+`<ul>${e.trials.map((t,i)=>`<li>실험 ${i+1} · ${esc(M.CONTEXTS[t.context].name)} · ${esc(labelPlan(t.settings))}<br>예상 기준 A: ${esc(M.referenceLabel(e.trials,i))}<br>${esc(t.prediction)}</li>`).join('')}</ul>`;
    }).join('')+'</section>';
  }
  window.CityCouncilUI={install(b){bridge=b;bind()},render,report};
})();
