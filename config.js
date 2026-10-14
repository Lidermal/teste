/* ══════════ FAMR • CONFIGURAÇÃO PÚBLICA ══════════
   A chave anon do Supabase É PÚBLICA por design (feita para frontend).
   A segurança REAL está no RLS do banco + nas permissões dos grupos.
   
   Contas privilegiadas são criadas apenas no database.sql (grupo "Alto Comando")
   e reconhecidas pelo sistema via permissões, não por senhas no código. */

const CONFIG = {
  supabaseUrl: 'https://fsmvyqfmgfivilufvgku.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbXZ5cWZtZ2ZpdmlsdWZ2Z2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MDU5NjIsImV4cCI6MjEwNjk4MTk2Mn0.W6qPA5TEtRn3r4bzuck_NEH3FNa4AaJDqGFR7yevUAU',
  logoUrl: 'famrlogo.png',
  orgName: 'Polícia FAMR'
};

const supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

// Estado global (cache em memória — sem dados sensíveis)
const STATE = { profile: null, groups: [], settings: {}, sections: [], page: 0 };

const PERMS = { ADMIN: 'admin', MASTER: 'master', REVIEW: 'review' };
const hasPerm = p => STATE.groups.some(g => (g.permissions || []).includes(p));
const isAdmin = () => hasPerm(PERMS.ADMIN);
const isMaster = () => hasPerm(PERMS.MASTER);
