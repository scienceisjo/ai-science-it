'use strict';
window.PresentationTools = {
  mount(config) {
    const icon = (name, label, id) => '<button type="button" id="'+id+'" title="'+label+'" aria-label="'+label+'"><i data-lucide="'+name+'"></i></button>';
    const option = (value, text) => { const el=document.createElement('option'); el.value=value; el.textContent=text; return el; };
    if (!config.active) {
      const button=document.createElement('button');button.type='button';button.className='icon presentation-entry';
      button.title=button.ariaLabel='발표용 미리보기 · 학생 기록과 분리';button.innerHTML='<i data-lucide="presentation"></i>';
      button.onclick=()=>location.assign(config.lessonURL(config.lesson));
      document.querySelector(config.entry)?.append(button);window.lucide?.createIcons();return;
    }
    document.body.classList.add('presentation-mode');
    const bar=document.createElement('nav');bar.id='presentation-tools';bar.setAttribute('aria-label','발표용 바로가기');
    bar.innerHTML='<span class="presentation-status">발표 모드 <small>학생 기록과 분리</small></span><select id="present-lesson" aria-label="발표할 차시"></select><select id="present-place" aria-label="발표할 장소"></select>'
      +icon('map-pin','선택한 장소로 바로 이동','present-jump')
      +icon('book-open','선택한 장소의 탐구 열기','present-inquiry')
      +icon('clapperboard','현재 차시 도입 이야기','present-story')
      +icon('log-out','발표 종료 · 학습 화면으로','present-exit');
    document.body.append(bar);
    const select=bar.querySelector('#present-lesson'),places=bar.querySelector('#present-place');
    config.lessons.forEach((label,i)=>select.append(option(i+1,(i+1)+'차시 · '+label)));select.value=config.lesson;
    config.places.forEach(p=>places.append(option(p.id,p.name)));
    select.onchange=()=>location.assign(config.lessonURL(Number(select.value)));
    bar.querySelector('#present-jump').onclick=()=>config.jump(places.value);
    bar.querySelector('#present-inquiry').onclick=()=>config.inquiry(places.value);
    bar.querySelector('#present-story').onclick=()=>config.story();
    bar.querySelector('#present-exit').onclick=()=>location.assign(config.exitURL);
    window.lucide?.createIcons();
  }
};
