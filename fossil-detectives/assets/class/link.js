/* 화석 수사대 · 수업 연결부(학생 화면)
   공통 몸체는 link-core.js(넷제로 개발본 assets/class/link-core.js 의 사본, scripts/class-sync.cjs 로 맞춤).
   여기는 화석에만 있는 것: 기록 변수 state, 저장 키 SAVE(화면을 그리기 전에 keyAtParse 로 정함),
   사건(차시) 고르기, 지도 노드(0 처음 자리 · 1 ECHO · 2~5 탐구 1~4 · 6 시간 관문), 교사 슬라이드(teacher.html).
   index.html(=inquiry.html) 이 부르는 곳: SAVE 정할 때 keyAtParse(), 본문 스크립트 뒤 boot().then(init). */
window.FossilLink = (() => {
  'use strict';
  const NODE = { start: 0, guide: 1, 'step-1': 2, 'step-2': 3, 'step-3': 4, 'step-4': 5, portal: 6 };
  const NAMES = { start: '처음 자리', guide: 'ECHO', portal: '시간 관문' };
  const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
  const esc = s => window.ASI ? ASI.esc(s) : String(s == null ? '' : s);
  const q = s => document.querySelector(s);
  const inquiry = () => typeof isInquiry !== 'undefined' && isInquiry;
  const mapReady = () => typeof player !== 'undefined' && !!player && Array.isArray(navNodes) && navNodes.length > 0;
  const placeLabel = (p, c) => NAMES[p] || (/^step-(\d)$/.test(p) ? (CHAPTERS[c] && CHAPTERS[c].steps[+p.slice(5) - 1] || p.slice(5) + '단계') : p);
  let core = null, lastPlaced = null;

  function nodePos(c, i) {
    if (c === chapter && mapReady() && navNodes[i]) return navNodes[i].clone();
    const n = CHAPTERS[c] && CHAPTERS[c].nodes[i];
    return n ? { x: n[0], y: n[1] + .11, z: n[2] } : null;
  }

  const A = {
    id: 'fossil', keyPrefix: 'fossil_class_', lateBoot: true,
    placeRe: /^(start|guide|portal|step-[1-4])$/,
    volatileKeys: ['time'],
    // 저장 키를 정할 때(본문 스크립트가 PRESENTATION 을 선언하기 전)도 불리므로 주소에서 직접 읽는다
    eligible() {
      const p = new URLSearchParams(location.search);
      if (p.get('presentation') === '1') return false;   // 발표 모드는 학생 기록과 떨어져 있다
      if (p.get('map-preview')) return false;
      return true;
    },
    useKey() {},   // 저장 키는 본문 스크립트가 keyAtParse 로 이미 정했다
    validRecord: v => v.schema === 1,
    makeRecord(d) {
      const f = fresh();
      if (!d) return f;
      const r = Object.assign({}, f, d, { settings: Object.assign({}, f.settings, d.settings || {}) });
      for (const k of ['accepted', 'done', 'records', 'intro', 'endings', 'positions', 'sketches']) if (!r[k] || typeof r[k] !== 'object' || Array.isArray(r[k])) r[k] = {};
      return r;
    },
    getRecord: () => state,
    setRecord(r) { state = r; },
    anonHasWork: () => Object.keys(state.records || {}).length > 0 || Object.keys(state.done || {}).length > 0,
    trim(d, level) { if (level >= 1) d.sketches = {}; },   // 너무 길면 스케치(선 좌표)부터 뺀다
    progress() {
      const per = [1, 2, 3, 4].map(c => CHAPTERS[c].steps.filter((_, s) => state.done[key(c, s)]).length);
      const answers = Object.values(state.records || {}).reduce((n, r) => n + Object.entries(r || {}).filter(([k, v]) => k !== '자료 버전' && typeof v === 'string' && v.trim()).length, 0);
      return { done: per.reduce((a, b) => a + b, 0), total: 16, lessons: per, answers };
    },
    // 연구 요약(선생님 화면용): 완료 단계, 채운 칸·글자 수, 스케치·복원 창 수
    research() {
      let filled = 0, chars = 0;
      for (const rec of Object.values(state.records || {})) for (const [f, v] of Object.entries(rec || {})) {
        if (f === '자료 버전' || typeof v !== 'string' || !v.trim()) continue;
        filled++; chars += v.replace(/\s/g, '').length;
      }
      return {
        steps: Object.keys(state.done || {}).filter(k => state.done[k]),
        filled, chars,
        sketches: Object.values(state.sketches || {}).filter(s => Array.isArray(s) && s.length).length,
        windows: Object.keys(state.visitedWindows || {}).length
      };
    },
    position() {
      if (inquiry()) return { lesson: chapter, step: inquiryStep, place: 'inquiry' };
      const active = CHAPTERS[chapter].steps.findIndex((_, s) => !state.done[key(chapter, s)]);
      return { lesson: chapter, step: active < 0 ? 3 : active, place: place() };
    },
    flush() { save(); },
    // 친구 캐릭터(2026-11-13): 지도에서만 내 좌표를 알리고, 친구는 탐사 대원 캐릭터에 옷 색만 다르게
    coords() {
      if (inquiry() || !mapReady() || typeof world === 'undefined' || !world) return null;
      return { x: player.position.x, z: player.position.z, ry: player.rotation.y };
    },
    peerScene() {
      if (inquiry() || !mapReady() || typeof world === 'undefined' || !world || typeof makeCharacter !== 'function' || !window.THREE) return null;
      return {
        THREE: window.THREE, parent: world, labelY: 2.45,
        groundY: (x, z) => { const s = typeof surface === 'function' ? surface(x, z) : null; return s && isFinite(s.y) ? s.y : player.position.y; },
        make: color => makeCharacter(false, color)
      };
    },
    tools: () => inquiry() ? q('.inquiry-head') : q('.topactions'),
    headerEl: () => inquiry() ? q('.inquiry-head') : q('header.topbar'),
    statusEls: () => [q('#savedState')].concat(Array.from(document.querySelectorAll('.save-indicator'))),
    toast: m => toast(m),
    icons: () => icons(),
    homeURL: () => location.pathname.replace(/inquiry\.html$/, ''),
    stopMovement() { try { clearMovement(); autoRoute = []; } catch (e) {} },
    wrap(c) {
      // 저장할 때마다 학급 서버로도
      const appSave = save;
      save = function () { appSave(); c.schedule(); c.status(); };
      // 이동 잠금: 움직이는 키·지도 끌기·목적지 이동을 막는다(대화창이 열리면 앱이 스스로 멈춤)
      window.addEventListener('keydown', e => { if (c.blocked() && MOVE_KEYS.has(e.code)) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
      const canvasBlock = e => { if (c.blocked() && e.target && e.target.tagName === 'CANVAS') { e.stopImmediatePropagation(); e.preventDefault(); } };
      window.addEventListener('pointerdown', canvasBlock, true);
      if (typeof goNode === 'function') { const go = goNode; goNode = function (t) { if (c.blocked()) { toast('선생님이 이동을 잠갔어요.'); return; } return go(t); }; }
      // 선생님이 연 사건(차시)만 고를 수 있게
      if (typeof showChapters === 'function') {
        const show = showChapters;
        showChapters = function () {
          show();
          const open = c.live.open_lessons;
          if (!Array.isArray(open)) return;
          document.querySelectorAll('#chapterGrid .chapter-choice').forEach(b => {
            const n = Number(b.dataset.chapter);
            if (n !== chapter && !open.includes(n)) { b.disabled = true; b.title = '선생님이 아직 열지 않은 사건이에요.'; }
          });
        };
      }
    },
    goPlace(where, lesson, gather) {
      const c = lesson >= 1 && lesson <= 4 ? lesson : chapter;
      const open = core.live.open_lessons;
      if (c !== chapter && Array.isArray(open) && !open.includes(c)) { toast('선생님이 부른 사건이 아직 열리지 않았어요.'); return; }
      const p = nodePos(c, NODE[where]);
      if (!p) return;
      if (inquiry()) {
        save();
        state.positions[c] = { x: p.x, y: p.y, z: p.z }; state.chapter = c; save();
        location.href = fossilURL('./?chapter=' + c + '&return=1');
        return;
      }
      if (!mapReady()) return;
      core.withBypass(() => {
        document.querySelectorAll('dialog[open]').forEach(d => { if (d.id !== 'class-live' && !d.id.startsWith('class-')) d.close(); });
        if (c !== chapter) { rememberPosition(); chapter = c; state.chapter = c; save(); buildMap(); }
        const np = nodePos(c, NODE[where]);
        player.position.set(np.x, np.y, np.z);
        try { clearMovement(); autoRoute = []; } catch (e) {}
        lastPlaced = { place: where, chapter: c, x: np.x, z: np.z };
        rememberPosition(); save();
        toast(gather ? '선생님이 모두를 ' + placeLabel(where, c) + ' 앞으로 불렀어요.' : '선생님이 ' + placeLabel(where, c) + ' 앞으로 옮겨 주었어요.');
      });
    },
    openStep(l, s) {
      if (s > 3) return;
      const open = core.live.open_lessons;
      if (l !== chapter && Array.isArray(open) && !open.includes(l)) { toast('선생님이 연 단계가 아직 열리지 않은 사건에 있어요.'); return; }
      if (inquiry() && chapter === l && inquiryStep === s) return;
      if (!inquiry() && l === chapter) rememberPosition();
      state.accepted[l] = true; state.chapter = l; save();
      location.href = fossilURL('inquiry.html?chapter=' + l + '&step=' + s);
    },
    setView(mode) {
      if (inquiry() || !mapReady() || typeof setMode !== 'function') return;
      if (['overview', 'follow', 'first'].includes(mode)) setMode(mode);
      else if (mode === 'third') setMode('follow');
    },
    answerLabel(ref) {
      const m = /^(\d)-(\d)\|(.+)$/.exec(String(ref || ''));
      if (!m) return '';
      const c = CHAPTERS[+m[1]];
      return (c ? m[1] + '-' + (+m[2] + 1) + ' ' + c.steps[+m[2]] + ' · ' : '') + m[3];
    },
    screen(sc) {
      const page = Number(sc.page) || 0;
      const l = Math.min(4, Math.max(1, parseInt(String(sc.ref).replace(/\D/g, ''), 10) || chapter));
      if (sc.kind === 'learn') {
        // 화석은 학습하기 쪽 대신 사건 이야기 장면을 띄운다
        const slides = (CHAPTERS[l] && CHAPTERS[l].intro) || [];
        const s = slides[Math.min(page, slides.length - 1)];
        return { head: l + '차시 사건 이야기 · ' + (Math.min(page, slides.length - 1) + 1) + '/' + slides.length,
          body: s ? '<h2 id="class-live-title">' + esc(s[0]) + '</h2><p class="class-lead" style="font-size:19px;line-height:1.75">' + esc(s[1]) + '</p>' : '<h2 id="class-live-title">이야기 장면을 찾지 못했어요.</h2>' };
      }
      return {
        head: l + '차시 선생님 슬라이드 · ' + (page + 1) + '쪽',
        body: '<h2 id="class-live-title" class="sr-only">' + l + '차시 선생님 슬라이드</h2><div class="class-slide"><iframe title="선생님 슬라이드" tabindex="-1" src="teacher.html?lesson=' + l + '&s=1&k=last&p=' + (page + 1) + '"></iframe></div>'
      };
    }
  };

  // 선생님 화면에 보일 내 장소: 가장 가까운 지도 노드
  function place() {
    try {
      if (!mapReady()) return 'map';
      if (lastPlaced && lastPlaced.chapter === chapter && Math.hypot(player.position.x - lastPlaced.x, player.position.z - lastPlaced.z) < 1.5) return lastPlaced.place;
      let best = 7, at = -1;
      navNodes.forEach((n, i) => { const d = Math.hypot(player.position.x - n.x, player.position.z - n.z); if (d < best) { best = d; at = i; } });
      return ['start', 'guide', 'step-1', 'step-2', 'step-3', 'step-4', 'portal'][at] || 'map';
    } catch (e) { return 'map'; }
  }

  core = window.ASILink.create(A);
  return core;
})();
