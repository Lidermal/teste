/* ══════════ FAMR • AUTENTICAÇÃO v3 ══════════
   • Sessão expira por INATIVIDADE (1h) e na VIRADA DE DIA
   • Anti-spam: máx. 4 requisições de login / 5min por navegador → bloqueio 5min
   • 4 senhas erradas → conta BLOQUEADA (server-side) + log no painel admin
   • Sem credenciais no código: tudo via Supabase Auth + RLS */

const SCREENS = ['screen-login','screen-register','screen-reset','screen-maintenance'];
const INACTIVITY_MS = 60 * 60 * 1000;   // 1 hora
const BROWSER_WINDOW_MS = 5 * 60 * 1000; // janela de 5 min
const BROWSER_BLOCK_MS  = 5 * 60 * 1000; // bloqueio de 5 min
const MAX_REQ_WINDOW = 4;                // requisições permitidas na janela
const MAX_WRONG_PASS = 4;

let watchTimer = null, lastTouch = 0, cdTimer = null;
const dayStr = () => new Date().toISOString().slice(0,10);

function showScreen(id){
  SCREENS.forEach(s => document.getElementById(s).classList.add('hidden'));
  document.getElementById('shell').classList.add('hidden');
  if(id === 'shell') document.getElementById('shell').classList.remove('hidden');
  else document.getElementById(id).classList.remove('hidden');
}

/* ── Avisos na tela de login ── */
function loginAlert(msg, type='err'){
  const box = document.getElementById('login-alert');
  if(!box) return;
  const styles = {
    err:  'border-red-400 bg-red-50 text-red-700',
    warn: 'border-gold-500 bg-gold-100 text-gold-600',
    ok:   'border-famr-500 bg-famr-100 text-famr-700'
  };
  box.className = 'mb-4 rounded-lg border px-4 py-3 text-sm font-semibold ' + styles[type];
  box.innerHTML = msg;
  box.classList.remove('hidden');
}
const loginAlertHide = () => document.getElementById('login-alert')?.classList.add('hidden');
const setLoginDisabled = d => { const b = document.querySelector('#form-login button[type=submit]'); if(b) b.disabled = d; };

function startCountdown(until){
  const tick = () => {
    const ms = until - Date.now();
    if(ms <= 0){ clearInterval(cdTimer); loginAlertHide(); setLoginDisabled(false); return; }
    const m = Math.floor(ms/60000), s = Math.floor(ms%60000/1000);
    loginAlert(`<i class="fas fa-hourglass-half mr-1"></i> Muitas requisições de login neste navegador. Aguarde <b>${m}m ${s}s</b>.`, 'warn');
    setLoginDisabled(true);
  };
  clearInterval(cdTimer); tick(); cdTimer = setInterval(tick, 1000);
}
const showLockedMsg = () => loginAlert(
  `<i class="fas fa-lock mr-1"></i> Conta <b>BLOQUEADA</b> após ${MAX_WRONG_PASS} senhas incorretas.<br>
   Redefina sua senha em <b>"Esqueci a senha"</b> ou procure um administrador da FAMR.`, 'err');

/* ── Watchdog: inatividade 1h + virada de dia ── */
function startWatchdog(){
  stopWatchdog();
  localStorage.setItem('famr_day', dayStr());
  localStorage.setItem('famr_last_act', String(Date.now()));
  const touch = () => {
    const n = Date.now();
    if(n - lastTouch > 5000){ lastTouch = n; localStorage.setItem('famr_last_act', String(n)); }
  };
  ['click','keydown','mousemove','scroll','touchstart'].forEach(ev => window.addEventListener(ev, touch, { passive:true }));
  watchTimer = setInterval(async () => {
    if(localStorage.getItem('famr_day') !== dayStr())
      return endSession('Novo dia iniciado — sessão encerrada por segurança. Faça login novamente.');
    const last = +localStorage.getItem('famr_last_act') || Date.now();
    if(Date.now() - last > INACTIVITY_MS)
      return endSession('Sessão encerrada por inatividade (1 hora sem atividade).');
  }, 20000);
}
function stopWatchdog(){ if(watchTimer){ clearInterval(watchTimer); watchTimer = null; } }
async function endSession(msg){
  stopWatchdog();
  await supabase.auth.signOut().catch(()=>{});
  localStorage.removeItem('famr_day');
  showScreen('screen-login');
  loginAlert(`<i class="fas fa-clock mr-1"></i> ${msg}`, 'warn');
}

document.addEventListener('DOMContentLoaded', boot);

async function boot(){
  supabase.auth.onAuthStateChange((event) => {
    if(event === 'PASSWORD_RECOVERY') showScreen('screen-reset');
    if(event === 'SIGNED_OUT'){ STATE.profile = null; stopWatchdog(); showScreen('screen-login'); }
  });

  document.getElementById('form-login').addEventListener('submit', doLogin);
  document.getElementById('form-register').addEventListener('submit', doRegister);
  document.getElementById('link-forgot').addEventListener('click', e => { e.preventDefault(); doForgot(); });
  document.getElementById('link-register').addEventListener('click', e => { e.preventDefault(); showScreen('screen-register'); });
  document.getElementById('link-back-login').addEventListener('click', e => { e.preventDefault(); showScreen('screen-login'); });
  document.getElementById('btn-reset-save').addEventListener('click', doResetSave);
  document.getElementById('btn-maint-login').addEventListener('click', () => showScreen('screen-login'));
  document.getElementById('btn-logout').addEventListener('click', doLogout);

  const { data: sets } = await supabase.from('settings').select('*').in('key', ['maintenance','announcement']);
  (sets||[]).forEach(s => STATE.settings[s.key] = s.value);

  const { data:{ session } } = await supabase.auth.getSession();
  if(session){
    const day = localStorage.getItem('famr_day');
    const last = +localStorage.getItem('famr_last_act') || 0;
    if(day && day !== dayStr()){ await supabase.auth.signOut(); loginAlert('Novo dia iniciado — faça login novamente.', 'warn'); }
    else if(last && Date.now() - last > INACTIVITY_MS){ await supabase.auth.signOut(); loginAlert('Sessão expirada por inatividade (1h).', 'warn'); }
    else await enterSystem(session.user.id);
  } else {
    showScreen(STATE.settings.maintenance?.enabled ? 'screen-maintenance' : 'screen-login');
  }
}

/* ── LOGIN com anti-spam + bloqueio ── */
async function doLogin(e){
  e.preventDefault();
  loginAlertHide();
  const nick = document.getElementById('login-nick').value.trim();
  const pass = document.getElementById('login-pass').value;
  if(!nick || !pass) return;

  const nk = nick.toLowerCase();
  const blkKey = 'famr_blk_' + nk, attKey = 'famr_att_' + nk;

  // Bloqueio ativo neste navegador?
  const until = +localStorage.getItem(blkKey) || 0;
  if(Date.now() < until){ startCountdown(until); return; }

  // Anti double-click (3s)
  const now = Date.now();
  if(now - (+localStorage.getItem('famr_last_submit') || 0) < 3000) return;
  localStorage.setItem('famr_last_submit', String(now));

  // Máx. 4 requisições em 5min neste navegador → bloqueia 5min
  const arr = (JSON.parse(localStorage.getItem(attKey) || '[]')).filter(t => now - t < BROWSER_WINDOW_MS);
  arr.push(now); localStorage.setItem(attKey, JSON.stringify(arr));
  if(arr.length > MAX_REQ_WINDOW){
    const u = now + BROWSER_BLOCK_MS;
    localStorage.setItem(blkKey, String(u));
    startCountdown(u);
    return;
  }

  const btn = e.target.querySelector('button'); btn.disabled = true;
  try{
    const { data: info, error } = await supabase.rpc('famr_login_info', { nick });
    if(error || !info){ loginAlert('Nickname não encontrado ou conta banida.', 'err'); return; }
    if(info.locked){ showLockedMsg(); return; }

    const { data, error: le } = await supabase.auth.signInWithPassword({ email: info.email, password: pass });
    if(le){
      if(/invalid login credentials/i.test(le.message)){
        const { data: r } = await supabase.rpc('famr_login_failure', { nick });
        if(r && r.locked) showLockedMsg();
        else loginAlert(`Senha incorreta (<b>${r?.fails ?? '?'}/${MAX_WRONG_PASS}</b>). Na 4ª tentativa a conta é bloqueada.`, 'err');
      } else {
        loginAlert('Falha de conexão: ' + le.message, 'err');
      }
      return;
    }

    // Sucesso: limpa rastros do navegador + zera contagem no servidor
    localStorage.removeItem(attKey); localStorage.removeItem(blkKey);
    await supabase.rpc('famr_login_success', { nick });
    await supabase.rpc('log_action', { action:'LOGIN', details:{ nick } });
    await enterSystem(data.user.id);
  } finally { btn.disabled = false; }
}

/* ── Sessão → shell ── */
async function enterSystem(userId){
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if(error || !profile){ await supabase.auth.signOut(); showScreen('screen-login'); return; }
  if(profile.status === 'banned'){ await supabase.auth.signOut(); loginAlert('Conta BANIDA do sistema.', 'err'); showScreen('screen-login'); return; }
  if(profile.status === 'pending'){ await supabase.auth.signOut(); loginAlert('Conta ainda não ativada. Procure um administrador.', 'warn'); showScreen('screen-login'); return; }
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
  buildSidebar();
  location.hash = location.hash || '#/home';
  route();
}

/* ── ALISTAMENTO (corrigido) ── */
async function doRegister(e){
  e.preventDefault();
  const nick = document.getElementById('reg-nick').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const btn = e.target.querySelector('button'); btn.disabled = true;
  try{
    const { data, error } = await supabase.auth.signUp({
      email, password: pass,
      options: { data: { nickname: nick } } // trigger SQL cria o profile 'pending'
    });
    if(error){ toast('Erro no alistamento: ' + error.message, 'err'); return; }
    // e-mail já cadastrado (Supabase retorna identities vazio)
    if(data.user && (data.user.identities || []).length === 0){
      toast('Este e-mail já está cadastrado. Use "Esqueci a senha".', 'warn'); return;
    }
    if(data.session) await supabase.auth.signOut(); // não loga automaticamente
    document.getElementById('form-register').classList.add('hidden');
    document.getElementById('register-success').classList.remove('hidden');
    await supabase.rpc('log_action', { action:'REGISTRO', details:{ nick } }).catch(()=>{});
  } finally { btn.disabled = false; }
}

/* ── ESQUECI A SENHA (corrigido) ── */
async function doForgot(){
  const nick = prompt('Digite seu nickname Habbo para recuperação:');
  if(!nick || !nick.trim()) return;
  const { data: email, error } = await supabase.rpc('resolve_login_email', { nick: nick.trim() });
  if(error){ toast('Erro no servidor: ' + error.message, 'err'); return; }
  if(!email){ toast('Nickname não encontrado ou banido.', 'err'); return; }
  const { error: rErr } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: location.origin + location.pathname
  });
  if(rErr){ toast('Erro ao enviar: ' + rErr.message, 'err'); return; }
  toast('Link de redefinição enviado ao e-mail cadastrado. Expira em 10 minutos. Ao abrir, você volta aqui para criar a nova senha.');
}

/* ── NOVA SENHA (link de recuperação) ── */
async function doResetSave(){
  const p1 = document.getElementById('reset-pass').value;
  const p2 = document.getElementById('reset-pass2').value;
  if(p1.length < 6){ toast('Senha mínima: 6 caracteres.', 'warn'); return; }
  if(p1 !== p2){ toast('As senhas não conferem.', 'err'); return; }
  const { error } = await supabase.auth.updateUser({ password: p1 });
  if(error){ toast('Erro: ' + error.message, 'err'); return; }
  // trigger handle_password_change destrava a conta + log
  await supabase.rpc('log_action', { action:'SENHA_REDEFINIDA', details:{} }).catch(()=>{});
  await supabase.auth.signOut();
  showScreen('screen-login');
  loginAlert('<i class="fas fa-check-circle mr-1"></i> Senha redefinida e conta desbloqueada. Faça login novamente.', 'ok');
}

async function doLogout(){
  await supabase.rpc('log_action', { action:'LOGOUT', details:{} }).catch(()=>{});
  stopWatchdog();
  await supabase.auth.signOut();
  location.hash = '';
  location.reload();
}
