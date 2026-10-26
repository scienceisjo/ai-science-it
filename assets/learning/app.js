'use strict';
(() => {
 const curriculum=EcoLearning, version=curriculum.version;
 ['자료 읽기 코치','관점 확장 도우미','실험 설계 코치','설계 비평 도우미'].forEach((name,i)=>LESSONS[i].role=name);
 const energyChapter=TEXTBOOK[0]?.[2];
 if(energyChapter){const card=energyChapter.cards.find(c=>c[0].includes('대체법'));if(card){card[0]='저탄소 에너지와 자료의 계산 기준';card[1]='이 자료에서 저탄소 에너지는 재생에너지와 원자력을 합한 분류입니다. 원자력은 재생에너지가 아닙니다. 1차에너지는 계산 방법에 따라 값이 달라질 수 있습니다. 이 수업은 2026-09-25 저장본끼리 비교하며, 현재 원사이트의 다른 방식·갱신 값과 섞지 않습니다.'}energyChapter.terms=energyChapter.terms.filter(x=>x!=='대체법');}
 const has=k=>typeof S.answers[k]==='string'&&!!S.answers[k].trim();
 const stepFor=(l,key)=>curriculum.lessons[l].steps.findIndex(s=>s.keys.includes(key));
 const policySignature=policies=>JSON.stringify(POLICIES.filter(p=>policies[p.id]?.on).map(p=>[p.id,p.sector?policies[p.id].rate:0]));
 const real=l=>S.evidence.filter(e=>e.lesson===l+1&&e.kind==='실제 자료');
 const pinnedPair=l=>real(l).some((a,i,all)=>all.slice(i+1).some(b=>a.label===b.label&&a.source===b.source&&a.unit===b.unit&&a.year!==b.year&&(l!==1||a.label===CITIES.find(c=>c.id===S.city)?.name+' 총배출')));
 const trialPair=()=>trialRows().some((a,i,all)=>all.slice(i+1).some(b=>a.day===b.day&&a.capacity===b.capacity&&a.efficiency!==b.efficiency));
 const keyProblem=(l,k)=>({key:k,step:stepFor(l,k),message:'「'+(answerLabels[k]||k)+'」 기록이 필요해요. 한두 문장으로 설명하거나, 판단 보류와 필요한 자료를 남겨도 됩니다.'});
 // The contract checks records and comparison conditions, never scientific correctness.
 function stepIssue(l,s){
  const step=curriculum.lessons[l].steps[s];
  const missing=step.keys.find(k=>!has(k));if(missing)return keyProblem(l,missing);
  if(l<2&&s===1&&!pinnedPair(l))return {step:1,message:'같은 대상·단위의 서로 다른 두 연도 값을 근거로 담아 주세요.'};
  if(l===1&&s===2&&!cityEvidenceReady())return {step:2,message:'선택한 도시의 총배출과 다른 종류의 지표를 각각 담아 주세요.'};
  if(l===2&&s===2&&!trialPair())return {step:2,message:'같은 날짜·태양광 조건에서 감소율만 바꾼 두 실험을 기록해 주세요.'};
  if(l===3&&s===1){
   if(councilDesign())return null;
   if(!has('l4prediction'))return {step:1,key:'l4prediction',message:'조합 비교 전의 예상이 필요합니다.'};
   const ps=POLICIES.filter(p=>S.policies[p.id]?.on);
   if(!ps.length)return {step:1,message:'설계할 정책을 한 가지 이상 선택해 주세요.'};
   if(budget().cost>8)return {step:1,message:'가상 자원 8점 안에서 조합을 조정해 주세요.'};
   if(ps.some(p=>!S.evidence.some(e=>e.id===S.policies[p.id].evidence)||!S.policies[p.id].reason?.trim()))return {step:1,message:'선택한 정책마다 실제로 담아 둔 근거와 연결 이유가 필요합니다.'};
   if(new Set(S.scenarios.map(s=>policySignature(s.policies))).size<2)return {step:1,message:'선택 정책이나 감축률이 다른 조합 두 개를 기록해 주세요. 설명만 달라진 조합은 같게 봅니다.'};
  }
  if(l===3&&s===4){
   if(designPolicies().some(p=>!S.checks[p.id+'_prompt']||!S.checks[p.id+'_model']))return {step:4,message:'선택한 요소의 계획–프롬프트–3D 대조표를 확인해 주세요. 누락·수정 필요도 기록입니다.'};
   if([0,1,2,3].some(i=>!S.checks['review'+i]))return {step:4,message:'최종 자기점검 네 항목을 확인해 주세요.'};
  }
  return null;
 }
 function finalIssue(l,requireAI=true){
  for(let s=0;s<5;s++){const e=stepIssue(l,s);if(e)return e}
  if(l===0&&(S.answers.l1evidence.match(/\d+(?:[.,]\d+)*/g)||[]).length<2)return {key:'l1evidence',step:4,message:'근거 칸에 담은 실제 수치 두 개를 가져오고, 그 의미를 설명해 주세요.'};
  if(l===3&&requireAI&&!S.model)return {step:3,message:'AI 생성 모델 검증은 아직 미실시입니다. 모델을 가져오거나 아래에서 핵심 학습 기록만 보존할 수 있습니다.'};
  return null;
 }
 validFinal=l=>finalIssue(l);
 cruiseRequirement=(l,s)=>s===4?finalIssue(l):stepIssue(l,s);
 const oldRequirement=showCruiseRequirement;
 showCruiseRequirement=function(err){
  const step=Number.isInteger(err.step)&&err.step>=0?err.step:stepFor(S.lesson,err.key);
  if(INQUIRY_PAGE&&step>=0&&step!==S.steps[S.lesson]){
   $('#feedback').innerHTML=esc(err.message)+' <button type="button" data-learning-step="'+step+'">'+esc(curriculum.lessons[S.lesson].steps[step].name)+'에서 보완하기</button>';
   $('#feedback').scrollIntoView({block:'center'});$('#feedback button')?.focus();return;
  }
  oldRequirement(err);
 };
 function helpView(l,s){
  const d=curriculum.lessons[l].steps[s];
  return '<section class="learning-task" aria-label="이번 탐구의 목표"><p class="learning-eyebrow">'+(l+1)+'차시 · '+(s+1)+'/5</p><h2>'+esc(d.name)+'</h2><p>'+esc(d.action)+'</p><details data-learning-help="overview"><summary>오늘 배우는 것과 남길 기록</summary><p>'+esc(curriculum.lessons[l].question)+'</p><ul>'+curriculum.lessons[l].goals.map(g=>'<li>'+esc(g)+'</li>').join('')+'</ul><p><b>결과물</b> '+esc(curriculum.lessons[l].output)+'</p></details></section>'+
   '<div class="learning-help" aria-label="자료 읽기 도움">'+[['terms','말뜻부터',d.terms],['reading','읽는 순서와 해설',d.read],['frame','내 설명의 문장 틀',d.frame]].map(([id,title,text])=>'<details data-learning-help="'+id+'"><summary>'+title+'</summary><p>'+esc(text)+'</p>'+(id==='frame'?'<p class="small">문장 틀은 예시입니다. 자기 말로 쓰고, 수치와 판단은 직접 고르세요.</p>':'')+'</details>').join('')+'</div>';
 }
 function previousWork(l,s){
  const keys=s===4?[['l1initial','처음 생각'],['l2initial','처음 판단'],['l3prediction','첫 예상'],['l4priority','나의 우선순위']][l]:l===3?['planConditions','3차시에서 남긴 설계 조건']:l===2?['l2transfer','2차시에서 가져온 전략']:l===1?['l1claim','1차시에서 남긴 주장']:null;
  if(!keys||!(s===0||s===4))return '';
  return '<details class="learning-previous" open><summary>'+esc(keys[1])+'</summary><blockquote>'+esc(S.answers[keys[0]]||'아직 기록이 없습니다. 아래에서 모르는 점부터 남겨도 됩니다.')+'</blockquote><p class="small">'+esc(curriculum.lessons[l].transfer)+'</p></details>';
 }
 function chartReading(l,s){
  if(l===0&&s===1){
   const r=D.countries[S.country].co2.filter(x=>x.co2!==null&&x.year>=S.start&&x.year<=S.end),a=r[0],b=r.at(-1);if(!a||!b)return '';
   const diff=b.co2-a.co2;
   return '<details class="reading-worked" data-learning-help="chart" open><summary>선택한 그래프 함께 읽기</summary><p>가로축 <b>연도</b> · 세로축 <b>연간 배출량(백만 tCO₂/년)</b> · 대상 <b>'+esc(names[S.country])+'</b></p><table class="mini-table"><caption>현재 선택한 실제 자료</caption><tr><th>처음</th><th>나중</th><th>나중−처음</th></tr><tr><td>'+a.year+'년<br>'+fmt(a.co2)+'</td><td>'+b.year+'년<br>'+fmt(b.co2)+'</td><td>'+fmt(diff)+' 백만 tCO₂/년</td></tr></table><p>'+ (a.year===b.year?'같은 연도입니다. 비교할 다른 연도를 선택하세요.':diff>0?'이 기간의 끝값이 시작값보다 큽니다. 모든 해에 계속 증가했다는 뜻인지는 중간의 선도 살펴보세요.':diff<0?'이 기간의 끝값이 시작값보다 작습니다. 감소 원인은 이 선만으로 확정할 수 없습니다.':'두 끝값은 같습니다. 중간에도 변화가 없었는지는 그래프를 더 살펴보세요.')+'</p><p class="small">계산과 관찰 해설입니다. 이것이 어떤 주장을 지지하는지는 직접 판단하세요.</p></details>';
  }
  if(l===0&&s===3){
   const r=D.countries[S.country].energy.find(r=>r.year===+S.year);if(!r)return '';
   return '<details class="reading-worked" data-learning-help="scope" open><summary>같은 나라·연도, 다른 범위</summary><label class="field">비교할 대상'+select('country',Object.entries(names),S.country)+'</label><p>'+esc(names[S.country])+' · '+S.year+'년 · 저장된 OWID 자료</p><div class="values">'+point(names[S.country]+' 저탄소 / 발전량',r.low_carbon_share_elec,'%',S.year,'https://ourworldindata.org/grapher/electricity-mix')+point(names[S.country]+' 저탄소 / 1차에너지',r.low_carbon_share_energy,'%',S.year,'https://ourworldindata.org/energy-mix')+'</div><p>같은 %라도 분모가 다릅니다. 두 값을 더하거나 그 차이를 감축량으로 읽지 않습니다. 아래에서 탄소집약도도 확인할 수 있습니다.</p></details>';
  }
  if(l===1&&s>=1&&s<=3){
   const c=CITIES.find(c=>c.id===S.city),a=c.total[0],b=c.total.at(-1);
   return '<details class="reading-worked" data-learning-help="city"><summary>'+esc(c.name)+' 자료를 읽는 기준</summary><p><b>'+c.years[0]+'년 '+fmt(a)+' → '+c.years.at(-1)+'년 '+fmt(b)+' tCO₂e/년</b></p><p>두 끝값의 변화는 '+fmt(b-a)+'tCO₂e/년입니다. 표와 그래프가 천 t로 표시되면 1,000으로 나눈 값입니다.</p><p>'+esc(c.boundary)+'</p><p>여기까지는 관찰입니다. 정책의 인과 효과를 입증하려면 다른 조건과 비교 자료가 더 필요합니다.</p></details>';
  }
  return '';
 }
 function progressView(l){
  const d=curriculum.lessons[l];
  return '<details class="learning-progress" open><summary>차시 기록 점검</summary><p class="small">작성 여부와 비교 조건만 확인합니다. 정답 자동 채점이 아닙니다.</p><ol>'+d.steps.map((x,s)=>{const issue=stepIssue(l,s);return '<li><span data-learning-status="'+s+'" class="record-state '+(!issue?'record-ready':'')+'">'+(issue?'보완 필요':'기록 있음')+'</span><button type="button" data-learning-step="'+s+'">'+esc(x.name)+'</button></li>'}).join('')+'</ol>'+(l===3?'<p id="learning-completion-state"></p>':'')+'</details>';
 }
 function refreshProgress(){
  document.querySelectorAll('[data-learning-status]').forEach(el=>{const issue=stepIssue(S.lesson,+el.dataset.learningStatus);el.textContent=issue?'보완 필요':'기록 있음';el.classList.toggle('record-ready',!issue)});
  const state=document.getElementById('learning-completion-state');if(state)state.textContent='핵심 학습 기록: '+(!finalIssue(3,false)?'구비됨':'작성 중')+' · AI 생성 모델 검증: '+(S.model&&!finalIssue(3)?'기록 구비됨':'미완료');
 }
 const previousAnswer=answer;
 answer=function(k,v){previousAnswer(k,v);queueMicrotask(refreshProgress)};
 document.addEventListener('change',()=>queueMicrotask(refreshProgress));
 const previousPicker=evidencePicker;
 evidencePicker=k=>previousPicker(k).replace(' open><summary>','><summary>');
 const priorContent=getContent;
 getContent=function(l,s){
  let body=priorContent(l,s);
  if(l===0&&s===4){const list=evidenceList(S.evidence.filter(e=>e.lesson===1));body=body.replace(list,'<details class="learning-bridge"><summary>이번 차시에 모은 근거 '+S.evidence.filter(e=>e.lesson===1).length+'개 다시 읽기</summary>'+list+'</details>')}
  if(l===3&&s===0)body='<div class="learning-bridge">'+[0,1,2].map((n)=>'<details><summary>'+(n+1)+'차시 핵심 기록</summary>'+[['l1claim','l1reason'],['l2transfer','l2limit'],['l3trialReason','planConditions']][n].map(k=>'<p><b>'+esc(answerLabels[k]||k)+'</b><br>'+esc(S.answers[k]||'아직 기록 없음')+'</p>').join('')+'</details>').join('')+'</div>'+body;
  if(l===2&&s===4)body=body.replace('앞 차시의 정책 전략과 건물 탐구 결과를 연결합니다.','각 분야는 한 문장씩. 근거가 부족하면 “보류: 필요한 자료”를 적어도 됩니다.');
  return helpView(l,s)+previousWork(l,s)+chartReading(l,s)+body+(s===4?progressView(l)+'<section class="learning-exit"><h3>발표 전, 한 번 더 생각하기</h3><p>'+esc(curriculum.lessons[l].exit)+'</p><p class="small">이웃과 말로 설명해 보세요. 자신과 다른 판단이 나오면 서로 쓴 근거를 확인하세요.</p></section>':'');
 };
 const oldCo2Source=source;
 source=function(text,url,unit,year,updated){return oldCo2Source(String(text).replace('OWID, 1차에너지 대체법','OWID, 앱에 저장된 1차에너지 자료'),url,unit,year,updated)+(String(url).includes('ourworldindata.org')?'<small class="snapshot-note">수업에서는 '+esc(D.version)+' 저장본을 사용합니다. 원사이트는 이후 값·산정 방법이 바뀔 수 있으므로 섞어 비교하지 마세요.</small>':'')};
 const oldCoach=renderCoach;
 renderCoach=function(){
  oldCoach();
  if(S.mode==='comparison'&&!$('#coach').textContent.trim())$('#coach').innerHTML='<div class="coach-inline"><h3>탐구 점검 질문</h3><p>'+esc(coachQuestion(S.lesson))+'</p></div>';
  if(!api.claude){$('#coach-question')?.closest('label')?.remove();$('#ask-coach')?.remove();}
  $('#coach').insertAdjacentHTML('afterbegin','<p class="learning-common">자료 읽기 도움과 고정 질문은 모두에게 동일합니다. 실제 AI 응답과 구분합니다.</p>');
 };
 function baseline(){try{const v=JSON.parse(S.answers.l3baseline||'null');return v&&Number.isInteger(v.day)&&v.day>=0&&v.day<=6&&Number.isFinite(v.capacity)&&v.capacity>=0&&v.capacity<=150&&Number.isFinite(v.efficiency)?v:null}catch{return null}}
 const originalBuilding=buildingView;
 buildingView=function(passive=false){
  const locked=baseline();if(passive&&locked){S.day=locked.day;S.capacity=locked.capacity;}
  const html=originalBuilding(passive);if(!has(passive?'l3passivePrediction':'l3balancePrediction'))return html;
  const a=baseline(),ts=trialRows(),b=buildingCalc();
  const compare=passive?'<section class="learning-baseline"><h3>한 조건만 바꾸는 비교</h3><p>바꿀 것: <b>수요 감소율</b> · 고정할 것: <b>날짜와 태양광 출력</b></p>'+(a?'<p>기준 A: '+esc(a.date)+' / '+a.capacity+'kW / 감소 '+a.efficiency+'%</p><p>현재−A: 소비 '+fmt(b.consumption-a.consumption)+'kWh, 부족 전력 '+fmt(b.imported-a.imported)+'kWh</p><button type="button" id="learning-release-baseline">기준 고정 해제</button>':'<p>먼저 날짜·출력을 정하고 기준 A를 기록하세요. 기록 뒤에는 감소율만 바꿉니다.</p><button type="button" id="learning-set-baseline"><i data-lucide="pin"></i> 현재 조건을 기준 A로 기록·고정</button>')+'</section>':'';
  return compare+html+(ts.length>=8?'<p class="note">현재 실험 8개를 모두 기록했습니다. '+(trialPair()?'조건이 같은 쌍을 비교하세요.':'통제된 비교가 없으면 기록을 보관한 뒤 새 묶음을 시작하세요.')+'</p><button id="learning-new-trials">기존 묶음 보관 · 새 비교</button>':'');
 };
 function applyBaseline(){
  if(S.lesson!==2||S.steps[2]!==2||!baseline())return;
  for(const k of ['day','capacity']){const el=$('[data-setting="'+k+'"]');if(el){el.disabled=true;el.title='기준 A에 고정된 조건'}}
 }
 const originalRender=render;
 render=function(){
  originalRender();
  if(!D||!CITIES||COUNCIL_PAGE)return;
  if(INQUIRY_PAGE){
   $('#deliverable').textContent='남길 기록: '+curriculum.lessons[S.lesson].output;
   if(S.steps[S.lesson]<4){const b=document.createElement('button');b.type='button';b.id='learning-next-data';b.innerHTML='다음 자료 <i data-lucide="arrow-right"></i>';$('.actions').append(b)}
   if(S.lesson===3&&S.steps[3]===4){const b=document.createElement('button');b.id='learning-core-save';b.innerHTML='<i data-lucide="save"></i> 핵심 학습 기록 보존';$('.actions').prepend(b);$('#next').innerHTML='AI 3D 검증까지 완료 <i data-lucide="check"></i>'}
   applyBaseline();refreshProgress();
   const optional=$('.council-invite');if(optional){const details=document.createElement('details');details.className='learning-optional';details.innerHTML='<summary>선택 활동 · 시민 설계회의</summary>';optional.replaceWith(details);details.append(optional)}
  }
  const credit=$('#app-credit');if(credit&&!credit.querySelector('.hnr-credit'))credit.insertAdjacentHTML('beforeend','<span class="hnr-credit"><img src="assets/brand/hnr-tech-mark.webp" alt="HNR TECH"> 학습 보강 '+version+'</span>');
  icons();
 };
 // Reset only owned buttons before each render; existing inputs and navigation keep their behavior.
 const decoratedRender=render;
 render=function(){document.querySelectorAll('#learning-next-data,#learning-core-save').forEach(el=>el.remove());decoratedRender()};
 async function completion(l,core=false){
  flushLearningInputs();const e=finalIssue(l,!core);if(e)return showCruiseRequirement(e);
  if(l===3&&!core){try{if(!await modelRead())return showCruiseRequirement({step:3,message:'이 기기에 모델 파일이 없습니다. GLB를 다시 가져오거나 핵심 학습 기록만 보존하세요.'})}catch{return showCruiseRequirement({step:3,message:'모델 저장소를 확인하지 못했습니다. 파일을 다시 확인해 주세요.'})}}
  if(core){answer('l4coreSavedAt',new Date().toISOString());log('core_learning_recorded',{contentVersion:version,aiModelVerified:false})}
  else {const newly=!S.done[l];S.done[l]=true;if(l===3)answer('l4coreSavedAt',new Date().toISOString());if(newly)log('lesson_completed',{contentVersion:version});}
  if(l===0&&S.mapReturn)S.mapReturn.pendingScene='first-record-next-question';save();
  showModal(core?'핵심 학습 기록을 보존했습니다':'이번 차시의 기록을 확인했습니다','<p>'+esc(curriculum.lessons[l].output)+'</p><p><b>작성 완료는 과학적 정답 인증이 아닙니다.</b> 근거와 설명은 선생님·동료와 검토하세요.</p>'+(core?'<p>AI 생성 모델 검증은 미완료로 남깁니다. 기존 기록은 유지되고 나중에 모델을 가져와 이어갈 수 있습니다.</p>':'')+'<p>'+esc(curriculum.lessons[l].transfer)+'</p><div class="row"><button id="learning-complete-map" class="primary">맵으로 돌아가기</button><button id="learning-export"><i data-lucide="download"></i> 기록 내보내기</button></div><details class="learning-optional"><summary>시간이 남으면 · 시민 설계회의</summary><p>선택 이야기 활동입니다. 오늘의 필수 기록을 대신하지 않습니다. 연구 수업에서는 교사가 정한 같은 운영 조건을 따릅니다.</p><button id="council-start">설계회의 열기</button></details>');icons();
 }
 const priorNext=next;
 next=function(){if(!INQUIRY_PAGE||COUNCIL_PAGE)return priorNext();if(S.steps[S.lesson]===4)return completion(S.lesson);return priorNext()};
 document.addEventListener('toggle',e=>{if(e.target.matches?.('details[data-learning-help]')&&e.target.open)log('learning_scaffold_open',{section:e.target.dataset.learningHelp,contentVersion:version})},true);
 document.addEventListener('change',e=>{
  if(!e.target.matches('[data-setting="day"],[data-setting="capacity"]')||S.lesson!==2||S.steps[2]!==2||!baseline())return;
  e.stopImmediatePropagation();e.target.value=baseline()[e.target.dataset.setting];toast('기준 A에 고정된 조건입니다. 다른 조건으로 실험하려면 기준 고정을 해제하세요.');
 },true);
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const handled=['learning-next-data','learning-core-save','learning-complete-map','learning-export','learning-set-baseline','learning-release-baseline','learning-new-trials','scenario-save'];
  if(b.dataset.learningStep===undefined&&!handled.includes(b.id))return;
  e.preventDefault();e.stopImmediatePropagation();flushLearningInputs();
  if(b.dataset.learningStep!==undefined){const s=+b.dataset.learningStep;return go(S.lesson,s)}
  if(b.id==='learning-complete-map')return returnFromInquiry();
  if(b.id==='learning-export')return exportState();
  if(b.id==='learning-core-save')return completion(3,true);
  if(b.id==='learning-next-data'){const err=stepIssue(S.lesson,S.steps[S.lesson]);if(err)return showCruiseRequirement(err);log('learning_direct_transition',{contentVersion:version});return go(S.lesson,S.steps[S.lesson]+1)}
  if(b.id==='learning-set-baseline'){
   const c=buildingCalc(),a={day:S.day,date:buildingRows()[0].timestamp.slice(0,10),capacity:S.capacity,efficiency:S.efficiency,consumption:c.consumption,production:c.production,imported:c.imported,predictionRef:{key:'l3passivePrediction',revision:S.revisions.findLastIndex(r=>r.key==='l3passivePrediction')},contentVersion:version};
   const ts=trialRows();if(ts.length>=8&&!ts.some(t=>t.day===a.day&&t.capacity===a.capacity&&t.efficiency===a.efficiency))return toast('실험 묶음을 보관하고 새 비교를 시작해 주세요.');
   if(!ts.some(t=>t.day===a.day&&t.capacity===a.capacity&&t.efficiency===a.efficiency))answer('l3trials',JSON.stringify([...ts,a]));
   answer('l3baseline',JSON.stringify(a));log('experiment_baseline_locked',{baseline:a,contentVersion:version});return render();
  }
  if(b.id==='learning-release-baseline'){answer('l3baseline','');log('experiment_baseline_released');return render()}
  if(b.id==='learning-new-trials'){
   if(!confirm('기존 실험은 수정 이력과 보관 묶음에 남기고 새 비교를 시작할까요?'))return;
   let archive=[];try{archive=JSON.parse(S.answers.l3trialArchive||'[]');if(!Array.isArray(archive))archive=[]}catch{}
   if(archive.length>=10)return toast('보관 묶음이 10개입니다. 기록을 내보낸 뒤 기존 비교를 검토하세요.');
   const archived=JSON.stringify([...archive,{time:new Date().toISOString(),trials:trialRows()}]);
   if(archived.length>5000)return toast('보관 용량에 도달했습니다. 기존 기록을 내보낸 뒤 선생님과 비교할 실험을 정해 주세요. 기록은 지우지 않았습니다.');
   answer('l3trialArchive',archived);answer('l3trials','[]');answer('l3baseline','');log('trial_batch_archived');return render();
  }
  if(b.id==='scenario-save'){
   const v=budget();if(v.cost>8)return toast('자원 8점 안에서 기록하세요.');if(!POLICIES.some(p=>S.policies[p.id]?.on))return toast('정책을 먼저 선택하세요.');
   if(S.scenarios.some(s=>policySignature(s.policies)===policySignature(S.policies)))return toast('같은 정책·감축률의 조합입니다. 설명이 아닌 조건을 바꾸어 비교하세요.');
   S.scenarios.push({...v,name:'조합 '+String.fromCharCode(65+S.scenarios.length),policies:structuredClone(S.policies),time:new Date().toISOString(),prediction:S.answers.l4prediction||'',contentVersion:version});log('scenario_saved',{contentVersion:version});return render();
  }
 },true);
 const oldExport=exportState;
 exportState=function(){flushLearningInputs();log('learning_version',{contentVersion:version,dataVersion:D.version});oldExport()};
 let reportLogo=new URL('assets/brand/hnr-tech-mark.webp',location.href).href;
 const oldReport=reportHTML;
 reportHTML=function(){
  const template=document.createElement('template');template.innerHTML=oldReport();
  const internal=new Set(['l3trials','l3baseline','l3trialArchive','l4coreSavedAt']);
  template.content.querySelectorAll('p').forEach(p=>{if(internal.has(p.querySelector('b')?.textContent))p.remove()});
  const experiment=template.content.querySelectorAll('section')[2];
  if(experiment){const table=document.createElement('div');table.innerHTML=trialComparison()+'<p>비교 기준·예상 수정 이력·보관한 실험 묶음은 함께 내보낸 기록 JSON에서 확인합니다. 표의 결과는 실측 부하에 가정을 적용한 계산이며 실제 기술 성능 인증이 아닙니다.</p>';experiment.append(table)}
  return template.innerHTML+'<section><h2>학습 기록의 구비 상태</h2><p>활동 버전 '+version+' · 자동 과학 채점이 아닙니다.</p>'+curriculum.lessons.map((l,i)=>'<p><b>'+(i+1)+'차시 '+esc(l.question)+'</b><br>'+l.steps.map((s,j)=>esc(s.name)+': '+(stepIssue(i,j)?'보완 필요':'기록 있음')).join(' / ')+'</p>').join('')+'<p>4차시 핵심 기록: '+(!finalIssue(3,false)?'구비됨':'보완 필요')+'<br>AI 생성 모델 검증: '+(S.model&&!finalIssue(3)?'기록 구비됨':'미완료')+'</p><p>기본 모형 검토를 실제 AI 검증으로 간주하지 않습니다. 서버 미연결 공개판의 기록으로 AI 처치 효과를 입증할 수 없습니다.</p><img src="'+esc(reportLogo)+'" alt="HNR TECH" width="64"></section>';
 };
 const priorBoot=boot;
 boot=async function(){
  await priorBoot();if(!D||!CITIES)return;
  if(S.model)try{if(!await modelRead()){S.model=null;save();if(INQUIRY_PAGE&&!COUNCIL_PAGE)render()}}catch{toast('모델 파일 저장소를 확인하지 못했습니다.')}
  log('learning_session_started',{contentVersion:version,dataVersion:D.version,liveAI:!!api.claude,presentation:!!PRESENTATION});
  const tools=document.querySelector('.tools');if(tools&&!tools.querySelector('.hnr-header')){const logo=document.createElement('img');logo.src='assets/brand/hnr-tech-mark.webp';logo.alt='HNR TECH';logo.className='hnr-header';tools.prepend(logo)}
  try{const response=await fetch(reportLogo);if(response.ok)reportLogo=await new Promise((resolve,reject)=>{response.blob().then(blob=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)},reject)})}catch{}
 };
 const priorViewer=inquiryModelView;
 let viewerSignature='';
 inquiryModelView=function(){
  if(!INQUIRY_PAGE)return priorViewer();
  const signature=JSON.stringify([S.lesson,S.exploded,designPolicies().map(p=>[p.id,S.placements[p.id]||'east'])]);
  if(inquiryViewer&&city&&signature!==viewerSignature){scene.remove(city);dispose(city);city=new THREE.Group();scene.add(city)}
  priorViewer();
  if(inquiryViewer&&$('#inquiry-viewer')&&S.lesson===3&&signature!==viewerSignature){
   scene.remove(city);dispose(city);city=new THREE.Group();scene.add(city);box(16,.1,16,0,-.08,0,'#b6ccc1');
   const groups={north:[],east:[],south:[],west:[]};designPolicies().forEach(p=>groups[S.placements[p.id]||'east'].push(p));
   const center={north:[0,-4.5],east:[4.5,0],south:[0,4.5],west:[-4.5,0]};
   for(const [side,ps]of Object.entries(groups))ps.forEach((p,i)=>{const [x,z]=center[side],shift=(i-(ps.length-1)/2)*2.6;policyObject(p,x+(side==='north'||side==='south'?shift:0),z+(side==='east'||side==='west'?shift:0))});
   city.visible=!imports;paintInquiryViewer();
  }
  if(inquiryViewer&&$('#inquiry-viewer'))viewerSignature=signature;
 };
 window.EcoLearningAudit={stepIssue,finalIssue,policySignature,baseline,version};
})();
