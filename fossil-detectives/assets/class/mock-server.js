/* 가짜 수업 서버 — setup.sql 의 asi_* 함수 21개를 메모리에서 흉내 낸다.
   쓰는 곳: ① 자동 시험(Node, Playwright 가 Supabase 주소로 가는 요청을 여기로 돌림)
           ② 선생님 화면 체험(dashboard.html?demo=1, 가짜 학생 28명)
   실제 서버에는 아무것도 보내지 않는다. 규칙을 바꿀 때는 setup.sql 과 함께 고칠 것. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ASIMock = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));
  const fail = code => { const e = new Error(code); e.code = code; throw e; };
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const squash = s => String(s || '').toLowerCase().replace(/\s/g, '');

  function cleanLive(p, now) {
    const v = {};
    if (!isObj(p)) return v;
    if (typeof p.paused === 'boolean') v.paused = p.paused;
    if (typeof p.move_lock === 'boolean') v.move_lock = p.move_lock;
    if (Array.isArray(p.open_lessons)) {
      v.open_lessons = [...new Set(p.open_lessons.filter(e => typeof e === 'number' && /^[1-4]$/.test(String(e))))].sort();
    }
    const s = p.screen;
    if (isObj(s) && ['learn', 'slide', 'answer', 'notice'].includes(s.kind)
        && String(s.ref == null ? '' : s.ref).length <= 60 && String(s.text == null ? '' : s.text).length <= 300) {
      v.screen = {
        kind: s.kind, ref: s.ref == null ? '' : String(s.ref),
        page: typeof s.page === 'number' && /^[0-9]{1,2}$/.test(String(s.page)) ? s.page : 0,
        text: s.text == null ? '' : String(s.text)
      };
    }
    if (typeof p.timer_end === 'string') {
      const t = Date.parse(p.timer_end);
      if (!isNaN(t) && t > now - 3600e3 && t < now + 3 * 3600e3) v.timer_end = new Date(t).toISOString();
    }
    if (typeof p.notice === 'string' && p.notice.trim()) v.notice = p.notice.trim().slice(0, 200);
    if (['name', 'no', 'off'].includes(p.peers)) v.peers = p.peers;   // 친구 캐릭터 표시(11-13)
    return v;
  }
  const stripNulls = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null));

  function createServer(opts) {
    opts = opts || {};
    const clock = opts.now || (() => Date.now());
    const db = { rooms: [], sessions: [], students: [], records: [], commands: [], scores: [], notes: [] };
    let seq = { room: 0, student: 0, command: 0, score: 0, note: 0 };
    const calls = [];
    const iso = () => new Date(clock()).toISOString();

    const roomJson = r => ({ code: r.code, program: r.program, title: r.title, school: r.school, closed: r.closed, records_locked: r.records_locked });
    const roomByCode = c => db.rooms.find(r => r.code === String(c || '').trim().toUpperCase());
    function teacherRoom(tok) {
      const s = db.sessions.find(x => x.token === tok);
      if (!s) fail('no_session');
      if (s.expires < clock()) fail('expired');
      return db.rooms.find(r => r.id === s.room_id);
    }
    function student(tok) {
      const st = db.students.find(x => x.token === tok);
      if (!st) fail('no_student');
      return st;
    }
    const recordOf = st => db.records.find(r => r.student_id === st.id);
    const maxCmd = rid => db.commands.filter(c => c.room_id === rid).reduce((m, c) => Math.max(m, c.id), 0);

    const F = {
      asi_room_public({ p_code }) { const r = roomByCode(p_code); return r ? roomJson(r) : null; },

      asi_join({ p_code, p_no, p_name }) {
        const no = String(p_no || '').replace(/[\s-]/g, ''), name = String(p_name || '').trim();
        if (!/^[0-9A-Za-z]{1,12}$/.test(no)) fail('bad_no');
        if (!name || name.length > 20) fail('bad_name');
        const r = roomByCode(p_code); if (!r) fail('no_room');
        let st = db.students.find(s => s.room_id === r.id && s.student_no === no);
        if (st) { if (squash(st.name) !== squash(name)) fail('name_mismatch'); }
        else {
          if (r.closed) fail('closed');
          if (db.students.filter(s => s.room_id === r.id).length >= 60) fail('room_full');
          st = { id: ++seq.student, room_id: r.id, student_no: no, name, group_no: null, token: uuid(), lesson: null, step: null, place: null, help_at: null, created_at: iso(), last_seen: iso() };
          db.students.push(st);
        }
        st.last_seen = iso();
        const rc = recordOf(st);
        return {
          token: st.token, student_no: st.student_no, name: st.name, group_no: st.group_no,
          room: roomJson(r), live: clone(r.live), live_rev: r.live_rev, last_command_id: maxCmd(r.id),
          record: rc ? { data: clone(rc.data), rev: rc.rev, updated_at: rc.updated_at } : null
        };
      },

      asi_load({ p_token }) {
        const st = student(p_token), rc = recordOf(st);
        if (!rc) return { data: null, rev: 0 };
        return { data: clone(rc.data), progress: clone(rc.progress), rev: rc.rev, updated_at: rc.updated_at };
      },

      asi_save({ p_token, p_data, p_progress, p_base_rev }) {
        if (!isObj(p_data)) fail('bad_data');
        if (JSON.stringify(p_data).length > 400000) fail('too_long');
        if (p_progress != null && (!isObj(p_progress) || JSON.stringify(p_progress).length > 2000)) fail('bad_progress');
        const st = student(p_token), r = db.rooms.find(x => x.id === st.room_id);
        if (r.records_locked) fail('records_locked');
        let rc = recordOf(st);
        if (rc && p_base_rev !== rc.rev) return { conflict: true, rev: rc.rev, updated_at: rc.updated_at };
        if (!rc && (p_base_rev || 0) !== 0) return { conflict: true, rev: 0, updated_at: null };
        const rev = (rc ? rc.rev : 0) + 1, at = iso();
        if (!rc) { rc = { student_id: st.id, room_id: st.room_id }; db.records.push(rc); }
        Object.assign(rc, { data: clone(p_data), progress: clone(p_progress || {}), rev, updated_at: at });
        st.last_seen = at;
        return { ok: true, rev, updated_at: at };
      },

      asi_tick({ p_token, p_lesson, p_step, p_place, p_after, p_live_rev, p_x = null, p_z = null, p_ry = null, p_peers = false, p_peers_since = null }) {
        const st = student(p_token);
        if (Number.isInteger(p_lesson) && p_lesson >= 1 && p_lesson <= 4) st.lesson = p_lesson;
        if (Number.isInteger(p_step) && p_step >= 0 && p_step <= 4) st.step = p_step;
        if (p_place != null) st.place = String(p_place).trim().slice(0, 40);
        st.last_seen = iso();
        // 친구 캐릭터(11-13): 움직였을 때만 좌표를 받고, 지도를 보고 있으면 같은 차시 친구 위치를 돌려준다
        if (typeof p_x === 'number' && typeof p_z === 'number' && Math.abs(p_x) < 5000 && Math.abs(p_z) < 5000) {
          st.px = p_x; st.pz = p_z; if (typeof p_ry === 'number') st.pry = p_ry; st.pos_at = clock();
        }
        const r = db.rooms.find(x => x.id === st.room_id);
        const mode = (r.live && r.live.peers) || 'name';
        let here = null, peers = null;
        if (p_peers && mode !== 'off' && st.lesson != null) {
          const since = p_peers_since ? Date.parse(p_peers_since) - 1000 : null;
          const r1 = v => Math.round(v * 10) / 10;
          const list = db.students.filter(s => s.room_id === st.room_id && s.id !== st.id && s.lesson === st.lesson && s.px != null
            && Date.parse(s.last_seen) > clock() - 15000).sort((a, b) => a.id - b.id);
          here = list.map(s => [s.id, ['inquiry', 'council'].includes(s.place) ? 0 : 1]);
          peers = list.filter(s => since == null || s.pos_at > since)
            .map(s => [s.id, mode === 'no' ? s.student_no : s.name, r1(s.px), r1(s.pz), Math.round((s.pry || 0) * 100) / 100]);
        }
        const cmds = db.commands.filter(c => c.room_id === st.room_id && c.id > (p_after || 0) && c.created > clock() - 600e3
          && (c.target === 'all' || c.target === 'student:' + st.id || (st.group_no != null && c.target === 'group:' + st.group_no)))
          .sort((a, b) => a.id - b.id).slice(0, 20).map(c => ({ id: c.id, kind: c.kind, payload: clone(c.payload) }));
        return {
          now: iso(), live_rev: r.live_rev, live: p_live_rev !== r.live_rev ? clone(r.live) : null,
          records_locked: r.records_locked, group_no: st.group_no, help_at: st.help_at, commands: cmds,
          peers_mode: mode, here, peers
        };
      },

      asi_help({ p_token, p_on }) {
        const st = student(p_token);
        st.help_at = p_on ? iso() : null; st.last_seen = iso();
        return st.help_at;
      },

      asi_create_room({ p_program, p_title, p_school, p_pass }) {
        if (!['netzero', 'fossil'].includes(p_program)) fail('bad_program');
        if (!String(p_title || '').trim()) fail('bad_title');
        if (String(p_pass || '').length < 6) fail('short_pass');
        const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code;
        do { code = Array.from({ length: 6 }, () => alpha[Math.floor(Math.random() * alpha.length)]).join(''); } while (roomByCode(code));
        const r = { id: ++seq.room, code, program: p_program, title: String(p_title).trim().slice(0, 60), school: String(p_school || '').trim().slice(0, 40),
          pass: String(p_pass), fail_count: 0, locked_until: 0, closed: false, records_locked: false, live: { open_lessons: [1] }, live_rev: 0 };
        db.rooms.push(r);
        const token = uuid(); db.sessions.push({ token, room_id: r.id, expires: clock() + 12 * 3600e3 });
        return { code, token };
      },

      asi_teacher_login({ p_code, p_pass }) {
        const r = roomByCode(p_code); if (!r) return { error: 'no_room' };
        if (r.locked_until > clock()) return { error: 'locked' };
        if (r.pass !== String(p_pass || '')) {
          r.fail_count++;
          if (r.fail_count >= 10) { r.fail_count = 0; r.locked_until = clock() + 600e3; }
          return { error: 'wrong_pass' };
        }
        r.fail_count = 0;
        const token = uuid(); db.sessions.push({ token, room_id: r.id, expires: clock() + 12 * 3600e3 });
        return { token, room: roomJson(r), live: clone(r.live), live_rev: r.live_rev };
      },

      asi_teacher_logout({ p_tok }) {
        const i = db.sessions.findIndex(s => s.token === p_tok); if (i < 0) return false;
        db.sessions.splice(i, 1); return true;
      },

      asi_teacher_overview({ p_tok }) {
        const r = teacherRoom(p_tok);
        return {
          now: iso(), room: roomJson(r), live: clone(r.live), live_rev: r.live_rev, last_command_id: maxCmd(r.id),
          students: db.students.filter(s => s.room_id === r.id).sort((a, b) => a.student_no < b.student_no ? -1 : 1).map(s => {
            const rc = recordOf(s);
            return { id: s.id, student_no: s.student_no, name: s.name, group_no: s.group_no, lesson: s.lesson, step: s.step, place: s.place,
              help_at: s.help_at, last_seen: s.last_seen, progress: clone(rc ? rc.progress : {}), rev: rc ? rc.rev : 0, updated_at: rc ? rc.updated_at : null };
          })
        };
      },

      asi_teacher_live({ p_tok, p_patch }) {
        const r = teacherRoom(p_tok);
        if (!isObj(p_patch)) fail('bad_patch');
        r.live = cleanLive(stripNulls(Object.assign({}, r.live, p_patch)), clock());
        r.live_rev++;
        return { live: clone(r.live), live_rev: r.live_rev };
      },

      asi_teacher_command({ p_tok, p_target, p_kind, p_payload }) {
        const r = teacherRoom(p_tok);
        if (!['gather', 'teleport', 'open_step', 'view', 'card', 'reload'].includes(p_kind)) fail('bad_kind');
        if (p_payload != null && (!isObj(p_payload) || JSON.stringify(p_payload).length > 2000)) fail('bad_payload');
        const t = String(p_target || '');
        const ok = t === 'all' || /^group:[1-9][0-9]?$/.test(t)
          || (/^student:[0-9]{1,18}$/.test(t) && db.students.some(s => s.room_id === r.id && s.id === Number(t.slice(8))));
        if (!ok) fail('bad_target');
        db.commands = db.commands.filter(c => !(c.room_id === r.id && c.created < clock() - 86400e3));
        const id = ++seq.command;
        db.commands.push({ id, room_id: r.id, target: t, kind: p_kind, payload: clone(p_payload || {}), created: clock() });
        return id;
      },

      asi_teacher_answers({ p_tok, p_path }) {
        const r = teacherRoom(p_tok);
        if (!Array.isArray(p_path) || p_path.length < 1 || p_path.length > 6 || p_path.some(x => x == null || String(x).length > 40)) fail('bad_path');
        return db.students.filter(s => s.room_id === r.id).sort((a, b) => a.student_no < b.student_no ? -1 : 1).map(s => {
          const rc = recordOf(s);
          let v = rc ? rc.data : null;
          for (const k of p_path) v = v == null ? null : (Array.isArray(v) ? v[Number(k)] : v[k]);
          return { student_id: s.id, student_no: s.student_no, name: s.name, group_no: s.group_no, value: v === undefined ? null : clone(v), updated_at: rc ? rc.updated_at : null };
        });
      },

      asi_teacher_student({ p_tok, p_student_id }) {
        const r = teacherRoom(p_tok);
        const st = db.students.find(s => s.id === p_student_id && s.room_id === r.id); if (!st) fail('no_student');
        const rc = recordOf(st);
        return {
          student: { id: st.id, student_no: st.student_no, name: st.name, group_no: st.group_no, lesson: st.lesson, step: st.step, help_at: st.help_at, last_seen: st.last_seen },
          data: rc ? clone(rc.data) : null, progress: rc ? clone(rc.progress) : null, rev: rc ? rc.rev : 0, updated_at: rc ? rc.updated_at : null,
          scores: db.scores.filter(x => x.student_id === st.id).sort((a, b) => a.element < b.element ? -1 : 1).map(x => { const o = clone(x); delete o.room_id; delete o.student_id; return o; })
        };
      },

      asi_teacher_set_student({ p_tok, p_student_id, p_name, p_group }) {
        const r = teacherRoom(p_tok);
        if (p_name != null && (!String(p_name).trim() || String(p_name).trim().length > 20)) fail('bad_name');
        if (p_group != null && (p_group < 0 || p_group > 99)) fail('bad_group');
        const st = db.students.find(s => s.id === p_student_id && s.room_id === r.id); if (!st) fail('no_student');
        if (p_name != null) st.name = String(p_name).trim();
        if (p_group != null) st.group_no = p_group === 0 ? null : p_group;
        return { id: st.id, name: st.name, group_no: st.group_no };
      },

      asi_teacher_remove_student({ p_tok, p_student_id }) {
        const r = teacherRoom(p_tok);
        const i = db.students.findIndex(s => s.id === p_student_id && s.room_id === r.id); if (i < 0) return false;
        db.students.splice(i, 1);
        db.records = db.records.filter(x => x.student_id !== p_student_id);
        db.scores = db.scores.filter(x => x.student_id !== p_student_id);
        return true;
      },

      asi_teacher_clear_help({ p_tok, p_student_id }) {
        const r = teacherRoom(p_tok);
        const st = db.students.find(s => s.id === p_student_id && s.room_id === r.id); if (!st) return false;
        st.help_at = null; return true;
      },

      asi_teacher_score({ p_tok, p_student_id, p_element, p_level, p_note }) {
        const r = teacherRoom(p_tok);
        if (!db.students.some(s => s.id === p_student_id && s.room_id === r.id)) fail('no_student');
        if ((r.program === 'netzero' && !/^N[1-6]$/.test(p_element || '')) || (r.program === 'fossil' && !/^P[1-8]$/.test(p_element || ''))) fail('bad_element');
        if (p_level != null && !['A', 'B', 'C', 'D', 'E', 'U'].includes(p_level)) fail('bad_level');
        if (String(p_note || '').length > 1000) fail('too_long');
        let sc = db.scores.find(x => x.student_id === p_student_id && x.element === p_element);
        if (!sc) { sc = { id: ++seq.score, room_id: r.id, student_id: p_student_id, element: p_element, ai_level: null, ai_evidence: '', ai_model: '', ai_at: null }; db.scores.push(sc); }
        Object.assign(sc, { level: p_level == null ? null : p_level, note: String(p_note || ''), decided_at: p_level == null ? null : iso(), updated_at: iso() });
        const o = clone(sc); delete o.room_id; return o;
      },

      asi_teacher_scores({ p_tok }) {
        const r = teacherRoom(p_tok);
        return db.scores.filter(x => x.room_id === r.id).sort((a, b) => a.student_id - b.student_id || (a.element < b.element ? -1 : 1)).map(x => { const o = clone(x); delete o.room_id; return o; });
      },

      asi_teacher_notes({ p_tok, p_scope }) {
        const r = teacherRoom(p_tok);
        const latest = {};
        for (const n of db.notes.filter(x => x.room_id === r.id && (!p_scope || x.scope === p_scope))) {
          if (!latest[n.scope] || latest[n.scope].created_at < n.created_at) latest[n.scope] = n;
        }
        return Object.values(latest).sort((a, b) => a.scope < b.scope ? -1 : 1).map(n => ({ scope: n.scope, result: clone(n.result), n_answers: n.n_answers, model: n.model, created_at: n.created_at }));
      },

      // Edge Function asi-ai 흉내: 진짜 AI 대신 정해진 규칙으로 묶고 제안한다(체험·시험용)
      'asi-ai'(body) {
        const r = teacherRoom(body.token);
        const own = v => typeof v === 'string' ? v.replace(/\[(E\d{3})\][^\n]*\n출처:[^\n]*/g, '').trim() : '';
        const at = (data, k) => { if (!data) return ''; const m = /^(\d-\d)\|(.+)$/.exec(k); return own(m ? ((data.records || {})[m[1]] || {})[m[2]] : (data.answers || {})[k]); };
        const model = '가짜 AI(체험·시험용)';
        if (body.action === 'summarize') {
          const rows = F.asi_teacher_answers({ p_tok: body.token, p_path: body.path }).filter(x => own(x.value));
          const num = rows.filter(x => /\d/.test(own(x.value))), word = rows.filter(x => !/\d/.test(own(x.value)));
          const groups = [
            num.length && { title: '수치를 들어 설명', summary: '연도나 값을 적어 변화를 설명한 답입니다.', members: num.map(x => x.student_id), example: num[0].student_id },
            word.length && { title: '수치 없이 설명', summary: '변화의 방향이나 까닭을 말로 설명한 답입니다.', members: word.map(x => x.student_id), example: word[0].student_id }
          ].filter(Boolean);
          const result = { groups, unclear: [], teacher_check: rows.length ? '두 묶음이 같은 자료를 보고 있는지 물어보세요.' : '' };
          db.notes.push({ id: ++seq.note, room_id: r.id, scope: 'answers:' + (body.path || []).join('/'), result: clone(result), n_answers: rows.length, model, created_at: iso() });
          return { result, n_answers: rows.length, model };
        }
        if (body.action === 'suggest') {
          const el = body.element || {};
          if (!/^[NP][1-8]$/.test(String(el.id))) fail('bad_element');
          const out = [];
          for (const st of db.students.filter(s => s.room_id === r.id)) {
            const rc = recordOf(st), text = (el.keys || []).map(k => at(rc && rc.data, k)).filter(Boolean).join(' ');
            if (!text) continue;
            const level = /\d/.test(text) && text.length > 30 ? 'B' : text.length > 12 ? 'C' : 'D';
            out.push({ student_id: st.id, level, evidence: '「' + text.slice(0, 30) + '」 체험용 가짜 제안' });
            let sc = db.scores.find(x => x.student_id === st.id && x.element === el.id);
            if (!sc) { sc = { id: ++seq.score, room_id: r.id, student_id: st.id, element: el.id, level: null, note: '', decided_at: null }; db.scores.push(sc); }
            Object.assign(sc, { ai_level: level, ai_evidence: out[out.length - 1].evidence, ai_model: model, ai_at: iso(), updated_at: iso() });
          }
          db.notes.push({ id: ++seq.note, room_id: r.id, scope: 'score:' + el.id, result: { suggestions: clone(out) }, n_answers: out.length, model, created_at: iso() });
          return { suggestions: out, n_answers: out.length, model };
        }
        fail('bad_action');
      },

      asi_teacher_update_room({ p_tok, p_title, p_school, p_closed, p_records_locked, p_new_pass }) {
        const r = teacherRoom(p_tok);
        if (p_title != null && !String(p_title).trim()) fail('bad_title');
        if (p_new_pass != null && String(p_new_pass).length < 6) fail('short_pass');
        if (p_title != null) r.title = String(p_title).trim().slice(0, 60);
        if (p_school != null) r.school = String(p_school).trim().slice(0, 40);
        if (p_closed != null) r.closed = !!p_closed;
        if (p_records_locked != null) r.records_locked = !!p_records_locked;
        if (p_new_pass != null) { r.pass = String(p_new_pass); db.sessions = db.sessions.filter(s => s.room_id !== r.id || s.token === p_tok); }
        return roomJson(r);
      }
    };

    // fn 이름과 인자(JSON)를 받아 응답 본문을 돌려준다. 오류는 PostgREST 처럼 {status:400, body:{message}} 로.
    function handle(fn, args) {
      calls.push({ fn, args: clone(args), at: clock() });
      if (!F[fn]) return { status: 404, body: { code: 'PGRST202', message: 'Could not find the function public.' + fn } };
      try { return { status: 200, body: F[fn](args || {}) }; }
      catch (e) {
        if (fn === 'asi-ai') return { status: e.code === 'no_session' || e.code === 'expired' ? 401 : 400, body: { error: e.code || String(e.message) } };   // Edge Function 은 {error} 로 답함
        return { status: 400, body: { code: 'P0001', message: e.code || String(e.message) } };
      }
    }
    // 브라우저 체험용: ASI.setTransport 에 그대로 넣는다
    async function transport(fn, args) {
      const r = handle(fn, clone(args));
      if (r.status !== 200) throw new Error(r.body.message || r.body.error);
      if (r.body && typeof r.body === 'object' && !Array.isArray(r.body) && typeof r.body.error === 'string') throw new Error(r.body.error);
      return clone(r.body);
    }
    return { handle, transport, db, calls, functions: Object.keys(F) };
  }

  return { createServer, cleanLive };
});
