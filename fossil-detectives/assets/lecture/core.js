/* ═══════════════════════════════════════════════════════════════
   core.js — 강의 덱 엔진
   · 1920×1080 무대를 화면에 맞춰 배율(레터박스)
   · 장면(scene) = 도입(enter, 저절로) + 빌드 단계(go(k), 클릭마다)
   · 되돌아가기·건너뛰기는 "처음 상태로 복원 → 순간 재생"이라 언제나 같은 모습
   · 애니메이션 도구는 ctx 가 쥐고 있어 장면을 떠나면 저절로 정리됨
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const SW = 1920, SH = 1080;
  const Q = new URLSearchParams(location.search);
  const STILL = Q.get('still') === '1';
  /* 학생 모드(?s=1): 대본(노트) 숨김 — 허브 「칠판 다시보기」용. sc_teacher=1 이 저장된 기기는 그대로 교사 화면 */
  let TEACHER_DEV = false; try { TEACHER_DEV = localStorage.getItem('sc_teacher') === '1'; } catch (e) {}
  const STUDENT = Q.get('s') === '1' && !TEACHER_DEV;
  if (STUDENT) document.documentElement.classList.add('student');
  const REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (STILL || Q.get('clean') === '1') document.documentElement.classList.add('still');
  if (Q.get('grid') === '1') document.documentElement.classList.add('grid');
  if (Q.get('log') === '1') {   // 검증용: 콘솔 수준을 앞머리로 남김(console.py 가 읽음)
    const oe = console.error.bind(console), ow = console.warn.bind(console);
    const txt = a => a.map(x => (x && x.stack) ? String(x.stack).split(String.fromCharCode(10)).slice(0, 2).join(' | ') : (typeof x === 'object' ? (() => { try { return JSON.stringify(x); } catch (e) { return String(x); } })() : String(x))).join(' ');
    console.error = (...a) => oe('[ERR] ' + txt(a));
    console.warn = (...a) => ow('[WARN] ' + txt(a));
    window.addEventListener('error', e => oe('[ERR] uncaught ' + (e.message || '') + ' @' + (e.lineno || '')));
    window.addEventListener('unhandledrejection', e => oe('[ERR] rejection ' + ((e.reason && e.reason.stack) || e.reason)));
  }

  /* ── 곡선 ── */
  const EASE = {
    out: 'cubic-bezier(.2,.8,.2,1)', outQuint: 'cubic-bezier(.22,1,.36,1)', inOut: 'cubic-bezier(.65,0,.35,1)',
    in: 'cubic-bezier(.55,0,.75,.1)', spring: 'cubic-bezier(.34,1.56,.64,1)', soft: 'cubic-bezier(.25,.1,.25,1)', linear: 'linear',
  };
  const JE = {
    linear: t => t,
    out: t => 1 - Math.pow(1 - t, 3),
    outQuint: t => 1 - Math.pow(1 - t, 5),
    inOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    in: t => t * t * t,
    soft: t => t * t * (3 - 2 * t),
    spring: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    elastic: t => (t === 0 || t === 1) ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3) + 1,
  };

  /* ── 등장 모양(선언형·ctx.reveal 공용) ── svg 요소에는 blur(필터) 빼고 */
  const REVEAL = {
    rise:  { k: [{ opacity: 0, transform: 'translateY(28px)', filter: 'blur(12px)' }, { opacity: 1, transform: 'translateY(0px)', filter: 'blur(0px)' }], dur: 900 },
    fade:  { k: [{ opacity: 0 }, { opacity: 1 }], dur: 700 },
    blur:  { k: [{ opacity: 0, transform: 'scale(1.06)', filter: 'blur(24px)' }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }], dur: 1100 },
    scale: { k: [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'scale(1)' }], dur: 900 },
    pop:   { k: [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1)' }], dur: 750, ease: 'spring' },
    left:  { k: [{ opacity: 0, transform: 'translateX(-64px)' }, { opacity: 1, transform: 'translateX(0px)' }], dur: 900 },
    right: { k: [{ opacity: 0, transform: 'translateX(64px)' }, { opacity: 1, transform: 'translateX(0px)' }], dur: 900 },
    down:  { k: [{ opacity: 0, transform: 'translateY(-28px)' }, { opacity: 1, transform: 'translateY(0px)' }], dur: 900 },
    up:    { k: [{ opacity: 0, transform: 'translateY(72px)' }, { opacity: 1, transform: 'translateY(0px)' }], dur: 1000 },
    draw:  { k: [{ opacity: 1, strokeDashoffset: 1 }, { opacity: 1, strokeDashoffset: 0 }], dur: 1200, ease: 'inOut' },
    wipe:  { k: [{ opacity: 1, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0% 0 0)' }], dur: 1000, ease: 'inOut' },
    none:  { k: [{ opacity: 1 }, { opacity: 1 }], dur: 1 },
  };
  const isSVG = el => el instanceof SVGElement && !(el instanceof SVGSVGElement);
  const GEOM = 'path,line,polyline,polygon,circle,ellipse,rect';
  const noFilter = k => k.map(f => { const g = Object.assign({}, f); delete g.filter; return g; });

  const STUB = { finished: Promise.resolve(), cancel() {}, finish() {}, pause() {}, play() {}, playbackRate: 1, effect: null };

  /* ═════════ 장면 도구 상자 ═════════ */
  class Ctx {
    constructor(root, idx) {
      this.root = root; this.idx = idx; this.instant = false; this.alive = true;
      this.reduced = REDUCED; this.still = STILL; this.E = EASE; this.JE = JE; this.data = {};
      this._anims = []; this._loops = []; this._timers = []; this._waits = []; this._tweens = []; this._sfxT = []; this._disp = [];
    }
    /** 효과음: SFX.play(name, a, b) 를 delay ms 뒤에. 순간 모드(되돌리기·복원)·건너뛰기·장면 나감이면 조용히 */
    sfx(name, delay = 0, a, b) {
      if (STILL || this.instant || !this.alive || !window.SFX) return;
      if (delay > 0) { const id = setTimeout(() => { if (this.alive && !this.instant) SFX.play(name, a, b); }, delay); this._sfxT.push(id); }
      else SFX.play(name, a, b);
    }
    /** 이어지는 소리('fan'|'hum'|'boil') — 장면을 떠나면 저절로 멎는다. 반환: {level(v), whine(v), stop()} */
    sfxLoop(kind, o) { const h = window.SFX ? SFX.loop(kind, o) : null; if (h) this._disp.push(() => h.stop()); return h; }
    onDispose(fn) { this._disp.push(fn); }
    $(s) { return this.root.querySelector(s); }
    $$(s) { return Array.from(this.root.querySelectorAll(s)); }
    _el(el) { return typeof el === 'string' ? this.$(el) : el; }
    _els(els) { if (typeof els === 'string') return this.$$(els); if (!els) return []; return (els.length !== undefined && !(els instanceof Element)) ? Array.from(els) : [els]; }

    /** Web Animations 한 방. o: {dur, delay, ease, fill, iter, dir, composite}. 순간 모드면 바로 끝 상태 */
    a(el, kf, o = {}) {
      el = this._el(el);
      if (!el || !this.alive) return STUB;
      const infinite = o.iter === Infinity;
      const inst = this.instant && !infinite;
      const an = el.animate(kf, {
        duration: inst ? 0 : (o.dur ?? 700), delay: inst ? 0 : (o.delay ?? 0),
        easing: EASE[o.ease] || o.ease || EASE.out, fill: o.fill || 'both',
        iterations: o.iter ?? 1, direction: o.dir || 'normal', composite: o.composite || 'replace',
      });
      if (inst) { try { an.finish(); } catch (e) {} }
      this._anims.push(an);
      return an;
    }
    /** 여러 요소에 시차(stagger ms)를 두고 같은 애니 */
    all(els, kf, o = {}) {
      return this._els(els).map((e, i) => this.a(e, typeof kf === 'function' ? kf(e, i) : kf, Object.assign({}, o, { delay: (o.delay || 0) + i * (o.stagger || 0) })));
    }
    /** 등장: fx = rise|fade|blur|scale|pop|left|right|down|up|draw|wipe */
    reveal(el, fx = 'rise', o = {}) {
      const els = this._els(el); const out = [];
      els.forEach((e, i) => {
        const P = REVEAL[fx] || REVEAL.rise;
        const d = Object.assign({ dur: P.dur, ease: P.ease || 'out' }, o);
        if (o.stagger) d.delay = (o.delay || 0) + i * o.stagger;
        // 효과음: 학습지 빈칸 답이 채워지면 「띠링」, pop·up 등장이면 「톡」
        if (!this.instant) {
          const sk = (e.classList && e.classList.contains('a') && e.parentElement && e.parentElement.classList.contains('bk')) ? 'blank' : ((fx === 'pop' || fx === 'up') ? 'pop' : null);
          if (sk) this.sfx(sk, d.delay || 0);
        }
        if (fx === 'draw') {
          const geo = (e.matches && e.matches(GEOM)) ? [e] : Array.from(e.querySelectorAll(GEOM));
          this.a(e, [{ opacity: 1 }, { opacity: 1 }], { dur: 1, delay: d.delay });
          geo.forEach(g => { if (!g.hasAttribute('pathLength')) g.setAttribute('pathLength', '1'); out.push(this.a(g, P.k, d)); });
        } else {
          out.push(this.a(e, isSVG(e) ? noFilter(P.k) : P.k, d));
        }
      });
      return out.length === 1 ? out[0] : { finished: Promise.all(out.map(x => x.finished)), list: out };
    }
    /** 사라짐(기본: 흐려지며 살짝 위로) */
    hide(el, o = {}) {
      return this.all(el, isSVG(this._els(el)[0] || document.body) ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(8px)' }],
        Object.assign({ dur: 500, ease: 'out' }, o));
    }
    /** 기다리기(순간 모드면 곧장) */
    wait(ms) {
      if (this.instant || !this.alive) return Promise.resolve();
      return new Promise(res => { const w = { res }; w.t = setTimeout(() => { const i = this._waits.indexOf(w); if (i >= 0) this._waits.splice(i, 1); res(); }, ms); this._waits.push(w); });
    }
    /** JS 트윈 — WAAPI 로 못 움직이는 것(속성·viewBox·path d·숫자). fn(p, rawT) */
    tween(dur, fn, o = {}) {
      const ease = typeof o.ease === 'function' ? o.ease : (JE[o.ease] || JE.out);
      if (this.instant || !this.alive) { if (this.alive) fn(1, 1); return Promise.resolve(); }
      const delay = o.delay || 0;
      return new Promise(res => {
        let start = null, done = false, id = 0;
        const tw = {
          finish: () => { if (done) return; done = true; cancelAnimationFrame(id); try { fn(1, 1); } catch (e) { console.error(e); } res(); },
          kill: () => { if (done) return; done = true; cancelAnimationFrame(id); res(); },
        };
        this._tweens.push(tw);
        if (!o.noInit) { try { fn(0, 0); } catch (e) { console.error(e); } }
        const tick = now => {
          if (done) return;
          if (start === null) start = now + delay;
          const t = (now - start) / dur;
          if (t < 0) { id = requestAnimationFrame(tick); return; }
          if (t >= 1) { tw.finish(); return; }
          try { fn(ease(t), t); } catch (e) { console.error(e); tw.kill(); return; }
          id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
      });
    }
    /** 숫자 굴리기. o.fmt(v) 로 모양 */
    count(el, from, to, o = {}) {
      el = this._el(el); if (!el) return Promise.resolve();
      const fmt = o.fmt || (v => Math.round(v).toLocaleString('ko-KR'));
      if (to !== from) this.sfx('counter', o.delay || 0, o.dur ?? 1200);
      return this.tween(o.dur ?? 1200, p => { el.textContent = fmt(from + (to - from) * p); }, Object.assign({ ease: 'outQuint' }, o));
    }
    /** 선 그리기(pathLength=1 을 붙여 stroke-dashoffset 1→0) */
    draw(el, o = {}) { return this.reveal(el, 'draw', o); }
    /** SVG 카메라 — viewBox 를 [x,y,w,h] 로 옮김 */
    camera(svg, to, o = {}) {
      svg = this._el(svg); if (!svg) return Promise.resolve();
      const from = (svg.getAttribute('viewBox') || `0 0 ${SW} ${SH}`).split(/[\s,]+/).map(Number);
      this.sfx('whoosh', o.delay || 0, o.dur ?? 1400, .55);
      return this.tween(o.dur ?? 1400, p => { svg.setAttribute('viewBox', from.map((v, i) => (v + (to[i] - v) * p).toFixed(2)).join(' ')); }, Object.assign({ ease: 'inOut' }, o));
    }
    /** 장면이 살아 있는 동안 도는 고리. fn(t초, dt초). 반환값.stop() */
    loop(fn) {
      const L = { on: true, t: 0, last: null, id: 0 };
      const tick = now => {
        if (!L.on || !this.alive) return;
        const dt = L.last === null ? 0 : Math.min(0.05, (now - L.last) / 1000);
        L.last = now; L.t += dt;
        try { fn(L.t, dt); } catch (e) { console.error('[loop]', e); L.on = false; return; }
        L.id = requestAnimationFrame(tick);
      };
      L.stop = () => { L.on = false; cancelAnimationFrame(L.id); };
      L.id = requestAnimationFrame(tick);
      this._loops.push(L);
      return L;
    }
    timer(fn, ms) { const id = setTimeout(() => { if (this.alive) fn(); }, this.instant ? 0 : ms); this._timers.push(id); return id; }
    every(fn, ms) { const id = setInterval(() => { if (this.alive) fn(); }, ms); this._timers.push(id); return id; }
    /** 지금 도는 것을 끝 상태로(클릭이 애니 도중에 오면) */
    hurry() {
      this.instant = true;
      this._sfxT.splice(0).forEach(id => clearTimeout(id));      // 아직 울리기 전인 효과음은 접는다
      this._anims.forEach(a => { try { const t = a.effect && a.effect.getComputedTiming(); if (t && t.iterations !== Infinity && a.playState !== 'finished') a.finish(); } catch (e) {} });
      this._tweens.slice().forEach(tw => tw.finish());
      this._waits.splice(0).forEach(w => { clearTimeout(w.t); w.res(); });
    }
    dispose() {
      this.alive = false;
      this._sfxT.splice(0).forEach(id => clearTimeout(id));
      this._disp.splice(0).forEach(fn => { try { fn(); } catch (e) {} });
      this._loops.forEach(l => l.stop());
      this._timers.forEach(id => clearTimeout(id));
      this._tweens.slice().forEach(tw => tw.kill());
      this._waits.splice(0).forEach(w => { clearTimeout(w.t); w.res(); });
    }
  }

  /* ═════════ SVG 도우미 ═════════ */
  const NS = 'http://www.w3.org/2000/svg';
  const U = {
    NS,
    el(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; },
    lerp: (a, b, t) => a + (b - a) * t,
    clamp: (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)),
    rand: (a = 0, b = 1) => a + Math.random() * (b - a),
    /** 결정적 난수(검증 화면이 매번 같게): U.rng(seed)() */
    rng(seed = 1) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; },
    uid: (() => { let n = 0; return (p = 'u') => `${p}${(++n).toString(36)}`; })(),
    E: EASE, JE,
  };

  /* ═════════ 덱 ═════════ */
  const scenes = {};
  const Deck = {
    scene(id, def) { scenes[id] = def; },
    list: [], i: -1, k: 0, ctx: null, busy: null, U, EASE, JE, Ctx, STILL, REDUCED, STUDENT,
  };
  window.Deck = Deck; window.U = U;

  let stage, viewport, hud, prog, dots, notesEl, ovEl, helpEl, blankEl;
  const fit = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / SW, vh / SH);
    stage.style.transform = `translate(${(vw - SW * s) / 2 - vw / 2}px, ${(vh - SH * s) / 2 - vh / 2}px) scale(${s})`;
    Deck.scale = s;
  };
  const defOf = sec => scenes[sec.id] || {};
  const stepsOf = sec => {
    if (sec.__steps != null) return sec.__steps;
    let m = +(defOf(sec).steps || 0);
    const tmp = document.createElement('div'); tmp.innerHTML = sec.__pristine;
    tmp.querySelectorAll('[data-step]').forEach(e => { m = Math.max(m, +e.getAttribute('data-step') || 0); });
    tmp.querySelectorAll('[data-out]').forEach(e => { m = Math.max(m, +e.getAttribute('data-out') || 0); });
    return (sec.__steps = m);
  };
  const safe = async (fn, c) => { try { await fn(); } catch (e) { if (c && c.alive) console.error(`[scene ${c.root.id}]`, e); } };

  function runDecl(c, k) {
    if (k === 0) {
      c.$$('[data-in]').forEach(el => {
        const v = el.getAttribute('data-in'); const delay = +(el.dataset.delay || (v && !isNaN(+v) ? v : 0));
        c.reveal(el, el.dataset.fx || 'rise', { delay, dur: el.dataset.dur ? +el.dataset.dur : undefined, ease: el.dataset.ease || undefined });
      });
    } else {
      c.$$(`[data-step="${k}"]`).forEach(el => {
        c.reveal(el, el.dataset.fx || 'rise', { delay: +(el.dataset.delay || 0), dur: el.dataset.dur ? +el.dataset.dur : undefined, ease: el.dataset.ease || undefined });
      });
      c.$$(`[data-out="${k}"]`).forEach(el => c.hide(el, { delay: +(el.dataset.outDelay || 0) }));
    }
  }

  async function show(i, k = 0, opt = {}) {
    const n = Deck.list.length; if (!n) return;
    i = Math.max(0, Math.min(n - 1, i));
    const to = Deck.list[i]; const from = Deck.i >= 0 ? Deck.list[Deck.i] : null;
    k = Math.max(0, Math.min(stepsOf(to), k));
    const instant = !!opt.instant || STILL;
    if (Deck.ctx) { Deck.ctx.hurry(); Deck.ctx.dispose(); }
    Deck.busy = null;

    if (from && from !== to) {
      from.classList.remove('is-on');
      if (instant || opt.cut) { from.classList.remove('is-out'); from.innerHTML = ''; }
      else {
        from.classList.add('is-out');
        const done = () => { if (!from.classList.contains('is-on')) { from.classList.remove('is-out'); from.innerHTML = ''; } };
        setTimeout(done, 700);
      }
    }
    to.getAnimations && to.getAnimations().forEach(a => a.cancel());
    to.innerHTML = to.__pristine;
    to.classList.remove('is-out'); to.classList.add('is-on');
    Deck.i = i; Deck.k = k;
    const tile = to.getAttribute('data-tile') || 'dark';
    document.body.classList.toggle('on-light', tile === 'light' || tile === 'parchment');
    if (from && from !== to && !instant && !opt.cut) {
      to.animate([{ opacity: 0, transform: 'scale(1.015)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 620, easing: EASE.out });
      if (window.SFX) SFX.play('slide');
    }
    const c = new Ctx(to, i); Deck.ctx = c;
    const def = defOf(to);
    const run = (async () => {
      c.instant = instant;
      runDecl(c, 0);
      if (def.enter) await safe(() => def.enter(c), c);
      for (let s = 1; s <= k; s++) {
        if (!c.alive) return;
        c.instant = true; runDecl(c, s);
        if (def.go) await safe(() => def.go(c, s), c);
      }
      c.instant = STILL;
    })();
    Deck.busy = run; ui();
    await run;
    if (Deck.busy === run) Deck.busy = null;
    if (STILL) markReady();
    try { history.replaceState(null, '', `#${i + 1}${k ? '.' + k : ''}`); } catch (e) {}
  }
  async function stepTo(k) {
    const c = Deck.ctx, sec = Deck.list[Deck.i]; if (!c) return;
    Deck.k = k; ui();
    if (window.SFX && !STILL) SFX.play('step');
    c.instant = STILL; runDecl(c, k);
    const def = defOf(sec);
    const run = def.go ? safe(() => def.go(c, k), c) : Promise.resolve();
    Deck.busy = run;
    await run;
    if (Deck.busy === run) { Deck.busy = null; c.instant = STILL; }
    try { history.replaceState(null, '', `#${Deck.i + 1}${k ? '.' + k : ''}`); } catch (e) {}
  }
  Deck.next = () => {
    if (Deck.busy && Deck.ctx) { Deck.ctx.hurry(); return; }
    const sec = Deck.list[Deck.i];
    if (Deck.k < stepsOf(sec)) stepTo(Deck.k + 1);
    else if (Deck.i < Deck.list.length - 1) show(Deck.i + 1, 0);
  };
  Deck.prev = () => {
    if (Deck.k > 0) show(Deck.i, Deck.k - 1, { instant: true });
    else if (Deck.i > 0) show(Deck.i - 1, stepsOf(Deck.list[Deck.i - 1]), { instant: true });
  };
  Deck.go = (i, k = 0, opt) => show(i, k, opt);
  Deck.goId = (id, k = 0) => { const i = Deck.list.findIndex(s => s.id === id); if (i >= 0) show(i, k); };
  /** 지금 단계 다시 보기(R) */
  Deck.replay = async () => {
    const k = Deck.k;
    if (k === 0) { const i = Deck.i; Deck.i = -1; await show(i, 0, { cut: true }); }
    else { await show(Deck.i, k - 1, { instant: true }); stepTo(k); }
  };
  Deck.steps = sec => stepsOf(sec || Deck.list[Deck.i]);

  function markReady() {
    const fin = () => { document.documentElement.dataset.ready = '1'; };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(fin, 60));
  }

  /* ── 화면 바깥 UI ── */
  const ICON = {
    prev: '<svg viewBox="0 0 20 20"><path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 20 20"><path d="M7.5 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    grid: '<svg viewBox="0 0 20 20"><g fill="currentColor"><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/></g></svg>',
    notes: '<svg viewBox="0 0 20 20"><path d="M4 5h12M4 10h12M4 15h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    full: '<svg viewBox="0 0 20 20"><path d="M3.5 8V3.5H8M12 3.5h4.5V8M16.5 12v4.5H12M8 16.5H3.5V12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    replay: '<svg viewBox="0 0 20 20"><path d="M4.5 10a5.5 5.5 0 1 0 1.8-4.1M4.5 3.8v3.4h3.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sound: '<svg viewBox="0 0 20 20"><path d="M3.5 8h3l4-3.5v11L6.5 12h-3z" fill="currentColor"/><path d="M13.5 7.2a4 4 0 0 1 0 5.6M15.6 5a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 20 20"><path d="M3.5 8h3l4-3.5v11L6.5 12h-3z" fill="currentColor"/><path d="M13.5 7.5l4.5 5M18 7.5l-4.5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };
  function syncSound() {
    const b = hud && hud.querySelector('[data-a="sound"]'); if (!b) return;
    const on = !window.SFX || SFX.isOn();
    b.innerHTML = on ? ICON.sound : ICON.mute; b.classList.toggle('off', !on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  /* ── 키워드 진행 표시(무대 오른쪽 위 · 녹화 화면에도 보임) ──
     window.KW = {items:[{kw}], at:[장마다 키워드 번호]} — build.py 가 slides/…/_keywords.json 으로 넣는다.
     at: -1 = 숨김(표지·도입·키워드 장), 0..n-1 = 그 키워드, n = 모두 끝(정리·문제). 칩을 누르면 그 키워드의 첫 장으로 */
  let kwEl = null;
  function buildKw() {
    const K = window.KW; if (!K || !K.items || !K.items.length || !K.at) return;
    kwEl = document.createElement('div'); kwEl.id = 'kwbar'; kwEl.setAttribute('data-interactive', '');
    kwEl.innerHTML = K.items.map((it, j) => `<button type="button" class="kw" data-j="${j}" aria-label="키워드 ${j + 1}: ${it.kw}"><b>${j + 1}</b><span>${it.kw}</span></button>`).join('');
    stage.appendChild(kwEl);
    kwEl.addEventListener('click', e => {
      const b = e.target.closest('.kw'); if (!b) return; e.stopPropagation();
      const i = K.at.indexOf(+b.dataset.j); if (i >= 0 && i !== Deck.i) show(i, 0);
    });
  }
  function syncKw() {
    if (!kwEl) return;
    const K = window.KW, a = K.at[Deck.i], sec = Deck.list[Deck.i];
    const hide = a == null || a < 0 || (sec && sec.hasAttribute('data-kw-hide'));
    kwEl.classList.toggle('show', !hide);
    kwEl.classList.toggle('end', a >= K.items.length);
    kwEl.querySelectorAll('.kw').forEach((b, j) => { b.classList.toggle('done', j < a); b.classList.toggle('cur', j === a); });
  }
  function buildChrome() {
    buildKw();
    hud = document.createElement('div'); hud.id = 'hud';
    hud.innerHTML = `<button data-a="replay" aria-label="이 단계 다시 보기(R)">${ICON.replay}</button>${STUDENT ? '' : `<button data-a="notes" aria-label="대본 보기(T)">${ICON.notes}</button>`}<button data-a="grid" aria-label="전체 보기(O)">${ICON.grid}</button><button data-a="prev" aria-label="이전">${ICON.prev}</button><span class="count" id="count">1 / 1</span><button data-a="next" aria-label="다음">${ICON.next}</button><button data-a="sound" aria-label="소리 켜기/끄기(M)">${ICON.sound}</button><button data-a="full" aria-label="전체 화면(F)">${ICON.full}</button>`;
    document.body.appendChild(hud); syncSound();
    hud.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); act(b.dataset.a); });
    prog = document.createElement('div'); prog.id = 'progress'; prog.innerHTML = '<i></i>'; document.body.appendChild(prog);
    dots = document.createElement('div'); dots.id = 'stepdots'; document.body.appendChild(dots);
    notesEl = document.createElement('div'); notesEl.id = 'notes'; document.body.appendChild(notesEl);
    ovEl = document.createElement('div'); ovEl.id = 'overview'; ovEl.className = 'overlay'; document.body.appendChild(ovEl);
    helpEl = document.createElement('div'); helpEl.id = 'help'; helpEl.className = 'overlay';
    helpEl.innerHTML = `<div class="box"><h3>강의 조작</h3><table>
      <tr><td><kbd>→</kbd> <kbd>Space</kbd> 화면 클릭</td><td>다음(빌드 단계 → 다음 장)</td></tr>
      <tr><td><kbd>←</kbd> 오른쪽 클릭</td><td>이전</td></tr>
      <tr><td><kbd>R</kbd></td><td>이 단계 애니메이션 다시 보기</td></tr>
      <tr><td><kbd>N</kbd></td><td>발표자 노트(대본)</td></tr>
      <tr><td><kbd>O</kbd></td><td>전체 보기</td></tr>
      <tr><td><kbd>F</kbd></td><td>전체 화면</td></tr>
      <tr><td><kbd>M</kbd></td><td>소리 켜기/끄기</td></tr>
      <tr><td><kbd>B</kbd> / <kbd>W</kbd></td><td>검은 화면 / 흰 화면</td></tr>
      <tr><td>숫자 + <kbd>Enter</kbd></td><td>그 장으로 이동</td></tr>
      <tr><td>좌우로 밀기</td><td>전자칠판에서 넘기기</td></tr></table></div>`;
    document.body.appendChild(helpEl);
    helpEl.addEventListener('click', () => helpEl.classList.remove('show'));
    blankEl = document.createElement('div'); blankEl.id = 'blank'; document.body.appendChild(blankEl);
    blankEl.addEventListener('click', () => { blankEl.className = ''; });
  }
  function act(a) {
    if (a === 'next') Deck.next(); else if (a === 'prev') Deck.prev();
    else if (a === 'notes') toggleNotes(); else if (a === 'grid') toggleOverview();
    else if (a === 'full') toggleFull(); else if (a === 'replay') Deck.replay();
    else if (a === 'sound') { if (window.SFX) SFX.toggle(); syncSound(); }
  }
  function ui() {
    const n = Deck.list.length, sec = Deck.list[Deck.i]; if (!sec || !hud) return;
    const st = stepsOf(sec);
    hud.querySelector('#count').textContent = `${Deck.i + 1} / ${n}`;
    prog.firstChild.style.width = `${((Deck.i + (st ? Deck.k / (st + 1) : 0)) / Math.max(1, n - 1)) * 100}%`;
    dots.innerHTML = st ? Array.from({ length: st + 1 }, (_, j) => `<i class="${j <= Deck.k ? 'on' : ''}"></i>`).join('') : '';
    syncKw();
    if (notesEl.classList.contains('show')) renderNotes();
    if (ovEl.classList.contains('show')) renderOverview();
  }
  function md(s) { return s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  function renderNotes() {
    const sec = Deck.list[Deck.i]; const N = window.NOTES || {};
    const keys = (sec.dataset.notes || '').split(/[\s,]+/).filter(Boolean);
    const nx = Deck.list[Deck.i + 1];
    const st = stepsOf(sec);
    const extra = sec.dataset.say ? `<p>${md(sec.dataset.say)}</p>` : '';
    notesEl.innerHTML = `<div class="nh"><b>${Deck.i + 1}. ${sec.dataset.title || sec.id}</b><span>${st ? `단계 ${Deck.k} / ${st}` : ''}</span><span class="nx">${nx ? '다음 → ' + (nx.dataset.title || '') : '마지막 장'}</span></div>` +
      keys.map(key => N[key] ? `<p><span class="pn">${key}</span>${md(N[key])}</p>` : '').join('') + extra;
  }
  function toggleNotes() { notesEl.classList.toggle('show'); if (notesEl.classList.contains('show')) renderNotes(); }
  function renderOverview() {
    ovEl.innerHTML = `<h2>전체 보기 · ${Deck.list.length}장</h2><div class="grid">` + Deck.list.map((s, i) =>
      `<button class="ov ${i === Deck.i ? 'cur' : ''}" data-i="${i}" data-tile="${s.getAttribute('data-tile') || 'dark'}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="tt">${s.dataset.title || s.id}</span></button>`).join('') + '</div>';
  }
  function toggleOverview() {
    const on = !ovEl.classList.contains('show');
    ovEl.classList.toggle('show', on); if (on) renderOverview();
  }
  function toggleFull() {
    const d = document;
    if (!d.fullscreenElement) (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || (() => {})).call(d.documentElement);
    else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  }

  let hudTimer = 0;
  function pokeHud() { if (STILL) return; hud.classList.add('show'); dots.classList.add('show'); clearTimeout(hudTimer); hudTimer = setTimeout(() => { hud.classList.remove('show'); dots.classList.remove('show'); }, 2600); }

  function bind() {
    let jump = '';
    document.addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key;
      if (helpEl.classList.contains('show')) { helpEl.classList.remove('show'); e.preventDefault(); return; }
      if (blankEl.className && key !== 'b' && key !== 'B' && key !== 'w' && key !== 'W') { blankEl.className = ''; e.preventDefault(); return; }
      if (/^[0-9]$/.test(key)) { jump += key; return; }
      if (key === 'Enter' && jump) { show(+jump - 1, 0); jump = ''; e.preventDefault(); return; }
      jump = '';
      if (ovEl.classList.contains('show') && (key === 'Escape' || key === 'o' || key === 'O')) { toggleOverview(); e.preventDefault(); return; }
      switch (key) {
        case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown': case 'Enter': Deck.next(); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': Deck.prev(); break;
        case 'Home': show(0, 0); break;
        case 'End': show(Deck.list.length - 1, 0); break;
        case 'n': case 'N': case 't': case 'T': if (!STUDENT) toggleNotes(); break;
        case 'o': case 'O': toggleOverview(); break;
        case 'f': case 'F': toggleFull(); break;
        case 'm': case 'M': act('sound'); break;
        case 'r': case 'R': Deck.replay(); break;
        case 'b': case 'B': blankEl.className = blankEl.className === 'black' ? '' : 'black'; break;
        case 'w': case 'W': blankEl.className = blankEl.className === 'white' ? '' : 'white'; break;
        case 'h': case 'H': case '?': helpEl.classList.add('show'); break;
        case 'Escape': notesEl.classList.remove('show'); break;
        default: return;
      }
      e.preventDefault();
    });
    ovEl.addEventListener('click', e => { const b = e.target.closest('.ov'); if (b) { ovEl.classList.remove('show'); show(+b.dataset.i, 0); } else ovEl.classList.remove('show'); });
    // 무대 클릭·밀기
    let down = null;
    viewport.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now(), inter: !!e.target.closest('button,a,input,select,textarea,label,[data-interactive]') }; pokeHud(); });
    viewport.addEventListener('pointerup', e => {
      if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; const d0 = down; down = null;
      if (d0.inter) return;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) { dx < 0 ? Deck.next() : Deck.prev(); return; }
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && e.button === 0) {
        const r = stage.getBoundingClientRect();
        (e.clientX - r.left < r.width * 0.12) ? Deck.prev() : Deck.next();
      }
    });
    viewport.addEventListener('contextmenu', e => { if (e.target.closest('[data-interactive]')) return; e.preventDefault(); Deck.prev(); });
    document.addEventListener('mousemove', pokeHud, { passive: true });
    window.addEventListener('resize', fit);
  }

  function boot() {
    viewport = document.getElementById('viewport'); stage = document.getElementById('stage');
    Deck.list = Array.from(stage.querySelectorAll(':scope > section.slide'));
    // 한 번만: 장면별 build(root) → 처음 상태 저장
    Deck.list.forEach(sec => {
      const def = defOf(sec);
      if (def.build) { try { def.build(sec, U); } catch (e) { console.error(`[build ${sec.id}]`, e); } }
      sec.querySelectorAll('[data-fx="draw"]').forEach(g => {
        const geo = g.matches(GEOM) ? [g] : Array.from(g.querySelectorAll(GEOM));
        geo.forEach(x => { if (!x.hasAttribute('pathLength')) x.setAttribute('pathLength', '1'); });
      });
      sec.__pristine = sec.innerHTML;
      sec.innerHTML = '';
    });
    buildChrome(); fit(); bind();
    const h = (location.hash || '').replace('#', '').split('.');
    let si = Q.has('p') ? (+Q.get('p') - 1) : (h[0] ? +h[0] - 1 : 0);
    let sk = Q.has('k') ? +Q.get('k') : (h[1] ? +h[1] : 0);
    if (Q.has('id')) { const j = Deck.list.findIndex(s => s.id === Q.get('id')); if (j >= 0) si = j; }
    if (!(si >= 0)) si = 0;
    if (sk === -1 || Q.get('k') === 'last') sk = 99;
    if (Q.get('play') === '1' && sk > 0 && !STILL) { show(si, sk - 1, { instant: true }).then(() => stepTo(Math.min(sk, stepsOf(Deck.list[si])))); }
    else show(si, sk, { instant: sk > 0 });
    if (!STILL) setTimeout(pokeHud, 400);
  }
  Deck.boot = boot;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
  else setTimeout(boot, 0);
})();
