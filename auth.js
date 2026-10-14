/* ══════════ FAMR • AUTENTICAÇÃO (login, registro, recuperação) ══════════
   Sem credenciais hardcoded. Contas privilegiadas são reconhecidas pelo
   grupo "Alto Comando" criado no database.sql. */

const SCREENS = ['screen-login','screen-register','screen-reset','screen-maintenance'];
function showScreen(id){
  SCREENS.forEach(s => document.getElementById(s).classList.add('hidden'));
  document.getElementById('shell').classList.add('hidden');
  if(id === 'shell') document.getElementById('shell').classList.remove('hidden');
  else document.getElementById(id).classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', boot);

async function boot(){
  supabase.auth.onAuthStateChange((event) => {
    if(event === 'PASSWORD_RECOVERY'){ showScreen('screen-reset'); }
    if(event === 'SIGNED_OUT'){ STATE.profile = null; showScreen('screen-login'); }
  });

  document.getElementById('form-login').addEventListener('submit', doLogin);
  document.getElementById('form-register').addEventListener('submit', doRegister);
  document.getElementById('link-forgot').addEventListener('click', e => { e.preventDefault(); doForgot(); });
  document.getElementById('link-register').addEventListener('click', e => { e.preventDefault(); showScreen('screen-register'); });
  document.getElementById('link-back-login').addEventListener('click', e => { e.preventDefault(); showScreen('screen-login'); });
  document.getElementById('btn-reset-save').addEventListener('click', doResetSave);
  document.getElementById('btn-maint-login').addEventListener('click', () => showScreen('screen-login'));
  document.getElementById('btn-logout').addEventListener('click', doLogout);

  // Configurações públicas (manutenção/aviso) — RLS permite leitura anônima
  const { data: sets } = await supabase.from('settings').select('*').in('key', ['maintenance','announcement']);
  (sets||[]).forEach(s => STATE.settings[s.key] = s.value);

  const { data:{ session } } = await supabase.auth.getSession();
  if(session) await enterSystem(session.user.id);
  else showScreen(STATE.settings.maintenance?.enabled ? 'screen-maintenance' : 'screen-login');
}

/* ── LOGIN por nickname (resolve email via função SQL anon-safe) ── */
async function doLogin(e){
  e.preventDefault();
  const nick = document.getElementById('login-nick').value.trim();
  const pass = document.getElementById('login-pass').value;
  const btn = e.target.querySelector('button'); btn.disabled = true;

  try{
    // A função resolve_login_email (security definer) roda mesmo sem login
    const { data: email, error } = await supabase.rpc('resolve_login_email', { nick });
    if(error || !email){
      toast('Nickname não encontrado ou conta banida.', 'err');
      return;
    }

    const { data, error: loginErr } = await supabase.auth.signInWithPassword({ email, password: pass });
    if(loginErr){
      toast('Senha incorreta ou conta ainda não ativada.', 'err');
      return;
    }

    await supabase.rpc('log_action', { action:'LOGIN', details:{ nick } });
    await enterSystem(data.user.id);
  } finally { btn.disabled = false; }
}

/* ── Carrega perfil + grupos e entra no shell ── */
async function enterSystem(userId){
  const { data: profile, error } = await supabase
    .from('profiles').select('*').eq('id', userId).single();

  if(error || !profile){
    await supabase.auth.signOut();
    toast('Perfil não encontrado.', 'err');
    showScreen('screen-login');
    return;
  }
  if(profile.status === 'banned'){
    await supabase.auth.signOut();
    toast('Conta BANIDA do sistema.', 'err');
    showScreen('screen-login');
    return;
  }
  if(profile.status === 'pending'){
    await supabase.auth.signOut();
    toast('Conta ainda não ativada. Procure um administrador.', 'warn');
    showScreen('screen-login');
    return;
  }

  STATE.profile = profile;
  const { data: ug } = await supabase
    .from('user_groups').select('group_id, groups(*)').eq('user_id', userId);
  STATE.groups = (ug||[]).map(r => r.groups).filter(Boolean).sort((a,b) => (b.power_level||0)-(a.power_level||0));

  // Manutenção: só admin passa
  if(STATE.settings.maintenance?.enabled && !isAdmin()){
    document.getElementById('maintenance-msg').textContent = STATE.settings.maintenance.message || document.getElementById('maintenance-msg').textContent;
    showScreen('screen-maintenance');
    return;
  }

  // Header
  document.getElementById('user-nick').textContent = profile.nickname;
  document.getElementById('user-avatar').textContent = profile.nickname.charAt(0).toUpperCase();
  const g0 = STATE.groups[0];
  document.getElementById('user-group').textContent = g0 ? g0.name : 'Sem grupo';
  if(g0){
    document.getElementById('user-avatar').style.background = g0.color || '#14563f';
  }

  showScreen('shell');
  buildSidebar();
  location.hash = location.hash || '#/home';
  route();
}

/* ── REGISTRO (pendente de ativação) ── */
async function doRegister(e){
  e.preventDefault();
  const nick = document.getElementById('reg-nick').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;

  const { data, error } = await supabase.auth.signUp({
    email, password: pass,
    options: { data: { nickname: nick } }   // trigger SQL cria o profile 'pending'
  });
  if(error){ toast('Erro no alistamento: ' + error.message, 'err'); return; }
  if(data.session) await supabase.auth.signOut(); // não loga automaticamente

  document.getElementById('form-register').classList.add('hidden');
  document.getElementById('register-success').classList.remove('hidden');
  await supabase.rpc('log_action', { action:'REGISTRO', details:{ nick } }).catch(()=>{});
}

/* ── ESQUECI A SENHA (email da polícia via SMTP configurado; link 10min) ── */
async function doForgot(){
  const nick = prompt('Digite seu nickname Habbo:');
  if(!nick) return;
  const { data: email, error } = await supabase.rpc('resolve_login_email', { nick });
  if(error || !email){ toast('Nickname não encontrado.', 'err'); return; }

  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: location.origin + location.pathname
  });
  toast(resetErr ? 'Erro ao enviar: ' + resetErr.message
                 : 'Link de redefinição enviado. Expira em 10 minutos.');
}

async function doResetSave(){
  const p1 = document.getElementById('reset-pass').value;
  const p2 = document.getElementById('reset-pass2').value;
  if(p1 !== p2){ toast('As senhas não conferem.', 'err'); return; }
  const { error } = await supabase.auth.updateUser({ password: p1 });
  if(error){ toast('Erro: ' + error.message, 'err'); return; }
  await supabase.rpc('log_action', { action:'SENHA_REDEFINIDA', details:{} });
  await supabase.auth.signOut();
  toast('Senha alterada! Faça login novamente.');
  showScreen('screen-login');
}

async function doLogout(){
  await supabase.rpc('log_action', { action:'LOGOUT', details:{} }).catch(()=>{});
  await supabase.auth.signOut();
  location.hash = '';
  location.reload();
}
