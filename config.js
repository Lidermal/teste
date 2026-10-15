/* ══════════ FAMR • CONFIG (var = imune a conflito de redeclaração) ══════════ */
var CONFIG = {
  supabaseUrl: 'https://fsmvyqfmgfivilufvgku.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbXZ5cWZtZ2ZpdmlsdWZ2Z2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MDU5NjIsImV4cCI6MjEwNjk4MTk2Mn0.W6qPA5TEtRn3r4bzuck_NEH3FNa4AaJDqGFR7yevUAU',
  logoUrl: 'famrlogo.png',
  orgName: 'Polícia FAMR'
};

var supabase = null;
try{
  if(typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function'){
    throw new Error('supabase-js não carregou.');
  }
  supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  if(!supabase || typeof supabase.from !== 'function') throw new Error('cliente inválido.');
  window.FAMR_CONFIG_OK = true;
}catch(err){
  window.FAMR_CONFIG_OK = false;
  console.error('[FAMR] falha no config.js:', err);
}

var STATE = { profile:null, groups:[], settings:{}, sections:[], page:0 };
var PERMS = { ADMIN:'admin', MASTER:'master', REVIEW:'review' };
function hasPerm(p){ return STATE.groups.some(function(g){ return (g.permissions||[]).includes(p); }); }
function isAdmin(){ return hasPerm(PERMS.ADMIN); }
function isMaster(){ return hasPerm(PERMS.MASTER); }
