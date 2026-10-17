'use strict';
function fitCampusOverview(){
 const probe=camera.clone(),points=[],rect=document.querySelector('.world').getBoundingClientRect();probe.fov=43;probe.aspect=rect.width/rect.height;probe.updateProjectionMatrix();
 for(const [x,z]of DISTRICTS[S.lesson].sites)for(const dx of[-8,8])for(const dz of[-7,7])for(const y of[0,13])points.push(new THREE.Vector3(x+dx,y,z+dz));
 for(let radius=52;radius<=138;radius+=2){
  const d=radius/Math.cos(Math.atan(.7));probe.position.set(Math.sin(.04)*d*Math.cos(.82),d*Math.sin(.82)+1.15,-5+Math.cos(.04)*d*Math.cos(.82));probe.lookAt(0,1.15,-5);probe.updateMatrixWorld(true);
  if(points.every(p=>{const q=p.clone().project(probe);return Math.abs(q.x)<.85&&q.y>-.72&&q.y<.76}))return radius;
 }
 return 140;
}
// These are learning landmarks, not quantitative scientific models.
function learningAnchor(group,id,name,step,x,z){group.userData.learningTarget={id,kind:'station',name,step,x,z,markX:x,markZ:z,markY:2.8}}
function learningCanopy(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);g.userData.learningLandmark='transit-observatory';city.add(g);
 const rows=[];const b=(w,h,d,x,y,z,c)=>rows.push([x,y,z,w,h,d,c]);
 b(6.5,.18,3.3,0,.12,0,'#d2dbd9');
 for(const x of [-2.8,2.8])for(const z of [-1.25,1.25])b(.13,3.1,.13,x,1.7,z,'#456e73');
 b(7,.2,3.8,0,3.35,0,'#edf2ea');b(6.5,.08,1.4,0,3.52,-.8,'#426c81');
 for(let x=-2.8;x<3;x+=.55)b(.025,.025,1.35,x,3.58,-.8,'#a9c9d1');
 b(6,.85,.1,0,1.05,-1.3,'#92b5b5');b(3.6,.17,.6,-.8,.85,-.75,'#ad8867');
 b(.85,1.55,.22,2,1.65,-1.05,'#f0f2e9');
 for(let j=0;j<5;j++)b(.58,.045,.025,2,2.13-j*.19,-.925,j===0?'#c77957':'#6b8b89');
 b(1,.13,.7,2,.85,-.75,'#395c63');
 cozyBatch(new THREE.BoxGeometry(1,1,1),rows,g);
 cozySign('도시 교통 조사소',4.8,.48,0,2.95,1.35,g,'#367a85');
 streetCollider(g,0,0,6.6,3.4,3.6);
 const pavement=streetPatch(x,z+3.1,7.2,1.5,'#cddedb');
 pavement.userData.learningLandmark='transit-crossing';
 const stripes=[];for(let i=0;i<7;i++)stripes.push([x-2.9+i*.95,.105,z+3.1,.42,.018,1.05,'#f6f5e8']);
 cozyBatch(new THREE.BoxGeometry(1,1,1),stripes);
 learningAnchor(g,'landmark-transit','교통 조사 쉼터',2,x,z+3.1);
}
function learningTestHouse(x,labelText){
 const g=new THREE.Group();g.position.set(x,0,18);g.userData.learningLandmark='comparison-'+labelText;city.add(g);
 const rows=[],b=(w,h,d,x,y,z,c)=>rows.push([x,y,z,w,h,d,c]);
 b(3.2,.17,2.2,0,.22,0,'#d8ded9');
 for(const dx of [-1.25,1.25])b(.16,1.05,1.7,dx,.65,0,'#627d78');
 b(3.2,.18,2.2,0,1.25,0,labelText==='A'?'#527d94':'#b56d57');
 b(2.1,1.6,1.55,-.25,2.12,-.12,'#edf0e7');
 b(2.3,.16,1.75,-.25,2.99,-.12,'#5f8d91');
 b(.57,.76,.04,-.75,2.25,.67,'#6d9da9');b(.57,.76,.04,.25,2.25,.67,'#6d9da9');
 b(.05,1.05,.12,-.75,2.25,.7,'#ecf0e3');b(.05,1.05,.12,.25,2.25,.7,'#ecf0e3');
 b(.5,.1,.12,-.75,2.25,.7,'#ecf0e3');b(.5,.1,.12,.25,2.25,.7,'#ecf0e3');
 b(.35,1.1,.4,1.1,1.9,.1,'#45685f');b(.25,.33,.03,1.1,2.15,.32,'#d2e7db');
 // Both rigs start identical. Students choose and test a variable in the inquiry.
 b(1.65,.08,.85,-.25,3.13,-.3,'#3d637d');
 for(let i=0;i<4;i++)b(.025,.02,.82,-.86+i*.4,3.18,-.3,'#aec9cf');
 cozyBatch(new THREE.BoxGeometry(1,1,1),rows,g);
 cozySign(labelText,1.1,.65,0,.86,1.11,g,labelText==='A'?'#426c84':'#a85f48');
 streetCollider(g,0,0,3.2,2.2,3.3);
 learningAnchor(g,'landmark-'+labelText,'비교 실험 모형 '+labelText,2,x,20.4);
}
function learningCityModel(table){
 table.userData.learningLandmark='design-review';
 const rows=[],b=(w,h,d,x,y,z,c)=>rows.push([x,y,z,w,h,d,c]);
 b(11.3,.07,6.3,0,1.52,0,'#c5d9c6');
 b(11,.025,.45,0,1.57,.5,'#eef1e9');b(.55,.025,5.8,-.6,1.57,0,'#eef1e9');
 b(1.2,.035,6.1,3.4,1.57,0,'#7eb7bd');b(2.1,.08,.65,3.4,1.63,.5,'#ddd6bb');
 for(const x of [-4.4,-2.8,.7,2])for(const z of [-2,-.7,2]){
  const h=.55+(Math.abs(x)+z+3)%1.5;
  b(.85,h,.72,x,1.6+h/2,z,z<0?'#d8e4df':'#b9cdd2');
  b(.92,.1,.8,x,1.65+h,z,z<0?'#688c82':'#4e7d8b');
  b(.6,.2,.03,x,1.7+h*.55,z+.38,'#598d99');
 }
 b(1.4,.7,1,-3,1.95,2,'#f3eee1');b(1.65,.12,1.2,-3,2.38,2,'#c38365');
 b(.7,.12,1.7,4.6,1.75,-1.8,'#4a6e7f');
 cozyBatch(new THREE.BoxGeometry(1,1,1),rows,table);
 const trees=[];for(let i=0;i<9;i++)trees.push([4.5,1.8,-.2+i*.32,.19,.24,.19,i%2?'#94b473':'#547f65']);
 cozyBatch(new THREE.SphereGeometry(1,7,5),trees,table);
 for(const [x,text,color] of [[-4,'근거','#387c88'],[0,'조건','#aa7155'],[4,'검증','#557f61']]){
  const sign=cozySign(text,1.6,.5,x,1.56,3.27,table,color);sign.rotation.x=-.45;
 }
 learningAnchor(table,'landmark-design','도시 모형 검토대',3,7,19);
}
