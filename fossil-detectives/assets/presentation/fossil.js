'use strict';
function fossilURL(value){const url=new URL(value,location.href);if(PRESENTATION)url.searchParams.set('presentation','1');return url.href}
function fossilOverviewFit(){
 const points=[];for(const n of navNodes)for(const x of[-10,10])for(const z of[-10,10])for(const y of[0,8])points.push(n.clone().add(V(x,y,z)));
 const center=new T.Box3().setFromPoints(navNodes).getCenter(V());center.x-=4;center.y=3.5;world.userData.overviewCenter=center;
 if(innerWidth<600)return 118;
 const probe=camera.clone();probe.updateProjectionMatrix();
 for(let d=100;d<=238;d+=2){probe.position.copy(center).add(V(Math.sin(yaw)*d*Math.cos(.85),Math.sin(.85)*d,Math.cos(yaw)*d*Math.cos(.85)));probe.lookAt(center);probe.updateMatrixWorld(true);
  if(points.every(p=>{const q=p.clone().project(probe);return Math.abs(q.x)<.86&&q.y>-.73&&q.y<.76}))return d;
 }
 return 240;
}
function mountFossilPresentation(){
 const clear=()=>{stopOpening();document.querySelectorAll('dialog[open]').forEach(d=>d.close());clearMovement();autoRoute=[]};
 const jump=id=>{
  if(isInquiry){location.assign(fossilURL('./?chapter='+chapter+'&place='+id));return}
  clear();if(id==='overview'){setMode('overview');return}
  const n=Number(id);if(!navNodes[n])return;player.position.copy(navNodes[n]);player.rotation.y=Math.PI;setMode('follow');rememberPosition();save();
 };
 const places=[{id:'overview',name:'전체 기록관'},{id:'1',name:'ECHO에게 사건 받기'},...CHAPTERS[chapter].steps.map((s,i)=>({id:String(i+2),name:(i+1)+'. '+s})),{id:'6',name:'시간 관문'}];
 if(!isInquiry)navNodes.forEach((_,i)=>{if(i>6)places.push({id:String(i),name:nodeLabel(i)})});
 PresentationTools.mount({active:PRESENTATION,lesson:chapter,entry:'.tools',lessons:CHAPTERS.slice(1).map(c=>c.name),places,
  lessonURL:n=>'./?chapter='+n+'&presentation=1',exitURL:'./?chapter='+chapter,jump,
  inquiry:id=>{rememberPosition();save();const n=Number(id);location.assign(fossilURL('inquiry.html?chapter='+chapter+'&step='+(n>=2&&n<=5?n-2:0)))},
  story:()=>{clear();openStory()}
 });
 if(PRESENTATION){
  if(isInquiry)$('mapReturn').href=fossilURL('./?chapter='+chapter);
  const place=params.get('place');if(!isInquiry&&place&&places.some(p=>p.id===place)){jump(place);$('present-place').value=place;}
  save();
 }
 // Propagate the explicit mode only within this app, including journal links.
 document.addEventListener('click',e=>{if(!PRESENTATION)return;const a=e.target.closest('a[href]');if(!a)return;const u=new URL(a.href,location.href),base=new URL('./',location.href);if(u.origin===base.origin&&u.pathname.startsWith(base.pathname)&&/\/(?:index\.html|inquiry\.html)?$/.test(u.pathname))a.href=fossilURL(a.href)},true);
}
