/* AI와 과학을 IT다 · 수업 연결 공통 몸체(학생 화면)
   NET ZERO ECO-CITY(assets/class/link.js)와 화석 수사대(fossil-detectives/assets/class/link.js)가 함께 쓴다.
   앱마다 다른 것(기록 변수, 저장 키, 장소, 설명 화면, 순간이동)은 연결부(adapter)가 맡고, 여기는
   ① 입장(코드+학번+이름) ② 기기에 먼저 저장 → asi_save(판 번호 충돌 처리) ③ 2초 asi_tick(위치·상태·명령)
   ④ 멈춤·설명 화면·이동 잠금·타이머·공지·카드 ⑤ 손들기·내 정보·나가기 를 맡는다.
   화석 폴더에는 이 파일의 사본이 있다. 고치면 scripts/class-sync.cjs 로 맞출 것. */
window.ASILink = (() => {
  'use strict';
  const DEVICE_KEY = 'asi_device';
  const MAX_CHARS = 340000;                 // 서버 한 줄 40만 자(jsonb 글자 수)보다 넉넉히 작게
  const SEND_WAIT = 1500, SEND_MAXWAIT = 8000, SAME_RESEND = 60000;
  const PROGRAM_NAMES = { netzero: 'NET ZERO ECO-CITY', fossil: '화석 수사대' };

  function create(A) {
    const store = {
      get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
      set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
      del(k) { try { localStorage.removeItem(k); } catch (e) {} }
    };
    const device = (() => {
      let d = store.get(DEVICE_KEY, '');
      if (!/^[A-Za-z0-9-]{8,40}$/.test(d)) { d = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); store.set(DEVICE_KEY, d); }
      return d;
    })();
    const esc = s => window.ASI ? ASI.esc(s) : String(s == null ? '' : s);
    const q = s => document.querySelector(s);
    const SESSION_KEY = 'asi_' + A.id + '_session', NOTE_KEY = 'asi_' + A.id + '_note', RELOAD_KEY = 'asi_' + A.id + '_reloaded';

    let ses = null, on = false, ready = false, initAt = 0, pendingCode = '', key = '';
    let sync = { rev: 0, dirty: false };
    let live = {}, liveRev = -1, lastCmd = null, locked = false, offline = false, helpAt = null, skew = 0;
    let skipped = false, sendTimer = 0, inflight = false, firstDirty = 0, changes = 0, lastSig = '', lastSent = 0, tooBig = false, conflict = null, lastSavedAt = null;
    let helpLocalAt = 0, tickTimer = 0, ticking = false, bypass = false, clockTimer = 0;

    const eligible = () => { try { return !!window.ASI && A.eligible(); } catch (e) { return false; } };
    const keyFor = (code, no) => A.keyPrefix + code + '_' + no;
    const writeSync = () => store.set(key + '_sync', sync);
    const saveCmd = () => store.set(key + '_cmd', lastCmd);
    const keepConflict = (data, rev) => store.set(key + '_conflict', { kept_at: new Date().toISOString(), base_rev: rev, data });
    function readSession() {
      const v = store.get(SESSION_KEY, null);
      return v && typeof v === 'object' && /^[A-Z0-9]{4,12}$/.test(v.code || '') && /^[0-9a-f-]{36}$/i.test(v.token || '') && v.no ? v : null;
    }
    function readLocal(k) { try { const v = JSON.parse(localStorage.getItem(k)); return v && A.validRecord(v) ? v : null; } catch (e) { return null; } }
    // 서버 기록에서 학생 앱이 쓰지 않는 칸을 뺀다
    function strip(d) { const o = Object.assign({}, d || {}); delete o.studentWritten; delete o._sync; return o; }
    function useRecord(d) {
      const rec = A.makeRecord(d ? strip(d) : null);
      A.setRecord(rec);
      try { localStorage.setItem(key, JSON.stringify(rec)); } catch (e) {}
    }

    // 키 순서와 상관없이 같은 내용이면 같은 지문(서버 jsonb 는 키 순서를 바꾼다)
    function stable(v) {
      if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
      if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
      return JSON.stringify(v === undefined ? null : v);
    }
    function sigOf(d) {
      const o = Object.assign({}, d || {});
      delete o._sync; delete o.studentWritten;
      for (const k of A.volatileKeys || []) delete o[k];
      const s = stable(o);
      let h = 2166136261;
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      return (h >>> 0).toString(36) + ':' + s.length;
    }

    // 화면을 그리기 전에 저장 키를 정해야 하는 앱(화석)을 위해: 이 기기에 남은 입장 정보로 키만 돌려준다
    function keyAtParse() {
      try {
        if (!eligible()) return null;
        const asked = ASI.normCode(new URLSearchParams(location.search).get('room') || '');
        const s = readSession();
        if (!s || (asked && asked !== s.code)) return null;
        return keyFor(s.code, s.no);
      } catch (e) { return null; }
    }

    // ---------- 어떤 기록으로 시작할지 고르기 ----------
    // 넷제로: 화면을 그리기 전에 부른다. 화석(A.lateBoot): 화면을 그린 뒤에 불러서, 서버 기록이 더 새로우면 다시 연다.
    async function boot() {
      try {
        if (!eligible()) return;
        const asked = ASI.normCode(new URLSearchParams(location.search).get('room') || '');
        ses = readSession();
        if (asked && (!ses || ses.code !== asked)) pendingCode = asked;
        if (!ses || pendingCode) { if (pendingCode) ses = null; return; }
        on = true;
        key = keyFor(ses.code, ses.no);
        A.useKey(key);
        sync = Object.assign({ rev: 0, dirty: false }, store.get(key + '_sync', {}));
        lastCmd = store.get(key + '_cmd', null);
        const local = readLocal(key);
        let server = null;
        try { server = await ASI.rpc('asi_load', { p_token: ses.token }, { timeout: 6000 }); }
        catch (e) { if (e.code === 'no_student') return lost('no_student'); offline = true; }
        let replaced = false;
        if (server) {
          const sd = server.data && typeof server.data === 'object' ? server.data : null;
          if (sd && server.rev > 0) {
            const own = sd._sync && sd._sync.device === device;
            if (local && sync.dirty && (sync.rev === server.rev || own)) { if (!A.lateBoot) useRecord(local); sync.rev = server.rev; }
            else if (local && sync.dirty) {
              keepConflict(local, sync.rev); useRecord(sd); replaced = true; sync = { rev: server.rev, dirty: false };
              note('다른 기기에서 고친 기록이 있어서 서버 기록을 열었어요. 이 기기에서 쓰던 기록은 따로 보관했어요(내 정보 → 보관한 기록 내려받기).');
            } else {
              const same = local && sigOf(local) === sigOf(sd);
              if (!A.lateBoot || !same) { useRecord(sd); replaced = !same; }
              sync = { rev: server.rev, dirty: false }; lastSig = sigOf(sd); lastSent = Date.now();
            }
            lastSavedAt = server.updated_at || null;
          } else if (local) { if (!A.lateBoot) useRecord(local); sync = { rev: 0, dirty: true }; }
          else { if (!A.lateBoot) useRecord(null); sync = { rev: 0, dirty: false }; }
        } else if (!A.lateBoot) useRecord(local);
        writeSync();
        // 화면을 이미 그린 앱은 서버 기록으로 바꾼 뒤 한 번만 다시 연다
        if (A.lateBoot && replaced && !sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, '1'); location.reload(); return 'reload';
        }
        sessionStorage.removeItem(RELOAD_KEY);
      } catch (e) { console.warn('class boot', e && e.message); }
    }

    // ---------- 화면이 준비된 뒤 ----------
    function init() {
      if (!eligible()) return;
      buildButtons();
      const msg = sessionStorage.getItem(NOTE_KEY); if (msg) sessionStorage.removeItem(NOTE_KEY);
      if (!on) { if (pendingCode) setTimeout(() => openJoin(pendingCode, msg || ''), 300); return; }
      A.wrap(api);
      ready = true; initAt = Date.now();
      status(); renderHand();
      if (msg) setTimeout(() => openMe(msg), 500);
      document.addEventListener('visibilitychange', () => { if (!document.hidden && on) { tick(); queueSend(0); } });
      window.addEventListener('online', () => { if (on) { tick(); queueSend(0); } });
      window.addEventListener('beforeunload', () => { if (on) writeSync(); });
      window.addEventListener('resize', placeBars);
      tickTimer = setTimeout(tick, 900);
      schedule();
    }

    // ---------- 저장 ----------
    function schedule() {
      if (!on || !ready) return;
      changes++;
      if (!sync.dirty) { sync.dirty = true; writeSync(); }
      if (!firstDirty) firstDirty = Date.now();
      queueSend(Date.now() - firstDirty > SEND_MAXWAIT ? 0 : SEND_WAIT);
    }
    function queueSend(ms) { if (!on) return; clearTimeout(sendTimer); sendTimer = setTimeout(send, Math.max(0, ms || 0)); }
    function payload() {
      const d = Object.assign({}, A.getRecord());
      A.trim(d, 0);
      d._sync = { device, at: new Date().toISOString(), v: 1 };
      for (let level = 1; level <= 2 && JSON.stringify(d).length > MAX_CHARS; level++) A.trim(d, level);
      return JSON.stringify(d).length > MAX_CHARS ? null : d;
    }
    async function send(force) {
      if (!on || inflight || locked || conflict) return;
      if (!sync.dirty && !force) return;
      const d = payload();
      if (!d) { tooBig = true; status(); return; }
      tooBig = false;
      const sig = sigOf(d);
      if (!force && sig === lastSig && Date.now() - lastSent < SAME_RESEND) {   // 클릭 기록만 늘었으면 1분에 한 번만
        queueSend(SAME_RESEND - (Date.now() - lastSent) + 50);
        if (!skipped) { skipped = true; status(); }
        return;
      }
      skipped = false; inflight = true;
      const mark = changes;
      try {
        let prog = {}; try { prog = A.progress() || {}; } catch (e) {}
        const r = await ASI.rpc('asi_save', { p_token: ses.token, p_data: d, p_progress: prog, p_base_rev: sync.rev }, { timeout: 15000 });
        if (r && r.conflict) { await onConflict(r); return; }
        sync.rev = r.rev; lastSig = sig; lastSent = Date.now(); lastSavedAt = r.updated_at || new Date().toISOString();
        if (changes === mark) { sync.dirty = false; firstDirty = 0; }
        writeSync();
        offline = false;
      } catch (e) {
        if (e.code === 'records_locked') locked = true;
        else if (e.code === 'no_student') return lost('no_student');
        else if (e.code === 'too_long') tooBig = true;
        else offline = true;
      } finally {
        inflight = false;
        status();
        if (on && sync.dirty && !locked && !conflict && !tooBig) queueSend(offline ? 5000 : 2000);
      }
    }
    // 판 번호가 달라 저장되지 않았을 때: 같은 기기가 먼저 보낸 것이면 판만 맞추고, 다른 기기면 학생이 고른다
    async function onConflict(r) {
      let server = null;
      try { server = await ASI.rpc('asi_load', { p_token: ses.token }); } catch (e) {}
      const sd = server && server.data;
      if (sd && sd._sync && sd._sync.device === device) { sync.rev = server.rev; writeSync(); queueSend(0); return; }
      conflict = { rev: server ? server.rev : r.rev, updated_at: server ? server.updated_at : r.updated_at };
      status();
      openMe();
    }
    async function resolve(choice) {
      if (!conflict) return;
      const server = await ASI.rpc('asi_load', { p_token: ses.token });
      if (choice === 'server') {
        keepConflict(JSON.parse(JSON.stringify(A.getRecord())), sync.rev);
        useRecord(server.data);
        sync = { rev: server.rev, dirty: false }; writeSync();
        conflict = null;
        location.reload();
      } else {
        if (server && server.data) keepConflict(server.data, server.rev);
        sync.rev = server ? server.rev : conflict.rev; conflict = null; writeSync();
        await send(true);
        openMe();
      }
    }

    // ---------- 2초 신호 ----------
    async function tick() {
      clearTimeout(tickTimer);
      if (!on) return;
      if (ticking) { tickTimer = setTimeout(tick, 1000); return; }
      ticking = true;
      try {
        if (Date.now() - initAt > 1500 && A.applyGoto) A.applyGoto();
        const pos = position();
        const sentAt = Date.now();
        const r = await ASI.rpc('asi_tick', { p_token: ses.token, p_lesson: pos.lesson, p_step: pos.step, p_place: pos.place, p_after: lastCmd == null ? 0 : lastCmd, p_live_rev: liveRev }, { timeout: 8000 });
        if (offline) { offline = false; queueSend(0); }
        if (r.now) skew = Date.parse(r.now) - Date.now();
        if (r.live && typeof r.live === 'object') { live = r.live; liveRev = r.live_rev; renderLive(); }
        else if (liveShown() && Array.from(document.querySelectorAll('dialog[open]')).some(x => x.id !== 'class-live')) renderLive();
        if (!!r.records_locked !== locked) { locked = !!r.records_locked; if (!locked) queueSend(0); }
        if (r.group_no !== undefined && ses.group !== r.group_no) { ses.group = r.group_no; store.set(SESSION_KEY, ses); }
        if ('help_at' in r && sentAt > helpLocalAt && (r.help_at || null) !== (helpAt || null)) { helpAt = r.help_at || null; renderHand(); }
        const cmds = Array.isArray(r.commands) ? r.commands : [];
        if (lastCmd == null) { lastCmd = cmds.reduce((m, c) => Math.max(m, c.id), 0); saveCmd(); }   // 번호를 모르면 지난 명령은 건너뛴다
        else for (const c of cmds) { if (c.id <= lastCmd) continue; lastCmd = c.id; saveCmd(); run(c); }
      } catch (e) {
        if (e.code === 'no_student') { ticking = false; return lost('no_student'); }
        offline = true;
      } finally {
        ticking = false;
        status();
        if (on) tickTimer = setTimeout(tick, document.hidden ? 10000 : 2000);
      }
    }
    function position() {
      let p = {};
      try { p = A.position() || {}; } catch (e) {}
      return { lesson: Number.isInteger(p.lesson) ? p.lesson : null, step: Number.isInteger(p.step) ? p.step : null, place: typeof p.place === 'string' ? p.place : 'map' };
    }

    // ---------- 명령 ----------
    function flush() { try { A.flush(); } catch (e) {} }
    function run(c) {
      const p = c.payload && typeof c.payload === 'object' ? c.payload : {};
      try {
        if (c.kind === 'gather' || c.kind === 'teleport') { if (A.placeRe.test(String(p.place || ''))) A.goPlace(String(p.place), Number(p.lesson) || 0, c.kind === 'gather'); }
        else if (c.kind === 'open_step') { const l = Number(p.lesson), s = Number(p.step); if (l >= 1 && l <= 4 && Number.isInteger(s) && s >= 0 && s <= 4) A.openStep(l, s); }
        else if (c.kind === 'view') { if (A.setView) A.setView(String(p.mode || '')); }
        else if (c.kind === 'card') showCard(String(p.kind || ''), String(p.text || ''));
        else if (c.kind === 'reload') { flush(); setTimeout(() => location.reload(), 300); }
      } catch (e) { console.warn('class command', c.kind, e && e.message); }
    }
    // 같은 곳에 모여도 겹치지 않게 학번마다 조금씩 다른 자리
    function spread() {
      let h = 0; for (const ch of String(ses && ses.no || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      return { a: (h % 360) * Math.PI / 180, r: 0.9 + (h % 7) * 0.18 };
    }
    function showCard(kind, text) {
      if (!text.trim()) return;
      let el = q('#class-card');
      if (!el) {
        el = document.createElement('section');
        el.id = 'class-card'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
        document.body.append(el);
      }
      const title = kind === 'praise' ? '선생님 한마디' : kind === 'hint' ? '선생님 힌트' : '선생님 메시지';
      el.dataset.kind = kind;
      el.innerHTML = '<h3>' + title + '</h3><p></p><button type="button" id="class-card-close">확인</button>';
      el.querySelector('p').textContent = text.slice(0, 300);
      el.hidden = false;
      el.querySelector('button').onclick = () => { el.hidden = true; };
    }

    // ---------- 수업 상태(멈춤·설명 화면·이동 잠금·타이머·공지) ----------
    function liveDialog() {
      let d = q('#class-live');
      if (!d) {
        d = document.createElement('dialog');
        d.id = 'class-live'; d.setAttribute('aria-labelledby', 'class-live-title');
        d.addEventListener('cancel', e => e.preventDefault());   // Esc 로 닫지 못함: 선생님이 닫는다
        document.body.append(d);
      }
      return d;
    }
    const liveShown = () => { const d = q('#class-live'); return !!(d && d.open); };
    function screenHTML(sc) {
      const kind = sc.kind, page = Number(sc.page) || 0;
      let head = '선생님이 띄운 화면', body = '';
      if (kind === 'learn' || kind === 'slide') {
        const r = A.screen(sc) || { head, body: '<h2 id="class-live-title">화면을 찾지 못했어요.</h2>' };
        head = r.head; body = r.body;
      } else if (kind === 'answer') {
        const label = (A.answerLabel && A.answerLabel(sc.ref)) || '';
        head = '친구의 답 · 이름은 가렸어요';
        body = (label ? '<p class="class-q">' + esc(label) + '</p>' : '') + '<h2 id="class-live-title" class="sr-only">친구의 답</h2><blockquote class="class-answer"></blockquote>';
      } else {
        head = '선생님 알림';
        body = '<h2 id="class-live-title" class="class-big"></h2>';
      }
      return '<div class="class-live-head"><span>' + esc(head) + '</span></div><div class="class-live-body">' + body + '</div>'
        + '<p class="class-live-foot">선생님이 화면을 닫으면 하던 활동으로 돌아가요.</p>';
    }
    const pauseHTML = () => '<div class="class-pause"><h2 id="class-live-title">잠깐 멈춤</h2><p>선생님을 봐 주세요.</p>' + (live.notice ? '<p class="class-pause-note"></p>' : '') + '</div>';
    function renderLive() {
      const sc = live.screen && typeof live.screen === 'object' ? live.screen : null;
      const want = sc ? 'screen' : live.paused ? 'pause' : '';
      const d = liveDialog();
      if (!want) { if (d.open) d.close(); d.dataset.key = ''; }
      else {
        const k = want + ':' + (sc ? stable(sc) : '') + ':' + (want === 'pause' ? (live.notice || '') : '');
        if (d.dataset.key !== k) {
          d.dataset.key = k; d.dataset.mode = want; d.dataset.kind = sc ? sc.kind : '';
          d.innerHTML = want === 'screen' ? screenHTML(sc) : pauseHTML();
          if (sc && sc.kind === 'answer') d.querySelector('.class-answer').textContent = sc.text || '';
          if (sc && sc.kind === 'notice') d.querySelector('.class-big').textContent = sc.text || '';
          const pn = d.querySelector('.class-pause-note'); if (pn) pn.textContent = live.notice;
        }
        const others = Array.from(document.querySelectorAll('dialog[open]')).filter(x => x !== d);
        if (!d.open) { flush(); d.showModal(); }
        else if (others.length) { d.close(); d.showModal(); }   // 뒤에 열린 창보다 위로
        if (A.stopMovement) A.stopMovement();
      }
      document.body.classList.toggle('class-move-lock', !!live.move_lock);
      let lockEl = q('#class-lock');
      if (live.move_lock && !lockEl) { lockEl = document.createElement('div'); lockEl.id = 'class-lock'; lockEl.textContent = '선생님이 이동을 잠갔어요'; document.body.append(lockEl); }
      if (lockEl) lockEl.hidden = !live.move_lock;
      if (live.move_lock && A.stopMovement) A.stopMovement();
      let nb = q('#class-notice');
      if (live.notice) {
        if (!nb) { nb = document.createElement('div'); nb.id = 'class-notice'; nb.setAttribute('role', 'status'); nb.innerHTML = '<span></span><button type="button" aria-label="공지 접기" title="접기">접기</button>'; document.body.append(nb); nb.querySelector('button').onclick = () => { nb.hidden = true; nb.dataset.closed = nb.dataset.text; }; }
        nb.dataset.text = live.notice; nb.querySelector('span').textContent = live.notice;
        nb.hidden = nb.dataset.closed === live.notice;
      } else if (nb) nb.hidden = true;
      placeBars();
      clearInterval(clockTimer);
      if (live.timer_end) clockTimer = setInterval(drawTimer, 1000);
      drawTimer();
      if (A.onLive) A.onLive(live);
    }
    function placeBars() {
      const h = A.headerEl ? A.headerEl() : q('body>header'), top = h ? Math.max(0, h.getBoundingClientRect().bottom) + 8 : 8;
      for (const id of ['#class-notice', '#class-timer']) { const el = q(id); if (el) el.style.top = (id === '#class-timer' && q('#class-notice') && !q('#class-notice').hidden ? top + 44 : top) + 'px'; }
    }
    function drawTimer() {
      let el = q('#class-timer');
      const end = live.timer_end ? Date.parse(live.timer_end) : NaN;
      const left = Math.round((end - (Date.now() + skew)) / 1000);
      if (!live.timer_end || isNaN(end) || left < -30) { if (el) el.hidden = true; clearInterval(clockTimer); return; }
      if (!el) { el = document.createElement('div'); el.id = 'class-timer'; el.setAttribute('role', 'timer'); document.body.append(el); placeBars(); }
      el.hidden = false;
      el.classList.toggle('class-timer-end', left <= 0);
      el.textContent = left <= 0 ? '시간이 다 됐어요' : '남은 시간 ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    }

    // ---------- 머리줄 버튼·입장·내 정보 ----------
    function buildButtons() {
      const tools = A.tools();
      if (!tools || q('#class-me,#class-join-open')) return;
      if (!on) {
        const b = document.createElement('button');
        b.id = 'class-join-open'; b.type = 'button'; b.title = '수업 참여 · 입장 코드로 들어가기';
        b.innerHTML = '<i data-lucide="log-in"></i><span>수업 참여</span>';
        b.onclick = () => openJoin('', '');
        tools.prepend(b);
      } else {
        const me = document.createElement('button');
        me.id = 'class-me'; me.type = 'button';
        me.innerHTML = '<i class="class-dot" aria-hidden="true"></i><span>' + esc(ses.no + ' ' + ses.name) + '</span>';
        me.onclick = () => openMe();
        const hand = document.createElement('button');
        hand.id = 'class-hand'; hand.type = 'button'; hand.setAttribute('aria-pressed', 'false');
        hand.innerHTML = '<i data-lucide="hand"></i><span>손들기</span>';
        hand.onclick = toggleHand;
        tools.prepend(hand); tools.prepend(me);
      }
      try { A.icons(); } catch (e) {}
    }
    function status() {
      if (!on) return;
      const st = locked ? ['lock', '기록 확정됨 · 더 저장되지 않아요']
        : conflict ? ['warn', '다른 기기 기록과 겹침 · 이어 갈 쪽을 골라 주세요']
        : tooBig ? ['warn', '기록이 너무 커서 서버에 못 보냄 · 이 기기에는 저장됨']
        : offline ? ['off', '연결 끊김 · 이 기기에 저장됨']
        : sync.dirty && !skipped ? ['wait', '학급 서버로 보내는 중']
        : ['ok', '학급 서버에 저장됨'];
      for (const el of A.statusEls ? A.statusEls() : [q('#save-status')]) if (el) el.textContent = st[1];
      const me = q('#class-me');
      if (me) { me.dataset.state = st[0]; me.title = (ses.title || '수업') + ' · ' + st[1]; me.setAttribute('aria-label', ses.no + ' ' + ses.name + ' · ' + st[1]); }
      const d = q('#class-me-dlg'); if (d && d.open) fillMe();
    }
    function renderHand() {
      const b = q('#class-hand'); if (!b) return;
      b.setAttribute('aria-pressed', String(!!helpAt));
      b.classList.toggle('class-hand-on', !!helpAt);
      b.querySelector('span').textContent = helpAt ? '손 내리기' : '손들기';
      b.title = helpAt ? '손 든 표시를 내립니다' : '선생님 화면에 손 든 표시를 띄웁니다';
    }
    async function toggleHand() {
      const b = q('#class-hand'); if (b) b.disabled = true;
      try {
        helpAt = await ASI.rpc('asi_help', { p_token: ses.token, p_on: !helpAt });
        helpLocalAt = Date.now();
        renderHand();
        A.toast(helpAt ? '선생님 화면에 손 든 표시가 떴어요.' : '손 든 표시를 내렸어요.');
      } catch (e) { A.toast(e.message); }
      finally { if (b) b.disabled = false; }
    }
    function dialog(id, label) {
      let d = q('#' + id);
      if (!d) { d = document.createElement('dialog'); d.id = id; d.className = 'class-dlg'; d.setAttribute('aria-label', label); document.body.append(d); }
      return d;
    }
    function openJoin(code, message) {
      const d = dialog('class-join-dlg', '수업 참여');
      let bring = false; try { bring = !on && !!A.anonHasWork(); } catch (e) {}
      d.innerHTML = '<form method="dialog" class="class-form" novalidate>'
        + '<h2>수업 참여</h2>'
        + '<p class="class-sub">선생님이 알려 준 입장 코드와 내 학번·이름을 적어 주세요. 다음에 다시 들어올 때도 같은 학번과 이름이면 이어서 할 수 있어요.</p>'
        + (message ? '<p class="class-msg"></p>' : '')
        + '<label>입장 코드<input name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" required></label>'
        + '<label>학번<input name="no" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="예: 10305" required></label>'
        + '<label>이름<input name="name" autocomplete="off" maxlength="20" required></label>'
        + (bring ? '<label class="class-check"><input type="checkbox" name="bring" checked> 이 기기에서 쓰던 기록 가져가기(서버에 내 기록이 없을 때만)</label>' : '')
        + '<p class="class-err" role="alert"></p>'
        + '<div class="class-actions"><button type="submit" class="primary" value="join">들어가기</button><button type="button" value="close" data-close>닫기</button></div>'
        + '<p class="class-fine">기록은 이 기기와 학급 서버에 함께 저장돼요. 학번과 이름은 선생님 수업 화면에만 보여요.</p>'
        + '</form>';
      const f = d.querySelector('form'), el = f.elements;
      if (message) d.querySelector('.class-msg').textContent = message;
      el.code.value = code || '';
      d.querySelector('[data-close]').onclick = () => d.close();
      f.addEventListener('submit', async e => {
        e.preventDefault();
        const err = d.querySelector('.class-err'), btn = f.querySelector('button[type=submit]');
        const c = ASI.normCode(el.code.value), no = ASI.normNo(el.no.value), name = el.name.value.trim();
        if (!c) { err.textContent = '입장 코드를 적어 주세요.'; el.code.focus(); return; }
        if (!no) { err.textContent = ASI.MSG.bad_no; el.no.focus(); return; }
        if (!name) { err.textContent = ASI.MSG.bad_name; el.name.focus(); return; }
        btn.disabled = true; err.textContent = '들어가는 중…';
        try {
          const r = await ASI.rpc('asi_join', { p_code: c, p_no: no, p_name: name });
          if (r.room.program && r.room.program !== A.id) { err.textContent = '이 입장 코드는 다른 프로그램(' + (PROGRAM_NAMES[r.room.program] || r.room.program) + ') 수업이에요.'; btn.disabled = false; return; }
          const k = keyFor(r.room.code, r.student_no);
          if (r.record && r.record.data) {
            localStorage.setItem(k, JSON.stringify(A.makeRecord(strip(r.record.data))));
            store.set(k + '_sync', { rev: r.record.rev, dirty: false });
          } else if (el.bring && el.bring.checked && bring) {
            localStorage.setItem(k, JSON.stringify(A.getRecord()));
            store.set(k + '_sync', { rev: 0, dirty: true });
          }
          store.set(k + '_cmd', r.last_command_id || 0);
          store.set(SESSION_KEY, { code: r.room.code, token: r.token, no: r.student_no, name: r.name, title: r.room.title, school: r.room.school, group: r.group_no, program: r.room.program });
          location.replace(A.homeURL());
        } catch (e2) { err.textContent = e2.message; btn.disabled = false; }
      });
      if (!d.open) d.showModal();
      (code ? el.no : el.code).focus();
    }
    function openMe(message) {
      const d = dialog('class-me-dlg', '내 수업 정보');
      d.dataset.msg = message || ''; d.dataset.html = '';
      fillMe();
      if (!d.open) d.showModal();
    }
    function fillMe() {
      const d = q('#class-me-dlg'); if (!d) return;
      const kept = store.get(key + '_conflict', null);
      const when = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
      const stateText = (q('#class-me') || {}).title ? q('#class-me').title.split(' · ').slice(1).join(' · ') : '';
      const html = '<div class="class-form">'
        + '<h2>' + esc(ses.title || '수업') + '</h2>'
        + '<p class="class-sub">' + esc([ses.school, '입장 코드 ' + ses.code].filter(Boolean).join(' · ')) + '</p>'
        + (d.dataset.msg ? '<p class="class-msg">' + esc(d.dataset.msg) + '</p>' : '')
        + '<dl class="class-info"><dt>학번·이름</dt><dd>' + esc(ses.no + ' ' + ses.name) + '</dd>'
        + (ses.group ? '<dt>모둠</dt><dd>' + esc(ses.group) + '모둠</dd>' : '')
        + '<dt>저장</dt><dd>' + esc(stateText) + (when ? ' · 마지막 ' + esc(when) : '') + '</dd></dl>'
        + (conflict ? '<div class="class-conflict"><p>다른 기기에서 ' + esc(conflict.updated_at ? new Date(conflict.updated_at).toLocaleString('ko-KR') : '') + '에 저장한 기록이 서버에 있어요. 어느 쪽으로 이어 갈까요?</p>'
          + '<div class="class-actions"><button type="button" data-act="server">서버 기록 열기</button><button type="button" data-act="mine">이 기기 기록으로 저장</button></div>'
          + '<p class="class-fine">어느 쪽을 골라도 다른 쪽 기록은 이 기기에 따로 보관돼요.</p></div>' : '')
        + (kept ? '<p><button type="button" data-act="download">보관한 기록 내려받기</button></p>' : '')
        + '<div class="class-actions"><button type="button" data-act="close" class="primary">닫기</button><button type="button" data-act="leave">수업에서 나가기</button></div>'
        + '</div>';
      if (d.dataset.html === html) return;
      d.dataset.html = html; d.innerHTML = html;
      d.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
        const act = b.dataset.act;
        if (act === 'close') { d.dataset.msg = ''; d.close(); }
        else if (act === 'server' || act === 'mine') { b.disabled = true; try { await resolve(act); } catch (e) { A.toast(e.message); b.disabled = false; } }
        else if (act === 'download') {
          const blob = new Blob([JSON.stringify(store.get(key + '_conflict', null), null, 2)], { type: 'application/json' });
          const u = URL.createObjectURL(blob), a = document.createElement('a');
          a.href = u; a.download = A.id + '-보관기록-' + ses.no + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
        } else if (act === 'leave') leave();
      });
    }
    async function leave() {
      if (sync.dirty && !locked && !conflict) { try { await send(true); } catch (e) {} }
      if (sync.dirty && !confirm('아직 서버로 보내지 못한 기록이 있어요. 이 기기에 남겨 두고 나갈까요? 다음에 이 기기로 다시 들어오면 그때 보내요.')) return;
      if (!sync.dirty) { store.del(key); store.del(key + '_sync'); }
      store.del(SESSION_KEY);
      on = false; clearTimeout(tickTimer); clearTimeout(sendTimer);
      location.replace(A.homeURL());
    }
    // 선생님이 명단에서 지웠거나 열쇠가 바뀌었을 때
    function lost(code) {
      const s = ses;
      on = false; clearTimeout(tickTimer); clearTimeout(sendTimer);
      store.del(SESSION_KEY);
      if (A.onLost) A.onLost();
      try { sessionStorage.setItem(NOTE_KEY, ASI.MSG[code] || ASI.MSG.no_student); } catch (e) {}
      location.replace(A.homeURL() + (s ? (A.homeURL().includes('?') ? '&' : '?') + 'room=' + encodeURIComponent(s.code) : ''));
    }
    function note(m) { try { sessionStorage.setItem(NOTE_KEY, m); } catch (e) {} }

    // 시험용으로 안을 들여다보는 창(값은 복사본)
    const peek = () => ({ on, ready, code: ses && ses.code, no: ses && ses.no, sync: Object.assign({}, sync), live: JSON.parse(JSON.stringify(live)), liveRev, lastCmd, locked, offline, conflict, helpAt, place: on ? position().place : null, saveKey: on ? key : null });

    // 연결부가 쓰는 창구
    const api = {
      boot, init, schedule, peek, tick, send, keyAtParse, flush, spread, liveShown, status,
      place: () => position().place,
      get active() { return on; },
      get live() { return live; },
      get bypass() { return bypass; },
      withBypass(fn) { bypass = true; try { return fn(); } finally { bypass = false; } },
      get session() { return ses ? Object.assign({}, ses) : null; },
      blocked: () => on && !bypass && (!!live.move_lock || liveShown())
    };
    return api;
  }

  return { create };
})();
