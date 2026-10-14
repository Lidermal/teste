/* ══════════ FAMR • CONFIGURAÇÃO PÚBLICA (com auto-verificação) ══════════
   A chave anon é pública por design; a segurança real está no RLS do banco.
   Contas privilegiadas existem APENAS no database.sql. */

const CONFIG = {
  supabaseUrl: 'https://fsmvyqfmgfivilufvgku.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbXZ5cWZtZ2ZpdmlsdWZ2Z2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MDU5NjIsImV4cCI6MjEwNjk4MTk2Mn0.W6qPA5TEtRn3r4bzuck_NEH3FNa4AaJDqGFR7yevUAU',
  logoUrl: 'famrlogo.png',
  orgName: 'Polícia FAMR'
};

let supabase = null;
try{
  if(typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function'){
    throw new Error('a biblioteca supabase-js não carregou (CDN/bloqueador de scripts?).');
  }
  supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  if(!supabase || typeof supabase.from !== 'function'){
    throw new Error('o cliente Supabase foi criado inválido (confira URL e chave).');
  }
  window.FAMR_CONFIG_OK = true;
}catch(err){
  window.FAMR_CONFIG_OK = false;
  console.error('[FAMR] falha no config.js:', err);
  document.addEventListener('DOMContentLoaded', () => {
    const box = document.getElementById('login-alert');
    if(box){
      box.className = 'mt-4 rounded-lg border px-4 py-3 text-sm font-semibold border-red-400 bg-red-50 text-red-700';
      box.innerHTML = 'Falha no config.js: ' + (err && err.message ? err.message : err);
      box.classList.remove('hidden');
    }
  });
}
