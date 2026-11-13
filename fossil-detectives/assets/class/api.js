/* AI와 과학을 IT다 · 수업 기록 서버 호출 (학생 앱·선생님 화면이 같이 씀)
   서버: Supabase A 프로젝트. 표는 막혀 있고 asi_* 함수로만 드나든다.
   설치 SQL 과 설계서: codex-work/ai-science-it-db/ (setup.sql, README.md) */
(function () {
  'use strict';

  const CFG = {
    url: 'https://vbvtnmnodeoocbbjauap.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZidnRubW5vZGVvb2NiYmphdWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTQ0OTYsImV4cCI6MjA5NTA3MDQ5Nn0.dvuRrt3qw2Tya_QwGbcXrmGPdfDgI4xmgyH8UjU73Nc'
  };

  // 서버 오류 이름 → 화면에 보일 말
  const MSG = {
    no_room: '이 입장 코드로 된 수업이 없어요. 코드를 다시 확인해 주세요.',
    bad_no: '학번을 숫자로 적어 주세요.',
    bad_name: '이름을 적어 주세요(20자 안).',
    name_mismatch: '이 학번은 다른 이름으로 이미 들어와 있어요. 이름을 확인하고, 그래도 안 되면 선생님께 말씀해 주세요.',
    closed: '선생님이 새 입장을 막아 두었어요. 선생님께 말씀해 주세요.',
    room_full: '이 수업에 들어올 수 있는 인원이 다 찼어요.',
    no_student: '수업 명단에서 내 이름을 찾지 못했어요. 다시 들어와 주세요.',
    records_locked: '선생님이 기록을 확정해서 더 저장되지 않아요.',
    too_long: '기록이 너무 커서 서버에 보내지 못했어요. 이 기기에는 저장돼 있어요.',
    bad_data: '저장할 내용이 올바르지 않아요.',
    bad_progress: '진행 요약이 올바르지 않아요.',
    no_session: '선생님 화면 열쇠가 없어요. 다시 로그인해 주세요.',
    expired: '로그인한 지 12시간이 지났어요. 다시 로그인해 주세요.',
    wrong_pass: '방 비밀번호가 맞지 않아요.',
    locked: '비밀번호를 여러 번 틀려서 10분 동안 잠겼어요. 잠시 뒤 다시 해 주세요.',
    short_pass: '방 비밀번호는 6자 이상으로 정해 주세요.',
    bad_title: '수업 이름을 적어 주세요. 예: 1학년 3반',
    bad_program: '프로그램 이름이 올바르지 않아요.',
    code_fail: '입장 코드를 만들지 못했어요. 한 번 더 눌러 주세요.',
    bad_patch: '바꿀 내용이 올바르지 않아요.',
    bad_kind: '보낼 수 없는 명령이에요.',
    bad_payload: '명령 내용이 너무 길어요.',
    bad_target: '명령을 받을 학생을 찾지 못했어요.',
    bad_path: '질문 자리가 올바르지 않아요.',
    bad_group: '모둠 번호는 1~99 사이로 적어 주세요.',
    bad_element: '채점 요소가 올바르지 않아요.',
    bad_level: '채점 단계가 올바르지 않아요.',
    not_installed: '서버 준비가 아직 안 됐어요. 설치 SQL 을 한 번 실행해야 해요.',
    ai_missing: 'AI 서버 함수(asi-ai)가 아직 배포되지 않았어요.',
    ai_no_key: 'AI 기능은 아직 준비 중이에요(AI 키 등록 전). 다른 기능은 그대로 쓸 수 있어요.',
    refusal: 'AI 가 이 요청을 처리하지 않았어요. 질문을 바꿔 다시 해 주세요.',
    rate_limited: 'AI 요청이 몰렸어요. 1분쯤 뒤에 다시 해 주세요.',
    ai_error: 'AI 서버에서 문제가 생겼어요. 잠시 뒤 다시 해 주세요.',
    bad_action: '보낼 수 없는 AI 요청이에요.',
    no_records: '채점할 학생 기록이 아직 없어요.',
    network: '인터넷 연결을 확인해 주세요.',
    timeout: '서버 응답이 늦어요. 잠시 뒤 다시 해 주세요.',
    server: '서버에서 문제가 생겼어요. 잠시 뒤 다시 해 주세요.'
  };

  class ASIError extends Error {
    constructor(code, detail) { super(MSG[code] || MSG.server); this.code = MSG[code] ? code : 'server'; this.detail = detail; }
  }

  // 체험(demo) 화면은 가짜 서버를 끼운다: transport(fn, args) → Promise<응답 본문>
  let transport = null;
  function setTransport(fn) { transport = typeof fn === 'function' ? fn : null; }

  async function rpc(fn, args, opts) {
    opts = opts || {};
    if (transport) {
      try { return await transport(fn, args || {}); }
      catch (e) { throw e instanceof ASIError ? e : new ASIError(String(e && e.message || 'server'), e && e.message); }
    }
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const limit = setTimeout(() => ctl && ctl.abort(), opts.timeout || 12000);
    let res;
    try {
      res = await fetch(`${CFG.url}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        signal: ctl ? ctl.signal : undefined,
        headers: { apikey: CFG.key, Authorization: 'Bearer ' + CFG.key, 'Content-Type': 'application/json' },
        body: JSON.stringify(args || {})
      });
    } catch (e) {
      throw new ASIError(e && e.name === 'AbortError' ? 'timeout' : 'network', e && e.message);
    } finally { clearTimeout(limit); }
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
    if (!res.ok) {
      const m = String((body && (body.message || body.hint)) || text || res.status).trim();
      if (res.status === 404 || (body && body.code === 'PGRST202')) throw new ASIError('not_installed', m);
      throw new ASIError(m, m);
    }
    // 선생님 로그인은 비밀번호 오류를 {"error": "..."} 로 돌려준다
    if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.error === 'string') throw new ASIError(body.error, body.error);
    return body;
  }

  // AI 답 묶기·채점 제안(Edge Function asi-ai). 체험 화면은 가짜 서버가 대신 답한다
  async function ai(body) {
    if (transport) {
      try { return await transport('asi-ai', body || {}); }
      catch (e) { throw e instanceof ASIError ? e : new ASIError(String(e && e.message || 'server'), e && e.message); }
    }
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const limit = setTimeout(() => ctl && ctl.abort(), 150000);
    let res;
    try {
      res = await fetch(`${CFG.url}/functions/v1/asi-ai`, {
        method: 'POST', signal: ctl ? ctl.signal : undefined,
        headers: { apikey: CFG.key, Authorization: 'Bearer ' + CFG.key, 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
      });
    } catch (e) { throw new ASIError(e && e.name === 'AbortError' ? 'timeout' : 'network', e && e.message); }
    finally { clearTimeout(limit); }
    const data = await res.json().catch(() => null);
    if (res.status === 404 && !(data && data.error)) throw new ASIError('ai_missing');
    if (!res.ok) throw new ASIError((data && data.error) || 'server', data && data.detail);
    return data;
  }

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 입장 코드 보정: 한글 자판 상태로 친 글자를 영문으로 되돌리고 전각·공백·하이픈을 정리한다
  const JAMO = {
    'ㄱ': 'R', 'ㄲ': 'R', 'ㄴ': 'S', 'ㄷ': 'E', 'ㄸ': 'E', 'ㄹ': 'F', 'ㅁ': 'A', 'ㅂ': 'Q', 'ㅃ': 'Q', 'ㅅ': 'T', 'ㅆ': 'T',
    'ㅇ': 'D', 'ㅈ': 'W', 'ㅉ': 'W', 'ㅊ': 'C', 'ㅋ': 'Z', 'ㅌ': 'X', 'ㅍ': 'V', 'ㅎ': 'G',
    'ㅏ': 'K', 'ㅐ': 'O', 'ㅑ': 'I', 'ㅒ': 'O', 'ㅓ': 'J', 'ㅔ': 'P', 'ㅕ': 'U', 'ㅖ': 'P', 'ㅗ': 'H', 'ㅘ': 'HK', 'ㅙ': 'HO',
    'ㅚ': 'HL', 'ㅛ': 'Y', 'ㅜ': 'N', 'ㅝ': 'NJ', 'ㅞ': 'NP', 'ㅟ': 'NL', 'ㅠ': 'B', 'ㅡ': 'M', 'ㅢ': 'ML', 'ㅣ': 'L',
    'ㄳ': 'RT', 'ㄵ': 'SW', 'ㄶ': 'SG', 'ㄺ': 'FR', 'ㄻ': 'FA', 'ㄼ': 'FQ', 'ㄽ': 'FT', 'ㄾ': 'FX', 'ㄿ': 'FV', 'ㅀ': 'FG', 'ㅄ': 'QT'
  };
  const LEAD = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const VOW = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const TAIL = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  function normCode(s) {
    let out = '';
    for (const ch of String(s || '')) {
      const c = ch.charCodeAt(0);
      if (c >= 0xAC00 && c <= 0xD7A3) {
        const n = c - 0xAC00;
        out += JAMO[LEAD[Math.floor(n / 588)]] + JAMO[VOW[Math.floor((n % 588) / 28)]] + (JAMO[TAIL[n % 28]] || '');
      } else if (JAMO[ch]) out += JAMO[ch];
      else if (c >= 0xFF01 && c <= 0xFF5E) out += String.fromCharCode(c - 0xFEE0);
      else out += ch;
    }
    return out.replace(/[\s\-_.·]/g, '').toUpperCase();
  }
  // 학번: 전각 숫자·공백·하이픈 정리
  const normNo = s => normCode(s).replace(/[^0-9A-Z]/g, '');

  window.ASI = { CFG, MSG, ASIError, rpc, ai, setTransport, esc, normCode, normNo };
})();
