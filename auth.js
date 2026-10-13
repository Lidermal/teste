// ============================================================
// auth.js - Supabase Client + Autenticação FAMR
// ============================================================

const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Estado global de sessão ----
let currentUser = null;
let currentProfile = null;

// ---- Inicialização ----
async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadProfile(session.user.id);
  }
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
      window.location.href = 'index.html';
    } else if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      await loadProfile(session.user.id);
    }
  });
}

async function loadProfile(userId) {
  const { data, error } = await sb
    .from('profiles')
    .select('*, groups(name,color,hierarchy_level), subgroups(name,color,hierarchy_level,groups(name)')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Erro ao carregar perfil:', error);
    return;
  }
  currentProfile = data;
}

// ---- LOGIN ----
async function loginUser(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;

  currentUser = data.user;
  await loadProfile(data.user.id);

  if (!currentProfile) throw new Error('Perfil não encontrado.');
  if (currentProfile.is_banned) {
    await sb.auth.signOut();
    throw new Error('Sua conta foi banida. Motivo: ' + (currentProfile.ban_reason || 'Não informado'));
  }
  if (!currentProfile.is_active) {
    await sb.auth.signOut();
    throw new Error('Sua conta ainda não foi ativada por um administrador.');
  }

  // Verificar manutenção
  const { data: settings } = await sb.from('system_settings').select('maintenance_mode').eq('id', 1).single();
  if (settings?.maintenance_mode && currentProfile.role !== 'admin' && currentProfile.role !== 'master') {
    await sb.auth.signOut();
    throw new Error('Sistema em manutenção. Tente novamente mais tarde.');
  }

  // Log de login
  await sb.from('login_logs').insert({
    user_id: data.user.id,
    email: email,
    nickname: currentProfile.nickname,
    success: true,
    user_agent: navigator.userAgent
  });

  // Atualizar last_login
  await sb.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', data.user.id);

  return currentProfile;
}

// ---- REGISTRO ----
async function registerUser(nickname, email, password) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { nickname } }
  });
  if (error) throw error;
  return data;
}

// ---- ESQUECEU A SENHA ----
async function requestPasswordReset(email) {
  // Verificar se o email existe
  const { data: profile } = await sb
    .from('profiles')
    .select('id, nickname, email')
    .eq('email', email)
    .eq('is_active', true)
    .eq('is_banned', false)
    .single();

  if (!profile) {
    throw new Error('E-mail não encontrado ou conta inativa.');
  }

  // Gerar token
  const token = crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos

  await sb.from('password_reset_tokens').insert({
    user_id: profile.id,
    token: token,
    expires_at: expiresAt
  });

  // Chamar Edge Function para enviar email
  const { error: fnError } = await sb.functions.invoke('send-reset-email', {
    body: { email: profile.email, nickname: profile.nickname, token: token }
  });

  if (fnError) {
    console.warn('Edge function falhou, tentando Supabase auth recovery como fallback');
    const { error: recoveryError } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-senha.html'
    });
    if (recoveryError) throw recoveryError;
  }

  return { success: true };
}

// ---- VALIDAR TOKEN DE RESET ----
async function validateResetToken(token) {
  const { data, error } = await sb
    .from('password_reset_tokens')
    .select('*, profiles(nickname, email)')
    .eq('token', token)
    .eq('used', false)
    .single();

  if (error || !data) return { valid: false, message: 'Token inválido.' };
  if (new Date(data.expires_at) < new Date()) return { valid: false, message: 'Token expirado. Solicite um novo.' };

  return { valid: true, userId: data.user_id, email: data.profiles?.email };
}

// ---- RESETAR SENHA ----
async function resetPassword(token, newPassword) {
  // Validar token
  const validation = await validateResetToken(token);
  if (!validation.valid) throw new Error(validation.message);

  // Usar Edge Function para atualizar senha com service_role
  const { data, error } = await sb.functions.invoke('reset-password', {
    body: { token: token, new_password: newPassword }
  });

  if (error) {
    // Fallback: usar supabase auth recovery
    throw new Error('Erro ao redefinir senha. Tente o link de recuperação do email.');
  }

  // Marcar token como usado
  await sb
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('token', token);

  return data;
}

// ---- LOGOUT ----
async function logoutUser() {
  await sb.auth.signOut();
  currentUser = null;
  currentProfile = null;
  window.location.href = 'index.html';
}

// ---- GUARD: verificar se está logado ----
function requireAuth() {
  if (!currentUser || !currentProfile) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// ---- GUARD: verificar se é admin ----
function requireAdmin() {
  if (!requireAuth()) return false;
  if (!['admin', 'master'].includes(currentProfile.role)) {
    alert('Acesso negado. Apenas administradores.');
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

// ---- GUARD: verificar se é master ----
function requireMaster() {
  if (!requireAuth()) return false;
  if (currentProfile.role !== 'master') {
    alert('Acesso negado. Apenas Chefia de Polícia.');
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

// ---- Utilitário: Google Drive URL ----
function driveImageUrl(fileId, size = 800) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

function driveDirectUrl(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// Expor globalmente
window.sb = sb;
window.currentUser = () => currentUser;
window.currentProfile = () => currentProfile;
window.initAuth = initAuth;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.requestPasswordReset = requestPasswordReset;
window.validateResetToken = validateResetToken;
window.resetPassword = resetPassword;
window.logoutUser = logoutUser;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
window.requireMaster = requireMaster;
window.driveImageUrl = driveImageUrl;
window.driveDirectUrl = driveDirectUrl;
