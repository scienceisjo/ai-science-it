'use strict';
(() => {
 if(document.body.dataset.course!=='netzero')return;
 const q=new URLSearchParams(location.search),n=Math.max(0,Math.min(3,(+q.get('lesson')||1)-1)),d=EcoLearning.lessons[n];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const diagrams=[
  '<div class="concept-visual"><p class="visual-label">비율 읽기 연습 · 가상값</p><div class="energy-example"><b>전체 100</b><div class="energy-bar" style="width:50%"><span style="width:20%">20</span><i>80</i></div><b>전체 200</b><div class="energy-bar"><span style="width:30%">60</span><i>140</i></div></div><p class="visual-legend">초록: 저탄소 · 회색: 나머지</p><p data-step="1">저탄소 비율: 20% → 30%</p><p data-step="2">나머지의 양: 80 → 140</p><p class="visual-check" data-step="3">비율이 커져도 나머지의 양이 줄었다고 보장할 수 없다.</p></div>',
  '<div class="concept-visual"><p class="visual-label">원인 판단 연습 · 가상 상황</p><div class="causal-example"><b>정책 시행 전<br>배출 200</b><span>→</span><b>정책 시행 뒤<br>배출 160</b></div><p>단위: tCO₂e/년 · 같은 집계 범위로 가정</p><p data-step="1">관찰: 두 시점 사이에 40 감소했다.</p><p data-step="2">추론: 정책이 영향을 주었을 수 있다.</p><p class="visual-check" data-step="3">날씨·인구·경기·동시 정책도 확인해야 원인을 좁힐 수 있다.</p></div>',
  '<div class="concept-visual"><p class="visual-label">하루 수지 연습 · 가상값</p><table class="concept-table"><tr><th></th><th>낮</th><th>밤</th><th>합계</th></tr><tr><th>소비</th><td>4</td><td>6</td><td>10</td></tr><tr><th>발전</th><td>10</td><td>0</td><td>10</td></tr></table><p>단위: kWh · 저장장치 없음</p><p data-step="1">하루 발전−소비 = 0kWh</p><p data-step="2">낮 잉여 6kWh, 밤 부족 6kWh</p><p class="visual-check" data-step="3">하루 수지가 0이어도 시간별 부족 전력은 남는다.</p></div>',
  '<div class="concept-visual"><p class="visual-label">앱의 단순 모형 기본 가정으로 비교</p><table class="concept-table"><tr><th>대안</th><th>운영 배출</th><th>자원</th></tr><tr><th>A 태양광·단열</th><td>840</td><td>5점</td></tr><tr><th>B 교통·단열</th><td>867.5</td><td>5점</td></tr></table><p>배출 단위: tCO₂e/년 · 가상 기준 1,000</p><p data-step="1">탄소 계산값은 A가 더 작다.</p><p data-step="2">두 대안이 바꾸는 생활 조건은 다르다.</p><p class="visual-check" data-step="3">지붕 조건·외곽 통행·주민 부담을 확인한 뒤 선택한다.</p></div>'
 ];
 const title=['비율과 양은 다른 질문에 답합니다','관찰한 변화와 원인 설명은 다릅니다','합계가 같아도 시간은 맞지 않을 수 있습니다','계산 결과 하나로 설계를 결정하지 않습니다'][n];
 const evidence=document.getElementById('evidence');
 evidence.innerHTML='<p class="kicker">'+(n+1)+'차시 / 함께 읽는 예시</p><h2>'+title+'</h2><div class="learning-teacher-split">'+diagrams[n]+'<div class="teacher-three"><div data-step="1"><b>먼저 확인</b><p>'+esc(d.steps[n===0?2:1].terms)+'</p></div><div data-step="2"><b>여기까지 말할 수 있다</b><p>'+esc(['비율·양의 관계를 점검할 수 있다. 가상 연습값을 실제 국가 통계로 인용하지 않는다.','정책 전후의 변화는 관찰이다. 정책만의 효과 크기는 이 비교만으로 확정하지 않는다.','하루 에너지 수지와 시간별 부족량은 다른 계산이다. 둘 다 확인한다.','가정 안에서 두 대안의 배출과 자원을 비교한다. 실제 성과·경제 예측과 구분한다.'][n])+'</p></div><div data-step="3"><b>오늘 학생이 할 판단</b><p>'+esc(d.exit)+'</p></div></div></div>';
 const concept=document.createElement('section');concept.className='slide';concept.id='learning-goals';concept.dataset.title='오늘 배울 것';concept.dataset.notes='learning-goals';concept.dataset.tile='light';
 concept.innerHTML='<p class="kicker">'+(n+1)+'차시 / 학습 목표</p><h2>'+esc(d.question)+'</h2><ol class="learning-teacher-goals">'+d.goals.map((g,i)=>'<li data-step="'+(i+1)+'"><span>0'+(i+1)+'</span>'+esc(g)+'</li>').join('')+'</ol><p class="foot">'+esc(EcoLearning.purpose)+'</p>';
 document.getElementById('opening').after(concept);
 window.NOTES['learning-goals']='35초. 세 목표를 읽되 용어 정의를 모두 설명하지 않습니다. 오늘은 자료를 읽는 도움을 받은 뒤 스스로 판단하고, 그 판단의 근거와 한계를 남기는 수업이라고 안내합니다.';
 window.NOTES.evidence='75초. 연습 예시임을 먼저 밝힙니다. 방향키마다 관찰 → 해석 → 한계로 설명합니다. '+d.teacher+' 숫자와 읽는 방법은 지원하되 실제 활동의 최종 주장은 학생이 선택하도록 합니다.';
 window.NOTES.opening='30초. '+window.NOTES.opening.replace(/^40초\. /,'');
 window.NOTES.route='30초. '+window.NOTES.route.replace(/^55초\. /,'');
 window.NOTES.roles='40초. '+window.NOTES.roles.replace(/^50초\. /,'');
 const lesson4=CLASSROOM_COURSES.netzero.lessons[3];
 lesson4.notes[3]='40초. 외부 AI 모델이 없으면 기본 모형을 검토하고 핵심 학습 기록을 보존합니다. AI 생성 결과 검증과 원안 전체 프로젝트 완료는 미완료로 표시합니다. 실제 AI 검증을 실시한 경우와 섞어 연구 분석하지 않습니다.';
 if(n===3)window.NOTES.roles=lesson4.notes[3];
 const guide=document.getElementById('guideBody');
 const scriptHeading=[...guide.querySelectorAll('h2')].find(el=>el.textContent==='3~5분 도입 대본');
 if(scriptHeading){
  let node=scriptHeading.nextElementSibling;
  while(node&&node.tagName!=='H2'){const next=node.nextElementSibling;node.remove();node=next}
  scriptHeading.insertAdjacentHTML('afterend',[['opening','사건'],['learning-goals','학습 목표'],['evidence','개념과 자료'],['route','순서'],['roles','역할과 산출물'],['start','시작']].map(([key,label],i)=>'<p><b>'+(i+1)+'. '+label+'</b><br>'+esc(window.NOTES[key])+'</p>').join(''));
 }
 document.querySelector('#roles .deliverable p').textContent=d.output;
 document.querySelectorAll('#route .mission-flow time').forEach((el,i)=>el.textContent=d.times[i]+'분');
 const rubric=[['자료 읽기','수치·대상·연도·단위·범위가 맞는가?','선택한 자료를 근거로 쓰는 이유를 설명한다.'],['과학·모형','에너지/탄소, 관찰/추론, 실측/가정을 구분하는가?','모형의 전제와 적용할 수 없는 범위를 말한다.'],['비교·설계','같은 기준의 비교와 다른 대안을 검토했는가?','변인 통제·시민 부담·필요 조건을 연결한다.'],['판단 수정','처음 설명과 지금 설명 사이의 이유가 있는가?','수정 또는 유지의 근거와 추가 확인 사항을 밝힌다.']];
 const guideIntro='<section class="teacher-learning-guide"><h2>이번 보강본의 운영 기준</h2><p><b>활동 버전 '+esc(EcoLearning.version)+'</b> · 원래 4차시의 자료→논증→설계·검증 순서를 유지합니다.</p><p>기본 도입은 약 4분(30+35+75+30+40+30초)입니다. 질문·응답을 더 받으면 5분까지 쓰고, 첫 단계 시간 안에 포함합니다. 실측한 수업 소요 시간이 아니라 운영 제안입니다.</p><h3>50분 안에서 우선할 것</h3><ol><li>교사 도입·단위 읽기 시범은 첫 단계에 포함합니다.</li><li>마지막 단계의 끝 5분은 발표·되돌아보기·기록 내보내기에 남깁니다.</li><li>모든 도움말을 다 읽히지 않습니다. 막히는 단계에서 필요한 도움만 엽니다.</li><li>맵 이동이 길어지면 탐구의 “다음 자료”로 같은 과제를 이어 갑니다. 이동 속도는 평가하지 않습니다.</li><li>시민 설계회의는 별도 선택 활동입니다. 필요하면 추가 시간을 확보하거나 같은 차시 정리 활동을 명시적으로 대체합니다. 50분 뒤에 의무로 더하지 않습니다.</li></ol><h3>오늘 학생에게 요구할 최소 기록</h3><p>'+esc(d.output)+'</p><p>'+esc(d.teacher)+'</p><h3>학생 설명을 확인하는 관찰 기준</h3><p>아래는 수업 피드백용 기준이며 타당도가 검증된 연구 검사나 자동 점수가 아닙니다.</p><table><tr><th>영역</th><th>교사의 확인 질문</th><th>근거가 드러난 설명</th></tr>'+rubric.map(r=>'<tr>'+r.map(t=>'<td>'+esc(t)+'</td>').join('')+'</tr>').join('')+'</table><p>이동·클릭·힌트 열기 횟수를 성취 점수로 바꾸지 않습니다. 판단이 교사와 달라도 자료와 논리가 타당한지 확인합니다. “아직 모른다”에도 필요한 자료가 구체적인지 묻습니다.</p><h3>계정·기기 문제가 있을 때</h3><p>AI API와 학급 서버가 연결되지 않은 공개판에서는 고정 질문과 기기 저장만 제공합니다. 4차시는 핵심 기록과 실제 AI 모델 검증을 별도로 표시합니다. 기본 모형은 AI 결과가 아니며, AI 검증을 하지 않았는데 완료한 것으로 코딩하지 않습니다.</p><h3>연구 시작 전에 확정할 사항</h3><ul><li>연구 질문이 AI 효과인지 가상 공간을 포함한 수업 패키지 효과인지 먼저 정합니다.</li><li>AI 효과 비교라면 두 집단의 자료·도움말·시간·교사 개입·이동 및 회의 선택 조건을 같게 유지하고 실제 AI 사용 여부를 별도 기록합니다.</li><li>모둠 공동 결과물과 개인 학습 결과를 구분합니다. 발표와 퇴장 질문은 개인이 설명하게 하고, 같은 기기의 모둠 기록을 여러 개인의 독립 기록으로 복제하지 않습니다.</li><li>사전·사후 검사는 4×50분 밖에 시간을 따로 배정합니다. 현재 검사 A/B는 유사한 구조·추가 자료 반전이라 반복 학습 효과가 생길 수 있습니다. 검증된 검사로 간주하지 말고 연구진이 동형성·내용타당도·채점 일치도를 검토해야 합니다.</li><li>수업 도중 자료와 도움말 버전을 바꾸지 않습니다. 이 보강본은 기존 연구 진행 중인 버전에 덮어 적용하지 않습니다.</li><li>학습 기록은 교사가 정한 비공개 경로로 받습니다. 공개 게시판에 학생 이름·학번·대화 기록을 올리지 않습니다.</li></ul><h3>자료 기준</h3><p>앱의 고정 스냅샷은 2026-09-25입니다. OWID 원사이트의 현재 표와 수업 저장본을 혼용하지 않습니다. 현재 OWID는 1차에너지 산정 방법 변경을 안내하고 있어, 다음 연구 버전의 자료를 갱신할 때 방법과 메타데이터를 함께 확인해야 합니다.</p><p><a href="https://ourworldindata.org/energy-mix" target="_blank" rel="noopener">OWID 에너지 구성·산정 방법</a> · <a href="https://ourworldindata.org/co2-and-greenhouse-gas-emissions" target="_blank" rel="noopener">OWID CO₂·온실가스 자료의 범위</a></p></section>';
 guide.insertAdjacentHTML('afterbegin',guideIntro);
 guide.querySelectorAll('p').forEach(p=>{if(p.textContent.includes('앱도 GLB 없는 최종 완료를 승인하지 않습니다.'))p.textContent='외부 AI 도구가 준비되지 않으면 기본 배치 모형 검토와 핵심 학습 기록을 보존합니다. AI 생성 결과 검증은 미완료로 남깁니다. 전체 프로젝트 완료와 구분하세요.'});
 const credit=document.getElementById('app-credit'),creditText=credit.textContent.replace('2026-10-11','2026-10-26');credit.innerHTML='<img src="assets/brand/hnr-tech-mark.webp" alt="HNR TECH"> '+esc(creditText)+' · 시나리오 노동규';
 document.getElementById('start').querySelector('.kicker').textContent=(n+1)+'차시 / 탐구 시작';
 const brand=document.createElement('img');brand.src='assets/brand/hnr-tech-mark.webp';brand.alt='HNR TECH';brand.className='teacher-hnr';document.querySelector('.course-tools').prepend(brand);
})();
