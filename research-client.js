'use strict';
window.Research=(()=>{
 const staticHosting=document.querySelector('meta[name="netzero-hosting"]')?.content==='static';
 let member=null,timer=null,inflight=false,pending=false,blocked=false,ready=false;
 const credential=()=>!staticHosting&&sessionStorage.getItem('researchRole')==='student'?sessionStorage.getItem('researchToken')||'':'';
 async function call(route,data){const r=await fetch('/api/research/'+route,{method:data?'POST':'GET',headers:{'content-type':'application/json','x-research-token':credential()},...(data?{body:JSON.stringify(data)}:{})});const d=await r.json();if(!r.ok){const e=Error(d.error);e.status=r.status;throw e}return d}
 function notice(message){const el=document.querySelector('#research-status');if(el)el.textContent=message}
 function gate(message){blocked=true;pressed.clear();document.querySelectorAll('dialog[open]').forEach(d=>d.close());let el=document.querySelector('#research-gate');if(!el){el=document.createElement('div');el.id='research-gate';el.style.cssText='position:fixed;inset:0;z-index:100;background:#f6f8f8;display:grid;place-content:center;padding:28px;';el.innerHTML='<h2>연구 참여 상태</h2><p></p><a href="research.html">검사·참여 현황으로</a>';document.body.append(el)}el.querySelector('p').textContent=message}
 async function boot(){
  if(!credential())return;
  try{member=await call('me');SAVE='netzero_research_'+member.participant.id;
   const local=JSON.parse(localStorage.getItem(SAVE+'_pending')||'null');
   S={...fresh(),...(member.snapshot||{}),id:member.participant.id,mode:member.mode};
   if(local?.dirty&&local.revision===member.participant.revision){S={...fresh(),...local.snapshot,id:member.participant.id,mode:member.mode};pending=true}
   else if(local?.dirty){localStorage.setItem(SAVE+'_conflict',JSON.stringify(local));notice('미전송 기록과 서버 기록이 충돌했습니다. 로컬 보류 파일을 보존했습니다.');sessionStorage.setItem('researchConflict','1')}
   if(member.phase!=='learning')gate('현재 단계는 '+({pre:'사전 검사',post:'사후 검사',closed:'종료'}[member.phase]||member.phase)+'입니다.');
  }catch(e){gate(e.message)}
 }
 function cache(){if(!member)return;try{localStorage.setItem(SAVE+'_pending',JSON.stringify({revision:member.participant.revision,snapshot:S,dirty:pending}))}catch{notice('저장 공간 부족 · 탐구 기록을 파일로 내보내세요.')}}
 function schedule(){if(!ready||!member||blocked)return;S.mode=member.mode;pending=true;cache();clearTimeout(timer);timer=setTimeout(sync,1200)}
 async function sync(){if(!pending||inflight||blocked||!member)return;inflight=true;pending=false;notice('학급에 기록 전송 중');try{const d=await call('sync',{revision:member.participant.revision,snapshot:structuredClone(S)});member.participant.revision=d.revision;cache();notice('학급 기록 저장됨 · '+new Date(d.updated).toLocaleTimeString('ko-KR'))}catch(e){pending=true;cache();notice('미전송 · '+e.message);if([401,403,409].includes(e.status))gate(e.message)}finally{inflight=false;if(pending&&!blocked)timer=setTimeout(sync,5000)}}
 function init(){
  const tools=document.querySelector('body>header .tools');const a=document.createElement('a');a.href='research.html';a.textContent=staticHosting?'연구 안내':member?'연구 현황':'연구 참여';a.style.cssText='font-size:12px;white-space:nowrap';tools.append(a);
  if(!member)return;const el=document.createElement('div');el.id='research-status';el.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#fff;padding:3px 12px;font-size:11px;z-index:25;text-align:center';document.body.append(el);notice(sessionStorage.getItem('researchConflict')?'서버 기록 사용 중 · 로컬 미전송 기록은 보관됨':'학급 연결 · '+member.className+' · '+member.participant.alias);
  if(localStorage.getItem(SAVE+'_conflict')){const restore=document.createElement('button');restore.textContent='보류 기록 저장';restore.style.fontSize='11px';restore.onclick=()=>{const u=URL.createObjectURL(new Blob([localStorage.getItem(SAVE+'_conflict')],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='pending-study-record.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};tools.append(restore)}
  const mode=document.querySelector('[data-setting="mode"]');if(mode)mode.disabled=true;
  document.addEventListener('change',e=>{if(e.target.dataset.setting==='mode'){S.mode=member.mode;renderCoach()}},true);
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(b?.id==='teacher-open')setTimeout(()=>{const mode=document.querySelector('[data-setting="mode"]');if(mode){mode.disabled=true;mode.title='연구 학급 조건은 서버에 고정됩니다.'}},0)});
  document.addEventListener('change',e=>{if(e.target.id==='import-pass'){e.stopImmediatePropagation();e.target.value='';toast('연구 참여 중에는 개인 기록 가져오기를 사용할 수 없습니다.')}},true);
  window.addEventListener('online',()=>sync());window.addEventListener('beforeunload',e=>{if(pending||inflight){cache();e.preventDefault();e.returnValue=''}});
  setInterval(async()=>{try{const m=await call('me');if(m.phase!=='learning')gate('학급 단계가 변경되었습니다. 검사·참여 현황으로 이동하세요.')}catch(e){if([401,403,409].includes(e.status))gate(e.message)}},15000);
  ready=true;if(pending)sync();
 }
 return {boot,init,schedule,credential,staticHosting};
})();
