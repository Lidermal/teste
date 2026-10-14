/* ══════════ FAMR • CONFIGURAÇÃO PÚBLICA (completa) ══════════
   Chave anon é pública por design; a segurança real está no RLS do banco.
   Contas privilegiadas existem APENAS no database.sql. */

const CONFIG = {
  supabaseUrl: 'https://fsmvyqfmgfivilufvgku.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbXZ5cWZtZ2ZpdmlsdWZ2Z2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MDU5NjIsImV4cCI6MjEwNjk4MTk2Mn0.W6qPA5TEtRn3r4bzuck_NEH3FNa4AaJDqGFR7yevUAU',
  logoUrl: 'famrlogo.png',
  orgName: 'Polícia FAMR'
};

/* ── Cliente Supabase com auto-verificação ── */
let supabase = null;
try{
  if(typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function'){
    throw new Error('a biblioteca supabase-js não carregou (CDN/bloqueador?).');
  }
  supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  if(!supabase || typeof supabase.from !== 'function'){
    throw new Error('cliente Supabase inválido (confira URL/chave).');
  }
  window.FAMR_CONFIG_OK = true;
}catch(err){
  window.FAMR_CONFIG_OK = false;
  console.error('[FAMR] falha no config.js:', err);
}

/* ── Estado global + permissões (usados por app.js e auth.js) ── */
const STATE = { profile: null, groups: [], settings: {}, sections: [], page: 0 };

const PERMS = { ADMIN: 'admin', MASTER: 'master', REVIEW: 'review' };
const hasPerm = p => STATE.groups.some(g => (g.permissions || []).includes(p));
const isAdmin  = () => hasPerm(PERMS.ADMIN);
const isMaster = () => hasPerm(PERMS.MASTER);
