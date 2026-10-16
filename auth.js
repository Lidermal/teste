/* ══════════ FAMR • AUTENTICAÇÃO v22 (Detecção imediata de Recovery) ══════════ */

const SCREENS = ['screen-login','screen-register','screen-forgot','screen-reset','screen-maintenance'];
const INACTIVITY_MS = 60*60*1000, BROWSER_WINDOW_MS = 5*60*1000, BROWSER_BLOCK_MS = 5*60*1000;
const MAX_REQ_WINDOW = 4, MAX_WRONG_PASS = 4;
let watchTimer = null, lastTouch = 0, cdTimer = null;
const dayStr = () => new Date().toISOString().slice(0,10);

/* ── DETECÇÃO IMEDIATA DE RECUPERAÇÃO (antes de qualquer outra lógica) ── */
/* Detecta tokens de recuperação na URL (access_token, type=recovery, recovery_token) */
const _urlHash = location.hash || '';
const _urlSearch = location.search || '';
const _hasRecoveryToken = /type=recovery|recovery_token=|access_token=[^&]+.*type=recovery/i.test(_urlHash + _urlSearch);

/* Flag global que controla o fluxo de recuperação */
window._famrRecovery = _hasRecoveryToken;

/* Mostra a tela de reset IMEDIATAMENTE se houver token de recovery */
if(window._famrRecovery){
  console.log('[FAMR] Token de recuperação detectado na URL. Mostrando tela de nova senha.');
  /* Precisamos esperar o DOM estar pronto para manipular as telas */
  document.addEventListener('DOMContentLoaded', () => {
    SCREENS.forEach(s => document.getElementById(s)?.classList.add('hidden'));
    document.getElementById('shell')?.classList.add('hidden');
    document.getElementById('screen-reset')?.classList.remove('hidden');
    cleanRecoveryHash();
  }, { once: true });
}

/* Remove tokens sensíveis da URL */
function cleanRecoveryHash(){
  if(/access_token|type=recovery|recovery_token/.test(location.hash)){
    history.replaceState(null, '', location.pathname + location.search);
  }
}

function showScreen(id){
  /* Se estiver em recuperação, NUNCA sai da tela de reset até o usuário salvar */
  if(window._famrRecovery && id !== 'screen-reset' && id !== 'screen-login'){
    console.log('[FAMR] Bloqueado redirecionamento para', id, '(recuperação ativa)');
    return;
  }
  SCREENS.forEach(s => document.getElementById(s)?.classList.add('hidden'));
  document.getElementById('shell')?.classList.add('hidden');
  if(id === 'shell') document.getElementById('shell')?.classList.remove('hidden');
  else document.getElementById(id)?.classList.remove('hidden');
}
function loginAlert(msg, type='err'){
  const box = document.getElementById('login-alert'); if(!box) return;
  const st = { err:'border-red-400 bg-red-50 text-red-700', warn:'border-gold-500 bg-gold-100 text-gold-600', ok:'border-famr-500 bg-famr-100 text-famr-700' };
  box.className = 'mt-4 rounded-lg border px-4 py-3 text-sm font-semibold ' + st[type];
  box.innerHTML = msg; box.classList.remove('hidden');
}
const loginAlertHide = () => document.getElementById('login-alert')?.classList.add('hidden');
const setLoginDisabled = d => { const b = document.querySelector('#form-login button[type=submit]'); if(b) b.disabled = d; };
function sbOk(){ try{ return typeof supabase !== 'undefined' && !!supabase && typeof supabase.from === 'function'; }catch(e){ return false; } }
const MSG_SERVIDOR = '<i class="fas fa-triangle-exclamation mr-1"></i> Falha interna ao conectar com o servidor.<br><span class="text-xs font-normal">Tente novamente em instantes. Se persistir, contate o Alto Comando da FAMR.</span>';

function startCountdown(until){
  clearInterval(cdTimer);
  const tick = () => {
    const ms = until - Date.now();
    if(ms <= 0){ clearInterval(cdTimer); loginAlertHide(); setLoginDisabled(false); return; }
    const m = Math.floor(ms/60000), s = Math.floor(ms%60000/1000);
    loginAlert('<i class="fas fa-hourglass-half mr-1"></i> Muitas tentativas neste navegador. Aguarde <b>'+m+'m '+s+'s</b>.', 'warn');
    setLoginDisabled(true);
  };
  tick(); cdTimer = setInterval(tick, 1000);
}
const showLockedMsg = () => loginAlert(
  '<i class="fas fa-lock mr-1"></i> Conta <b>BLOQUEADA</b> após '+MAX_WRONG_PASS+' senhas incorretas.<br>Use <b>"Esqueci a senha"</b> para redefinir e destravar, ou procure um administrador da FAMR.', 'err');

function startWatchdog(){
  stopWatchdog();
  localStorage.setItem('famr_day', dayStr());
  localStorage.setItem('famr_last_act', String(Date.now()));
  const touch = () => { const n = Date.now(); if(n - lastTouch > 5000){ lastTouch = n; localStorage.setItem('famr_last_act', String(n)); } };
  ['click','keydown','mousemove','scroll','touchstart'].forEach(ev => window.addEventListener(ev, touch, { passive:true }));
  watchTimer = setInterval(async () => {
    if(localStorage.getItem('famr_day') !== dayStr()) return endSession('Novo dia iniciado — sessão encerrada por segurança.');
    const last = +localStorage.getItem('famr_last_act') || Date.now();
    if(Date.now() - last > INACTIVITY_MS) return endSession('Sessão encerrada por inatividade (1 hora sem atividade).');
  }, 20000);
}
function stopWatchdog(){ if(watchTimer){ clearInterval(watchTimer); watchTimer = null; } }
async function endSession(msg){
  stopWatchdog();
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
        console.log('[FAMR] PASSWORD_RECOVERY capturado pelo onAuthStateChange');
        window._famrRecovery = true;
        showScreen('screen-reset');
        cleanRecoveryHash();
      }
      if(event === 'SIGNED_OUT' && !window._famrRecovery){
        STATE.profile = null; STATE.groups = []; stopWatchdog();
        if(!document.getElementById('shell').classList.contains('hidden')){
          showScreen('screen-login'); loginAlert('Sessão encerrada. Faça login novamente.', 'warn');
        }
      }
    });
  }catch(err){
    console.error('[FAMR] listeners:', err);
    if(!window._famrRecovery) showScreen('screen-login');
    loginAlert('Erro interno ao preparar a tela. Tente novamente (Ctrl+F5).', 'err');
  }
  
  /* Só roda initSession se NÃO estiver em fluxo de recuperação */
  if(!window._famrRecovery){
    initSession().catch(err => {
      console.error('[FAMR] boot:', err);
      showScreen('screen-login');
      loginAlert('Não foi possível iniciar o sistema. Tente novamente (Ctrl+F5). Se persistir, contate o Alto Comando.', 'err');
    });
  } else {
    console.log('[FAMR] Fluxo de recuperação ativo — pulando initSession normal');
  }
});

async function initSession(){
  if(!sbOk()){ console.error('[FAMR] cliente Supabase indisponível.'); showScreen('screen-login'); loginAlert(MSG_SERVIDOR, 'err'); return; }
  const { data: sets } = await supabase.from('settings').select('*').in('key', ['maintenance','announcement']);
  (sets||[]).forEach(s => STATE.settings[s.key] = s.value);

  const { data:{ session } } = await supabase.auth.getSession();
  if(session){
    const day = localStorage.getItem('famr_day');
    const last = +localStorage.getItem('famr_last_act') || 0;
    if(day && day !== dayStr()){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Novo dia iniciado — faça login novamente.', 'warn'); return; }
    if(last && Date.now() - last > INACTIVITY_MS){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Sessão expirada por inatividade (1h).', 'warn'); return; }
    await enterSystem(session.user.id);
  } else {
    showScreen(STATE.settings.maintenance?.enabled ? 'screen-maintenance' : 'screen-login');
  }
}

async function doLogin(e){
  loginAlertHide();
  if(!sbOk()){ loginAlert(MSG_SERVIDOR, 'err'); return; }
  const nick = document.getElementById('login-nick').value.trim();
  const pass = document.getElementById('login-pass').value.trim();
  if(!nick || !pass) return;

  const nk = nick.toLowerCase(), blkKey = 'famr_blk_'+nk, attKey = 'famr_att_'+nk;
  const until = +localStorage.getItem(blkKey) || 0;
  if(Date.now() < until){ startCountdown(until); return; }
  const now = Date.now();
  if(now - (+localStorage.getItem('famr_last_submit') || 0) < 3000) return;
  localStorage.setItem('famr_last_submit', String(now));
  const arr = (JSON.parse(localStorage.getItem(attKey) || '[]')).filter(t => now - t < BROWSER_WINDOW_MS);
  arr.push(now); localStorage.setItem(attKey, JSON.stringify(arr));
  if(arr.length > MAX_REQ_WINDOW){ const u = now + BROWSER_BLOCK_MS; localStorage.setItem(blkKey, String(u)); startCountdown(u); return; }

  const btn = e.target.querySelector('button'); btn.disabled = true;
  try{
    const { data: v, error } = await supabase.rpc('famr_login_verify', { nick, pass });
    if(error){ console.error('[FAMR] verify:', error); loginAlert(MSG_SERVIDOR, 'err'); return; }
    if(!v){ loginAlert('Nickname não encontrado ou conta banida.<br><span class="text-xs font-normal">Confirme o nickname ou procure o Alto Comando.</span>', 'err'); return; }
    if(v.locked){ showLockedMsg(); return; }
    if(v.ok !== true){ loginAlert('Senha incorreta (<b>'+(v.fails ?? '?')+'/'+MAX_WRONG_PASS+'</b>). Na 4ª tentativa a conta é bloqueada.', 'err'); return; }

    const { data, error: le } = await supabase.auth.signInWithPassword({ email: v.email, password: pass });
    if(le){
      console.error('[FAMR] signIn:', le);
      loginAlert('Falha ao abrir a sessão do quartel. Tente novamente; se persistir, contate o Alto Comando.', 'err');
      return;
    }
    localStorage.removeItem(attKey); localStorage.removeItem(blkKey);
    try{ await supabase.rpc('log_action', { action:'LOGIN', details:{ nick } }); }catch(e){}
    await enterSystem(data.user.id);
  } catch(err){
    console.error('[FAMR] login:', err);
    loginAlert('Erro inesperado no login. Tente novamente; se persistir, contate o Alto Comando.', 'err');
  } finally { btn.disabled = false; }
}

async function enterSystem(userId){
  if(window._famrRecovery){ showScreen('screen-reset'); return; }

  const { data: profile, error } = await supabase.from('profiles_view').select('*').eq('id', userId).single();
  if(error || !profile){ console.error('[FAMR] perfil:', error); await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Perfil não encontrado. Procure um administrador da FAMR.', 'err'); return; }
  if(profile.status === 'banned'){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Conta BANIDA do sistema.', 'err'); return; }
  if(profile.status === 'pending'){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Conta ainda não ativada. Procure um administrador.', 'warn'); return; }
  if(profile.login_locked){ await supabase.auth.signOut(); showScreen('screen-login'); showLockedMsg(); return; }

  STATE.profile = profile;
  const { data: ug } = await supabase.from('user_groups').select('group_id, groups(*)').eq('user_id', userId);
  STATE.groups = (ug||[]).map(r => r.groups).filter(Boolean).sort((a,b) => (b.power_level||0)-(a.power_level||0));

  if(STATE.settings.maintenance?.enabled && !isAdmin()){
    document.getElementById('maintenance-msg').textContent = STATE.settings.maintenance.message || document.getElementById('maintenance-msg').textContent;
    showScreen('screen-maintenance'); return;
  }

  document.getElementById('user-nick').textContent = profile.nickname;
  document.getElementById('user-avatar').textContent = profile.nickname.charAt(0).toUpperCase();
  const g0 = STATE.groups[0];
  document.getElementById('user-group').textContent = g0 ? g0.name : 'Sem grupo';
  if(g0) document.getElementById('user-avatar').style.background = g0.color || '#14563f';

  startWatchdog();
  showScreen('shell');
  try{ await buildSidebar(); }catch(err){ console.error('[FAMR] sidebar:', err); }
  if(!location.hash || location.hash === '#') location.hash = '#/home';
  try{ await route(); }catch(err){ console.error('[FAMR] route:', err); }
}

async function doRegister(e){
  if(!sbOk()){ toast('Falha de conexão com o servidor. Tente novamente.', 'err'); return; }
  const nick = document.getElementById('reg-nick').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const btn = e.target.querySelector('button'); btn.disabled = true;
  try{
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { nickname: nick } } });
    if(error){ toast('Erro no alistamento: ' + error.message, 'err'); return; }
    if(data.user && (data.user.identities || []).length === 0){ 
      toast('Este e-mail já está cadastrado. Use "Esqueci a senha".', 'warn'); 
      return; 
    }
    if(data.session){
      console.log('[FAMR] Sessão imediata detectada. Gravando hash...');
      const { error: rpcErr } = await supabase.rpc('famr_set_credentials', { new_pass: pass });
      if(rpcErr) console.error('[FAMR] Falha ao gravar hash imediato:', rpcErr);
      await supabase.auth.signOut();
    }
    document.getElementById('form-register').classList.add('hidden');
    document.getElementById('register-success').classList.remove('hidden');
    try{ await supabase.rpc('log_action', { action:'REGISTRO', details:{ nick } }); }catch(e){}
  } catch(err){ 
    console.error('[FAMR] registro:', err); 
    toast('Erro inesperado no alistamento. Tente novamente.', 'err'); 
  } finally { btn.disabled = false; }
}

async function doForgot(e){
  if(!sbOk()){ toast('Falha de conexão com o servidor. Tente novamente.', 'err'); return; }
  const nick = document.getElementById('forgot-nick').value.trim();
  if(!nick) return;
  const btn = e.target.querySelector('button'); btn.disabled = true;
  try{
    const { data: email, error } = await supabase.rpc('resolve_login_email', { nick });
    if(error){ console.error('[FAMR] resolve:', error); toast('Não foi possível processar agora. Tente novamente.', 'err'); return; }
    if(!email){ toast('Nickname não encontrado. Confirme com o Alto Comando.', 'err'); return; }
    
    const redirectURL = location.origin + location.pathname;
    console.log('[FAMR] Enviando link de recuperação para:', email, 'com redirectTo:', redirectURL);
    
    const { error: rErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectURL });
    
    if(rErr){ 
      console.error('[FAMR] reset:', rErr); 
      const msg = String(rErr.message || '');
      if(/sending recovery email|retryablefetch|smtp/i.test(msg)){
        toast('O servidor de e-mail do quartel está indisponível agora. Aguarde 1 minuto e tente de novo; se persistir, avise o Alto Comando.', 'warn');
      } else if(/rate limit|too many/i.test(msg)){
        toast('Muitas solicitações em sequência. Aguarde 1 minuto antes de pedir outro link.', 'warn');
      } else if(/redirect url not allowed/i.test(msg)){
        toast('URL de redirecionamento não permitida. Verifique a configuração no painel do Supabase.', 'err');
      } else {
        toast('Não foi possível enviar agora. Tente novamente.', 'err');
      }
      return; 
    }
    
    document.getElementById('form-forgot').classList.add('hidden');
    document.getElementById('forgot-ok').classList.remove('hidden');
    try{ await supabase.rpc('log_action', { action:'SENHA_LINK_ENVIADO', details:{ nick } }); }catch(e){}
  } catch(err){ 
    console.error('[FAMR] forgot:', err); 
    toast('Erro inesperado. Tente novamente.', 'err'); 
  } finally { btn.disabled = false; }
}

async function doResetSave(){
  const p1 = document.getElementById('reset-pass').value;
  const p2 = document.getElementById('reset-pass2').value;
  if(p1.length < 6){ toast('Senha mínima: 6 caracteres.', 'warn'); return; }
  if(p1 !== p2){ toast('As senhas não conferem.', 'err'); return; }
  
  const { error } = await supabase.auth.updateUser({ password: p1 });
  if(error){ 
    console.error('[FAMR] reset update:', error); 
    if(/token/i.test(error.message)){
      toast('O link expirou ou já foi usado. Solicite um novo link de redefinição.', 'err');
    } else {
      toast('Erro ao salvar a senha. Tente novamente.', 'err');
    }
    return; 
  }
  
  try{ 
    await supabase.rpc('famr_set_credentials', { new_pass: p1 }); 
    console.log('[FAMR] Hash gravado com sucesso após recuperação');
  }catch(e){
    console.error('[FAMR] Falha ao atualizar hash local:', e);
  }
  
  try{ await supabase.rpc('log_action', { action:'SENHA_REDEFINIDA', details:{} }); }catch(e){}
  
  /* Libera a flag de recuperação */
  window._famrRecovery = false;
  cleanRecoveryHash();
  
  await supabase.auth.signOut();
  showScreen('screen-login');
  loginAlert('<i class="fas fa-check-circle mr-1"></i> Senha redefinida e conta desbloqueada. Faça login novamente.', 'ok');
}

async function doLogout(){
  try{ await supabase.rpc('log_action', { action:'LOGOUT', details:{} }); }catch(e){}
  stopWatchdog();
  window._famrRecovery = false;
  await supabase.auth.signOut();
  location.hash = '';
  location.reload();
}
