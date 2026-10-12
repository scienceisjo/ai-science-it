'use strict';
(() => {
 if(document.body.dataset.course!=='fossil')return;
 const requested=Number(new URLSearchParams(location.search).get('lesson'));
 const lesson=[1,2,3,4].includes(requested)?requested:1;
 const content={
  1:{title:'어려운 용어보다, 그 증거가 말하는 것',body:`<div class="sc-teach-columns"><section data-step="1"><h3>페름기 말</h3><p>화산 물질이 있는 층<br>+ 화석군의 급격한 소멸</p><b>활동과 변화의 관련성 검토</b></section><section data-step="2"><h3>백악기 말</h3><p>충돌 구조<br>+ 이리듐 농도 이상</p><b>서로 다른 충돌 단서 연결</b></section></div><p class="sc-teach-takeaway" data-step="3">학생의 일: 한 사건 선택 → 가설과 단서 연결 → 모르는 점 남기기</p><p class="foot">용어는 외우지 않습니다. 동위원소·온도 지표의 뜻은 학생 자료와 교사 운영 안내에 있습니다.</p>`,
   note:'35초. 연구에서 보고한 내용과 그것으로 설명하려는 가설을 구분합니다. 이리듐은 주변 층보다 많다는 뜻이지 원소 하나만으로 원인을 모두 확정한다는 뜻이 아닙니다. 동위원소는 질량이 다른 탄소의 종류이며 비율 변화는 탄소 순환의 단서입니다. 온도 지표는 과거 바다에 온도계를 넣어 잰 값이 아니라 간접 추정입니다. 한 사건을 집중 검토하고 나머지는 선택 활동으로 둡니다.'},
  2:{title:'길이로 옮길 것은 시간의 비율입니다',body:`<div class="sc-teach-equation" data-step="1"><span>지구 역사 전체<br><b>100cm</b></span><span>고생대 비율<br><b>6.3%</b></span><span>띠의 길이<br><b>6.3cm</b></span></div><p class="sc-teach-formula" data-step="1">100cm × 6.3 ÷ 100 = 6.3cm</p><div class="sc-teach-columns" data-step="2"><section><h3>표준 화석 · 언제?</h3><p>한 종이 존재한 지질학적 기간<br>≠ 한 마리의 수명</p></section><section><h3>시상 화석 · 어떤 환경?</h3><p>생활 조건이 환경의 단서<br>≠ 사진만 보고 정확한 기후 확정</p></section></div><p class="foot" data-step="3">6.3%는 원안의 반올림 수업 자료입니다. 자료 가져오기 뒤 학생은 같은 길이 배치의 문제점을 설명합니다.</p>`,
   note:'45초. 지구 역사 전체를 100cm로 놓으니 1%가 1cm입니다. 고생대 6.3%를 6.3cm로 옮기는 예시를 함께 봅니다. 수치 입력은 자료 가져오기 버튼으로 줄이고 비율의 의미를 묻습니다. 표준 화석에서 짧은 기간은 개체 수명이 아니라 한 종이 기록에 존재한 지질학적 기간입니다. 정확한 연대를 숫자로 재는 도구와 혼동하지 않습니다.'},
  3:{title:'사진에 없는 정보는 출처를 붙여 더합니다',body:`<ol class="sc-teach-ladder"><li data-step="1"><b>관찰</b><p>삼엽충 사진에서 마디가 반복된다.</p></li><li data-step="2"><b>제공된 지식</b><p>BGS: 산출 암석·함께 나온 화석이 해양 생활의 근거다.</p></li><li data-step="3"><b>범위를 지킨 해석</b><p>바다에 살던 생물로 해석한다.<br>정확한 수심·수온·몸 색은 아직 모른다.</p></li></ol><p class="foot">표본을 바꾸면 배경 설명도 바뀝니다. 네 표본은 같은 시대·장소에서 함께 나온 자료가 아닙니다.</p>`,
   note:'45초. 사진의 마디와 해양 서식 정보가 서로 다른 출처에서 왔음을 말합니다. 관찰, 제공된 지식, 해석을 구분해 문장을 만듭니다. 조개는 모두 얕고 따뜻한 바다라는 설명을 경계합니다. 식물 잎이 나온 곳이 곧 식물이 자라던 자리라고 단정하지 않습니다. 표본 정보는 답안 전체가 아니며 학생은 한계와 추가 자료를 직접 선택합니다.'},
  4:{title:'시대 전체 대신, 한 경계 전후를 연결합니다',body:`<div class="sc-teach-columns" data-step="1"><section><h3>고생대 말 → 중생대 초</h3><p>페름기 말 해양 지층<br>수온 단서와 화석군 변화</p></section><section><h3>중생대 말 → 신생대 초</h3><p>백악기 말 충돌 경계<br>환경 교란과 생물군 변화</p></section></div><div class="sc-teach-chain" data-step="2"><span>햇빛 감소</span><b>→</b><span>광합성·먹이 영향</span><b>→</b><span>생존 조건 변화</span></div><p class="sc-teach-takeaway" data-step="3">연결 예시이지 모든 멸종의 단일 원인이 아닙니다.</p><p class="foot">선택한 경계의 비교 해설과 출처를 사용합니다. 선택하지 않은 시대의 자료를 억지로 채우지 않습니다.</p>`,
   note:'45초. 인접한 두 시대를 연결하되 한 경계로 범위를 좁힙니다. 백악기 말 사례에서 햇빛 감소가 광합성 생물과 먹이 관계에 영향을 줄 수 있음을 연결 예시로 설명합니다. 충돌 직후 변화가 신생대 전체 기후라는 뜻은 아닙니다. 모둠은 비교 해설에서 근거를 고르고, 자료가 없는 시대 칸은 비워 둡니다. 3차시 사진을 이 경계의 직접 출토 자료로 쓰지 않습니다.'}
 };
 const d=content[lesson],route=document.getElementById('route');
 route.insertAdjacentHTML('beforebegin',`<section class="slide scaffold-slide" id="support" data-title="개념을 연결하는 시범" data-notes="support" data-tile="light"><p class="kicker">${lesson}차시 / 함께 읽고 판단하기</p><h2 data-in>${d.title}</h2>${d.body}</section>`);
 window.NOTES.support=d.note;
 const seconds=lesson===1?{opening:20,family:30,evidence:50,'graph-case':40,support:35,route:25,roles:35,start:20}:{opening:30,evidence:55,support:45,route:45,roles:45,start:25};
 for(const [id,sec] of Object.entries(seconds))window.NOTES[id]=window.NOTES[id].replace(/^\d+초\./,sec+'초.');
 if(lesson===1)window.NOTES.route='25초. 다섯 가설의 뜻을 읽고 페름기 말 또는 백악기 말 한 사건을 집중 검토합니다. 다른 사건의 선택은 필수가 아닙니다. 가설 선택, 근거 검토, 판단의 수정 여부를 연결해 봅니다. 답안 완성 표시를 과학적 정답으로 평가하지 않습니다.';
 if(lesson===2)window.NOTES.evidence='55초. 25cm씩인 초기 기록을 검토하고 다음 장면에서 고생대 비율의 변환을 함께 보여 줍니다. 값을 숨겨 맞히게 하지 않습니다. 순서·수치는 제공하되 왜 같은 길이가 아닌지 학생이 설명하도록 합니다.';
 if(lesson===4){
  window.NOTES.roles='45초. 모둠은 한 경계 전후의 복원지도를, 개인은 그 근거를 연결한 보고서 설계도를 남깁니다. 선택하지 않은 시대를 다 채우게 하지 않습니다. 시기·지역, 환경 단서, 생물 단서, 연결 설명, 한계를 확인합니다. 기존 수행평가 상세 기준은 담당 교사가 안내합니다.';
  document.querySelector('#roles .deliverable p').textContent='선택한 경계의 모둠 복원지도 + 개인 보고서 설계도';
 }
 const notesInOrder=Array.from(document.querySelectorAll('#stage>.slide')).map(s=>[s.dataset.title,window.NOTES[s.id]]);
 const guide=document.getElementById('guideBody'),heading=Array.from(guide.querySelectorAll('h2')).find(x=>x.textContent==='3~5분 도입 대본');
 if(heading){let next=heading.nextElementSibling;while(next&&next.tagName!=='H2'){const remove=next;next=next.nextElementSibling;remove.remove();}const total=Object.values(seconds).reduce((a,b)=>a+b,0);heading.insertAdjacentHTML('afterend',`<p>총 약 ${Math.floor(total/60)}분 ${total%60}초. 도입 5분 안에 포함합니다. 자세한 해설은 각 탐구 자료에서도 다시 볼 수 있습니다.</p>`+notesInOrder.map(([title,note])=>`<p><b>${title}</b><br>${note}</p>`).join(''));}
 guide.insertAdjacentHTML('beforeend',`<h2>도움은 제공하고 판단은 남기는 운영</h2><p>자료를 읽는 방법과 용어의 뜻은 함께 설명합니다. 학생은 설명의 적절성·근거·한계를 판단합니다. 도움을 사용했다는 이유로 감점하지 않습니다. 본문을 모두 읽어 주기보다 시범 하나 후 학생이 적용하게 합니다.</p><h3>검토 예시 · 자동 채점 아님</h3><table><thead><tr><th>확인할 것</th><th>충분한 응답의 특징</th><th>다시 물을 부분</th></tr></thead><tbody><tr><td>근거</td><td>자료 번호·내용·시기 또는 지역이 맞는다.</td><td>출처 없이 “그냥 그럴 것 같다”고 설명한다.</td></tr><tr><td>연결</td><td>환경이 생존 조건에 어떻게 영향을 주는지 설명한다.</td><td>앞뒤로 일어났다는 사실만으로 원인이라고 한다.</td></tr><tr><td>한계</td><td>확인하지 못한 부분과 필요한 자료가 연결된다.</td><td>“모른다”만 쓰거나 모든 지역에 일반화한다.</td></tr></tbody></table><p>부분적으로 근거만 제시했다면 연결 이유를, 설명만 제시했다면 근거를 되묻습니다. 이 표는 관찰 준거이며 원안의 7/15/8 배점을 대신하지 않습니다.</p><p>응답 예시: “자료에서 환경과 생물 기록의 변화가 함께 보이지만, 그 사이 과정은 더 확인해야 한다.” 부족한 응답: “둘 다 바뀌었으니 무조건 원인이다.” 학생이 실제로 고른 사건의 자료 번호와 내용을 추가해야 완성된 응답입니다.</p><h2>연구 기록의 버전</h2><p>새로 작성·수정한 응답에는 자료 버전 ${FossilScaffold.version}을 남깁니다. 기존 응답은 자동으로 고치지 않습니다. 도움의 양과 필수 문항이 바뀌었으므로 이전 버전과 단순 합산하지 말고 연구진이 분석 기준을 먼저 정합니다.</p>`);
 if(lesson===1)guide.insertAdjacentHTML('beforeend','<h2>증거 용어와 두 사건의 해설</h2>'+FossilScaffold.glossary()+FossilScaffold.caseEvidence('permian')+FossilScaffold.caseEvidence('cretaceous'));
 if(lesson===4)guide.insertAdjacentHTML('beforeend','<h2>보고서의 비교 범위</h2><p>두 시대의 특정 경계 전후를 비교하는 것이며 네 시대 전체의 환경을 전부 조사한 것으로 처리하지 않습니다. 원래 수행평가가 전체 시대를 요구하면 이 시간 이후 추가 조사 시간을 확보합니다.</p>'+FossilScaffold.compare('permian')+FossilScaffold.compare('cretaceous'));
 const credit=document.getElementById('app-credit');if(credit)credit.textContent=credit.textContent.replace('2026-10-11','2026-10-12');
 if(new URLSearchParams(location.search).get('concept')==='support'&&!location.hash){const i=Array.from(document.querySelectorAll('#stage>.slide')).findIndex(s=>s.id==='support');history.replaceState(null,'',location.pathname+location.search+'#'+(i+1)+'.0');}
})();
