'use strict';
(() => {
 if (document.body.dataset.course !== 'fossil' || Number(new URLSearchParams(location.search).get('lesson') || 1) !== 1) return;
 const evidence = document.getElementById('evidence');
 document.body.classList.add('marine-lesson');
 const section = (id,title,body) => `<section class="slide marine-slide" id="${id}" data-title="${title}" data-notes="${id}" data-tile="light"><p class="kicker">1차시 / 그래프를 함께 읽는 준비</p><h2 data-in>${title}</h2>${body}</section>`;
 evidence.insertAdjacentHTML('beforebegin',section('family','‘과’는 한 마리, 두 마리를 센 수가 아닙니다',`
  <p class="family-lead" data-in>종보다 큰 분류 묶음인 <b>과</b>를 셉니다. 여러 속이 한 과에 속합니다.</p>
  <div class="family-demo" data-step="1"><section><h3>과 A</h3><p>속 1 · 속 2</p><div class="family-species"><span>종 가</span><span>종 나</span><span>종 다</span></div></section><section><h3>과 B</h3><p>속 3</p><div class="family-species"><span>종 라</span><span>종 마</span></div></section></div>
  <p class="family-count" data-step="2">이 가상 예의 <strong>과는 2개</strong>, 종은 5개입니다.<br>각 종의 개체가 몇 마리인지는 제시하지 않았습니다.</p>
  <p class="family-summary" data-step="3">이번 그래프: 화석 기록을 바탕으로 시기별 <b>해양 생물 과의 수</b>를 집계</p>
  <p class="foot">분류 단계 설명을 위한 가상 예시입니다. 실제 화석 자료가 아니며, 모든 과의 종 수가 같은 것은 아닙니다.</p>`));
 evidence.classList.add('marine-slide','marine-evidence');
 evidence.innerHTML=`<p class="kicker">1차시 / 축과 색을 함께 읽기</p><h2 data-in>색 하나가 아니라, 맨 위 경계선을 읽습니다</h2><div class="marine-teach-grid"><div>${MarineGraph.figure()}</div><div class="marine-callouts">
  <section data-step="1"><h3>1. 가로축</h3><p>왼쪽 과거 → 오른쪽 현재<br>칸의 길이로 기간을 재지 않아요.</p></section>
  <section data-step="2"><h3>2. 세로축</h3><p>해양 생물 <b>과의 수</b><br>200·400·600 눈금을 확인해요.</p></section>
  <section data-step="3"><h3>3. 세 색의 합계</h3><p><b>맨 위 경계선</b>이 전체 과의 수예요.<br>색 하나의 두께와 구분해요.</p></section>
  <section data-step="4"><h3>색은 생물군 구분</h3><p>같은 시기에 여러 생물군이 함께 있어요. 색 이름은 암기하지 않아요.</p></section>
 </div></div><p class="foot" data-step="4">해양 생물의 기록입니다. 육상 생물을 포함한 지구 전체 생물 수 그래프가 아닙니다.</p>`;
 evidence.insertAdjacentHTML('afterend',section('graph-case','페름기 말, 감소 전과 후를 같이 읽어 봅시다',`
  <div class="marine-teach-grid"><div>${MarineGraph.figure({example:true,teaching:true})}</div><div class="marine-callouts">
   <section data-step="1"><h3>함께 읽은 관찰</h3><p><b>약 400~500과에서<br>약 200과로 감소</b></p><small>눈금에서 읽은 대략적인 값</small></section>
   <section data-step="2"><h3>그 뒤의 변화</h3><p>긴 시간에 걸쳐 다시 증가<br>같은 생물의 부활은 아니에요.</p></section>
   <section data-step="3"><h3>이제 여러분의 판단</h3><p>“항상 늘기만 했다”는 설명,<br>이 자료와 맞을까요?</p></section>
   <section data-step="4"><h3>원인은 아직 몰라요</h3><p>충돌·화산 때문인지는<br>다른 자료가 필요해요.</p></section>
  </div></div><p class="foot">원본의 화살표는 6개입니다. 캄브리아기 감소도 포함되어 있어 5대 대멸종의 수와 다릅니다.</p>`));
 const notes = {
  opening:'25초. 오늘은 대멸종의 원인을 맞히기 전에 그래프가 보여 주는 변화를 함께 읽습니다. 지구 전체 개체 수를 센 자료가 아니라는 점을 먼저 예고합니다.',
  family:'35초. “과가 몇 개인가요?”를 묻고 2개임을 확인합니다. 과 아래 여러 속과 종이 속한다는 관계만 알면 됩니다. 분류 단계 전체를 외우게 하지 않습니다. A와 B는 실제 생물명이 아니라 설명용 묶음입니다. 한 과가 줄었다고 생물이 한 마리 줄었다는 뜻은 아닙니다.',
  evidence:'60초. 왼쪽에서 오른쪽으로 손을 움직여 시간 방향을 짚습니다. 세로축 200·400·600을 읽고, 세 색의 맨 위 경계선을 가리킵니다. 색은 서로 다른 생물군의 누적 표시입니다. 노란 부분의 두께만 읽으면 전체 과의 수가 아닙니다. “현대형”이라는 이름이 그 생물군이 현대에 처음 생겼다는 뜻은 아닙니다. 아래의 시대 이름과 색 안의 생물군 이름을 구분합니다. 가로 길이로 시간이나 회복 속도를 계산하지 않습니다.',
  'graph-case':'45초. 분홍 표시가 나타나면 400과와 600과 사이의 높이에서 약 200과로 내려간다고 읽어 줍니다. 약 400~500과는 눈금에서 읽은 범위이고 원자료의 정밀 수치가 아닙니다. 학생은 이 해석을 바탕으로 “항상 꾸준히 늘었다”는 주장의 적절성을 판단합니다. 이후 증가를 같은 종의 부활로 말하지 않도록 합니다. 그래프만으로 어떤 원인인지, 종이나 개체의 몇 %가 사라졌는지는 알 수 없다고 정리합니다.',
  route:'30초. 원안의 10·12·15·8분 흐름은 유지합니다. 첫 10분은 방금 함께 읽은 사례로 결론을 씁니다. 다섯 감소의 수치를 모두 옮기는 과제가 아닙니다. 뒤의 원인 가설 선택은 맞히기 시험이 아니며 판단 보류를 허용합니다.',
  roles:'45초. 화면의 역할별 장소 사진과 시범 문장을 봅니다. 관찰 예시는 교사가 제공하고, 학생은 무엇을 말할 수 있고 없는지 판단합니다. 역할은 전용 방 이름이 아니라 모둠 안의 분담입니다. 다음 차시에는 역할을 순환합니다.',
  start:'20초. 첫 활동에서는 ‘늘기만 했는가?’에 대한 결론과 그래프로 확정할 수 없는 점을 남깁니다. 필요하면 학생 자료의 한국어 해설을 다시 읽습니다. 기록은 자동 전송되지 않으므로 종료 전 교사가 정한 제출 경로로 내보냅니다.'
 };
 Object.assign(window.NOTES,notes);
 const credit=document.getElementById('app-credit');if(credit)credit.textContent=credit.textContent.replace('2026-10-11','2026-10-12');
 const guide = document.getElementById('guideBody');
 const oldHeading = Array.from(guide.querySelectorAll('h2')).find(x=>x.textContent==='3~5분 도입 대본');
 if(oldHeading){let next=oldHeading.nextElementSibling;while(next&&next.tagName!=='H2'){const remove=next;next=next.nextElementSibling;remove.remove();}oldHeading.insertAdjacentHTML('afterend','<p>총 약 4분 20초. 원안의 도입 5분에 포함하며, 더 필요한 설명은 첫 그래프 활동 10분에 이어서 진행합니다.</p>'+Object.entries(notes).map(([id,text])=>`<p><b>${document.getElementById(id).dataset.title}</b><br>${text}</p>`).join(''));}
 guide.insertAdjacentHTML('beforeend',`<section><h2>그래프 지도 시 확인할 개념</h2><p>학생에게 곡선 해독을 전부 맡기지 않습니다. 축·색·감소 예시를 제공한 뒤 결론과 한계를 학생이 판단하게 합니다. 예시 문장을 답안 칸에 자동 입력하지 않습니다.</p>${MarineGraph.glossary()}<p>과의 수 감소는 해양 생물 다양성 변화의 단서입니다. 과의 감소율을 종 멸종률·개체 감소율로 바꾸지 않습니다. 이 곡선만으로 자료 오류 여부나 보존·채집의 영향을 모두 판별할 수도 없습니다.</p><p>출처: <a href="https://silurian-reef.fieldmuseum.org/narrative/474" target="_blank" rel="noopener">The Field Museum · Biodiversity through geologic time</a>. 한국어 표기와 분홍 읽기 표시를 덧붙였으며 원본 곡선을 새 수치로 재작성하지 않았습니다.</p></section>`);
 const concept=new URLSearchParams(location.search).get('concept');
 if(['family','evidence','graph-case'].includes(concept)&&!location.hash){const index=Array.from(document.querySelectorAll('#stage>.slide')).findIndex(x=>x.id===concept);history.replaceState(null,'',location.pathname+location.search+'#'+(index+1)+'.0');}
})();
