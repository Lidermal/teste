/* ══════════ FAMR • AUTENTICAÇÃO v-final4 (remove .catch() de rpc | delegação contas novas | watchdog | recovery) ══════════ */

const escA = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const SCREENS = ['screen-login','screen-register','screen-forgot','screen-reset','screen-maintenance'];
const INACTIVITY_MS = 60*60*1000, BROWSER_WINDOW_MS = 5*60*1000, BROWSER_BLOCK_MS = 5*60*1000;
const MAX_REQ_WINDOW = 4, MAX_WRONG_PASS = 4;
let watchTimer = null, lastTouch = 0, cdTimer = null;
const dayStr = () => new Date().toISOString().slice(0,10);

/* ── DETECÇÃO IMEDIATA DE RECUPERAÇÃO ── */
const _urlHash = location.hash || '';
const _urlSearch = location.search || '';
const _hasRecoveryToken = /type=recovery|recovery_token=|access_token=[^&]+.*type=recovery/i.test(_urlHash + _urlSearch);
window._famrRecovery = _hasRecoveryToken;

if(window._famrRecovery){
  document.addEventListener('DOMContentLoaded', () => {
    SCREENS.forEach(s => document.getElementById(s)?.classList.add('hidden'));
    document.getElementById('shell')?.classList.add('hidden');
    document.getElementById('screen-reset')?.classList.remove('hidden');
    cleanRecoveryHash();
  }, { once: true });
}

function cleanRecoveryHash(){
  if(/access_token|type=recovery|recovery_token/.test(location.hash)){
    history.replaceState(null, '', location.pathname + location.search);
  }
}

function showScreen(id){
  if(window._famrRecovery && id !== 'screen-reset' && id !== 'screen-login') return;
  SCREENS.forEach(s => document.getElementById(s)?.classList.add('hidden'));
  document.getElementById('shell')?.classList.add('hidden');
  if(id === 'shell') document.getElementById('shell')?.classList.remove('hidden');
  else document.getElementById(id)?.classList.remove('hidden');
}

/* ── ALERTA COM UM ÚNICO ÍCONE (não passe <i> na mensagem) ── */
function showAlert(boxId, kind, html){
  const box = document.getElementById(boxId);
  if(!box) return;
  const icons = { ok:'fa-circle-check', err:'fa-circle-exclamation', warn:'fa-triangle-exclamation', info:'fa-circle-info' };
  box.className = `alert-box alert-${kind} mt-4`;
  box.innerHTML = `<i class="fas ${icons[kind]||icons.info}"></i><div>${html}</div>`;
  box.classList.remove('hidden');
}
function hideAlert(boxId){
  const box = document.getElementById(boxId);
  if(box){ box.classList.add('hidden'); box.innerHTML=''; }
}
function loginAlert(msg, type='err'){ showAlert('login-alert', type, msg); }
const loginAlertHide = () => hideAlert('login-alert');

function authToast(msg, type='err'){
  console[type==='err'?'error':'warn']('[FAMR]', msg);
  if(typeof toast === 'function'){ toast(msg, type); return; }
  showAlert('login-alert', type, escA(msg));
}

const setLoginDisabled = d => {
  const b = document.querySelector('#form-login button[type=submit]');
  if(b) b.disabled = d;
};

function sbOk(){ try{ return typeof supabase !== 'undefined' && !!supabase && typeof supabase.from === 'function'; }catch(e){ return false; } }
const MSG_SERVIDOR = 'Falha interna ao conectar com o servidor. Tente novamente em instantes.';

/* ★ v-final4: helper seguro p/ RPCs OPCIONAIS. O builder do supabase.rpc() NÃO tem .catch()
   em várias versões → usar try/catch em volta do await. Nunca mais "is not a function". */
async function tryRpc(name, params){
  try{ return await supabase.rpc(name, params); }
  catch(e){ console.warn('[FAMR] rpc opcional "'+name+'" falhou:', e && e.message); return { data:null, error:e }; }
}

function startCountdown(until){
  clearInterval(cdTimer);
  const tick = () => {
    const ms = until - Date.now();
    if(ms <= 0){ clearInterval(cdTimer); loginAlertHide(); setLoginDisabled(false); return; }
    const m = Math.floor(ms/60000), s = Math.floor(ms%60000/1000);
    loginAlert('Muitas tentativas. Aguarde <b>'+m+'m '+s+'s</b>.', 'warn');
    setLoginDisabled(true);
  };
  tick(); cdTimer = setInterval(tick, 1000);
}

const showLockedMsg = () => loginAlert(
  'Conta <b>BLOQUEADA</b> após '+MAX_WRONG_PASS+' senhas incorretas.<br>Use <b>"Esqueci a senha"</b> para redefinir.', 'err');

function startWatchdog(){
  stopWatchdog();
  localStorage.setItem('famr_day', dayStr());
  localStorage.setItem('famr_last_act', String(Date.now()));
  const touch = () => { const n = Date.now(); if(n - lastTouch > 5000){ lastTouch = n; localStorage.setItem('famr_last_act', String(n)); } };
  ['click','keydown','mousemove','scroll','touchstart'].forEach(ev => window.addEventListener(ev, touch, { passive:true }));
  watchTimer = setInterval(async () => {
    if(localStorage.getItem('famr_day') !== dayStr()) return endSession('Novo dia iniciado — sessão encerrada.');
    const last = +localStorage.getItem('famr_last_act') || Date.now();
    if(Date.now() - last > INACTIVITY_MS) return endSession('Sessão expirada por inatividade (1h).');
  }, 20000);
}
function stopWatchdog(){ if(watchTimer){ clearInterval(watchTimer); watchTimer = null; } }

async function endSession(msg){
  stopWatchdog();
  await famrLog('LOGOUT', { nick: STATE.profile?.nickname || 'usuário', motivo: 'expiração' });
  try{ await supabase.auth.signOut(); }catch(e){}
  localStorage.removeItem('famr_day');
  showScreen('screen-login');
  loginAlert(escA(msg), 'warn');
}

/* ── LISTENERS ── */
document.addEventListener('DOMContentLoaded', () => {
  try{
    const on = (id, ev, fn) => document.getElementById(id)?.addEventListener(ev, fn);
    on('form-login','submit', e => { e.preventDefault(); doLogin(e); });
    on('form-register','submit', e => { e.preventDefault(); doRegister(e); });
    on('form-forgot','submit', e => { e.preventDefault(); doForgot(e); });
    on('link-forgot','click', e => { e.preventDefault(); loginAlertHide(); showScreen('screen-forgot'); });
    on('link-register','click', e => { e.preventDefault(); loginAlertHide(); showScreen('screen-register'); });
    on('link-back-login','click', e => { e.preventDefault(); loginAlertHide(); showScreen('screen-login'); });
    on('link-back-login2','click', e => { e.preventDefault(); loginAlertHide(); showScreen('screen-login'); });
    on('btn-reset-save','click', e => { e.preventDefault(); doResetSave(); });
    on('btn-maint-login','click', () => showScreen('screen-login'));
    on('btn-logout','click', doLogout);

    supabase.auth.onAuthStateChange((event, session) => {
      if(event === 'PASSWORD_RECOVERY'){
        window._famrRecovery = true;
        showScreen('screen-reset');
        cleanRecoveryHash();
      }
      if(event === 'SIGNED_OUT' && !window._famrRecovery){
        STATE.profile = null; STATE.groups = []; stopWatchdog();
        const shell = document.getElementById('shell');
        if(shell && !shell.classList.contains('hidden')){
          showScreen('screen-login'); loginAlert('Sessão encerrada.', 'warn');
        }
      }
    });
  }catch(err){
    console.error('[FAMR] listeners:', err);
    if(!window._famrRecovery) showScreen('screen-login');
  }

  if(!window._famrRecovery){
    initSession().catch(err => {
      console.error('[FAMR] boot:', err);
      showScreen('screen-login');
      loginAlert('Erro ao iniciar sistema.', 'err');
    });
  }
});

async function initSession(){
  if(!sbOk()){ showScreen('screen-login'); loginAlert(MSG_SERVIDOR, 'err'); return; }
  const { data: sets } = await supabase.from('settings').select('*').in('key', ['maintenance','announcement']);
  (sets||[]).forEach(s => STATE.settings[s.key] = s.value);

  const { data:{ session } } = await supabase.auth.getSession();
  if(session){
    const day = localStorage.getItem('famr_day');
    const last = +localStorage.getItem('famr_last_act') || 0;
    if(day && day !== dayStr()){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Novo dia. Faça login novamente.', 'warn'); return; }
    if(last && Date.now() - last > INACTIVITY_MS){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Sessão expirada (1h).', 'warn'); return; }
    await enterSystem(session.user.id);
  } else {
    showScreen(STATE.settings.maintenance?.enabled ? 'screen-maintenance' : 'screen-login');
  }
}

/* ══════════ LOGIN v-final4 (delegação + sem .catch() em rpc) ══════════ */
async function doLogin(e){
  loginAlertHide();
  if(!sbOk()){ loginAlert(MSG_SERVIDOR, 'err'); return false; }

  const nick = (document.getElementById('login-nick')?.value || '').trim();
  const pass = document.getElementById('login-pass')?.value || '';
  if(!nick || !pass) return false;

  /* anti-brute-force local */
  const nk = nick.toLowerCase(), blkKey = 'famr_blk_'+nk, attKey = 'famr_att_'+nk;
  const until = +localStorage.getItem(blkKey) || 0;
  if(Date.now() < until){ startCountdown(until); return false; }
  const now = Date.now();
  if(now - (+localStorage.getItem('famr_last_submit') || 0) < 3000) return false;
  localStorage.setItem('famr_last_submit', String(now));
  const arr = (JSON.parse(localStorage.getItem(attKey) || '[]')).filter(t => now - t < BROWSER_WINDOW_MS);
  arr.push(now); localStorage.setItem(attKey, JSON.stringify(arr));
  if(arr.length > MAX_REQ_WINDOW){ const u = now + BROWSER_BLOCK_MS; localStorage.setItem(blkKey, String(u)); startCountdown(u); return false; }

  const btn = e.target.querySelector('button[type="submit"]') || e.target.querySelector('button');
  const textSpan = btn?.querySelector('#btn-login-text');
  if(btn){
    btn.disabled = true; btn.classList.add('btn-auth-loading');
    if(textSpan){ textSpan.textContent = 'AUTENTICANDO...'; }
    else { btn.innerHTML = '<span class="spin-sm"></span> AUTENTICANDO...'; }
  }

  try{
    const { data: v, error } = await supabase.rpc('famr_login_verify', { p_nick: nick, p_pass: pass });
    if(error){ console.error('[FAMR] login_verify:', error); throw new Error('Falha na verificação de segurança.'); }
    const row = Array.isArray(v) ? v[0] : v;
    if(!row){ throw new Error('Nickname não encontrado ou conta banida.'); }
    if(row.locked){ throw new Error('CONTA_BLOQUEADA'); }

    let sessionUser = null;

    if(row.delegated){
      /* CONTA NOVA: validação REAL pelo Supabase Auth (GoTrue). Erro de credencial = falha de senha. */
      const { data, error: le } = await supabase.auth.signInWithPassword({ email: row.email, password: pass });
      if(le){
        console.error('[FAMR] signIn (delegado):', le);
        const credErr = /invalid login credentials|invalid credential|wrong password|senha/i.test(le.message||'');
        if(credErr){
          await tryRpc('famr_bump_failed', { p_email: row.email });   // ★ sem .catch()
          let f = (row.fails || 0) + 1;
          try{
            const { data: lk } = await supabase.rpc('famr_login_lookup', { p_nick: nick });
            if(lk && lk[0] && lk[0].failed_logins != null) f = lk[0].failed_logins;
          }catch(_){}
          if(f >= MAX_WRONG_PASS) throw new Error('CONTA_BLOQUEADA');
          throw new Error(`Senha incorreta (${f}/${MAX_WRONG_PASS}).`);
        }
        /* não é senha (ex.: e-mail não confirmado / rate limit): não pune, mostra o motivo real */
        throw new Error(le.message || 'Falha ao abrir sessão.');
      }
      sessionUser = data.user;
      await tryRpc('famr_reset_failed', { p_email: row.email });        // ★ sem .catch()  ← este era o vilão do login da conta nova
    } else {
      /* CONTA LEGADA: o verify já validou bcrypt no banco e contou a falha. */
      if(row.ok !== true){ throw new Error(`Senha incorreta (${row.fails||0}/${MAX_WRONG_PASS}).`); }
      const { data, error: le } = await supabase.auth.signInWithPassword({ email: row.email, password: pass });
      if(le){
        console.error('[FAMR] signIn (legado) anomalia:', le);
        throw new Error('Falha ao abrir sessão. Contate a chefia.');
      }
      sessionUser = data.user;
    }

    /* sucesso: limpa contadores locais */
    localStorage.removeItem(attKey); localStorage.removeItem(blkKey);

    const { data: prof } = await supabase.from('profiles_view').select('nickname,status,login_locked').eq('id', sessionUser.id).single();
    if(!prof){ await supabase.auth.signOut(); throw new Error('Perfil não encontrado.'); }
    if(prof.status !== 'active'){
      await supabase.auth.signOut();
      throw new Error(prof.status==='banned' ? 'Conta BANIDA.' : 'Conta não ativada pelo Alto Comando.');
    }
    if(prof.login_locked){ await supabase.auth.signOut(); throw new Error('CONTA_BLOQUEADA'); }

    showAlert('login-alert', 'ok', `<b>${escA(prof.nickname)}</b> logado com sucesso! Entrando no quartel...`);
    await famrLog('LOGIN', { nick: prof.nickname });
    await enterSystem(sessionUser.id);

  } catch(err){
    console.error('[FAMR] login:', err);
    const msg = err.message || 'Erro desconhecido.';
    if(msg.includes('CONTA_BLOQUEADA')) showLockedMsg();
    else loginAlert(escA(msg), 'err');
  } finally {
    if(btn){
      btn.disabled = false; btn.classList.remove('btn-auth-loading');
      if(textSpan){ textSpan.textContent = 'ACESSAR O QUARTEL'; }
      else { btn.innerHTML = '<i class="fas fa-right-to-bracket"></i> ACESSAR O QUARTEL'; }
    }
  }
  return false;
}

async function enterSystem(userId){
  if(window._famrRecovery){ showScreen('screen-reset'); return; }
  const { data: profile, error } = await supabase.from('profiles_view').select('*').eq('id', userId).single();
  if(error || !profile){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Perfil não encontrado.', 'err'); return; }
  if(profile.status === 'banned'){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Conta BANIDA.', 'err'); return; }
  if(profile.status === 'pending'){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Conta não ativada. Aguarde a aprovação da chefia.', 'warn'); return; }
  if(profile.login_locked){ await supabase.auth.signOut(); showScreen('screen-login'); showLockedMsg(); return; }

  STATE.profile = profile;
  const { data: ug } = await supabase.from('user_groups').select('group_id, groups(*)').eq('user_id', userId);
  STATE.groups = (ug||[]).map(r => r.groups).filter(Boolean).sort((a,b) => (a.order_index||0)-(b.order_index||0));

  if(STATE.settings.maintenance?.enabled && !isAdmin()){
    document.getElementById('maintenance-msg').textContent = STATE.settings.maintenance.message || '';
    showScreen('screen-maintenance'); return;
  }
  startWatchdog(); showScreen('shell');
  try{ await buildSidebar(); }catch(err){ console.error(err); }
  if(!location.hash || location.hash === '#') location.hash = '#/home';
  try{ await route(); }catch(err){ console.error(err); }
}

/* ══════════ ALISTAMENTO ══════════ */
async function doRegister(e){
  if(e) e.preventDefault();
  if(!sbOk()){ authToast(MSG_SERVIDOR, 'err'); return false; }

  const nick  = (document.getElementById('reg-nick')?.value || '').trim();
  const email = (document.getElementById('reg-email')?.value || '').trim().toLowerCase();
  const pass  = document.getElementById('reg-pass')?.value || '';
  const pass2El = document.getElementById('reg-pass2');
  const pass2 = pass2El ? pass2El.value : pass;

  if(!nick || !email || !pass){ authToast('Preencha todos os campos.', 'warn'); return false; }
  if(pass !== pass2){ authToast('As senhas não conferem.', 'warn'); return false; }
  if(pass.length < 6){ authToast('A senha deve ter no mínimo 6 caracteres.', 'warn'); return false; }

  const form = document.getElementById('form-register');
  const btn = form ? form.querySelector('button[type="submit"]') : null;
  if(btn){ btn.disabled = true; btn.classList.add('btn-auth-loading'); btn.innerHTML = '<span class="spin-sm"></span> CRIANDO CONTA...'; }

  try{
    const { data: chk, error: chkErr } = await supabase.rpc('famr_check_alistamento', { p_email: email, p_nick: nick });
    if(chkErr){ console.warn('[FAMR] check_alistamento:', chkErr.message); }
    else if(chk){
      if(chk.email_exists){ authToast('Este e-mail já está cadastrado. Faça login ou use "Esqueci a senha".', 'warn'); return false; }
      if(chk.nick_exists){ authToast('Este nickname já está em uso. Escolha outro.', 'warn'); return false; }
    }

    const { data, error } = await supabase.auth.signUp({ email, password: pass, options:{ data:{ nickname: nick } } });
    if(error){
      console.error('[FAMR] signUp:', error);
      if(/already registered|already exists|duplicate/i.test(error.message)){
        authToast('Este e-mail já está cadastrado. Faça login ou use "Esqueci a senha".', 'warn');
      } else {
        authToast('Erro no alistamento: '+error.message, 'err');
      }
      return false;
    }
    if(!data || !data.user){ authToast('Não foi possível criar a conta.', 'err'); return false; }
    if((data.user.identities || []).length === 0){
      authToast('Este e-mail já possui conta. Faça login.', 'warn'); return false;
    }

    const { error: rpcErr } = await supabase.rpc('famr_finalize_alistamento', {
      p_user_id: data.user.id, p_email: email, p_nickname: nick
    });
    if(rpcErr){
      console.error('[FAMR] finalize_alistamento:', rpcErr);
      authToast('Conta criada, mas o perfil não foi registrado: '+rpcErr.message, 'err');
      return false;
    }

    if(data.session){ await supabase.auth.signOut(); }

    form?.classList.add('hidden');
    document.getElementById('register-success')?.classList.remove('hidden');
    if(typeof toast === 'function') toast('Alistamento enviado! Aguarde a aprovação da chefia.', 'ok');
    tryRpc('log_action', { action:'REGISTRO', details:{ nick } });        // ★ sem .catch()
  } catch(err){
    console.error('[FAMR] registro:', err);
    authToast('Erro inesperado no alistamento: '+err.message, 'err');
  } finally {
    if(btn){ btn.disabled = false; btn.classList.remove('btn-auth-loading'); btn.innerHTML = '<i class="fas fa-user-plus"></i> ALISTAR-SE'; }
  }
  return false;
}

/* ══════════ ESQUECI A SENHA ══════════ */
async function doForgot(e){
  if(e) e.preventDefault();
  if(!sbOk()){ authToast(MSG_SERVIDOR, 'err'); return false; }
  const nick = (document.getElementById('forgot-nick')?.value || '').trim();
  if(!nick){ authToast('Informe o nickname.', 'warn'); return false; }
  const btn = e.target.querySelector('button[type="submit"]');
  if(btn) btn.disabled = true;
  try{
    const { data: lk, error } = await supabase.rpc('famr_login_lookup', { p_nick: nick });
    const row = Array.isArray(lk) ? lk[0] : lk;
    if(error || !row || !row.email){ authToast('Nickname não encontrado.', 'err'); return false; }
    const { error: rErr } = await supabase.auth.resetPasswordForEmail(row.email, { redirectTo: location.origin + location.pathname });
    if(rErr){ authToast('Erro ao enviar link: '+rErr.message, 'err'); return false; }
    document.getElementById('form-forgot')?.classList.add('hidden');
    document.getElementById('forgot-ok')?.classList.remove('hidden');
    await famrLog('SENHA_LINK_ENVIADO', { nick });
  } catch(err){ authToast('Erro inesperado.', 'err'); }
  finally { if(btn) btn.disabled = false; }
  return false;
}

async function doResetSave(){
  const p1 = document.getElementById('reset-pass')?.value || '';
  const p2 = document.getElementById('reset-pass2')?.value || '';
  if(p1.length < 6){ authToast('Senha mínima: 6 caracteres.', 'warn'); return; }
  if(p1 !== p2){ authToast('As senhas não conferem.', 'err'); return; }
  const btn = document.getElementById('btn-reset-save');
  if(btn) btn.disabled = true;
  try{
    const { error } = await supabase.auth.updateUser({ password: p1 });
    if(error){ authToast('Erro ao salvar senha: '+error.message, 'err'); return; }
    try{ await supabase.rpc('famr_set_credentials', { new_pass: p1 }); }catch(e){}
    await famrLog('SENHA_REDEFINIDA', {});
    window._famrRecovery = false;
    cleanRecoveryHash();
    await supabase.auth.signOut();
    showScreen('screen-login');
    loginAlert('Senha redefinida. Faça login novamente.', 'ok');
  } finally { if(btn) btn.disabled = false; }
}

/* ══════════ LOGOUT ══════════ */
async function doLogout(){
  const nick = STATE.profile?.nickname || 'usuário';
  await famrLog('LOGOUT', { nick });
  stopWatchdog();
  window._famrRecovery = false;
  await supabase.auth.signOut();
  location.hash = '';
  location.reload();
}

/* ══════════ FAMRLOG (já usava try/catch, mantido) ══════════ */
async function famrLog(action, details={}){
  const enriched = { ...details };
  if(!enriched.nick && STATE.profile) enriched.nick = STATE.profile.nickname;
  try{
    const fnUrl = CONFIG.supabaseUrl + '/functions/v1/log-action';
    const { data:{ session } } = await supabase.auth.getSession();
    const headers = { 'Content-Type':'application/json', 'apikey': CONFIG.supabaseAnonKey };
    if(session?.access_token) headers['Authorization'] = 'Bearer ' + session.access_token;
    const res = await fetch(fnUrl, { method:'POST', headers, body: JSON.stringify({ action, details: enriched, nick: enriched.nick }) });
    if(res.ok) return;
    throw new Error('HTTP '+res.status);
  }catch(e){
    console.warn('[FAMR] log-action falhou, tentando rpc:', e.message);
    try{ await supabase.rpc('log_action', { action, details: enriched }); }catch(_){}
  }
}
