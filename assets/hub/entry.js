'use strict';
(() => {
 const script=document.currentScript,href=script?.dataset.hub;if(!href||document.getElementById('resource-hub-link'))return;
 const target=document.querySelector('.course-tools')||document.querySelector('#inquiry:not([hidden]) .inquiry-head')||document.querySelector('body>header .tools')||document.querySelector('.topactions');if(!target)return;
 const a=document.createElement('a');a.id='resource-hub-link';a.href=href;a.textContent='자료 모음';a.title='수업 자료 모음 · 소개 · 교사 매뉴얼';a.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:6px 10px;flex-shrink:0;border:1px solid #cbd9d3;border-radius:6px;background:#fff;color:#176b56;font:600 13px/1.3 sans-serif;white-space:nowrap;text-decoration:none';target.append(a);
})();
