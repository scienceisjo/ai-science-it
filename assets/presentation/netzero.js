'use strict';
function presentationLessonURL(lesson){return '?map-preview='+lesson+'&presentation=1'}
function mountNetzeroPresentation(){
 if(!D||!CITIES)return;
 if(!INQUIRY_PAGE&&!archiveRoom&&cameraMode==='third'){resizeScene();resetOutdoorCamera()}
 if(!INQUIRY_PAGE)window.addEventListener('resize',()=>{if(!archiveRoom&&cameraMode==='third')resetOutdoorCamera()});
 const clear=()=>{if(opening)openingEnd('presentation');document.querySelectorAll('dialog[open]').forEach(d=>d.close());pressed.clear();rpgWalk=null;drag=null;};
 const places=[{id:'overview',name:'전체 도시'},{id:'npc',name:RPG_NPCS[S.lesson]},...LESSONS[S.lesson].steps.map((s,i)=>({id:String(i),name:(i+1)+'. '+s}))];
 const landmarks=[[],[{id:'landmark-transit',name:'교통 조사 쉼터',step:2}],[{id:'landmark-A',name:'비교 실험 모형 A',step:2},{id:'landmark-B',name:'비교 실험 모형 B',step:2}],[{id:'landmark-design',name:'도시 모형 검토대',step:3}]][S.lesson];places.push(...landmarks);
 const jump=id=>{
  if(INQUIRY_PAGE){location.assign(presentationLessonURL(S.lesson+1)+'&place='+id);return}
  clear();if(archiveRoom)leaveArchive(false);
  if(id==='overview'){resetOutdoorCamera();setCameraMode('third');return}
  if(S.lesson===0&&id!=='npc')enterArchive(rpgTargets.find(t=>t.kind==='station'));
  const target=id==='npc'?rpgTargets.find(t=>t.kind==='npc'):id.startsWith('landmark-')?rpgTargets.find(t=>t.id===id):rpgTargets.find(t=>t.kind===(archiveRoom?'exhibit':'station')&&t.step===Number(id));
  if(!target)return;
  player.position.set(target.x,0,target.z);rpgWalk=null;storyTarget=target;
  setCameraMode('follow');followYaw=id==='landmark-design'?.65:0;followPitch=id.startsWith('landmark-')?.58:.24;followDistance=id.startsWith('landmark-')?6.8:4.8;followReady=false;rpgHud();
 };
 PresentationTools.mount({active:PRESENTATION,lesson:S.lesson+1,entry:INQUIRY_PAGE?'.tools':'.world-tools',lessons:LESSONS.map(l=>l.short),places,
  lessonURL:presentationLessonURL,exitURL:'./',jump,
  inquiry:id=>{flushLearningInputs();rememberMap();save();location.assign(inquiryURL(S.lesson,landmarks.find(p=>p.id===id)?.step??(/^[0-4]$/.test(id)?Number(id):0)))},
  story:()=>{clear();missionWelcome()}
 });
 if(PRESENTATION){
  const originalTravel=travelRegion;travelRegion=i=>{if(Number.isInteger(i)&&i>=0&&i<4)location.assign(presentationLessonURL(i+1));else originalTravel(i)};
  const place=new URLSearchParams(location.search).get('place');if(place&&places.some(p=>p.id===place)&&!INQUIRY_PAGE){jump(place);$('#present-place').value=place;}
  $('#save-status').textContent='발표 모드 · 임시 기록';
 }
}
