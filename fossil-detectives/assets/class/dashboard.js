/* 선생님 수업 화면 (NET ZERO ECO-CITY)
   실시간 화면(3초마다 asi_teacher_overview) → 답 모아보기 → 루브릭 채점표 → 방 설정
   ?demo=1 이면 가짜 서버(mock-server.js)와 가짜 학생 28명으로 움직인다. 실제 서버에 아무것도 보내지 않음. */
(() => {
  'use strict';
  // 프로그램 설정: <html data-program="fossil"> 이면 화석 수사대, 없으면 NET ZERO
  const P = window.ASI_PROGRAMS[document.documentElement.dataset.program || 'netzero'];
  const { rpc, esc } = window.ASI;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const params = new URLSearchParams(location.search);
  const DEMO = params.get('demo') === '1';
  const AUTH_KEY = 'asi_teacher_' + P.id, RECENT_KEY = 'asi_teacher_recent_' + P.id;
  const LEVELS = ['A', 'B', 'C', 'D', 'E'];
  const ONLINE_MS = 25000, STUCK_MS = 10 * 60000;
  const STEPS = P.stepCount || 5, TOTAL = STEPS * 4, RANGE = [...Array(STEPS).keys()];

  let auth = null, ov = null, tab = 'live', pollTimer = 0, polling = false, serverSkew = 0;
  const selected = new Set(), seen = {}, tiles = new Map();
  let scores = null, curQ = null, answersCache = null, hideNames = false, drawerAt = null;
  const studentCache = new Map();

  const store = {
    get(k, d, s) { try { const v = (s || localStorage).getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v, s) { try { (s || localStorage).setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k, s) { try { (s || localStorage).removeItem(k); } catch (e) {} }
  };
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600);
  }
  const nowMs = () => Date.now() + serverSkew;
  // 받침을 보고 「으로/로」: 받침 없음·ㄹ 받침 → 로
  const ro = w => { const c = String(w).trim().slice(-1).charCodeAt(0) - 0xAC00; const j = c >= 0 && c <= 11171 ? c % 28 : 0; return String(w).trim() + (j === 0 || j === 8 ? '로' : '으로'); };
  const fmtTime = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }); };
  const nameOf = s => hideNames ? '학생 ' + (ov ? ov.students.findIndex(x => x.id === s.id) + 1 : '') : s.name;
  const label = s => hideNames ? nameOf(s) : s.student_no + ' ' + s.name;   // 이름 가리기면 학번도 숨김
  async function call(fn, args) {
    try { return await rpc(fn, Object.assign({ p_tok: auth.token }, args || {})); }
    catch (e) {
      if (e.code === 'no_session' || e.code === 'expired') { logout(e.message); }
      throw e;
    }
  }

  // ---------- 처음 화면: 방 열기·새 방 만들기 ----------
  function renderLogin(message) {
    stopPoll();
    const recent = store.get(RECENT_KEY, []).filter(r => r && r.code).slice(0, 6);
    $('#app').innerHTML = '<main class="login">'
      + '<h1>' + esc(P.name) + ' 선생님 수업 화면</h1>'
      + '<p>학생들이 입장 코드로 들어오면 여기에서 진행 상황을 보고, 학생 화면을 멈추거나 설명 화면을 띄우고, 답을 모아 채점합니다.</p>'
      + (message ? '<p class="err">' + esc(message) + '</p>' : '')
      + '<div class="login-grid">'
      + '<form id="f-login" novalidate><h2>만들어 둔 방 열기</h2>'
      + (recent.length ? '<div class="recent">' + recent.map(r => '<button type="button" data-code="' + esc(r.code) + '">' + esc(r.title) + ' · ' + esc(r.code) + '</button>').join('') + '</div>' : '')
      + '<label>입장 코드<input name="code" class="code-input" autocomplete="off" maxlength="12" required></label>'
      + '<label>방 비밀번호<input name="pass" type="password" autocomplete="current-password" required></label>'
      + '<p class="err" data-err></p><button class="primary" type="submit">열기</button></form>'
      + '<form id="f-create" novalidate><h2>새 방 만들기</h2>'
      + '<label>수업 이름<input name="title" maxlength="60" placeholder="예: 1학년 3반" required></label>'
      + '<label>학교(선택)<input name="school" maxlength="40"></label>'
      + '<label>방 비밀번호(6자 이상)<input name="pass" type="password" autocomplete="new-password" minlength="6" required></label>'
      + '<label>비밀번호 한 번 더<input name="pass2" type="password" autocomplete="new-password" required></label>'
      + '<p class="err" data-err></p><button class="primary" type="submit">만들기</button>'
      + '<p class="muted" style="margin:0;font-size:12.5px">학급 하나에 방 하나를 만듭니다. 비밀번호는 다시 볼 수 없으니 따로 적어 두세요.</p></form>'
      + '</div>'
      + '<p class="demo">수업 전에 미리 눌러 보려면 <a href="?demo=1">체험 화면</a>을 여세요. 가짜 학생 28명이 움직이고, 실제 서버에는 아무것도 저장하지 않습니다.</p>'
      + '</main>';
    const fl = $('#f-login'), fc = $('#f-create');
    $$('.recent button', fl).forEach(b => b.onclick = () => { fl.elements.code.value = b.dataset.code; fl.elements.pass.focus(); });
    fl.onsubmit = async e => {
      e.preventDefault();
      const err = $('[data-err]', fl), code = ASI.normCode(fl.elements.code.value);
      if (!code) { err.textContent = '입장 코드를 적어 주세요.'; return; }
      err.textContent = '여는 중…';
      try {
        const r = await rpc('asi_teacher_login', { p_code: code, p_pass: fl.elements.pass.value });
        if (r.room.program !== P.id) { err.textContent = '이 방은 다른 프로그램(' + (r.room.program === 'fossil' ? '화석 수사대' : r.room.program) + ') 방이에요.'; return; }
        start({ token: r.token, code: r.room.code, title: r.room.title, school: r.room.school });
      } catch (x) { err.textContent = x.message; }
    };
    fc.onsubmit = async e => {
      e.preventDefault();
      const err = $('[data-err]', fc), f = fc.elements;
      if (!f.title.value.trim()) { err.textContent = ASI.MSG.bad_title; return; }
      if (f.pass.value.length < 6) { err.textContent = ASI.MSG.short_pass; return; }
      if (f.pass.value !== f.pass2.value) { err.textContent = '두 비밀번호가 달라요.'; return; }
      err.textContent = '만드는 중…';
      try {
        const r = await rpc('asi_create_room', { p_program: P.id, p_title: f.title.value.trim(), p_school: f.school.value.trim(), p_pass: f.pass.value });
        start({ token: r.token, code: r.code, title: f.title.value.trim(), school: f.school.value.trim() }, true);
      } catch (x) { err.textContent = x.message; }
    };
  }

  function start(a, fresh) {
    auth = a;
    if (!DEMO) {
      store.set(AUTH_KEY, auth, sessionStorage);
      const recent = store.get(RECENT_KEY, []).filter(r => r.code !== a.code);
      recent.unshift({ code: a.code, title: a.title });
      store.set(RECENT_KEY, recent.slice(0, 8));
    }
    renderShell();
    if (fresh) toast('방을 만들었어요. 학생들에게 입장 코드 ' + a.code + ' 를 알려 주세요.');
    poll();
  }
  async function logout(message) {
    stopPoll();
    if (auth && !message && !DEMO) { try { await rpc('asi_teacher_logout', { p_tok: auth.token }); } catch (e) {} }
    store.del(AUTH_KEY, sessionStorage);
    auth = null; ov = null; tiles.clear(); selected.clear(); scores = null; studentCache.clear();
    if (DEMO) { location.href = location.pathname; return; }
    renderLogin(message || '');
  }

  // ---------- 틀 ----------
  function studentLink() {
    const u = new URL(P.studentPath, location.href);
    u.search = '?room=' + auth.code;
    return u.href;
  }
  function renderShell() {
    $('#app').innerHTML = (DEMO ? '<div class="demo-bar">체험 화면입니다. 가짜 학생 28명이 움직이고, 버튼을 눌러도 실제 서버에는 아무것도 저장하지 않아요. <a href="' + location.pathname + '">진짜 방 열기</a></div>' : '')
      + '<header class="top"><span class="app-name">' + esc(P.name) + ' 수업 화면</span>'
      + '<span class="room" id="room-title"></span>'
      + '<span class="count" id="count"></span>'
      + '<label class="switch" title="이 화면을 학생들 앞에 비출 때 켭니다. 학번과 이름 대신 「학생 1」처럼 보여요."><input type="checkbox" id="hide-names"> 이름 가리기</label>'
      + '<span class="code"><span>입장 코드</span><b id="room-code">' + esc(auth.code) + '</b><button type="button" id="copy-link">학생 링크 복사</button></span>'
      + '<button type="button" id="btn-logout">나가기</button></header>'
      + '<div class="controls" id="controls">'
      + '<button type="button" class="big" id="btn-pause" aria-pressed="false">모두 멈춤</button>'
      + '<button type="button" class="big" id="btn-screen">설명 화면 띄우기</button>'
      + '<button type="button" class="big" id="btn-gather">모두 모으기</button>'
      + '<span class="sep"></span>'
      + '<label class="switch"><input type="checkbox" id="sw-lock"> 이동 잠금</label>'
      + '<span class="group lesson-toggle"><span class="lbl">열린 차시</span>' + [1, 2, 3, 4].map(n => '<button type="button" data-open="' + n + '" aria-pressed="false" title="' + n + '차시 ' + esc(P.lessons[n - 1]) + '">' + n + '</button>').join('') + '</span>'
      + '<span class="group"><span class="lbl">타이머</span><span class="timer-left" id="timer-left"></span>' + [5, 10, 15].map(m => '<button type="button" data-timer="' + m + '">' + m + '분</button>').join('') + '<button type="button" data-timer="0" id="timer-off">끄기</button></span>'
      + '<span class="group"><span class="lbl">공지</span><input type="text" id="notice-in" maxlength="200" placeholder="학생 화면 위쪽에 한 줄"><button type="button" id="notice-send">올리기</button><button type="button" id="notice-clear">내리기</button></span>'
      + '</div>'
      + '<div class="screen-strip" id="screen-strip" hidden></div>'
      + '<nav class="tabs" role="tablist">'
      + [['live', '수업 화면'], ['answers', '답 모아보기'], ['scores', '채점표'], ['settings', '방 설정']].map(([k, t]) => '<button type="button" role="tab" data-tab="' + k + '" aria-selected="' + (k === tab) + '">' + t + '</button>').join('')
      + '</nav>'
      + '<section class="panel" id="p-live"><div class="live"><div><div class="tiles" id="tiles"></div></div><aside class="side" id="side"></aside></div></section>'
      + '<section class="panel" id="p-answers" hidden></section>'
      + '<section class="panel" id="p-scores" hidden></section>'
      + '<section class="panel" id="p-settings" hidden></section>'
      + '<aside class="drawer" id="drawer" hidden></aside>'
      + '<dialog id="dlg"></dialog>';
    $('#btn-logout').onclick = () => { if (DEMO || confirm('이 기기에서 선생님 화면을 닫을까요? 학생들은 계속 저장돼요.')) logout(); };
    $('#copy-link').onclick = async () => {
      const link = studentLink();
      try { await navigator.clipboard.writeText(link); toast('학생 링크를 복사했어요: ' + link); }
      catch (e) { prompt('학생 링크', link); }
    };
    $('#hide-names').onchange = e => {
      hideNames = e.target.checked;
      if (tab === 'live' && ov) renderLive(); else if (tab === 'answers' && answersCache) drawAnswers(); else if (tab === 'scores' && scores) drawScores(); else if (tab === 'settings') renderSettings();
    };
    $('#btn-pause').onclick = () => setLive({ paused: !(ov && ov.live.paused) });
    $('#btn-screen').onclick = openScreenPicker;
    $('#btn-gather').onclick = openGather;
    $('#sw-lock').onchange = e => setLive({ move_lock: e.target.checked });
    $$('[data-open]').forEach(b => b.onclick = () => {
      const n = +b.dataset.open, cur = (ov && Array.isArray(ov.live.open_lessons)) ? ov.live.open_lessons.slice() : [1];
      const next = cur.includes(n) ? cur.filter(x => x !== n) : cur.concat(n).sort();
      setLive({ open_lessons: next });
    });
    $$('[data-timer]').forEach(b => b.onclick = () => {
      const m = +b.dataset.timer;
      setLive({ timer_end: m ? new Date(nowMs() + m * 60000).toISOString() : null });
    });
    $('#notice-send').onclick = () => { const v = $('#notice-in').value.trim(); if (v) setLive({ notice: v }); };
    $('#notice-in').onkeydown = e => { if (e.key === 'Enter') $('#notice-send').click(); };
    $('#notice-clear').onclick = () => { $('#notice-in').value = ''; setLive({ notice: null }); };
    $$('.tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
    showTab(tab);
    if (!window.__asiTimer) window.__asiTimer = setInterval(drawTimer, 1000);
  }

  function showTab(k) {
    tab = k;
    $$('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === k)));
    ['live', 'answers', 'scores', 'settings'].forEach(x => { $('#p-' + x).hidden = x !== k; });
    if (k === 'answers') renderAnswers();
    if (k === 'scores') loadScores();
    if (k === 'settings') renderSettings();
    if (k !== 'scores') closeDrawer();
  }

  // ---------- 3초마다 ----------
  function stopPoll() { clearTimeout(pollTimer); pollTimer = 0; }
  async function poll() {
    clearTimeout(pollTimer);
    if (!auth) return;
    if (!polling) {
      polling = true;
      try {
        ov = await call('asi_teacher_overview');
        if (ov.now) serverSkew = Date.parse(ov.now) - Date.now();
        update();
      } catch (e) { if (auth) toast(e.message); }
      finally { polling = false; }
    }
    if (auth) pollTimer = setTimeout(poll, document.hidden ? 10000 : 3000);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && auth) poll(); });

  const online = s => s.last_seen && nowMs() - Date.parse(s.last_seen) < ONLINE_MS;
  function stuckMin(s) {
    const key = s.lesson + '-' + s.step;
    const h = seen[s.id];
    if (!h || h.key !== key) { seen[s.id] = { key, since: Date.now() }; return 0; }
    return online(s) && s.lesson ? Math.floor((Date.now() - h.since) / 60000) : 0;
  }

  function update() {
    if (!ov) return;
    const r = ov.room, live = ov.live || {};
    $('#room-title').innerHTML = esc(r.title) + (r.school ? '<small>' + esc(r.school) + '</small>' : '') + (r.closed ? '<small>새 입장 막음</small>' : '') + (r.records_locked ? '<small>기록 확정됨</small>' : '');
    const n = ov.students.length, on = ov.students.filter(online).length;
    $('#count').textContent = '학생 ' + n + '명 · 접속 ' + on + '명';
    // 조작 줄
    const pause = $('#btn-pause');
    pause.setAttribute('aria-pressed', String(!!live.paused));
    pause.textContent = live.paused ? '멈춤 풀기' : '모두 멈춤';
    $('#sw-lock').checked = !!live.move_lock;
    const open = Array.isArray(live.open_lessons) ? live.open_lessons : [];
    $$('[data-open]').forEach(b => b.setAttribute('aria-pressed', String(open.includes(+b.dataset.open))));
    const ni = $('#notice-in'); if (document.activeElement !== ni && live.notice && !ni.value) ni.value = live.notice;
    $('#notice-clear').disabled = !live.notice;
    drawTimer();
    drawStrip();
    if (tab === 'live') renderLive();
  }

  function drawTimer() {
    const el = $('#timer-left'); if (!el || !ov) return;
    const end = ov.live && ov.live.timer_end ? Date.parse(ov.live.timer_end) : NaN;
    const left = Math.round((end - nowMs()) / 1000);
    el.textContent = isNaN(end) ? '' : left > 0 ? Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') : '끝';
    $('#timer-off').disabled = isNaN(end);
  }

  async function setLive(patch) {
    try {
      const r = await call('asi_teacher_live', { p_patch: patch });
      if (ov) { ov.live = r.live; ov.live_rev = r.live_rev; update(); }
    } catch (e) { toast(e.message); }
  }
  async function command(targets, kind, payload, done) {
    try {
      await Promise.all(targets.map(t => call('asi_teacher_command', { p_target: t, p_kind: kind, p_payload: payload || {} })));
      if (done) toast(done);
    } catch (e) { toast(e.message); }
  }
  // 고른 학생이 모두이면 한 번에, 아니면 한 명씩
  function targetsOf(ids) {
    if (!ov) return [];
    const all = ov.students.map(s => s.id);
    if (!ids || ids.length === 0 || ids.length === all.length) return ['all'];
    return ids.map(id => 'student:' + id);
  }

  // ---------- 실시간 화면 ----------
  function tileHTML(s) {
    const pr = s.progress || {}, total = pr.total || TOTAL, done = pr.done || 0;
    const off = !online(s), stuck = stuckMin(s);
    const where = !s.last_seen || !s.lesson ? '아직 신호 없음' : s.lesson + '차시 ' + (P.steps[s.lesson - 1][s.step] || '') + ' · ' + P.place(s.place, s.lesson);
    const flags = [];
    if (s.help_at) flags.push('<span class="flag-help">손 듦 ' + esc(fmtTime(s.help_at)) + '</span>');
    if (off) flags.push('<span class="flag-off">' + (s.last_seen ? '연결 끊김 ' + esc(fmtTime(s.last_seen)) : '들어오기 전') + '</span>');
    else if (stuck >= STUCK_MS / 60000) flags.push('<span class="flag-stuck">같은 단계 ' + stuck + '분</span>');
    return '<span class="who"><span>' + esc(label(s)) + '</span><small>' + (s.group_no ? s.group_no + '모둠' : '') + '</small></span>'
      + '<span class="where" title="' + esc(where) + '">' + esc(where) + '</span>'
      + '<span class="bar" title="기록이 채워진 단계 ' + done + '/' + total + '"><i style="width:' + Math.round(done / total * 100) + '%"></i></span>'
      + '<span class="flags">' + flags.join('') + '<span class="muted" style="margin-left:auto">' + done + '/' + total + '</span></span>';
  }
  function renderLive() {
    const box = $('#tiles');
    if (!ov.students.length) {
      tiles.clear();
      box.innerHTML = '<div class="empty" style="grid-column:1/-1">아직 들어온 학생이 없어요. 학생들에게 입장 코드 <b>' + esc(auth.code) + '</b> 또는 학생 링크를 알려 주세요.<br><span class="muted">' + esc(studentLink()) + '</span></div>';
    } else {
      if (box.querySelector('.empty')) box.innerHTML = '';
      const ids = new Set(ov.students.map(s => s.id));
      for (const [id, el] of tiles) if (!ids.has(id)) { el.remove(); tiles.delete(id); selected.delete(id); }
      ov.students.forEach((s, i) => {
        let el = tiles.get(s.id);
        if (!el) {
          el = document.createElement('button');
          el.type = 'button'; el.className = 'tile'; el.dataset.id = s.id;
          el.onclick = () => { selected.has(s.id) ? selected.delete(s.id) : selected.add(s.id); renderLive(); };
          tiles.set(s.id, el);
        }
        if (box.children[i] !== el) box.insertBefore(el, box.children[i] || null);
        const html = tileHTML(s);
        if (el._html !== html) { el.innerHTML = html; el._html = html; }
        el.classList.toggle('off', !online(s));
        el.classList.toggle('help', !!s.help_at);
        el.classList.toggle('sel', selected.has(s.id));
        el.setAttribute('aria-pressed', String(selected.has(s.id)));
        el.setAttribute('aria-label', label(s) + (selected.has(s.id) ? ' 고름' : ''));
      });
    }
    renderSide();
  }

  function renderSide() {
    const side = $('#side'), list = ov.students;
    const hands = list.filter(s => s.help_at).sort((a, b) => a.help_at < b.help_at ? -1 : 1);
    const counts = [0, 1, 2, 3].map(l => RANGE.map(st => list.filter(s => online(s) && s.lesson === l + 1 && s.step === st)));
    const sel = list.filter(s => selected.has(s.id));
    const sameLesson = sel.length && sel.every(s => s.lesson === sel[0].lesson) ? sel[0].lesson : 0;
    const placeBtn = p => {
      if (p.lessons && sameLesson && !p.lessons.includes(sameLesson)) return '';
      const label = p.step != null ? (sameLesson ? P.steps[sameLesson - 1][p.step] : (p.step + 1) + '단계') : p.label;
      return '<button type="button" data-move="' + p.id + '" title="' + esc(p.step != null ? (p.step + 1) + '단계 시설' : p.label) + '">' + esc(label) + '</button>';
    };
    const html = '<section><h3>손 든 학생 ' + hands.length + '명</h3><div class="hands">'
      + (hands.length ? hands.map(s => '<button type="button" data-hand="' + s.id + '" title="눌러서 손 내리기"><span>' + esc(label(s)) + '</span><span class="muted">' + esc(fmtTime(s.help_at)) + ' · 내리기</span></button>').join('') : '<span class="muted">없음</span>')
      + '</div></section>'
      + '<section><h3>단계별 인원 <span class="muted" style="font-weight:400">(접속한 학생, 숫자를 누르면 고름)</span></h3><table class="steps"><thead><tr><th></th>' + RANGE.map(i => i + 1).map(n => '<th>' + n + '단계</th>').join('') + '</tr></thead><tbody>'
      + counts.map((row, l) => '<tr><th title="' + esc(P.lessons[l]) + '">' + (l + 1) + '차시</th>' + row.map((who, st) => who.length
        ? '<td><button type="button" data-cell="' + l + '-' + st + '" title="' + esc(P.steps[l][st] + ' · ' + who.map(s => nameOf(s)).join(', ')) + '">' + who.length + '</button></td>'
        : '<td class="zero" title="' + esc(P.steps[l][st]) + '">0</td>').join('') + '</tr>').join('')
      + '</tbody></table></section>'
      + '<section><h3>고른 학생 ' + sel.length + '명</h3>'
      + '<div class="row"><button type="button" data-pick="all">모두 고르기</button><button type="button" data-pick="help">손 든 학생</button><button type="button" data-pick="none"' + (sel.length ? '' : ' disabled') + '>고르기 풀기</button></div>'
      + '<p class="sub">옮기기' + (sameLesson ? ' (' + sameLesson + '차시)' : sel.length ? ' (각자 지금 차시)' : '') + '</p>'
      + '<div class="row">' + P.places.filter(p => p.step == null).map(placeBtn).join('') + '</div>'
      + '<div class="row">' + P.places.filter(p => p.step != null).map(placeBtn).join('') + '</div>'
      + '<p class="sub">탐구 단계 열기</p><div class="row"><select id="open-step" aria-label="열 단계">' + P.steps.map((st, l) => '<optgroup label="' + (l + 1) + '차시">' + st.map((n, i) => '<option value="' + (l + 1) + '-' + i + '">' + (l + 1) + '-' + (i + 1) + ' ' + esc(n) + '</option>').join('') + '</optgroup>').join('') + '</select><button type="button" id="open-step-go">열기</button></div>'
      + '<p class="sub">카드 보내기</p><textarea id="card-text" rows="2" maxlength="300" placeholder="예: 두 연도의 단위가 같은지 먼저 확인해 보세요."></textarea>'
      + '<div class="row" style="margin-top:4px"><button type="button" data-card="hint">힌트로 보내기</button><button type="button" data-card="praise">칭찬으로 보내기</button></div>'
      + '<p class="sub">시점·새로 고침</p><div class="row"><button type="button" data-view="overview">전체 보기</button><button type="button" data-view="follow">따라가기</button><button type="button" data-view="first">1인칭</button><button type="button" id="reload-go" title="새 판을 배포한 뒤 학생 화면을 새로 고칩니다">새로 고침</button></div>'
      + '<p class="muted" style="font-size:12px;margin:4px 0 0">아무도 고르지 않으면 모두에게 보냅니다.</p>'
      + '</section>';
    // 입력 중인 칸은 지우지 않는다
    const keep = { card: ($('#card-text') || {}).value || '', step: ($('#open-step') || {}).value || '', focus: document.activeElement && document.activeElement.id };
    if (side._html === html) return;
    side._html = html; side.innerHTML = html;
    if (keep.card) $('#card-text').value = keep.card;
    if (keep.step) $('#open-step').value = keep.step;
    if (keep.focus && $('#' + keep.focus)) $('#' + keep.focus).focus();
    $$('[data-hand]', side).forEach(b => b.onclick = async () => { try { await call('asi_teacher_clear_help', { p_student_id: +b.dataset.hand }); poll(); } catch (e) { toast(e.message); } });
    $$('[data-cell]', side).forEach(b => b.onclick = () => { const [l, st] = b.dataset.cell.split('-').map(Number); selected.clear(); list.filter(s => online(s) && s.lesson === l + 1 && s.step === st).forEach(s => selected.add(s.id)); renderLive(); });
    $$('[data-pick]', side).forEach(b => b.onclick = () => {
      const k = b.dataset.pick; selected.clear();
      if (k === 'all') list.forEach(s => selected.add(s.id));
      if (k === 'help') list.filter(s => s.help_at).forEach(s => selected.add(s.id));
      renderLive();
    });
    const who = () => { const ids = list.filter(s => selected.has(s.id)).map(s => s.id); return { t: targetsOf(ids), n: ids.length || list.length, all: !ids.length || ids.length === list.length }; };
    $$('[data-move]', side).forEach(b => b.onclick = () => {
      const w = who(), p = { place: b.dataset.move };
      if (sameLesson) p.lesson = sameLesson;
      command(w.t, w.all ? 'gather' : 'teleport', p, (w.all ? '모두를 ' : w.n + '명을 ') + ro(b.textContent) + ' 옮겼어요.');
    });
    $('#open-step-go', side).onclick = () => { const [l, s] = $('#open-step').value.split('-').map(Number), w = who(); command(w.t, 'open_step', { lesson: l, step: s }, (w.all ? '모두' : w.n + '명') + '에게 ' + l + '-' + (s + 1) + ' 단계를 열었어요.'); };
    $$('[data-card]', side).forEach(b => b.onclick = () => {
      const text = $('#card-text').value.trim(); if (!text) { $('#card-text').focus(); return; }
      const w = who(); command(w.t, 'card', { kind: b.dataset.card, text }, (w.all ? '모두' : w.n + '명') + '에게 카드를 보냈어요.').then(() => { $('#card-text').value = ''; });
    });
    $$('[data-view]', side).forEach(b => b.onclick = () => { const w = who(); command(w.t, 'view', { mode: b.dataset.view }, '시점을 맞췄어요.'); });
    $('#reload-go', side).onclick = () => { const w = who(); if (confirm((w.all ? '모든 학생' : w.n + '명') + '의 화면을 새로 고칠까요? 쓰던 글은 저장된 뒤 다시 열려요.')) command(w.t, 'reload', {}, '새로 고침을 보냈어요.'); };
  }

  // ---------- 모두 모으기 ----------
  function openGather() {
    const d = $('#dlg');
    d.innerHTML = '<div class="dlg-head"><h2>모두 모으기</h2><button type="button" data-close>닫기</button></div><div class="dlg-body">'
      + '<label class="switch" style="font-weight:600">차시 <select id="g-lesson"><option value="0">각자 지금 차시</option>' + [1, 2, 3, 4].map(n => '<option value="' + n + '">' + n + '차시 ' + esc(P.lessons[n - 1]) + '</option>').join('') + '</select></label>'
      + '<div class="menu-list" id="g-places"></div>'
      + '<p class="muted" style="margin:0;font-size:12.5px">탐구 화면을 보던 학생은 쓰던 글을 저장한 뒤 지도로 돌아와 그 자리에 섭니다. 열리지 않은 차시로는 옮기지 않아요.</p></div>';
    const draw = () => {
      const l = +$('#g-lesson').value;
      $('#g-places').innerHTML = P.places.filter(p => !p.lessons || !l || p.lessons.includes(l)).map(p => '<button type="button" data-g="' + p.id + '">' + esc(p.step != null ? (l ? P.steps[l - 1][p.step] : (p.step + 1) + '단계') + (P.stepSuffix || '') : p.label) + '</button>').join('');
      $$('[data-g]', d).forEach(b => b.onclick = () => {
        const p = { place: b.dataset.g }; if (l) p.lesson = l;
        command(['all'], 'gather', p, '모두를 ' + ro(b.textContent) + ' 모았어요.'); d.close();
      });
    };
    $('#g-lesson').onchange = draw; draw();
    $('[data-close]', d).onclick = () => d.close();
    d.showModal();
  }

  // ---------- 설명 화면 띄우기 ----------
  let pick = { kind: P.textbook ? 'learn' : 'slide', lesson: 1, page: 0 };
  function openScreenPicker() {
    const d = $('#dlg');
    const cur = ov && ov.live.screen;
    const studentLesson = () => { const ls = (ov ? ov.students : []).map(s => s.lesson).filter(Boolean); if (!ls.length) return 1; const c = {}; ls.forEach(x => c[x] = (c[x] || 0) + 1); return +Object.keys(c).sort((a, b) => c[b] - c[a])[0]; };
    if (!cur) pick.lesson = studentLesson();
    d.innerHTML = '<div class="dlg-head"><h2>학생 화면에 띄우기</h2><button type="button" data-close>닫기</button></div><div class="dlg-body">'
      + '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="seg" role="tablist">' + [['learn', '학습하기 쪽'], ['slide', '선생님 슬라이드'], ['notice', '알림 글']].filter(x => x[0] !== 'learn' || P.textbook).map(([k, t]) => '<button type="button" data-kind="' + k + '" aria-pressed="' + (pick.kind === k) + '">' + t + '</button>').join('') + '</span>'
      + '<label class="switch" id="pk-lesson-wrap">차시 <select id="pk-lesson">' + [1, 2, 3, 4].map(n => '<option value="' + n + '"' + (n === pick.lesson ? ' selected' : '') + '>' + n + '차시 ' + esc(P.lessons[n - 1]) + '</option>').join('') + '</select></label></div>'
      + '<div id="pk-body"></div>'
      + '<p class="muted" style="margin:0;font-size:12.5px">띄운 화면은 학생이 닫을 수 없고, 위쪽 초록 줄에서 쪽을 넘기거나 닫습니다. 학생 답은 「답 모아보기」에서 띄웁니다.</p></div>';
    const body = () => {
      $('#pk-lesson-wrap').hidden = pick.kind === 'notice';
      const l = pick.lesson;
      if (pick.kind === 'learn') {
        $('#pk-body').innerHTML = '<div class="pages">' + P.textbook[l - 1].map((t, i) => '<button type="button" data-page="' + i + '"><small>' + (i + 1) + '쪽 · ' + esc(P.steps[l - 1][i] || '') + '</small>' + esc(t) + '</button>').join('') + '</div>';
        $$('[data-page]', d).forEach(b => b.onclick = () => { showScreen({ kind: 'learn', ref: String(l), page: +b.dataset.page }); d.close(); });
      } else if (pick.kind === 'slide') {
        $('#pk-body').innerHTML = '<div class="slide-preview"><iframe id="pk-frame" title="슬라이드 미리보기" tabindex="-1"></iframe></div>'
          + '<div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button type="button" id="pk-prev">이전 쪽</button><span id="pk-no" style="min-width:70px;text-align:center"></span><button type="button" id="pk-next">다음 쪽</button><span style="flex:1"></span><button type="button" class="primary" id="pk-show">이 쪽 띄우기</button></div>';
        let max = 40;
        const frame = $('#pk-frame');
        const go = () => { $('#pk-no').textContent = (pick.page + 1) + (max < 40 ? ' / ' + max : '') + '쪽'; frame.src = P.slideURL(l, pick.page); };
        frame.onload = () => { try { const n = frame.contentWindow.Deck && frame.contentWindow.Deck.list && frame.contentWindow.Deck.list.length; if (n) { max = n; if (pick.page >= max) { pick.page = max - 1; go(); } else $('#pk-no').textContent = (pick.page + 1) + ' / ' + max + '쪽'; } } catch (e) {} };
        $('#pk-prev').onclick = () => { if (pick.page > 0) { pick.page--; go(); } };
        $('#pk-next').onclick = () => { if (pick.page < max - 1) { pick.page++; go(); } };
        $('#pk-show').onclick = () => { showScreen({ kind: 'slide', ref: String(l), page: pick.page, max }); d.close(); };
        go();
      } else {
        $('#pk-body').innerHTML = '<textarea id="pk-text" rows="4" maxlength="300" style="width:100%;font-size:16px" placeholder="학생 화면 가운데에 크게 보일 글"></textarea><div style="margin-top:8px"><button type="button" class="primary" id="pk-show">띄우기</button></div>';
        $('#pk-show').onclick = () => { const t = $('#pk-text').value.trim(); if (!t) return; showScreen({ kind: 'notice', ref: '', page: 0, text: t }); d.close(); };
      }
    };
    $$('[data-kind]', d).forEach(b => b.onclick = () => { pick.kind = b.dataset.kind; pick.page = 0; $$('[data-kind]', d).forEach(x => x.setAttribute('aria-pressed', String(x === b))); body(); });
    $('#pk-lesson').onchange = e => { pick.lesson = +e.target.value; pick.page = 0; body(); };
    $('[data-close]', d).onclick = () => d.close();
    body();
    d.showModal();
  }
  let slideMax = {};
  function showScreen(sc) {
    if (sc.kind === 'slide' && sc.max) slideMax[sc.ref] = sc.max;
    const v = { kind: sc.kind, ref: sc.ref || '', page: sc.page || 0, text: sc.text || '' };
    setLive({ screen: v });
  }
  function drawStrip() {
    const el = $('#screen-strip'), sc = ov && ov.live.screen;
    if (!sc) { el.hidden = true; el.innerHTML = ''; el._key = ''; return; }
    const key = JSON.stringify(sc); if (el._key === key && !el.hidden) return; el._key = key;
    let what = '', pages = 0;
    if (sc.kind === 'learn' && P.textbook) { const l = +sc.ref || 1; pages = P.textbook[l - 1].length; what = l + '차시 학습하기 · ' + (sc.page + 1) + '/' + pages + '쪽 「' + P.textbook[l - 1][sc.page] + '」'; }
    else if (sc.kind === 'slide') { pages = slideMax[sc.ref] || 40; what = sc.ref + '차시 선생님 슬라이드 · ' + (sc.page + 1) + '쪽'; }
    else if (sc.kind === 'answer') what = '학생 답(이름 가림) · ' + (P.labels[sc.ref] || sc.ref);
    else what = '알림 글 · ' + sc.text.slice(0, 40);
    el.hidden = false;
    el.innerHTML = '<span>학생 화면에 띄움:</span><b>' + esc(what) + '</b><span class="grow"></span>'
      + (pages ? '<button type="button" id="st-prev"' + (sc.page <= 0 ? ' disabled' : '') + '>이전 쪽</button><button type="button" id="st-next"' + (sc.page >= pages - 1 ? ' disabled' : '') + '>다음 쪽</button>' : '')
      + '<button type="button" class="primary" id="st-close">화면 닫기</button>';
    if (pages) {
      $('#st-prev').onclick = () => setLive({ screen: Object.assign({}, sc, { page: sc.page - 1 }) });
      $('#st-next').onclick = () => setLive({ screen: Object.assign({}, sc, { page: sc.page + 1 }) });
    }
    $('#st-close').onclick = () => setLive({ screen: null });
  }

  // ---------- 답 모아보기 ----------
  function renderAnswers() {
    const box = $('#p-answers');
    if (!curQ) curQ = P.questions[0];
    box.innerHTML = '<div class="answers"><nav class="qlist" aria-label="질문 목록">'
      + [1, 2, 3, 4].map(l => '<h3>' + l + '차시 ' + esc(P.lessons[l - 1]) + '</h3>' + P.questions.filter(q => q.lesson === l).map(q => '<button type="button" data-q="' + esc(q.key) + '" aria-current="' + (q === curQ) + '"><small>' + l + '-' + (q.step + 1) + ' ' + esc(q.stepName) + '</small>' + esc(q.label) + '</button>').join('')).join('')
      + '</nav><section class="alist" id="alist"></section></div>';
    $$('[data-q]', box).forEach(b => b.onclick = () => { curQ = P.questions.find(q => q.key === b.dataset.q); $$('[data-q]', box).forEach(x => x.setAttribute('aria-current', String(x === b))); loadAnswers(); });
    loadAnswers();
  }
  let ansFilter = 'all';
  async function loadAnswers() {
    const box = $('#alist'), q = curQ;
    box.innerHTML = '<div class="head"><h2>' + esc(q.lesson + '-' + (q.step + 1) + ' ' + q.stepName + ' · ' + q.label) + '</h2><span class="muted">불러오는 중…</span></div>';
    try { answersCache = { key: q.key, rows: await call('asi_teacher_answers', { p_path: q.path }) }; }
    catch (e) { box.innerHTML = '<div class="head"><h2>' + esc(q.label) + '</h2></div><div class="empty">' + esc(e.message) + '</div>'; return; }
    answersCache.ai = null;
    try { const n = await call('asi_teacher_notes', { p_scope: 'answers:' + q.path.join('/') }); if (n && n[0]) answersCache.ai = Object.assign({ at: n[0].created_at }, n[0]); } catch (e) {}
    drawAnswers();
  }
  // AI 정리 칸: 묶음마다 이름·정리·속한 학생·대표 답. 맞고 틀림은 판단하지 않는다
  function aiPanelHTML(ai, rows) {
    if (!ai) return '';
    if (ai.busy) return '<div class="ai-panel"><p class="muted">AI 가 답을 읽고 있어요. 30초쯤 걸려요.</p></div>';
    const r = ai.result || {}, byId = id => rows.find(x => x.student_id === id), roster = ov ? ov.students : [];
    const who = id => { const s = roster.find(x => x.id === id) || byId(id); return s ? (hideNames ? '학생 ' + (roster.findIndex(x => x.id === id) + 1) : s.student_no + ' ' + s.name) : ''; };
    const groups = (r.groups || []).map(g => {
      const ex = g.example != null && byId(g.example) ? P.ownText(byId(g.example).value) : '';
      return '<section class="ai-group"><h3>' + esc(g.title) + ' <span class="muted">' + g.members.length + '명</span></h3><p>' + esc(g.summary) + '</p>'
        + (ex ? '<blockquote>' + esc(ex.length > 160 ? ex.slice(0, 157) + '…' : ex) + '</blockquote>' : '')
        + '<p class="ai-who">' + esc(g.members.map(who).filter(Boolean).join(', ')) + '</p></section>';
    }).join('');
    return '<div class="ai-panel"><div class="ai-head"><b>AI 정리</b><span class="muted">' + esc(fmtTime(ai.at || ai.created_at)) + ' · 학생 ' + (ai.n_answers || 0) + '명의 글 · 이름 없이 번호로 보낸 글만 읽고, 맞고 틀림은 판단하지 않아요</span></div>'
      + (groups || '<p class="muted">묶을 만큼 답이 모이지 않았어요.</p>')
      + ((r.unclear || []).length ? '<p class="ai-who"><b>짧거나 질문과 먼 답</b> ' + esc(r.unclear.map(who).join(', ')) + '</p>' : '')
      + (r.teacher_check ? '<p class="ai-check"><b>다시 물어볼 점</b> ' + esc(r.teacher_check) + '</p>' : '') + '</div>';
  }
  async function runAiSummary() {
    const q = curQ;
    answersCache.ai = { busy: true }; drawAnswers();
    try {
      const r = await ASI.ai({ token: auth.token, action: 'summarize', path: q.path, question: q.label });
      if (curQ !== q) return;
      answersCache.ai = Object.assign({ at: new Date().toISOString() }, r);
      if (r.note === 'too_few') toast('쓴 학생이 두 명보다 적어서 묶지 않았어요.');
    } catch (e) { answersCache.ai = null; toast(e.message); }
    drawAnswers();
  }
  function drawAnswers() {
    const box = $('#alist'), q = curQ, rows = answersCache.rows;
    const own = r => P.ownText(r.value);
    const written = rows.filter(r => own(r) || P.evidenceCount(r.value));
    const shown = ansFilter === 'written' ? written : ansFilter === 'blank' ? rows.filter(r => !(own(r) || P.evidenceCount(r.value))) : rows;
    box.innerHTML = '<div class="head"><h2>' + esc(q.lesson + '-' + (q.step + 1) + ' ' + q.stepName + ' · ' + q.label) + '</h2>'
      + '<span>쓴 학생 ' + written.length + ' / ' + rows.length + '</span>'
      + '<span class="seg">' + [['all', '모두'], ['written', '쓴 학생'], ['blank', '빈칸']].map(([k, t]) => '<button type="button" data-f="' + k + '" aria-pressed="' + (ansFilter === k) + '">' + t + '</button>').join('') + '</span>'
      + '<button type="button" id="a-ai"' + (answersCache.ai && answersCache.ai.busy ? ' disabled' : '') + ' title="학생이 직접 쓴 글만 이름 없이 번호로 보내 비슷한 생각끼리 묶습니다">AI로 답 묶어 보기</button>'
      + '<button type="button" id="a-reload">새로 불러오기</button></div>'
      + aiPanelHTML(answersCache.ai, rows)
      + (shown.length ? shown.map(r => {
        const t = own(r), ev = P.evidenceCount(r.value), idx = rows.indexOf(r);
        return '<div class="arow"><span class="who">' + (hideNames ? '학생 ' + (idx + 1) : esc(r.student_no) + '<small>' + esc(r.name) + '</small>') + '</span>'
          + '<span class="text' + (t ? '' : ' blank') + '">' + (t ? esc(t) : ev ? '(직접 쓴 글 없음)' : '(아직 쓰지 않음)') + (ev ? '<span class="ev">가져온 근거 ' + ev + '개는 빼고 보여요</span>' : '') + '</span>'
          + (t ? '<button type="button" data-show="' + idx + '" title="이름을 가리고 학생 화면에 띄웁니다">학생 화면에 띄우기</button>' : '<span></span>') + '</div>';
      }).join('') : '<div class="empty" style="margin:12px">해당하는 학생이 없어요.</div>');
    $$('[data-f]', box).forEach(b => b.onclick = () => { ansFilter = b.dataset.f; drawAnswers(); });
    $('#a-reload').onclick = loadAnswers;
    $('#a-ai').onclick = runAiSummary;
    $$('[data-show]', box).forEach(b => b.onclick = () => {
      const t = own(rows[+b.dataset.show]);
      showScreen({ kind: 'answer', ref: q.key, page: 0, text: t.length > 300 ? t.slice(0, 297) + '…' : t });
      toast('이름을 가리고 학생 화면에 띄웠어요. 위쪽 초록 줄에서 닫을 수 있어요.');
    });
  }

  // ---------- 채점표 ----------
  async function loadScores() {
    const box = $('#p-scores');
    if (!scores) box.innerHTML = '<div class="empty">불러오는 중…</div>';
    try { scores = await call('asi_teacher_scores'); } catch (e) { box.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; return; }
    drawScores();
  }
  const scoreOf = (sid, el) => (scores || []).find(x => x.student_id === sid && x.element === el);
  function totalOf(sid) {
    let sum = 0, n = 0;
    for (const r of P.rubric) { const sc = scoreOf(sid, r.id); if (sc && LEVELS.includes(sc.level)) { sum += r.points[sc.level]; n++; } }
    return { sum, n };
  }
  function drawScores() {
    const box = $('#p-scores'), list = ov ? ov.students : [];
    if (!P.rubric.length) { box.innerHTML = '<div class="empty">이 프로그램의 루브릭 기준을 아직 넣지 않았어요.</div>'; return; }
    if (!list.length) { box.innerHTML = '<div class="empty">아직 들어온 학생이 없어요.</div>'; return; }
    const cell = (s, r) => {
      const sc = scoreOf(s.id, r.id), lv = sc && sc.level || '';
      return '<td><select data-s="' + s.id + '" data-e="' + r.id + '" class="' + (lv ? 'set' : '') + '" aria-label="' + esc(s.student_no + ' ' + r.no + ' ' + r.name) + '">'
        + '<option value=""' + (lv ? '' : ' selected') + '>-</option>' + LEVELS.map(x => '<option value="' + x + '"' + (lv === x ? ' selected' : '') + '>' + x + ' ' + r.points[x] + '</option>').join('') + '<option value="U"' + (lv === 'U' ? ' selected' : '') + '>미확인</option></select>'
        + (sc && sc.ai_level ? '<span class="ai">AI 제안 ' + esc(sc.ai_level) + '</span>' : '')
        + '<button type="button" class="quiet" data-open-s="' + s.id + '" data-open-e="' + r.id + '" title="근거 보며 채점">근거</button></td>';
    };
    const first = P.rubric[0], last = P.rubric[P.rubric.length - 1];
    box.innerHTML = '<div class="score-tools"><span>루브릭 ' + esc((first.no || first.id) + '~' + (last.no || last.id)) + ' · ' + P.total + '점. 칸을 고르면 바로 저장되고, 「근거」를 누르면 학생 답과 단계 기준을 함께 봅니다.</span><span class="grow"></span>'
      + '<label class="switch"><select id="sc-ai-el" aria-label="AI 제안을 받을 요소">' + P.rubric.map(r => '<option value="' + r.id + '">' + esc((r.no || r.id) + ' ' + r.name) + '</option>').join('') + '</select></label>'
      + '<button type="button" id="sc-ai"' + (aiBusy ? ' disabled' : '') + ' title="학생이 직접 쓴 글만 이름 없이 번호로 보내 단계 제안을 받습니다. 점수는 바뀌지 않아요.">' + (aiBusy ? 'AI 가 읽는 중…' : 'AI 채점 제안 받기') + '</button>'
      + '<button type="button" id="sc-reload">새로 불러오기</button><button type="button" id="sc-csv">채점표 내려받기(CSV)</button></div>'
      + '<div class="score-wrap"><table class="scores"><thead><tr><th class="l">학번</th><th class="l">이름</th>'
      + P.rubric.map(r => '<th title="' + esc(r.area) + '">' + r.no + ' ' + esc(r.name) + '<small>' + r.points.A + '점</small></th>').join('')
      + '<th>합계<small>확정한 요소만</small></th></tr></thead><tbody>'
      + list.map(s => { const t = totalOf(s.id); return '<tr><td class="l">' + (hideNames ? '' : esc(s.student_no)) + '</td><td class="l">' + esc(nameOf(s)) + '</td>' + P.rubric.map(r => cell(s, r)).join('') + '<td class="total">' + t.sum + ' <span class="muted" style="font-weight:400">(' + t.n + '/' + P.rubric.length + ')</span></td></tr>'; }).join('')
      + '</tbody></table></div>';
    $$('select[data-s]', box).forEach(sel => sel.onchange = async () => {
      const sid = +sel.dataset.s, el = sel.dataset.e, old = scoreOf(sid, el);
      try {
        const r = await call('asi_teacher_score', { p_student_id: sid, p_element: el, p_level: sel.value || null, p_note: old ? old.note : '' });
        scores = scores.filter(x => !(x.student_id === sid && x.element === el)).concat(r);
        drawScores();
      } catch (e) { toast(e.message); sel.value = old && old.level || ''; }
    });
    $$('[data-open-s]', box).forEach(b => b.onclick = () => openDrawer(+b.dataset.openS, b.dataset.openE));
    $('#sc-reload').onclick = loadScores;
    $('#sc-csv').onclick = downloadCSV;
    if (aiEl) $('#sc-ai-el').value = aiEl;
    $('#sc-ai-el').onchange = e => { aiEl = e.target.value; };
    $('#sc-ai').onclick = runAiSuggest;
  }
  // AI 채점 제안: 결과는 각 칸 아래 「AI 제안」으로만 보이고, 선생님이 고른 단계는 바뀌지 않는다
  let aiBusy = false, aiEl = '';
  async function runAiSuggest() {
    const el = P.rubric.find(r => r.id === ($('#sc-ai-el').value || aiEl)) || P.rubric[0];
    aiEl = el.id; aiBusy = true; drawScores();
    try {
      const r = await ASI.ai({ token: auth.token, action: 'suggest', element: { id: el.id, no: el.no || el.id, name: el.name, levels: el.levels, keys: el.keys }, labels: Object.fromEntries(el.keys.map(k => [k, P.labels[k] || k])) });
      aiBusy = false;
      await loadScores();
      toast(r.note === 'no_records' ? ASI.MSG.no_records : (el.no || el.id) + ' 제안을 ' + (r.suggestions || []).length + '명 받았어요. 칸 아래 「AI 제안」을 보고 정해 주세요.');
    } catch (e) { aiBusy = false; drawScores(); toast(e.message); }
  }
  function downloadCSV() {
    const list = ov ? ov.students : [];
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['학번', '이름'].concat(P.rubric.flatMap(r => [r.no + ' ' + r.name + ' 단계', r.no + ' 점수'])).concat(['합계', '확정 요소 수']);
    const rows = list.map(s => {
      const t = totalOf(s.id);
      return [s.student_no, s.name].concat(P.rubric.flatMap(r => { const sc = scoreOf(s.id, r.id), lv = sc && sc.level || ''; return [lv === 'U' ? '미확인' : lv, LEVELS.includes(lv) ? r.points[lv] : '']; })).concat([t.sum, t.n]);
    });
    const csv = '﻿' + [head].concat(rows).map(r => r.map(q).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = '채점표_' + (ov ? ov.room.title : '') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function studentRecord(sid) {
    const s = ov && ov.students.find(x => x.id === sid);
    const c = studentCache.get(sid);
    if (c && s && c.rev === s.rev) return c;
    const r = await call('asi_teacher_student', { p_student_id: sid });
    studentCache.set(sid, r);
    return r;
  }
  function closeDrawer() { const d = $('#drawer'); if (d) { d.hidden = true; d.innerHTML = ''; } drawerAt = null; }
  async function openDrawer(sid, el) {
    const d = $('#drawer'), r = P.rubric.find(x => x.id === el), s = ov.students.find(x => x.id === sid);
    if (!r || !s) return;
    drawerAt = { sid, el };
    d.hidden = false;
    d.innerHTML = '<header><h2>' + esc(label(s) + ' · ' + r.no + ' ' + r.name) + '</h2><button type="button" data-x>닫기</button></header><div class="body"><p class="muted">기록을 불러오는 중…</p></div>';
    $('[data-x]', d).onclick = closeDrawer;
    let rec;
    try { rec = await studentRecord(sid); } catch (e) { $('.body', d).innerHTML = '<p>' + esc(e.message) + '</p>'; return; }
    if (!drawerAt || drawerAt.sid !== sid || drawerAt.el !== el) return;
    const ans = (rec.data && rec.data.answers) || {};
    const sc = scoreOf(sid, el) || {};
    const lv = sc.level || '';
    d.innerHTML = '<header><h2>' + esc(label(s) + ' · ' + r.no + ' ' + r.name) + '</h2><button type="button" data-x>닫기</button></header>'
      + '<div class="body"><section><h3>이 요소의 근거가 되는 학생 답</h3>'
      + r.keys.map(k => { const q = P.questions.find(x => x.key === k), t = P.ownText(ans[k]), ev = P.evidenceCount(ans[k]); return '<div class="ans"><b>' + esc((q ? q.lesson + '-' + (q.step + 1) + ' ' : '') + (P.labels[k] || k)) + '</b><p' + (t ? '' : ' class="muted"') + '>' + (t ? esc(t) : '(쓰지 않음)') + '</p>' + (ev ? '<span class="muted" style="font-size:12px">가져온 근거 ' + ev + '개</span>' : '') + '</div>'; }).join('')
      + (rec.data ? '<p class="muted" style="font-size:12px;margin:0">담은 근거 ' + ((rec.data.evidence || []).length) + '개 · 마지막 저장 ' + esc(fmtTime(rec.updated_at)) + '</p>' : '<p class="muted">아직 저장된 기록이 없어요.</p>')
      + '</section><section><h3>단계 기준</h3><div class="levels">'
      + LEVELS.map(x => '<label><input type="radio" name="lv" value="' + x + '"' + (lv === x ? ' checked' : '') + '><b>' + x + ' ' + r.points[x] + '점</b><span>' + esc(r.levels[x]) + '</span></label>').join('')
      + '<label><input type="radio" name="lv" value="U"' + (lv === 'U' ? ' checked' : '') + '><b>미확인</b><span>기록을 더 확인한 뒤 정합니다.</span></label>'
      + '<label><input type="radio" name="lv" value=""' + (!lv ? ' checked' : '') + '><b>비움</b><span>확정하지 않습니다.</span></label></div></section>'
      + (r.focus ? '<p class="muted" style="margin:0;font-size:12.5px"><b>채점 초점</b> ' + esc(r.focus) + '</p>' : '')
      + '<section><h3>선생님 메모</h3><textarea id="dr-note" rows="3" maxlength="1000" style="width:100%">' + esc(sc.note || '') + '</textarea></section>'
      + '<section><h3>AI 제안</h3><div class="ai-box">' + (sc.ai_level ? '제안 단계 ' + esc(sc.ai_level) + (sc.ai_evidence ? '<br>근거로 본 문장: ' + esc(sc.ai_evidence) : '') + '<br>제안일 뿐이며 점수는 선생님이 정합니다.' : '아직 없음. 채점표 위 「AI 채점 제안 받기」로 받을 수 있어요. 점수는 선생님이 정합니다.') + '</div></section></div>'
      + '<footer><button type="button" class="primary" id="dr-save">저장</button><button type="button" id="dr-next">저장하고 다음 학생</button><span class="grow"></span><button type="button" data-x>닫기</button></footer>';
    $$('[data-x]', d).forEach(b => b.onclick = closeDrawer);
    const saveIt = async () => {
      const level = ($('input[name=lv]:checked', d) || {}).value || null;
      const r2 = await call('asi_teacher_score', { p_student_id: sid, p_element: el, p_level: level, p_note: $('#dr-note').value });
      scores = (scores || []).filter(x => !(x.student_id === sid && x.element === el)).concat(r2);
      drawScores();
    };
    $('#dr-save').onclick = async () => { try { await saveIt(); toast('저장했어요.'); } catch (e) { toast(e.message); } };
    $('#dr-next').onclick = async () => {
      try {
        await saveIt();
        const list = ov.students, i = list.findIndex(x => x.id === sid);
        if (i < list.length - 1) openDrawer(list[i + 1].id, el); else { toast('마지막 학생이에요.'); closeDrawer(); }
      } catch (e) { toast(e.message); }
    };
  }

  // ---------- 방 설정 ----------
  function renderSettings() {
    const box = $('#p-settings'), r = ov ? ov.room : { title: auth.title, school: auth.school };
    box.innerHTML = '<div class="settings"><div style="display:grid;gap:14px">'
      + '<section><h2>방 정보</h2><label>수업 이름<input id="st-title" maxlength="60" value="' + esc(r.title) + '"></label><label>학교<input id="st-school" maxlength="40" value="' + esc(r.school || '') + '"></label><div><button type="button" id="st-save">저장</button></div></section>'
      + '<section><h2>입장과 기록</h2>'
      + '<label class="switch"><input type="checkbox" id="st-closed"' + (r.closed ? ' checked' : '') + '> 새 학생 입장 막기</label><p class="note">이미 들어온 학생은 같은 학번·이름으로 계속 들어올 수 있어요.</p>'
      + '<label class="switch"><input type="checkbox" id="st-locked"' + (r.records_locked ? ' checked' : '') + '> 기록 확정(학생 저장 막기)</label><p class="note">채점을 시작할 때 켭니다. 학생 화면에 「기록 확정됨」이 뜨고 서버 기록이 더 바뀌지 않아요.</p></section>'
      + '<section><h2>방 비밀번호 바꾸기</h2><label>새 비밀번호(6자 이상)<input id="st-pass" type="password" autocomplete="new-password"></label><label>한 번 더<input id="st-pass2" type="password" autocomplete="new-password"></label><div><button type="button" id="st-pass-go">바꾸기</button></div><p class="note">바꾸면 이 화면을 뺀 다른 기기의 선생님 화면은 닫혀요.</p></section>'
      + '</div><section><h2>학생 명단</h2><p class="note">모둠 번호를 적어 두면 나중에 모둠별로 보낼 수 있어요. 지우면 그 학생의 기록과 채점도 함께 지워져요.</p>'
      + '<table class="roster"><thead><tr><th>학번</th><th>이름</th><th>모둠</th><th>마지막 접속</th><th></th></tr></thead><tbody>'
      + (ov && ov.students.length ? ov.students.map(s => '<tr><td>' + esc(s.student_no) + '</td><td><input data-name="' + s.id + '" value="' + esc(s.name) + '" maxlength="20" aria-label="' + esc(s.student_no) + ' 이름"></td><td><input class="grp" data-grp="' + s.id + '" type="number" min="0" max="99" value="' + (s.group_no || '') + '" aria-label="' + esc(s.student_no) + ' 모둠"></td><td class="muted">' + esc(fmtTime(s.last_seen)) + '</td><td><button type="button" class="quiet" data-del="' + s.id + '">지우기</button></td></tr>').join('') : '<tr><td colspan="5" class="muted">아직 없음</td></tr>')
      + '</tbody></table></section></div>';
    const room = async args => { try { const x = await call('asi_teacher_update_room', Object.assign({ p_title: null, p_school: null, p_closed: null, p_records_locked: null, p_new_pass: null }, args)); if (ov) ov.room = x; update(); toast('바꿨어요.'); } catch (e) { toast(e.message); renderSettings(); } };
    $('#st-save').onclick = () => room({ p_title: $('#st-title').value, p_school: $('#st-school').value });
    $('#st-closed').onchange = e => room({ p_closed: e.target.checked });
    $('#st-locked').onchange = e => { if (e.target.checked && !confirm('기록을 확정할까요? 학생들이 더 저장하지 못해요(나중에 다시 풀 수 있어요).')) { e.target.checked = false; return; } room({ p_records_locked: e.target.checked }); };
    $('#st-pass-go').onclick = () => { const a = $('#st-pass').value; if (a.length < 6) return toast(ASI.MSG.short_pass); if (a !== $('#st-pass2').value) return toast('두 비밀번호가 달라요.'); room({ p_new_pass: a }); };
    const setS = async (sid, name, grp) => { try { await call('asi_teacher_set_student', { p_student_id: sid, p_name: name, p_group: grp }); toast('바꿨어요.'); poll(); } catch (e) { toast(e.message); } };
    $$('[data-name]', box).forEach(i => i.onchange = () => setS(+i.dataset.name, i.value, null));
    $$('[data-grp]', box).forEach(i => i.onchange = () => setS(+i.dataset.grp, null, i.value === '' ? 0 : +i.value));
    $$('[data-del]', box).forEach(b => b.onclick = async () => {
      const s = ov.students.find(x => x.id === +b.dataset.del);
      if (!s || !confirm(s.student_no + ' ' + s.name + ' 학생을 지울까요? 기록과 채점도 함께 지워지고 되돌릴 수 없어요.')) return;
      try { await call('asi_teacher_remove_student', { p_student_id: s.id }); toast('지웠어요.'); await poll(); renderSettings(); } catch (e) { toast(e.message); }
    });
  }

  // ---------- 체험 화면: 가짜 서버와 가짜 학생 ----------
  async function demo() {
    const srv = ASIMock.createServer();
    ASI.setTransport(srv.transport);
    const room = await rpc('asi_create_room', { p_program: P.id, p_title: '체험 · 1학년 3반', p_school: '연구회 체험', p_pass: 'demo-only' });
    await rpc('asi_teacher_live', { p_tok: room.token, p_patch: { open_lessons: [1, 2] } });
    const names = ['김하늘', '이도윤', '박서연', '최지호', '정하린', '강민준', '조유나', '윤시우', '장예린', '임건우', '한소율', '오준서', '서다은', '신우진', '권나연', '황태윤', '안채원', '송현우', '전지안', '홍승민', '유서아', '고은호', '문가은', '양도현', '손지유', '배재윤', '백하은', '허주원'];
    const toks = [];
    for (let i = 0; i < names.length; i++) {
      const no = '103' + String(i + 1).padStart(2, '0');
      const j = await rpc('asi_join', { p_code: room.code, p_no: no, p_name: names[i] });
      const lesson = i % 9 === 0 ? 2 : 1, step = (i * 3) % STEPS;
      await rpc('asi_save', { p_token: j.token, p_data: P.demoRecord(i, lesson, step), p_progress: { done: Math.min(TOTAL, step + (lesson - 1) * STEPS + (i % 3)), total: TOTAL }, p_base_rev: 0 });
      toks.push({ token: j.token, lesson, step, place: 'map', after: j.last_command_id, live: -1, away: i === 7 || i === 19 });
    }
    // 가짜 학생 움직이기: 2초마다 신호, 선생님 명령을 따르는 척
    const places = P.places.map(p => p.id).concat(['map', 'inquiry', 'inquiry']);
    const tickAll = async () => {
      for (const [i, t] of toks.entries()) {
        if (t.away) continue;
        if (Math.random() < 0.08) t.place = places[Math.floor(Math.random() * places.length)];
        if (Math.random() < 0.015 && t.step < STEPS - 1) t.step++;
        const r = await rpc('asi_tick', { p_token: t.token, p_lesson: t.lesson, p_step: t.step, p_place: t.place, p_after: t.after, p_live_rev: t.live });
        t.live = r.live_rev;
        for (const c of r.commands) {
          t.after = c.id;
          if (c.kind === 'gather' || c.kind === 'teleport') { t.place = c.payload.place; if (c.payload.lesson) t.lesson = c.payload.lesson; }
          if (c.kind === 'open_step') { t.lesson = c.payload.lesson; t.step = c.payload.step; t.place = 'inquiry'; }
        }
        if (i === 4 && Math.random() < 0.05) await rpc('asi_help', { p_token: t.token, p_on: true });
      }
    };
    await rpc('asi_help', { p_token: toks[11].token, p_on: true });
    await tickAll();
    setInterval(tickAll, 2000);
    start({ token: room.token, code: room.code, title: '체험 · 1학년 3반', school: '연구회 체험' });
  }

  // ---------- 시작 ----------
  if (DEMO) { demo().catch(e => { $('#app').innerHTML = '<main class="login"><p class="err">체험 화면을 열지 못했어요: ' + esc(e.message) + '</p></main>'; }); }
  else {
    const saved = store.get(AUTH_KEY, null, sessionStorage);
    if (saved && saved.token) start(saved); else renderLogin('');
  }
  window.__ASI_DASH = { get ov() { return ov; }, get auth() { return auth; }, poll, selected };
})();
