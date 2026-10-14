/* ══════════ FAMR • CONFIGURAÇÃO PÚBLICA ══════════
   A chave anon é pública por design; a segurança real está no RLS.
   Contas privilegiadas existem APENAS no banco (database.sql). */

const CONFIG = {
  supabaseUrl: 'https://fsmvyqfmgfivilufvgku.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbXZ5cWZtZ2ZpdmlsdWZ2Z2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MDU5NjIsImV4cCI6MjEwNjk4MTk2Mn0.W6qPA5TEtRn3r4bzuck_NEH3FNa4AaJDqGFR7yevUAU',
  logoUrl: 'famrlogo.png',
  orgName: 'Polícia FAMR'
};

const supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

const STATE = { profile: null, groups: [], settings: {}, sections: [], page: 0 };

const PERMS = { ADMIN: 'admin', MASTER: 'master', REVIEW: 'review' };
const hasPerm = p => STATE.groups.some(g => (g.permissions || []).includes(p));
const isAdmin = () => hasPerm(PERMS.ADMIN);
const isMaster = () => hasPerm(PERMS.MASTER);
