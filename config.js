/* ══════════ FAMR • CONFIG (null-safe, sem declarar 'supabase') ══════════ */
var CONFIG = {
  supabaseUrl: 'https://fsmvyqfmgfivilufvgku.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbXZ5cWZtZ2ZpdmlsdWZ2Z2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MDU5NjIsImV4cCI6MjEwNjk4MTk2Mn0.W6qPA5TEtRn3r4bzuck_NEH3FNa4AaJDqGFR7yevUAU',
  logoUrl: 'famrlogo.png',
  orgName: 'Polícia FAMR'
};

try{
  var famrLib = window.supabase; // biblioteca UMD vinda do CDN
  if(!famrLib || typeof famrLib.createClient !== 'function'){
    throw new Error('supabase-js não carregou (CDN/bloqueador).');
  }
  // só converte em cliente se ainda for a biblioteca (evita duplicar)
  if(typeof famrLib.from !== 'function'){
    window.supabase = famrLib.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  }
  if(!window.supabase || typeof window.supabase.from !== 'function'){
    throw new Error('cliente Supabase inválido.');
  }
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
