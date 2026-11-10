/* NET ZERO ECO-CITY · 수업 연결부(학생 화면)
   공통 몸체는 link-core.js. 여기는 넷제로에만 있는 것: 기록 변수 S·저장 키 SAVE, 차시 열기(canVisitLesson),
   움직임 막기(rpgBlocked), 장소(연구원·에코·포탈·기록관·단계 시설), 학습하기 쪽(TEXTBOOK), 교사 슬라이드(teacher.html).
   index.html 이 부르는 곳: boot()(화면 그리기 전), init()(화면 준비 뒤), schedule()(save 마다). */
window.ClassLink = (() => {
  'use strict';
  const GOTO_KEY = 'asi_netzero_goto';
  const PLACE_NAMES = { researcher: '연구원', guide: '에코', portal: '포탈', record: '기록 벤치', archive: '기록관 안', start: '처음 자리' };
  const esc = s => window.ASI ? ASI.esc(s) : String(s == null ? '' : s);
  const q = s => document.querySelector(s);
  const inquiry = () => typeof INQUIRY_PAGE !== 'undefined' && INQUIRY_PAGE;
  const council = () => typeof COUNCIL_PAGE !== 'undefined' && COUNCIL_PAGE;
  const mapReady = () => typeof player !== 'undefined' && !!player && typeof rpgReady !== 'undefined' && rpgReady && Array.isArray(rpgTargets);
  const lessonNo = () => (S && Number.isInteger(S.lesson) ? S.lesson : 0);
  const placeLabel = p => PLACE_NAMES[p] || (/^step-(\d)$/.test(p) ? (LESSONS[lessonNo()] && LESSONS[lessonNo()].steps[+p.slice(5) - 1] || p.slice(5) + '단계') + ' 시설' : p);
  let core = null, lastPlaced = null, pendingGo = null;
  // 처음 답과 지금 답을 견줄 선택형·예상 칸(판단 수정 지표)
  const TRACK = ['l1initial', 'l1literacyA', 'l1literacyB', 'l2initial', 'l2aiChoice', 'l3prediction', 'l3balancePrediction', 'l3passivePrediction', 'l4prediction'];

  const A = {
    id: 'netzero', keyPrefix: 'netzero_class_',
    placeRe: /^(researcher|guide|portal|record|archive|start|step-[1-5])$/,
    volatileKeys: ['events', 'seconds'],
    eligible() {
      if (typeof MAP_PREVIEW === 'undefined' || MAP_PREVIEW !== null) return false;     // 맵 미리보기·발표 모드는 학생 기록과 떨어져 있다
      if (window.Research && typeof Research.credential === 'function' && Research.credential()) return false; // 연구 모드(로컬 서버)는 따로
      return true;
    },
    useKey(k) { SAVE = k; },
    validRecord: v => v.schema === SCHEMA,
    makeRecord: d => d ? Object.assign(fresh(), d) : fresh(),
    getRecord: () => S,
    setRecord(r) { S = r; },
    anonHasWork: () => Object.values(S.answers || {}).some(v => typeof v === 'string' && v.trim()) || (S.evidence || []).length > 0,
    // 클릭 기록(events)은 잘라 보내고, 학생이 직접 쓴 글(studentWritten)을 붙인다. level 이 오르면 더 줄인다
    trim(d, level) {
      if (level === 0) {
        d.events = Array.isArray(S.events) ? S.events.slice(-200) : [];
        try { if (typeof studentWritten === 'function') d.studentWritten = studentWritten(); } catch (e) {}
      } else if (level === 1) {
        d.events = d.events.slice(-30);
        if (Array.isArray(S.revisions)) d.revisions = S.revisions.slice(-150);
        if (Array.isArray(S.chat)) d.chat = S.chat.slice(-30);
      } else { d.events = []; d.revisions = (d.revisions || []).slice(-30); d.chat = (d.chat || []).slice(-10); }
    },
    progress() {
      const AU = window.EcoLearningAudit, per = [0, 0, 0, 0];
      let done = 0;
      if (AU && typeof AU.stepIssue === 'function') for (let l = 0; l < 4; l++) for (let s = 0; s < 5; s++) { try { if (!AU.stepIssue(l, s)) { per[l]++; done++; } } catch (e) {} }
      const answers = Object.values(S.answers || {}).filter(v => typeof v === 'string' && v.trim()).length;
      return { done, total: 20, lessons: per, finished: (S.done || []).map(Boolean), answers, evidence: (S.evidence || []).length };
    },
    // 연구 요약(선생님 화면 「학생별 기록」「반 전체 지표」용). 전체 클릭 기록(S.events)에서 세므로 잘라 보내는 것과 상관없다
    research() {
      const ev = Array.isArray(S.events) ? S.events : [], n = t => ev.filter(e => e.type === t).length;
      const revs = Array.isArray(S.revisions) ? S.revisions : [];
      const first = {}, changed = {};
      for (const r of revs) {
        const before = String(r.before == null ? '' : r.before).trim(), after = String(r.after == null ? '' : r.after).trim();
        if (TRACK.includes(r.key) && !(r.key in first)) first[r.key] = (before || after).slice(0, 200);
        if (before && before !== after) changed[r.key] = (changed[r.key] || 0) + 1;
      }
      const AU = window.EcoLearningAudit, steps = [];
      if (AU && typeof AU.stepIssue === 'function') for (let l = 0; l < 4; l++) for (let s = 0; s < 5; s++) { try { if (!AU.stepIssue(l, s)) steps.push((l + 1) + '-' + s); } catch (e) {} }
      const own = v => String(v || '').replace(/\[(E\d{3})\][^\n]*\n출처:[^\n]*/g, '').replace(/\s/g, '');
      return {
        steps,
        chars: Object.values(S.answers || {}).reduce((a, v) => a + (typeof v === 'string' ? own(v).length : 0), 0),
        revisions: Object.values(changed).reduce((a, b) => a + b, 0), revisedKeys: Object.keys(changed).length, first,
        evidence: (S.evidence || []).length, evidenceReal: (S.evidence || []).filter(e => e && e.kind === '실제 자료').length, inserted: n('evidence_inserted'),
        textbookOpen: n('textbook_open'), textbookSec: Math.round(ev.filter(e => e.type === 'textbook_close').reduce((a, e) => a + (Number(e.seconds) || 0), 0)),
        help: n('learning_scaffold_open'), recall: n('concept_recall'), ai: (S.chat || []).length,
        trials: n('building_trial') + n('comparison_run') + n('council_trial')
      };
    },
    position: () => ({ lesson: lessonNo() + 1, step: (S.steps && Number.isInteger(S.steps[lessonNo()])) ? S.steps[lessonNo()] : 0, place: place() }),
    flush() {
      try { if (typeof flushLearningInputs === 'function') flushLearningInputs(); } catch (e) {}
      save();
    },
    tools: () => q('body>header .tools'),
    toast: m => toast(m),
    icons: () => icons(),
    homeURL: () => location.pathname.replace(/inquiry\.html$/, ''),
    onLost() { SAVE = 'netzero_ecocity_four_v1'; },
    stopMovement() { try { pressed.clear(); rpgWalk = null; } catch (e) {} },
    // 앱 함수를 감싼다: 차시 열기(선생님이 엶), 움직임 막기(멈춤·이동 잠금·설명 화면)
    wrap(c) {
      if (typeof canVisitLesson === 'function') {
        const visit = canVisitLesson;
        canVisitLesson = function (i) {
          const open = c.live.open_lessons;
          if (!c.active || !Array.isArray(open) || (typeof PRESENTATION !== 'undefined' && PRESENTATION)) return visit(i);
          return Number.isInteger(i) && i >= 0 && i < 4 && (i <= lessonNo() || open.includes(i + 1));
        };
      }
      if (typeof rpgBlocked === 'function') {
        const blocked = rpgBlocked;
        rpgBlocked = function () { return blocked() || c.blocked(); };
      }
    },
    applyGoto() {
      if (!mapReady()) return;
      if (pendingGo) { const g = pendingGo; pendingGo = null; placeOnMap(g.place, g.lesson, g.gather); return; }
      let g = null;
      try { g = JSON.parse(sessionStorage.getItem(GOTO_KEY) || 'null'); sessionStorage.removeItem(GOTO_KEY); } catch (e) {}
      if (g && Date.now() - g.at < 60000 && A.placeRe.test(g.place)) placeOnMap(g.place, g.lesson, g.gather);
    },
    goPlace(where, lesson, gather) {
      const l = lesson >= 1 && lesson <= 4 ? lesson - 1 : lessonNo();
      if (inquiry()) {
        if (l !== lessonNo() && !canVisitLesson(l)) return;
        A.flush();
        S.lesson = l; S.mapReturn = null; save();
        try { sessionStorage.setItem(GOTO_KEY, JSON.stringify({ place: where, lesson: l, gather, at: Date.now() })); } catch (e) {}
        location.assign(typeof mapURL === 'function' ? mapURL() : './');
        return;
      }
      if (!mapReady()) { pendingGo = { place: where, lesson: l, gather }; return; }
      placeOnMap(where, l, gather);
    },
    openStep(l, s) {
      const i = l - 1;
      if (!canVisitLesson(i)) { toast('선생님이 연 단계가 아직 열리지 않은 차시에 있어요.'); return; }
      const here = inquiry() && !council();
      if (here && lessonNo() === i && S.steps[i] === s) return;
      A.flush();
      if (!here && mapReady() && typeof rememberMap === 'function') rememberMap();
      S.lesson = i; S.steps[i] = s;
      try { questState()[i] = true; } catch (e) {}
      save();
      location.assign(inquiryURL(i, s));
    },
    setView(mode) {
      if (inquiry() || !mapReady()) return;
      core.withBypass(() => {
        if (mode === 'overview') {
          setCameraMode('third');
          if (archiveRoom) { camAngle = 0; camRadius = 19; camHeight = 18; overviewPitch = Math.atan(18 / 19); }
          else if (typeof resetOutdoorCamera === 'function') resetOutdoorCamera();
        } else if (['first', 'third', 'follow'].includes(mode)) setCameraMode(mode);
      });
    },
    answerLabel: ref => (typeof answerLabels !== 'undefined' && answerLabels[ref]) || '',
    screen(sc) {
      const page = Number(sc.page) || 0;
      const l = Math.min(4, Math.max(1, parseInt(String(sc.ref).replace(/\D/g, ''), 10) || lessonNo() + 1));
      if (sc.kind === 'learn') {
        const pages = (typeof TEXTBOOK !== 'undefined' && TEXTBOOK[l - 1]) || [];
        const pg = pages[Math.min(page, pages.length - 1)];
        return {
          head: l + '차시 학습하기' + (pages.length ? ' · ' + (Math.min(page, pages.length - 1) + 1) + '/' + pages.length : ''),
          body: pg ? '<h2 id="class-live-title">' + esc(pg.title) + '</h2>' + (pg.lead ? '<p class="class-lead">' + esc(pg.lead) + '</p>' : '')
            + (pg.cards || []).map(c => '<section class="class-learn-card"><h3>' + esc(c[0]) + '</h3><p>' + c[1] + '</p></section>').join('')
            : '<h2 id="class-live-title">학습하기 쪽을 찾지 못했어요.</h2>'
        };
      }
      return {
        head: l + '차시 선생님 슬라이드 · ' + (page + 1) + '쪽',
        body: '<h2 id="class-live-title" class="sr-only">' + l + '차시 선생님 슬라이드</h2><div class="class-slide"><iframe title="선생님 슬라이드" tabindex="-1" src="teacher.html?lesson=' + l + '&s=1&k=last&p=' + (page + 1) + '"></iframe></div>'
      };
    }
  };

  // 선생님 화면에 보일 내 장소
  function place() {
    try {
      if (inquiry()) return council() ? 'council' : 'inquiry';
      if (!mapReady()) return 'map';
      // 선생님이 옮긴 자리에서 움직이지 않았으면 옮긴 곳으로 보고한다
      if (lastPlaced && lastPlaced.lesson === lessonNo() && Math.hypot(player.position.x - lastPlaced.x, player.position.z - lastPlaced.z) < 1) return lastPlaced.place;
      let near = (typeof rpgNearest !== 'undefined' && rpgNearest) || null, best = 4.5;
      if (!near) for (const t of rpgTargets) {
        const d = Math.hypot(player.position.x - t.x, player.position.z - t.z);
        if (d < best) { best = d; near = t; }
      }
      const name = t => !t ? null : t.kind === 'npc' ? 'researcher' : t.kind === 'guide' ? 'guide' : t.kind === 'portal' ? 'portal'
        : t.kind === 'record' ? 'record' : Number.isInteger(t.step) && (t.kind === 'exhibit' || (t.kind === 'station' && lessonNo() !== 0)) ? 'step-' + (t.step + 1)
        : t.kind === 'station' ? 'archive-door' : t.kind === 'exit' ? 'archive' : null;
      if (typeof archiveRoom !== 'undefined' && archiveRoom) return name(near) || 'archive';
      return name(near) || 'map';
    } catch (e) { return 'map'; }
  }

  function freeSpot(x, z) {
    const b = navigationBounds(), obs = (typeof archiveRoom !== 'undefined' && archiveRoom) ? archiveObstacles : plazaObstacles;
    const ok = (px, pz) => px >= b.minX && px <= b.maxX && pz >= b.minZ && pz <= b.maxZ
      && !obs.some(o => px > o.min.x - .4 && px < o.max.x + .4 && pz > o.min.z - .4 && pz < o.max.z + .4);
    if (ok(x, z)) return { x, z };
    for (let r = .6; r <= 9; r += .6) for (let i = 0; i < 16; i++) {
      const px = x + Math.cos(i / 16 * Math.PI * 2) * r, pz = z + Math.sin(i / 16 * Math.PI * 2) * r;
      if (ok(px, pz)) return { x: px, z: pz };
    }
    return { x: Math.min(b.maxX, Math.max(b.minX, x)), z: Math.min(b.maxZ, Math.max(b.minZ, z)) };
  }

  function placeOnMap(where, l, gather) {
    core.withBypass(() => {
      const modal = q('#modal'); if (modal && modal.open) modal.close();
      if (document.body.classList.contains('activity-open') && typeof closeActivity === 'function') closeActivity();
      if (l !== lessonNo()) {
        if (!canVisitLesson(l)) { toast('선생님이 부른 차시가 아직 열리지 않았어요.'); return; }
        travelRegion(l);
      }
      const step = /^step-(\d)$/.exec(where);
      const first = lessonNo() === 0, inside = first && (!!step || where === 'archive');
      if (first && inside && !archiveRoom) { const st = rpgTargets.find(t => t.kind === 'station'); if (st) enterArchive(st); }
      if (first && !inside && archiveRoom && !['researcher', 'guide'].includes(where)) leaveArchive(false);
      let t = null, spawned = false;
      if (step) { const n = +step[1] - 1; t = rpgTargets.find(x => x.step === n && (x.kind === 'exhibit' || x.kind === 'station')) || rpgTargets.find(x => x.step === n); }
      else if (where === 'archive') t = archiveRoom ? { x: 0, z: 3.8 } : rpgTargets.find(x => x.kind === 'station');
      else if (where === 'start') {
        if (archiveRoom) leaveArchive(false);
        if (lessonNo() === 0 && typeof placeVillageSpawn === 'function') { placeVillageSpawn(); spawned = true; }
        else { const sp = DISTRICTS[lessonNo()] && DISTRICTS[lessonNo()].spawn; if (sp) t = { x: sp[0], z: sp[1] }; }
      } else t = rpgTargets.find(x => x.kind === ({ researcher: 'npc', guide: 'guide', portal: 'portal', record: 'record' })[where]);
      if (!t && !spawned) { toast('선생님이 부른 곳(' + placeLabel(where) + ')이 이 구역에 없어요.'); return; }
      if (t) {
        const s = gather ? core.spread() : { a: 0, r: 0 };
        const p = freeSpot(t.x + Math.cos(s.a) * s.r, t.z + Math.sin(s.a) * s.r);
        player.position.set(p.x, 0, p.z);
      }
      lastPlaced = { place: where, lesson: lessonNo(), x: player.position.x, z: player.position.z };
      rpgWalk = null; drag = null; followReady = false;
      try { pressed.clear(); } catch (e) {}
      if (typeof rpgHud === 'function') rpgHud();
      toast(gather ? '선생님이 모두를 ' + placeLabel(where) + ' 앞으로 불렀어요.' : '선생님이 ' + placeLabel(where) + ' 앞으로 옮겨 주었어요.');
      try { log('class_move', { place: where, gather: !!gather }); } catch (e) {}
    });
  }

  core = window.ASILink.create(A);
  return core;
})();
