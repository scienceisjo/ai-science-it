'use strict';
(() => {
 const version='fossil-scaffold-20261012-v1';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const refs={
  P1:['Shen 외(2018) · 중국 펑라이탄 지층 연구','https://profiles.si.edu/display/sro_149827'],
  P2:['NPS · 대멸종과 생물군 변화','https://www.nps.gov/subjects/fossils/mass-extinctions-through-geologic-time.htm'],
  K1:['Schulte 외(2010) · 충돌 증거 검토','https://pubmed.ncbi.nlm.nih.gov/20203042/'],
  K2:['NSF · 충돌 뒤 환경 변화','https://www.nsf.gov/science-matters/moment-changed-earth'],
  T1:['BGS · 삼엽충','https://www.bgs.ac.uk/discovering-geology/fossils-and-geological-time/trilobites/'],
  T2:['BGS · 암모나이트','https://www.bgs.ac.uk/discovering-geology/fossils-and-geological-time/ammonites/'],
  T3:['James St. John · 표본 원자료 설명','https://commons.wikimedia.org/wiki/File:Pecopteris_carbonized_fossil_ferns_(Pennsylvanian)_(15359852239).jpg'],
  T4:['BGS · 이매패류','https://www.bgs.ac.uk/discovering-geology/fossils-and-geological-time/bivalves/'],
  T5:['BGS · 산호','https://www.bgs.ac.uk/discovering-geology/fossils-and-geological-time/corals/']
 };
 const source=id=>`<a class="sc-source" href="${refs[id][1]}" target="_blank" rel="noopener">[${id}] ${refs[id][0]}</a>`;
 const hypotheses=['기후 변화설','수륙 분포 변화설','해양 무산소설','화산 폭발설','소행성 충돌설','복합 원인 / 보류'];
 const hypothesisText=['기온·빙하·해수면의 변화가 생물의 서식 조건을 바꾼다.','대륙과 바다의 배치가 달라져 서식 공간과 해류가 바뀐다.','바닷물에 녹아 있는 산소가 부족해 생존이 어려워진다.','대규모 화산 활동이 기체와 물질을 내보내 기후·바다에 영향을 준다.','큰 천체의 충돌이 대기와 지표의 환경을 급격히 바꾼다.'];
 const cases={
  permian:{name:'페름기 말',boundary:'고생대 말 → 중생대 초',scope:'약 2억 5200만 년 전 · 중국 펑라이탄 해양 지층 중심',
   clues:[['P1','화산 기원 물질을 포함한 지층과 해양 화석군의 급격한 소멸이 보고되었다.','화산 활동과 생물 변화의 관련성을 검토할 단서다. 같은 층이라는 사실만으로 전 과정을 입증하지는 못한다.'],['P1','탄소 동위원소 비율의 변동과 해수 온도 지표의 변화가 보고되었다.','바다의 탄소 순환과 온도 조건도 달라졌을 가능성을 살핀다.']],
   compare:[['환경의 단서','소멸 직전·무렵에도 탄소 순환과 수온 지표가 변동했다.','소멸 직후 이 지역에서 더 큰 수온 상승이 보고되었다.','P1'],['생물의 단서','이 지층에는 여러 페름기형 해양 생물의 기록이 있었다.','조사 지점에서는 페름기형 종이 경계 뒤 살아남은 기록을 찾지 못했다. 다른 지점의 생존 양상은 달랐다.','P1']],
   mechanism:'물의 온도가 바뀌면 생물이 견딜 수 있는 범위를 벗어나거나 필요한 산소를 얻기 어려워질 수 있다. 실제 수온·산소 자료와 생물군별 차이를 더 확인한다.',
   limit:'펑라이탄 한 지점의 결과를 전 세계 모든 바다에 그대로 적용하지 않는다. 화산·수온·산소 등 여러 과정의 역할을 구분해야 한다.'},
  cretaceous:{name:'백악기 말',boundary:'중생대 말 → 신생대 초',scope:'약 6600만 년 전 · 칙술루브 충돌과 여러 지역의 경계층 자료',
   clues:[['K1','칙술루브 충돌 구조와 경계층의 이리듐 농도 이상 등 서로 다른 충돌 단서가 확인되었다.','한 단서가 아니라 여러 단서를 연결해 큰 충돌이 있었다는 설명을 검토한다.'],['K2','충돌 물질이 대기 중 햇빛을 줄이고 기온·광합성에 영향을 주는 과정이 연구되었다.','충돌 흔적과 생물 피해 사이를 이어 주는 환경 변화 설명이다. 모든 피해가 같은 과정 때문이라는 뜻은 아니다.']],
   compare:[['환경의 단서','충돌 전에도 지역·시기에 따른 기후 차이가 있었다. 전 세계를 하나의 기온으로 표시하지 않는다.','충돌 직후 먼지·황 성분 입자로 일사량과 기온이 낮아지는 과정이 제안된다. 장기 변화와 구분한다.','K2'],['생물의 단서','새가 아닌 공룡과 여러 생물군의 화석 기록이 있었다.','새가 아닌 공룡 등은 사라졌지만 모든 생물이 멸종한 것은 아니다. 살아남은 일부 집단은 이후 다양해졌다.','P2']],
   mechanism:'빛이 줄면 광합성 생물이 만드는 유기물이 줄어들 수 있다. 그 생물을 먹는 생물도 영향을 받을 수 있다. 감소의 크기·기간·지역 차이는 별도 자료가 필요하다.',
   limit:'이리듐 하나로 모든 생물의 사망 원인이나 멸종률을 계산하지 않는다. 충돌 직후의 어두움·냉각을 신생대 전체의 기후라고 쓰지 않는다.'}
 };
 const help=(title,body)=>`<aside class="sc-help"><h3>${title}</h3>${body}</aside>`;
 function glossary(){return `<details class="sc-details"><summary>낯선 증거 용어, 쉬운 말로</summary><dl class="sc-glossary"><dt>탄소 동위원소</dt><dd>같은 탄소이지만 질량이 다른 종류다. 그 비율의 변화는 탄소가 이동하고 순환한 방식의 단서가 된다. 비율 하나가 화산의 지문처럼 원인을 확정하지는 않는다.</dd><dt>해수 온도 지표</dt><dd>옛 바다에 온도계를 꽂아 잰 값이 아니다. 물질의 특성과 온도의 관계를 이용해 과거 온도를 추정하는 간접 단서다.</dd><dt>이리듐 농도 이상</dt><dd>주변 층보다 이리듐이라는 원소가 유난히 많이 검출된 상태다. 충돌 구조·충돌로 생긴 물질 등과 함께 해석한다.</dd><dt>화산 기원 물질</dt><dd>화산에서 나온 재 등이 굳어 지층에 남은 것이다. 화산 활동이 있었다는 근거와, 그것이 멸종을 일으킨 과정의 근거는 구분한다.</dd></dl>${source('P1')} ${source('K1')}</details>`;}
 function caseEvidence(id){const c=cases[id];return `<article class="sc-case" data-case="${id}"><h3>${c.name} · ${c.boundary}</h3><p class="sc-scope">${c.scope}</p>${c.clues.map(([r,f,i])=>`<div class="sc-evidence-row"><div><b>자료가 보고한 내용</b><p>${f}</p></div><div><b>함께 읽는 뜻</b><p>${i}</p></div>${source(r)}</div>`).join('')}<p class="sc-limit"><b>여기까지는 아직</b> ${c.limit}</p></article>`;}
 function casesView(){return `<div class="sc-cases">${Object.keys(cases).map((id,i)=>`<details class="sc-details" ${i===0?'open':''}><summary>${cases[id].name} 증거 묶음</summary>${caseEvidence(id)}</details>`).join('')}</div>`;}
 function evidence1(s){
  if(s===1)return `<h2>가설은 증거를 찾아가는 출발점</h2>${help('오늘은 한 사건을 집중 조사',`<p>페름기 말 또는 백악기 말의 <b>자료가 보고한 내용</b>을 읽고, 설명할 가설을 하나 고르세요. 아직 근거가 부족하면 보류해도 됩니다.</p>`)}${casesView()}<details class="sc-details"><summary>다섯 가설의 뜻</summary>${hypotheses.slice(0,5).map((h,i)=>`<h3>${h}</h3><p>${hypothesisText[i]}</p>`).join('')}<p>서로 배타적인 정답 목록이 아닙니다. 화산 활동과 기후 변화처럼 연결될 수 있습니다.</p></details>${glossary()}`;
  return `<h2>같은 증거를 다시 읽고 판단하기</h2>${help('사실 → 뜻 → 내 판단','<ol><li>집중할 사건의 보고 내용을 확인합니다.</li><li>해설을 읽고 내 가설과 연결되는 이유를 생각합니다.</li><li>가설을 유지·수정·보류하고, 아직 필요한 자료를 고릅니다.</li></ol>')}${casesView()}${glossary()}${help('추가 자료를 떠올리는 질문','<p>정확한 시기를 더 알아야 할까? 다른 지역도 같은지 봐야 할까? 생물이 영향을 받은 과정을 더 확인해야 할까? 가장 필요한 하나를 골라 이유를 쓰세요.</p>')}`;
 }
 function forms1(s,h){const {field,selectField,previousRecords}=h;
  if(s===1)return selectField('집중 사건','집중 조사할 사건',Object.values(cases).map(c=>c.name))+selectField('잠정 가설','지금 자료와 연결해 볼 가설',hypotheses)+field('가설 선택 이유','어떤 단서 때문에 이 가설을 살펴보려 하나요?','[자료 번호]의 ___은 ___와 관련이 있다고 생각한다. 다만 ___은 아직 확인해야 한다.')+`<details class="sc-details"><summary>다른 사건도 검토하기 · 선택 활동 / 이전 기록</summary><p>자료가 부족한 사건은 비워 두거나 보류할 수 있습니다. 다섯 사건의 원인을 모두 맞히는 과제가 아닙니다.</p>${['오르도비스기 말','데본기 후기','페름기 말','트라이아스기 말','백악기 말'].map((e,i)=>selectField('가설 '+(i+1),e,hypotheses,false)).join('')}</details>`;
  return `<details class="sc-details"><summary>내가 앞에서 세운 가설</summary>${previousRecords(1,2)}</details>`+selectField('심사 사건','집중 심사할 사건',Object.values(cases).map(c=>c.name))+field('자료의 관찰 사실','자료에서 확인한 내용 하나','[P1 또는 K1 등]에 ___이라고 보고되었다. 제공된 해석을 참고해 한 문장으로 정리하세요.')+field('자료의 해석','그 단서는 내 가설과 왜 연결되나요?','___이라면 ___의 변화가 생길 수 있으므로 이 단서는 ___ 가설과 관련된다.')+selectField('판단','다시 검토한 판단',['유지','수정','보류'])+field('판단 이유','판단의 이유와 다음에 볼 자료 하나','___ 때문에 판단을 ___했다. 아직 ___을 모르므로 ___ 자료를 더 보겠다.');
 }
 function timeline(){return help('100cm가 지구 역사 전체라면',`<p><b>1% = 1cm</b>입니다. 예를 들어 수업 자료의 고생대 비율 6.3%를 옮기면 <b>100cm × 6.3 ÷ 100 = 6.3cm</b>입니다.</p><p>자료의 순서: 선캄브리아시대 → 고생대 → 중생대 → 신생대<br>길이: 88.2cm / 6.3cm / 4.1cm / 1.4cm</p><p>네 시대를 25cm씩 놓으면 기간도 같았다고 오해할 수 있습니다. 이 비율은 원안의 반올림 값이며 최신 경계 연대의 정밀 계산값은 아닙니다.</p>`);}
 function clues(){return help('짧게 살았다 = 한 마리의 수명이 짧다?',`<p><b>아닙니다.</b> 여기서는 <b>한 종이 지구 역사에 나타나 사라질 때까지의 기간</b>을 말합니다. 한 마리가 몇 년 살았는지와 다릅니다.</p><dl class="sc-glossary"><dt>표준 화석 · 언제?</dt><dd>지질학적으로 짧은 기간에 살고 널리 분포한 종류는 지층의 시기 비교에 유용합니다. 화석 하나로 정확한 연도를 정한다는 뜻은 아닙니다.</dd><dt>시상 화석 · 어떤 환경?</dt><dd>특정 환경에서 살던 생물은 옛 서식 조건을 추리하는 단서가 됩니다. 산호초를 만드는 산호의 사례를 모든 산호에 적용하지 않습니다.</dd></dl>${source('T2')} ${source('T5')}`);}
 const specimenInfo=[
  ['마디와 몸의 구획','BGS는 삼엽충이 함께 발견되는 암석·화석 등을 근거로 바다에 살던 생물이라고 설명한다.','이 사진의 삼엽충을 해양 생물로 해석하는 데 도움이 된다. 정확한 수심·수온은 사진만으로 정하지 못한다.','T1'],
  ['말린 껍데기의 윤곽과 무늬','암모나이트는 바다에 살던 두족류다. 종별 생존 시기를 비교해 지층의 시기를 조사할 수 있다.','바다 환경과 관련된 표본이라고 해석할 수 있다. 종과 산출 지층 정보 없이 정확한 연도를 확정하지 않는다.','T2'],
  ['반복되는 잎 모양 흔적과 배열','원자료는 후기 석탄기 이암에 남은 Pecopteris 식물의 탄화 흔적이라고 설명한다.','식물이 존재했다는 단서다. 잎이 운반되어 쌓일 수도 있으므로 발견 지점이 곧 숲이 있던 자리라는 뜻은 아니다.','T3'],
  ['껍데기 윤곽과 방사상 무늬','이매패류에는 바다·기수·민물 환경에서 살던 종류가 있다. 종류와 함께 발견된 자료를 확인해야 한다.','조개라는 이름만으로 얕고 따뜻한 바다라고 확정하지 않는다. 이 표본의 종류·지층 정보를 더 조사한다.','T4']
 ];
 function specimen(i){const d=specimenInfo[i];return `<div class="sc-specimen" data-support-specimen="${i}"><h3>사진과 함께 읽는 표본 정보</h3><dl class="sc-glossary"><dt>직접 관찰할 것</dt><dd>${d[0]}</dd><dt>자료가 알려 주는 지식</dt><dd>${d[1]}</dd><dt>그 지식으로 해석할 때의 범위</dt><dd>${d[2]}</dd></dl>${source(d[3])}</div>`;}
 function compare(id){const c=cases[id];return `<article class="sc-case"><h3>${c.boundary}</h3><p>${c.scope}</p><div class="table-wrap"><table class="sc-comparison"><caption>자료를 바탕으로 정리한 비교 해설 · 학생이 측정한 값 아님</caption><thead><tr><th scope="col">같은 비교 항목</th><th scope="col">경계 전</th><th scope="col">경계 무렵·뒤</th></tr></thead><tbody>${c.compare.map(([label,a,b,r])=>`<tr><th scope="row">${label}</th><td>${a}</td><td>${b}<br>${source(r)}</td></tr>`).join('')}</tbody></table></div><p class="sc-limit">${c.limit}</p></article>`;}
 function pairLibrary(){return `<div class="sc-cases">${Object.keys(cases).map((id,i)=>`<details class="sc-details" ${i===0?'open':''}><summary>${cases[id].boundary} 비교 자료</summary>${compare(id)}</details>`).join('')}</div>`;}
 function evidence4(s,h){const {previousRecords}=h;
  if(s===0)return `<h2>시대 전체보다, 한 경계부터</h2>${help('모둠 복원지도의 범위',`<p>네 시대의 순서는 유지하되, 아래 <b>두 경계 중 하나</b>를 집중 비교합니다. 선택하지 않은 시대는 추가 자료가 필요한 칸으로 남겨도 됩니다.</p><p>1차시의 사건 기록 + 2차시의 시간 순서 + 3차시의 관찰·추론 구분을 함께 사용하세요. 표본 사진 네 장은 한 장소·시대의 묶음이 아닙니다.</p>`)}${pairLibrary()}<h3>앞선 나의 기록 · 읽기 전용</h3>${[1,2,3].map(c=>`<details class="sc-details"><summary>${c}차시 수사 기록</summary>${previousRecords(c)}</details>`).join('')}`;
  if(s===1)return `<h2>사건과 생물 사이에 빠진 연결</h2>${help('시간 순서와 인과 설명은 다릅니다','<p>“충돌 뒤 멸종이 일어났다”는 순서입니다. 어떤 환경 조건이 달라져 생존에 영향을 주었는지 설명과 근거가 더 필요합니다.</p>')}<div class="sc-chain" aria-label="사건에서 생물 변화까지 연결"><span>환경 조건 변화</span><b aria-hidden="true">→</b><span class="sc-gap">어떤 생존 조건이<br>달라졌을까?</span><b aria-hidden="true">→</b><span>생물군의 변화</span></div>${Object.keys(cases).map(id=>`<details class="sc-details"><summary>${cases[id].name} · 연결에 필요한 과학 개념</summary><p>${cases[id].mechanism}</p>${source(id==='permian'?'P2':'K2')}</details>`).join('')}${pairLibrary()}<details class="sc-details"><summary>내 모둠의 경계 선택과 복원지도</summary>${previousRecords(4,1)}</details>`;
  if(s===2)return `<h2>동료는 틀린 답을 찾는 채점자가 아닙니다</h2>${help('하나씩만 묻고, 설명을 고쳐 보기','<ol><li>어떤 자료 번호가 그 설명을 뒷받침하나요?</li><li>환경 변화가 생존에 영향을 주는 중간 과정은 무엇인가요?</li><li>다른 지역·다른 생물에도 같다고 말할 수 있나요?</li></ol>')}<div class="checklist"><label><input type="checkbox">이어진 두 시대의 특정 경계 전후를 비교했다.</label><label><input type="checkbox">환경 자료와 생물 자료를 각각 연결했다.</label><label><input type="checkbox">근거가 부족한 화살표는 잠정 설명으로 표시했다.</label></div>${previousRecords(4,2)}<p>교실에서 다른 모둠과 의견을 주고받고 기록합니다. 온라인 동시 편집은 아닙니다.</p>`;
  return `<h2>보고서는 앞선 판단을 연결한 설계도</h2>${help('각 칸 1~2문장부터','<p>선택한 경계의 환경 단서, 생물 단서, 연결 설명, 남은 질문을 정리합니다. 기후·수륙 분포·대기를 모두 채우기 위해 없는 정보를 만들어 쓰지 않습니다.</p>')}<div class="table-wrap"><table><thead><tr><th>구성</th><th>오늘 남길 내용</th><th>원안 배점</th></tr></thead><tbody><tr><td>서론</td><td>이어진 두 시대의 어느 경계인지, 고른 이유</td><td>7</td></tr><tr><td>본론</td><td>경계 전후 환경·생물 자료, 인과 연결과 출처</td><td>15</td></tr><tr><td>결론</td><td>화석의 가치와 아직 필요한 자료</td><td>8</td></tr></tbody></table></div><p class="smallprint">배점은 원안 표시입니다. 실제 평가는 담당 교사 기준을 따르며 작성 완료가 과학적 정답 판정은 아닙니다.</p>${previousRecords(4,3)}<details class="sc-details"><summary>비교 해설 다시 보기</summary>${pairLibrary()}</details>`;
 }
 function forms4(s,h){const {field,selectField,input,eras,colors}=h;
  if(s===0)return selectField('집중 경계','이번 모둠이 집중할 경계',Object.values(cases).map(c=>c.boundary))+field('공통 연결','우리 지도의 중심 설명과 아직 빠진 근거','선택한 경계에서 환경은 ___, 생물 기록은 ___이다. [자료 번호]를 연결해 ___을 설명하려 한다. ___은 더 확인해야 한다.')+`<details class="sc-details"><summary>네 시대의 지도 메모 · 이전 기록 / 추가 조사</summary><p>아는 범위만 남깁니다. 선택하지 않은 시대와 자료가 없는 항목은 빈칸이어도 됩니다.</p><div class="evidence-map">${eras.map((e,i)=>`<section class="era-column" style="border-color:${colors[i]}"><h3>${e}</h3>${field(e+' 기록','환경 · 화석 · 변화 · 출처','이 시대 전체가 같은 환경이었다고 일반화하지 않습니다.',false)}</section>`).join('')}</div></details>`;
  if(s===1)return `<div class="field-row">${selectField('시작 시대','경계 전의 시대',eras)}${selectField('다음 시대','경계 뒤의 시대',eras)}</div>`+field('환경 변화','비교 자료에서 환경 조건 하나를 골라 설명','예: 수온 또는 햇빛. 선택한 경계·지역을 밝히고 전후 차이를 쓰세요.')+field('생물 변화','그 경계 전후 생물 기록의 변화','개체 수와 과·종 수를 구분하세요. [자료 번호]에서 확인한 범위만 쓰세요.')+field('인과 근거','환경 → 생존 조건 → 생물 변화, 연결하기','___이 달라지면 생물이 ___하기 어려워질 수 있다. 이를 검토할 자료는 [___]이다.')+selectField('설명 상태','현재 설명의 확실성',['증거로 지지되는 설명','잠정 가설','판단 보류'])+field('설명의 한계','아직 확인해야 할 연결 하나','지역 차이 / 정확한 시기 / 생물군 차이 / 다른 원인 중 하나를 골라 왜 필요한지 설명하세요.');
  if(s===2)return field('동료의 지지','근거가 충분하다는 의견을 받은 부분','동료가 [자료 번호]와 ___의 연결을 지지했다.')+field('동료 질문','동료에게 받은 질문 하나','예: 이 자료를 다른 바다에도 적용할 수 있나요?')+field('설명 수정','질문을 반영해 바꾼 부분 또는 유지한 이유','처음에는 ___이라고 썼다. 질문을 듣고 ___로 범위를 좁혔다 / ___ 근거로 유지했다.');
  return input('탐구 제목','내 보고서의 질문을 제목으로')+field('시대 선정','이어진 두 시대와 집중 경계, 선정 이유','고생대 말-중생대 초 또는 중생대 말-신생대 초 중 선택한 범위와 이유를 쓰세요.')+field('환경 특징','경계 전후 환경 조건 한 가지','수온·햇빛 등 제공된 자료에서 확인한 조건만. 자료 번호와 지역을 함께 쓰세요.')+field('화석 근거','생물·화석 기록에서 확인한 전후 변화와 출처','___ 기록이 ___로 변했다 [자료 번호]. 3차시 표본 사진을 이 경계의 실제 출토 증거처럼 쓰지 마세요.')+field('변천 설명','환경 변화가 생존에 영향을 주는 과정을 설명','환경 ___ → 생존 조건 ___ → 생물 기록 ___. 앞서 검토하고 수정한 연결을 사용하세요.')+field('결론','화석으로 알게 된 것과 남은 질문','화석은 ___을 설명하는 데 도움이 된다. 그러나 ___은 다른 증거가 필요하다.')+input('마지막 문장','“화석은 과거를 설명하는 ___이다.”');
 }
 function mount(form,chapter,step){
  const caseSelect=form.elements['집중 사건']||form.elements['심사 사건'];
  if(chapter===1&&caseSelect){const showCase=()=>{const id=Object.keys(cases).find(k=>cases[k].name===caseSelect.value);if(!id)return;form.querySelectorAll('.sc-cases .sc-case[data-case]').forEach(el=>{el.parentElement.open=el.dataset.case===id;});};caseSelect.addEventListener('change',showCase);showCase();}
  if(chapter===2&&step===1){const b=document.createElement('button');b.type='button';b.className='sc-import';b.innerHTML='<i data-lucide="arrow-down-to-line"></i>자료의 순서·길이 가져오기';b.title='제공된 수치만 입력합니다. 해석은 직접 작성합니다.';form.querySelector('[name="순서 0"]').closest('.field').before(b);b.onclick=()=>{const names=['선캄브리아시대','고생대','중생대','신생대'],vals=[88.2,6.3,4.1,1.4];for(let i=0;i<4;i++){form.elements['순서 '+i].value=names[i];form.elements['길이 '+i].value=vals[i];}b.dispatchEvent(new Event('input',{bubbles:true}));};}
 }
 function hintsFor(c,s,fallback){return ({
  '1-1':['한 사건을 고르고, 보고된 단서 하나가 어떤 가설과 연결되는지 찾아봐.','원인의 이름보다 “이 단서가 왜 관련 있는가”를 설명해 줘.','아직 근거가 부족하면 보류할 수 있어. 다음에 확인할 자료를 하나 골라 줘.'],
  '1-2':['자료가 보고한 내용과 네 해석을 다른 문장으로 나눠 봐.','이 증거가 내 가설을 지지하더라도 모든 과정을 설명한 것은 아닐 수 있어.','다른 지역, 정확한 시기, 생존에 영향을 준 과정 중 무엇을 더 봐야 할까?'],
  '4-0':['네 시대를 전부 채우기 전에, 두 시대가 만나는 한 경계를 골라 줘.','같은 비교 항목에서 환경과 생물 기록이 어떻게 달라졌는지 보자.','3차시 표본 사진은 선택한 경계에서 함께 발견된 자료가 아니라는 점을 확인해 줘.'],
  '4-1':['환경 변화와 생물 변화 사이에 어떤 생존 조건이 달라졌을까?','“뒤에 일어났다”만으로 부족해. 먹이, 온도, 산소 중 관련된 과정을 연결해 봐.','그 연결을 어느 자료가 지지하고 어느 부분은 더 확인해야 할까?']
 })[c+'-'+s]||fallback;}
 window.FossilScaffold={version,source,cases,caseEvidence,compare,glossary,evidence1,forms1,timeline,clues,specimen,evidence4,forms4,mount,hintsFor};
})();
