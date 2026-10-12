'use strict';
window.MarineGraph = (() => {
 const source = 'https://silurian-reef.fieldmuseum.org/narrative/474';
 const periods = [
  ['Є','캄브리아기',322,454],['O','오르도비스기',459,588],['S','실루리아기',595,651],
  ['D','데본기',659,755],['C','석탄기',765,918],['P','페름기',927,1001],
  ['Tr','트라이아스기',1009,1078],['J','쥐라기',1087,1203],['K','백악기',1214,1362],
  ['Pg','고제3기',1372,1449],['N','신제3기',1457,1490]
 ];
 // Only labels are covered. The museum's plotted shapes, ticks, and arrows remain unchanged.
 function svg({ example=false, teaching=false }={}) {
  return `<svg class="marine-svg" viewBox="0 0 1529 900" width="1529" height="900" role="img" aria-label="한국어 해양 생물 과 다양성 그래프. 왼쪽은 과거, 오른쪽은 현재. 세 색을 합한 맨 위 경계선이 전체 과의 수이며 페름기 말에 큰 감소가 보입니다.">
   <image href="assets/evidence/marine-families.png" x="0" y="0" width="1529" height="797"/>
   <g font-family="Malgun Gothic, sans-serif">
    <rect x="35" y="158" width="48" height="450" fill="white"/><text x="68" y="390" text-anchor="middle" transform="rotate(-90 68 390)" fill="#3c4a4c" font-size="31" font-weight="700">해양 생물 과의 수</text>
    <rect x="744" y="22" width="240" height="88" fill="white"/><text x="864" y="82" text-anchor="middle" fill="#b8200d" font-size="38" font-weight="700">대멸종</text>
    <rect x="344" y="592" width="247" height="21" fill="#003366"/><text x="349" y="608" fill="white" font-size="20">캄브리아형 동물군</text>
    <rect x="542" y="486" width="385" height="42" fill="#3399cc"/><text x="548" y="519" fill="white" font-size="29" font-weight="700">고생대형 동물군</text>
    <rect x="1090" y="430" width="400" height="49" fill="#ffcc66"/><text x="1100" y="466" fill="#3c3527" font-size="30" font-weight="700">현대형 동물군</text>
    <rect x="0" y="620" width="1529" height="280" fill="white"/>
    ${periods.map(([code,name,a,b],i)=>`<rect x="${a}" y="626" width="${b-a}" height="20" fill="${i<6?'#70a4c7':i<9?'#bbdf72':'#f1ee79'}"/><text transform="translate(${(a+b)/2+8} 666) rotate(-55)" text-anchor="end" fill="#263e3f" font-size="26">${name}</text>`).join('')}
    <rect x="1495" y="626" width="8" height="20" fill="#f1ee79"/>
    <rect x="322" y="805" width="679" height="40" fill="#70a4c7"/><text x="661" y="835" text-anchor="middle" font-size="30" fill="#123441">고생대</text>
    <rect x="1009" y="805" width="353" height="40" fill="#bbdf72"/><text x="1185" y="835" text-anchor="middle" font-size="30" fill="#294326">중생대</text>
    <rect x="1372" y="805" width="131" height="40" fill="#f1ee79"/><text x="1437" y="835" text-anchor="middle" font-size="27" fill="#494522">신생대</text>
    <text x="322" y="887" font-size="30" fill="#304849">약 5억 4천만 년 전</text><text x="1005" y="887" text-anchor="middle" font-size="28" fill="#304849">약 2억 5200만 년 전</text><text x="1400" y="887" text-anchor="end" font-size="26" fill="#304849">약 6600만 년 전</text><text x="1502" y="887" text-anchor="end" font-size="28" fill="#304849">현재</text>
   </g>
   ${example?`<g class="marine-mark" ${teaching?'data-step="1"':''} fill="none" stroke="#a12867" stroke-width="6"><path d="M190 335H945 M190 490H1000" stroke-dasharray="12 10"/><circle cx="945" cy="335" r="18"/><circle cx="1000" cy="490" r="18"/></g>`:''}
  </svg>`;
 }
 function figure(options={}) {
  return `<figure class="marine-figure">${options.controls?'<label class="marine-zoom"><input type="checkbox">그래프 확대</label>':''}<div class="marine-scroll" tabindex="0" role="region" aria-label="한국어 그래프">${svg(options)}</div><figcaption>© The Field Museum · CC BY-NC · 원본 곡선 유지, 한국어 표기${options.example?'·읽기 표시':''} 덧붙임. <a href="${source}" target="_blank" rel="noopener">원자료와 해설</a> · <a href="assets/evidence/marine-families.png" target="_blank" rel="noopener">영어 원본</a></figcaption></figure>`;
 }
 function glossary() {
  return `<details class="marine-glossary"><summary>영어·약어 뜻 확인</summary><dl><div><dt>NUMBER OF MARINE FAMILIES</dt><dd>해양 생물 과의 수</dd></div><div><dt>MASS EXTINCTIONS</dt><dd>대멸종</dd></div><div><dt>MILLIONS OF YEARS AGO</dt><dd>백만 년 전 단위. 540은 약 5억 4천만 년 전.</dd></div><div><dt>evolutionary fauna</dt><dd>진화 동물군. 이 그래프에서 묶어 보여 주는 생물군입니다.</dd></div><div><dt>PALEOZOIC / MESOZOIC / CENOZOIC</dt><dd>고생대 / 중생대 / 신생대</dd></div>${periods.map(([code,name])=>`<div><dt>${code}</dt><dd>${name}</dd></div>`) .join('')}</dl><p>맨 오른쪽의 매우 좁은 칸은 원본에 약어가 없으므로 새 이름을 임의로 붙이지 않았습니다. 동물군 이름은 분류 기준을 설명하는 용어이며 이번 수업의 암기 대상이 아닙니다.</p></details>`;
 }
 function student() {
  return `<div class="marine-learning"><h2>생명 기록 그래프 · 한국어 읽기</h2><p><b>먼저 함께 읽기:</b> 무엇을 세었는지와 감소 한 곳을 확인한 뒤, 이 자료로 말할 수 있는 결론을 써 봅시다.</p>${figure({example:true,controls:true})}
   <ol class="marine-read"><li><b>세는 대상:</b> ‘과’는 여러 속을 묶는 분류 단계로, 종보다 큰 묶음입니다. 동물 한 마리씩 센 개체 수가 아닙니다.</li><li><b>가로축:</b> 왼쪽은 과거, 오른쪽은 현재입니다. 가로 길이로 기간을 계산하지 않습니다.</li><li><b>세로축:</b> 세 색을 합한 <strong>맨 위 경계선</strong>의 높이를 읽습니다. 색 하나의 두께는 전체 과의 수가 아닙니다.</li><li><b>색:</b> 서로 다른 생물군을 구분합니다. 한 시기에 여러 색이 함께 보이므로 ‘파랑 시대가 끝나면 노랑 시대’라는 뜻이 아닙니다.</li></ol>
   <section class="marine-worked"><h3>함께 읽은 예: 페름기 말</h3><p>분홍 표시를 따라가면 전체 과의 수가 <b>약 400~500과에서 약 200과로</b> 낮아집니다. 눈금으로 읽은 대략적인 값입니다. 이후의 긴 구간에서는 다시 늘어납니다.</p><p>이것은 ‘기록에 나타난 해양 생물의 다양성이 줄었다’고 해석할 단서입니다. 감소 비율을 개체 수나 종의 멸종률로 바꿔 말할 수는 없습니다.</p></section>
   <p class="marine-boundary"><b>아직 모르는 것:</b> 이 그래프에는 원인 자료가 없습니다. 화산이나 충돌 때문인지, 전 세계 생물 중 몇 %가 사라졌는지까지 확정할 수 없습니다. 다시 증가한 것이 사라진 생물의 부활을 뜻하지도 않습니다.</p>
   <details class="marine-glossary"><summary>다른 사건은 어디일까?</summary><p>오르도비스기 말 · 데본기 후기 · 페름기 말 · 트라이아스기 말 · 백악기 말. 이번에는 교사와 읽은 페름기 말 한 사례로 결론을 써도 됩니다.</p><p>원본에는 캄브리아기의 감소를 가리키는 화살표도 있어 화살표가 6개입니다. 이를 5대 대멸종의 수와 같게 세지 않습니다. 시대 칸의 너비는 2차시의 100cm 비율 띠와 다릅니다.</p></details>${glossary()}
   <p><a href="teacher.html?lesson=1&concept=family" target="_blank" rel="noopener">그림과 단계별 개념 설명 다시 보기</a></p></div>`;
 }
 return { svg, figure, glossary, student, periods };
})();
