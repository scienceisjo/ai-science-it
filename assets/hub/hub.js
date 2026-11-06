'use strict';
(() => {
 const key='ai-science-it-teacher-checklist-v1', inputs=[...document.querySelectorAll('[data-check]')];
 let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 const status=document.querySelector('#check-count');
 function update(){if(status)status.textContent=inputs.filter(el=>el.checked).length+' / '+inputs.length+'개 확인';}
 for(const input of inputs){input.checked=saved[input.dataset.check]===true;input.addEventListener('change',()=>{saved[input.dataset.check]=input.checked;try{localStorage.setItem(key,JSON.stringify(saved))}catch{const n=document.querySelector('#check-note');if(n)n.textContent='이 브라우저에서는 점검표가 저장되지 않습니다. 인쇄해서 확인해 주세요.'}update()});}update();
 document.querySelector('#reset-checks')?.addEventListener('click',()=>{saved={};inputs.forEach(el=>el.checked=false);try{localStorage.removeItem(key)}catch{}update()});
 document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
   const url=new URL(button.dataset.copy,location.href).href, message=button.closest('.share-area')?.querySelector('[role=status]');
   try{await navigator.clipboard.writeText(url);if(message)message.textContent='링크를 복사했습니다.'}
   catch{let field=button.closest('.share-area')?.querySelector('.share-input');if(!field){field=document.createElement('input');field.className='share-input';field.readOnly=true;field.setAttribute('aria-label','복사할 자료 모음 주소');button.closest('.share-area')?.append(field)}field.value=url;field.focus();field.select();if(message)message.textContent='주소를 선택했습니다. 복사해서 공유해 주세요.'}
 }));
 document.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
 let previous=null;window.addEventListener('beforeprint',()=>{if(previous)return;previous=[...document.querySelectorAll('details')].map(el=>[el,el.open]);previous.forEach(([el])=>el.open=true)});window.addEventListener('afterprint',()=>{if(!previous)return;previous.forEach(([el,open])=>el.open=open);previous=null});
 const links=[...document.querySelectorAll('.manual-toc a')];
 if('IntersectionObserver' in window && links.length){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){links.forEach(link=>{if(link.hash==='#'+entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')})}},{rootMargin:'-10% 0px -65% 0px'});document.querySelectorAll('.manual-body section[id]').forEach(el=>observer.observe(el));}
})();
