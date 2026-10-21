/* ══════════ FAMR • AUTENTICAÇÃO v31 (Spinner Login | Alerta Personalizado | Logs c/ IP) ══════════ */

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

/* ── ALERTA PERSONALIZADO (Substitui o antigo loginAlert) ── */
function showAlert(boxId, kind, html){
  const box = document.getElementById(boxId);
  if(!box) return;
  const icons = { ok:'fa-circle-check', err:'fa-circle-exclamation', warn:'fa-triangle-exclamation', info:'fa-circle-info' };
  box.className = `alert-box alert-${kind} mt-4`; /* Usa classes do CSS v31 */
  box.innerHTML = `<i class="fas ${icons[kind]||icons.info}"></i><div>${html}</div>`;
  box.classList.remove('hidden');
}
function hideAlert(boxId){ 
  const box=document.getElementById(boxId); 
  if(box){ box.classList.add('hidden'); box.innerHTML=''; } 
}

/* Mantém compatibilidade se algo chamar loginAlert */
function loginAlert(msg, type='err'){ showAlert('login-alert', type, msg); }
const loginAlertHide = () => hideAlert('login-alert');

const setLoginDisabled = d => { 
  const b = document.querySelector('#form-login button[type=submit]'); 
  if(b) b.disabled = d; 
};

function sbOk(){ try{ return typeof supabase !== 'undefined' && !!supabase && typeof supabase.from === 'function'; }catch(e){ return false; } }
const MSG_SERVIDOR = '<i class="fas fa-triangle-exclamation mr-1"></i> Falha interna ao conectar com o servidor.<br><span class="text-xs font-normal">Tente novamente em instantes.</span>';

function startCountdown(until){
  clearInterval(cdTimer);
  const tick = () => {
    const ms = until - Date.now();
    if(ms <= 0){ clearInterval(cdTimer); loginAlertHide(); setLoginDisabled(false); return; }
    const m = Math.floor(ms/60000), s = Math.floor(ms%60000/1000);
    loginAlert('<i class="fas fa-hourglass-half mr-1"></i> Muitas tentativas. Aguarde <b>'+m+'m '+s+'s</b>.', 'warn');
    setLoginDisabled(true);
  };
  tick(); cdTimer = setInterval(tick, 1000);
}

const showLockedMsg = () => loginAlert(
  '<i class="fas fa-lock mr-1"></i> Conta <b>BLOQUEADA</b> após '+MAX_WRONG_PASS+' senhas incorretas.<br>Use <b>"Esqueci a senha"</b> para redefinir.', 'err');

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
  loginAlert('<i class="fas fa-clock mr-1"></i> ' + msg, 'warn');
}

document.addEventListener('DOMContentLoaded', () => {
  try{
    const on = (id, ev, fn) => document.getElementById(id)?.addEventListener(ev, fn);
    on('form-login','submit', e => { e.preventDefault(); doLogin(e); });
    on('form-register','submit', e => { e.preventDefault(); doRegister(e); });
    on('form-forgot','submit', e => { e.preventDefault(); doForgot(e); });
    on('link-forgot','click', e => { e.preventDefault(); loginAlertHide(); showScreen('screen-forgot'); });
    on('link-register','click', e => { e.preventDefault(); showScreen('screen-register'); });
    on('link-back-login','click', e => { e.preventDefault(); showScreen('screen-login'); });
    on('link-back-login2','click', e => { e.preventDefault(); showScreen('screen-login'); });
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
        if(!document.getElementById('shell').classList.contains('hidden')){
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

/* ══════════ NOVO LOGIN COM SPINNER E MENSAGEM PERSONALIZADA ══════════ */
async function doLogin(e){
  loginAlertHide();
  if(!sbOk()){ loginAlert(MSG_SERVIDOR, 'err'); return; }
  
  const nickInput = document.getElementById('login-nick');
  const passInput = document.getElementById('login-pass');
  const nick = nickInput.value.trim();
  const pass = passInput.value.trim();
  if(!nick || !pass) return;

  /* Validações de bloqueio local (anti-brute-force) */
  const nk = nick.toLowerCase(), blkKey = 'famr_blk_'+nk, attKey = 'famr_att_'+nk;
  const until = +localStorage.getItem(blkKey) || 0;
  if(Date.now() < until){ startCountdown(until); return; }
  const now = Date.now();
  if(now - (+localStorage.getItem('famr_last_submit') || 0) < 3000) return;
  localStorage.setItem('famr_last_submit', String(now));
  const arr = (JSON.parse(localStorage.getItem(attKey) || '[]')).filter(t => now - t < BROWSER_WINDOW_MS);
  arr.push(now); localStorage.setItem(attKey, JSON.stringify(arr));
  if(arr.length > MAX_REQ_WINDOW){ const u = now + BROWSER_BLOCK_MS; localStorage.setItem(blkKey, String(u)); startCountdown(u); return; }

  /* ESTADO DE CARREGAMENTO (SPINNER) */
  const btn = e.target.querySelector('button');
  const inner = btn.querySelector('#btn-login-inner') || btn; /* Adapta se tiver span interno ou não */
  
  btn.disabled = true;
  btn.classList.add('btn-auth-loading');
  /* Se houver span #btn-login-text, muda ele. Senão, troca o innerHTML todo */
  const textSpan = btn.querySelector('#btn-login-text');
  if(textSpan){
     textSpan.textContent = 'AUTENTICANDO...';
     /* Adiciona spinner visualmente antes do texto se possível, ou assume CSS */
     if(!btn.querySelector('.spin-sm')){
        const sp = document.createElement('span'); sp.className='spin-sm'; sp.style.marginRight='.5rem';
        btn.insertBefore(sp, btn.firstChild);
     }
  } else {
     btn.innerHTML = '<span class="spin-sm"></span> AUTENTICANDO...';
  }

  try{
    /* 1. Verifica credenciais no banco (RPC customizada da FAMR) */
    const { data: v, error } = await supabase.rpc('famr_login_verify', { nick, pass });
    if(error){ throw new Error('Falha na verificação de segurança.'); }
    if(!v){ throw new Error('Nickname não encontrado ou conta banida.'); }
    if(v.locked){ throw new Error('CONTA_BLOQUEADA'); }
    if(v.ok !== true){ throw new Error(`Senha incorreta (${v.fails}/${MAX_WRONG_PASS}).`); }

    /* 2. Abre sessão Supabase */
    const { data, error: le } = await supabase.auth.signInWithPassword({ email: v.email, password: pass });
    if(le){ throw new Error('Falha ao abrir sessão.'); }

    /* Limpa contadores de erro */
    localStorage.removeItem(attKey); localStorage.removeItem(blkKey);

    /* 3. Carrega perfil para saber o NOME real */
    const { data: prof } = await supabase.from('profiles_view').select('nickname,status,login_locked').eq('id', data.user.id).single();
    
    /* Tratamento extra de status pós-login */
    if(prof.status !== 'active'){
       await supabase.auth.signOut();
       throw new Error(prof.status==='banned' ? 'Conta BANIDA.' : 'Conta não ativada pelo Alto Comando.');
    }
    if(prof.login_locked){
       await supabase.auth.signOut();
       throw new Error('CONTA_BLOQUEADA');
    }

    const displayName = prof.nickname;

    /* 4. SUCESSO: Mostra alerta verde personalizado */
    showAlert('login-alert', 'ok', `<i class="fas fa-circle-check"></i> <b>${esc(displayName)}</b> logado com sucesso! Entrando no quartel...`);
    
    /* 5. Registra LOG com IP via Edge Function */
    await famrLog('LOGIN', { nick: displayName });

    /* 6. Entra no sistema */
    await enterSystem(data.user.id);

  } catch(err){
    console.error('[FAMR] login:', err);
    let msg = err.message;
    if(msg.includes('CONTA_BLOQUEADA')){
       showLockedMsg();
    } else {
       loginAlert(`<i class="fas fa-circle-exclamation"></i> ${esc(msg)}`, 'err');
    }
  } finally {
    /* Restaura botão */
    btn.disabled = false;
    btn.classList.remove('btn-auth-loading');
    const sp = btn.querySelector('.spin-sm'); if(sp) sp.remove();
    if(textSpan){
       textSpan.textContent = 'ACESSAR O QUARTEL';
    } else {
       btn.innerHTML = '<i class="fas fa-right-to-bracket"></i> ACESSAR O QUARTEL';
    }
  }
}

async function enterSystem(userId){
  if(window._famrRecovery){ showScreen('screen-reset'); return; }

  const { data: profile, error } = await supabase.from('profiles_view').select('*').eq('id', userId).single();
  if(error || !profile){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Perfil não encontrado.', 'err'); return; }
  if(profile.status === 'banned'){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Conta BANIDA.', 'err'); return; }
  if(profile.status === 'pending'){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Conta não ativada.', 'warn'); return; }
  if(profile.login_locked){ await supabase.auth.signOut(); showScreen('screen-login'); showLockedMsg(); return; }

  STATE.profile = profile;
  /* Carrega grupos otimizado */
  const { data: ug } = await supabase.from('user_groups').select('group_id, groups(*)').eq('user_id', userId);
  STATE.groups = (ug||[]).map(r => r.groups).filter(Boolean).sort((a,b) => (a.order_index||0)-(b.order_index||0));

  if(STATE.settings.maintenance?.enabled && !isAdmin()){
    document.getElementById('maintenance-msg').textContent = STATE.settings.maintenance.message || '';
    showScreen('screen-maintenance'); return;
  }

  startWatchdog();
  showScreen('shell');
  try{ await buildSidebar(); }catch(err){ console.error(err); }
  if(!location.hash || location.hash === '#') location.hash = '#/home';
  try{ await route(); }catch(err){ console.error(err); }
}

/* ... (mantenha doRegister, doForgot, doResetSave iguais aos originais) ... */

async function doRegister(e){
  if(!sbOk()){ toast('Falha de conexão.', 'err'); return; }
  const nick = document.getElementById('reg-nick').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const btn = e.target.querySelector('button'); btn.disabled = true;
  try{
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { nickname: nick } } });
    if(error){ toast('Erro: ' + error.message, 'err'); return; }
    if(data.session){
      const { error: rpcErr } = await supabase.rpc('famr_set_credentials', { new_pass: pass });
      if(rpcErr) console.error(rpcErr);
      await supabase.auth.signOut();
    }
    document.getElementById('form-register').classList.add('hidden');
    document.getElementById('register-success').classList.remove('hidden');
    await famrLog('REGISTRO', { nick });
  } catch(err){ toast('Erro inesperado.', 'err'); } 
  finally { btn.disabled = false; }
}

async function doForgot(e){
  if(!sbOk()){ toast('Falha de conexão.', 'err'); return; }
  const nick = document.getElementById('forgot-nick').value.trim();
  if(!nick) return;
  const btn = e.target.querySelector('button'); btn.disabled = true;
  try{
    const { data: email, error } = await supabase.rpc('resolve_login_email', { nick });
    if(error || !email){ toast('Nickname não encontrado.', 'err'); return; }
    const redirectURL = location.origin + location.pathname;
    const { error: rErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectURL });
    if(rErr){ toast('Erro ao enviar link: '+rErr.message, 'err'); return; }
    document.getElementById('form-forgot').classList.add('hidden');
    document.getElementById('forgot-ok').classList.remove('hidden');
    await famrLog('SENHA_LINK_ENVIADO', { nick });
  } catch(err){ toast('Erro inesperado.', 'err'); } 
  finally { btn.disabled = false; }
}

async function doResetSave(){
  const p1 = document.getElementById('reset-pass').value;
  const p2 = document.getElementById('reset-pass2').value;
  if(p1.length < 6){ toast('Senha mínima: 6 caracteres.', 'warn'); return; }
  if(p1 !== p2){ toast('As senhas não conferem.', 'err'); return; }
  const { error } = await supabase.auth.updateUser({ password: p1 });
  if(error){ toast('Erro ao salvar senha.', 'err'); return; }
  try{ await supabase.rpc('famr_set_credentials', { new_pass: p1 }); }catch(e){}
  await famrLog('SENHA_REDEFINIDA', {});
  window._famrRecovery = false;
  cleanRecoveryHash();
  await supabase.auth.signOut();
  showScreen('screen-login');
  loginAlert('<i class="fas fa-check-circle mr-1"></i> Senha redefinida. Faça login novamente.', 'ok');
}

/* ══════════ NOVO LOGOUT COM LOG ANTES DA SESSÃO MORRER ══════════ */
async function doLogout(){
  const nick = STATE.profile?.nickname || 'usuário';
  /* Chama log ANTES do signOut para garantir que o token ainda existe e o IP é capturado */
  await famrLog('LOGOUT', { nick });
  
  stopWatchdog();
  window._famrRecovery = false;
  await supabase.auth.signOut();
  location.hash = '';
  location.reload();
}

/* ══════════ HELPER FAMRLOG (Chama Edge Function) ══════════ */
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
