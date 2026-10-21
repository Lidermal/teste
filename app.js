/* ══════════ FAMR • APP.JS COMPLETO v37 (Páginas Sub-Doc | Layout Full-Width Fix | Colar Code Real | Imagem Drag | Links Absolutos) ══════════ */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = d => new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
const statusChip = s => s==='approved' ? '<span class="chip chip-ok">APROVADO</span>' : s==='rejected' ? '<span class="chip chip-no">REPROVADO</span>' : '<span class="chip chip-wait">EM ANÁLISE</span>';

const ICON_OPTIONS = [
  'fa-shield-halved','fa-shield','fa-star','fa-medal','fa-award','fa-crown','fa-flag','fa-bullhorn','fa-gavel','fa-scale-balanced','fa-hand-fist','fa-crosshairs','fa-eye','fa-binoculars','fa-anchor','fa-life-ring','fa-fire-extinguisher','fa-dove','fa-feather-pointed',
  'fa-user-shield','fa-users','fa-user-tie','fa-user-secret','fa-person-military-rifle','fa-user-doctor','fa-user-nurse','fa-person-dress','fa-child','fa-people-group','fa-address-card','fa-id-badge','fa-id-card','fa-signature',
  'fa-tree','fa-leaf','fa-seedling','fa-mountain-sun','fa-water','fa-snowflake','fa-sun','fa-moon','fa-cloud','fa-bolt','fa-fire','fa-wind','fa-dragon','fa-paw','fa-dog','fa-cat','fa-horse','fa-falcon','fa-owl','fa-bug','fa-spider',
  'fa-plane','fa-helicopter','fa-truck-fast','fa-truck','fa-car','fa-bus','fa-ship','fa-train','fa-motorcycle','fa-bicycle','fa-cart-shopping','fa-boxes-stacked','fa-warehouse','fa-oil-can','fa-gas-pump','fa-wrench','fa-screwdriver-wrench','fa-tools','fa-hammer','fa-puzzle-piece','fa-gears','fa-industry',
  'fa-comment','fa-comments','fa-envelope','fa-paper-plane','fa-phone','fa-video','fa-microphone','fa-rss','fa-satellite-dish','fa-tower-broadcast',
  'fa-book-open','fa-book','fa-scroll','fa-file-lines','fa-file-signature','fa-folder-open','fa-folder','fa-graduation-cap','fa-school','fa-pen','fa-pencil','fa-pen-to-square','fa-clipboard-list','fa-clipboard-check','fa-list-check','fa-bookmark','fa-quote-left',
  'fa-coins','fa-money-bill-wave','fa-chart-pie','fa-chart-line','fa-chart-column','fa-calculator','fa-percent','fa-sack-dollar',
  'fa-heart','fa-heart-pulse','fa-staff-snake','fa-pills','fa-syringe','fa-hand-holding-medical','fa-crutch',
  'fa-laptop-code','fa-desktop','fa-mobile-screen','fa-server','fa-database','fa-network-wired','fa-wifi','fa-lock','fa-unlock','fa-key','fa-user-lock','fa-mask','fa-ghost','fa-robot','fa-brain','fa-lightbulb','fa-flask','fa-vial','fa-atom','fa-magnet','fa-gamepad','fa-chess-knight','fa-chess-rook','fa-chess-queen','fa-chess-bishop','fa-chess-pawn','fa-gem','fa-ring','fa-hourglass-half','fa-stopwatch','fa-clock','fa-calendar-days','fa-map-location-dot','fa-compass','fa-route','fa-road','fa-building-shield','fa-city','fa-monument','fa-archway','fa-place-of-worship','fa-church','fa-bible','fa-earth-americas','fa-earth-europe','fa-earth-asia','fa-globe','fa-satellite','fa-rocket','fa-meteor','fa-comet','fa-star-half-stroke','fa-certificate','fa-stamp','fa-ticket','fa-tags','fa-tag','fa-bell','fa-volume-high','fa-print','fa-scissors','fa-paperclip','fa-thumbtack','fa-pushpin','fa-magnifying-glass','fa-filter','fa-sort','fa-diagram-project','fa-sitemap','fa-layer-group','fa-cubes','fa-cube','fa-dice','fa-palette','fa-fill-drip','fa-font','fa-heading','fa-paragraph','fa-align-left','fa-align-center','fa-align-right','fa-align-justify','fa-list-ul','fa-list-ol','fa-quote-right','fa-code','fa-terminal','fa-trophy','fa-ranking-star','fa-flag-checkered','fa-parachute-box','fa-basketball','fa-football','fa-baseball','fa-volleyball','fa-table-tennis-paddle-ball','fa-bowling-ball','fa-golf-ball-tee','fa-hockey-puck','fa-futbol','fa-running','fa-dumbbell','fa-person-swimming','fa-sailboat','fa-broom','fa-first-aid','fa-kit-medical','fa-prescription','fa-tablets','fa-mortar-pestle','fa-utensils','fa-mug-hot','fa-wine-glass','fa-beer-mug-empty','fa-coffee','fa-ice-cream','fa-cake-candles','fa-cookie','fa-carrot','fa-apple-whole','fa-lemon','fa-orange','fa-grape','fa-strawberry','fa-blueberry','fa-drumstick-bite','fa-cheese','fa-egg','fa-bread-slice','fa-hamburger','fa-store','fa-shop','fa-box','fa-archive','fa-trash-can','fa-recycle','fa-tractor','fa-tree-city','fa-feather','fa-bird','fa-crow','fa-peacock','fa-swan','fa-duck','fa-turkey','fa-chicken','fa-moth','fa-bee','fa-ladybug','fa-beetle','fa-scorpion','fa-snake','fa-lizard','fa-turtle','fa-frog','fa-crocodile','fa-skull-crossbones','fa-wand-magic-sparkles','fa-hat-wizard','fa-dungeon','fa-kaaba','fa-mosque','fa-synagogue','fa-star-and-crescent','fa-star-of-david','fa-yin-yang','fa-ufo','fa-clover','fa-joint'
];
const SAFE_ICONS = [...new Set(ICON_OPTIONS.filter(i=>/^fa-/.test(i)))];

const GROUP_TYPES = { open:'ABERTO', closed:'FECHADO', invisible:'INVISÍVEL' };
const SLUGS_REQUIRE_GROUP = ['companhias'];

/* ══════════ TRADUÇÃO DE LOGS PT ══════════ */
const ACTION_PT = {
  LOGIN:'Login', LOGOUT:'Logout', REGISTRO:'Cadastro', USER_STATUS:'Alteração de status',
  USER_INVISIBLE:'Visibilidade alterada', LOCK_REMOVIDO_ADMIN:'Desbloqueio administrativo',
  SENHA_LINK_ENVIADO:'Link de senha enviado', SENHA_REDEFINIDA:'Senha redefinida',
  POST_CRIADO:'Publicação criada', POST_EDITADO:'Publicação editada', POST_EXCLUIDO:'Publicação excluída',
  SECTION_SAVE:'Setor salvo', SUBTOPIC_SAVE:'Subtópico salvo',
  GROUP_SAVE:'Grupo salvo', GROUP_DEL:'Grupo excluído', USER_GROUPS:'Grupos de usuário alterados',
  MANUTENCAO:'Modo manutenção', AVISO:'Aviso publicado', REVIEW_REQUEST:'Análise de protocolo',
  DOC_CREATE:'Documento criado', DOC_UPDATE:'Documento atualizado', DOC_DEL:'Documento excluído',
  DOC_PAGE_SAVE:'Página salva', DOC_PAGE_DEL:'Página excluída'
};
function ptAction(a){ return ACTION_PT[a] || a; }
function shortId(s){ return String(s||'').slice(0,8)+'…'; }
function truncate(s,n){ return String(s||'').length>n ? String(s).slice(0,n)+'…' : String(s||''); }
function statusLabel(s){ return ({active:'ativo', pending:'pendente', banned:'banido', approved:'aprovado', rejected:'reprovado'})[s] || s; }
function ptDetails(d, action){
  if(!d) return '—';
  const out = [];
  if(action==='USER_STATUS' && d.id)   out.push(`usuário ${shortId(d.id)} → ${statusLabel(d.status)}`);
  else if(action==='USER_INVISIBLE')  out.push(`usuário ${shortId(d.id)} ficou ${d.v?'oculto':'visível'}`);
  else if(action==='LOCK_REMOVIDO_ADMIN') out.push(`conta ${shortId(d.id)} destravada`);
  else if(action==='POST_CRIADO')     out.push(`subtópico ${shortId(d.subtopicId||d.id)}`);
  else if(action==='POST_EDITADO'||action==='POST_EXCLUIDO') out.push(`publicação ${shortId(d.id)}`);
  else if(action==='GROUP_SAVE')      out.push(`grupo "${d.name||'?'}" (${d.group_type||'?'} · ordem ${d.order_index??'-'})`);
  else if(action==='GROUP_DEL')       out.push(`grupo ${shortId(d.id)}`);
  else if(action==='USER_GROUPS')     out.push(`usuário ${shortId(d.userId)} recebeu ${Array.isArray(d.ids)?d.ids.length+' grupo(s)':d.ids}`);
  else if(action==='SECTION_SAVE')    out.push(`setor "${d.name||'?'}" (/ ${d.slug||'?'})`);
  else if(action==='SUBTOPIC_SAVE')   out.push(`subtópico "${d.name||'?'}"`);
  else if(action==='MANUTENCAO')      out.push(`manutenção ${d.enabled?'ATIVADA':'desativada'}${d.message?` · msg: "${truncate(d.message,40)}"`:''}`);
  else if(action==='AVISO')           out.push(d.text ? `aviso: "${truncate(d.text,60)}"` : 'aviso removido');
  else if(action==='SENHA_LINK_ENVIADO') out.push(`nickname: ${d.nick||'?'}`);
  else if(action==='REVIEW_REQUEST')  out.push(`protocolo ${shortId(d.req_id)} → ${statusLabel(d.new_status)}${d.note?` · motivo: "${truncate(d.note,40)}"`:''}`);
  else if(action==='DOC_CREATE')      out.push(`documento "${d.title||'?'}"${d.category?` (${d.category})`:''}${d.page_name?` · página: ${d.page_name}`:''}`);
  else if(action==='DOC_UPDATE')      out.push(`documento "${d.title||'?'}" atualizado`);
  else if(action==='DOC_DEL')         out.push(`documento ${shortId(d.id)} excluído`);
  else if(action==='DOC_PAGE_SAVE')   out.push(`página "${d.name||'?'}" (${d.slug||'?'})`);
  else if(action==='DOC_PAGE_DEL')    out.push(`página ${shortId(d.id)} excluída`);
  else if(action==='LOGIN')           out.push(`autenticação de ${d.nick||STATE.profile?.nickname||'usuário'}`);
  else if(action==='LOGOUT')          out.push(`saída de ${d.nick||STATE.profile?.nickname||'usuário'}`);
  else { Object.entries(d).forEach(([k,v])=>out.push(`${k}: ${typeof v==='object'?JSON.stringify(v):v}`)); }
  return out.join(' · ') || '—';
}

/* ══════════ CACHE GLOBAL ══════════ */
const CACHE = { data:{}, ttl:{} };
function cacheGet(key){ const e=CACHE.data[key]; if(e && Date.now()-e.t < (CACHE.ttl[key]||60_000)) return e.v; return undefined; }
function cacheSet(key,v,ttl=60_000){ CACHE.data[key]={t:Date.now(),v}; CACHE.ttl[key]=ttl; return v; }
function invalidate(prefix){ Object.keys(CACHE.data).forEach(k=>{ if(!prefix||k.startsWith(prefix)) delete CACHE.data[k]; }); }
async function cachedQuery(key, factory, ttl=60_000){
  const hit = cacheGet(key); if(hit!==undefined) return hit;
  const r = await factory(); cacheSet(key,r,ttl); return r;
}
const PAGE_SIZE = 25;

/* ══════════ HELPERS GRUPO ══════════ */
function groupChip(g){ return g ? `<span class="chip" style="background:${g.color}18;color:${g.color};border:1px solid ${g.color}55"><i class="fas ${g.icon||'fa-shield-halved'}"></i> ${esc(g.name)}</span>` : '<span class="chip chip-neutral">Geral</span>'; }
function sortGroups(list){ return [...(list||[])].sort((a,b)=>(a.order_index||0)-(b.order_index||0)); }
function primaryGroupOf(list){ return sortGroups(list)[0] || null; }
function colorGroupOf(list){ return sortGroups(list).find(g => g.apply_color) || null; }
function userIconOf(list){ return primaryGroupOf(list)?.icon || 'fa-user'; }

/* ══════════ PERMISSÕES ESTRITAS ══════════ */
function permOf(type,id){ return STATE.perms?.[type+':'+id] || null; }
function hasAnyRule(type,id){ return !!STATE.ruleIndex?.has(type+':'+id); }
function resolvePerm(type,id){
  const u = permOf(type,id); if(u) return u;
  const a = STATE.permAll?.[type+':'+id]; if(a) return a;
  if(hasAnyRule(type,id)) return {view:false,create:false,edit:false,del:false,mod:false};
  return null;
}
function canViewSection(sec){
  if(isAdmin()) return true;
  if(sec.required_group_id && !STATE.groups.some(g=>g.id===sec.required_group_id)) return false;
  const p = resolvePerm('section', sec.id);
  return p ? (p.view||p.mod) : true;
}
function canViewSub(sub){
  if(isAdmin()) return true;
  if(sub.required_group_id && !STATE.groups.some(g=>g.id===sub.required_group_id)) return false;
  const p = resolvePerm('subtopic', sub.id);
  if(p) return p.view||p.mod;
  const sec = (STATE.sections||[]).find(s=>s.id===sub.section_id);
  return sec ? canViewSection(sec) : true;
}
function canCreateIn(sub){
  if(!sub.allow_posts) return false;
  if(isAdmin()) return true;
  const p = resolvePerm('subtopic', sub.id) || resolvePerm('section', sub.section_id);
  return p ? (p.create||p.mod) : true;
}
function canEditIn(sub){ if(isAdmin()) return true; const p=resolvePerm('subtopic',sub.id)||resolvePerm('section',sub.section_id); return p ? !!(p.edit||p.mod) : false; }
function canDeleteIn(sub){ if(isAdmin()) return true; const p=resolvePerm('subtopic',sub.id)||resolvePerm('section',sub.section_id); return p ? !!(p.del||p.mod) : false; }
function isModOf(groupId){ return isAdmin() || STATE.modGroups?.has(groupId); }
function sectionNeedsGroup(sec){ return SLUGS_REQUIRE_GROUP.includes(sec?.slug); }
function canSeeSection(sec){
  if(!canViewSection(sec)) return false;
  if(sectionNeedsGroup(sec) && !isAdmin() && (STATE.groups||[]).length===0) return false;
  return true;
}

/* ══════════ TEMA / UI ══════════ */
function applyThemeIcon(){
  const b = document.getElementById('btn-theme'); if(!b) return;
  const dark = document.documentElement.getAttribute('data-theme')==='dark';
  b.innerHTML = `<i class="fas ${dark?'fa-sun':'fa-moon'}"></i>`;
  b.title = dark ? 'Modo claro' : 'Modo escuro';
}
window.toggleTheme = function(){
  const dark = document.documentElement.getAttribute('data-theme')==='dark';
  if(dark) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme','dark');
  try{ localStorage.setItem('famr-theme', dark?'light':'dark'); }catch(e){}
  applyThemeIcon();
};

function toast(msg, type='ok'){
  const el = document.createElement('div');
  el.className = 'toast ' + (type==='ok'?'':type);
  el.innerHTML = `<i class="fas ${type==='err'?'fa-circle-exclamation text-red-600':type==='warn'?'fa-triangle-exclamation text-gold-500':'fa-circle-check text-famr-600'} mt-0.5"></i><span>${esc(msg)}</span>`;
  document.getElementById('toast-root').appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function showAlert(boxId, kind, html){
  const box = document.getElementById(boxId);
  if(!box) return;
  const icons = { ok:'fa-circle-check', err:'fa-circle-exclamation', warn:'fa-triangle-exclamation', info:'fa-circle-info' };
  box.className = `alert-box alert-${kind} mt-4`;
  box.innerHTML = `<i class="fas ${icons[kind]||icons.info}"></i><div>${html}</div>`;
  box.classList.remove('hidden');
}
function hideAlert(boxId){ const box=document.getElementById(boxId); if(box){ box.classList.add('hidden'); box.innerHTML=''; } }

function openModal(title, bodyHTML, footerHTML=''){
  document.getElementById('modal-title').innerHTML = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML;
  document.getElementById('modal-root').classList.remove('hidden');
}
function closeModal(){
  document.getElementById('modal-root').classList.add('hidden');
  if(window._modalResolve){ window._modalResolve(null); window._modalResolve=null; }
}

function confirmDlg(msg, opts={}){
  const { title='Confirmar', okText='Confirmar', cancelText='Cancelar', danger=false } = opts;
  return new Promise(res => {
    openModal(`<i class="fas fa-triangle-exclamation ${danger?'text-red-500':'text-gold-500'} mr-2"></i>${esc(title)}`,
      `<p class="text-sm text-muted leading-relaxed">${msg}</p>`,
      `<button class="btn btn-outline btn-sm" id="_cf-cancel">${esc(cancelText)}</button>
       <button class="btn ${danger?'btn-danger':'btn-primary'} btn-sm" id="_cf-ok">${esc(okText)}</button>`);
    window._modalResolve = res;
    document.getElementById('_cf-ok').onclick = ()=>{ window._modalResolve=null; closeModal(); res(true); };
    document.getElementById('_cf-cancel').onclick = ()=>{ window._modalResolve=null; closeModal(); res(false); };
  });
}
function promptDlg(label, def='', opts={}){
  const { title='Entrada', okText='OK', inputType='text', multiline=false } = opts;
  return new Promise(res => {
    const field = multiline
      ? `<textarea id="_pf-input" class="input" rows="4" placeholder="${esc(def)}">${esc(def)}</textarea>`
      : `<input id="_pf-input" class="input" type="${inputType}" value="${esc(def)}" placeholder="${esc(def)}">`;
    openModal(`<i class="fas fa-pen-to-square text-gold-500 mr-2"></i>${esc(title)}`,
      `<label class="field"><span>${esc(label)}</span>${field}</label>`,
      `<button class="btn btn-outline btn-sm" id="_pf-cancel">Cancelar</button>
       <button class="btn btn-primary btn-sm" id="_pf-ok">${esc(okText)}</button>`);
    const inp = document.getElementById('_pf-input');
    setTimeout(()=>inp.focus(), 50);
    window._modalResolve = res;
    document.getElementById('_pf-ok').onclick = ()=>{ const v=inp.value.trim(); window._modalResolve=null; closeModal(); res(v); };
    document.getElementById('_pf-cancel').onclick = ()=>{ window._modalResolve=null; closeModal(); res(null); };
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter' && !multiline){ e.preventDefault(); const v=inp.value.trim(); window._modalResolve=null; closeModal(); res(v); } });
  });
}

function updateUserChip(){
  if(!STATE.profile) return;
  const nick = STATE.profile.nickname || '—';
  const main = primaryGroupOf(STATE.groups);
  const cg = colorGroupOf(STATE.groups);
  const av = document.getElementById('user-avatar');
  const nk = document.getElementById('user-nick');
  const gp = document.getElementById('user-group');
  if(nk) nk.textContent = nick;
  if(gp){ gp.textContent = main ? main.name : 'Sem grupo'; if(main) gp.style.color = main.color; }
  if(av){ av.textContent = nick.charAt(0).toUpperCase(); av.style.background = cg ? cg.color : '#14563f'; }
}

function startQsClock(){
  if(window._qsTimer){ clearInterval(window._qsTimer); window._qsTimer = null; }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const dateEl = document.getElementById('qs-date');
  if(dateEl) dateEl.textContent = cap(new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' }));
  const tick = () => { const c = document.querySelector('.qs-clock'); if(c) c.textContent = new Date().toLocaleTimeString('pt-BR'); };
  tick();
  window._qsTimer = setInterval(tick, 1000);
}

/* ══════════ ROUTER ══════════ */
window.addEventListener('hashchange', route);
async function route(){
  if(!STATE.profile) return;
  const raw = location.hash || '#/home';
  const clean = raw.startsWith('#/') ? raw.slice(2) : raw.replace(/^#/,'');
  const parts = clean.split('/');
  const page = parts[0] || 'home';
  const param = parts[1] || null;
  const subParam = parts[2] || null;
  const key = (page==='home') ? 'home' : (param ? page+'/'+param : page);
  updateUserChip(); applyThemeIcon(); updateSidebarActive(key);
  if(window._qsTimer){ clearInterval(window._qsTimer); window._qsTimer = null; }
  const c = document.getElementById('content');
  if(!c) return;
  /* Garante sempre largura total em todas as rotas */
  forceFullWidthContent();
  if(page==='doc-new'){ renderDocWorkspace(null, subParam); return; }
  if(page==='doc-edit'){ renderDocWorkspace(param, subParam); return; }
  if(page==='doc-page'){ await renderDocPage(c, param); return; }
  closeDocWorkspace();
  c.innerHTML = '<div class="skeleton h-40"></div><div class="skeleton h-64 mt-4"></div>';
  try{
    switch(page){
      case 'admin':   await renderAdmin(c); break;
      case 'perfil':  await renderProfile(c, param); break;
      case 'grupo':   await renderGroupPage(c, param); break;
      case 'section': await renderSection(c, param); break;
      case 'sub':     await renderSubtopic(c, param); break;
      default:        await renderHome(c);
    }
  }catch(err){
    console.error('[FAMR] rota "'+page+'":', err);
    c.innerHTML = `<div class="card card-body text-red-600 text-sm"><i class="fas fa-plug-circle-xmark mr-2"></i>Erro ao carregar esta tela.<br><small>${esc(err.message)}</small></div>`;
  }
}
function updateSidebarActive(key){ document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.key === key)); }

/* ══════════ FIX LAYOUT FULL-WIDTH (CORREÇÃO DO BUG ENCOLHIDO) ══════════ */
function forceFullWidthContent(){
  const c = document.getElementById('content');
  if(!c) return;
  /* Remove qualquer classe residual que limite largura */
  c.classList.remove('max-w-4xl','max-w-5xl','max-w-6xl','max-w-7xl','mx-auto','container');
  /* Aplica estilo inline garantindo 100% em qualquer viewport */
  c.style.width = '100%';
  c.style.maxWidth = '100%';
  c.style.minWidth = '0';
  c.style.marginLeft = '0';
  c.style.marginRight = '0';
  c.style.paddingLeft = '';
  c.style.paddingRight = '';
  /* Força também o pai direto para evitar flex/grid shrinking */
  const parent = c.parentElement;
  if(parent){
    parent.style.flex = '1 1 auto';
    parent.style.minWidth = '0';
    parent.style.overflowX = 'auto';
  }
}
/* Executa uma vez no boot e após cada troca de rota */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(forceFullWidthContent, 100);
});
window.addEventListener('resize', () => {
  clearTimeout(window._rzT);
  window._rzT = setTimeout(forceFullWidthContent, 150);
});

/* ══════════ SIDEBAR ══════════ */
async function buildSidebar(){
  const nav = document.getElementById('sidebar-nav');
  if(!nav) return;
  const { data: sections } = await supabase.from('sections').select('*').order('order_index');
  STATE.sections = sections || [];
  let html = `<a class="nav-item" data-key="home" href="#/home"><i class="fas fa-house"></i> Início</a>
              <div class="nav-sep">Tópicos oficiais</div>`;
  for(const s of STATE.sections){
    if(!canSeeSection(s)) continue;
    html += `<a class="nav-item" data-key="section/${s.slug}" href="#/section/${s.slug}"><i class="fas ${esc(s.icon||'fa-folder')}"></i> ${esc(s.name)}</a>`;
  }
  html += `<div class="nav-sep">Minha conta</div>
           <a class="nav-item" data-key="perfil/me" href="#/perfil/me"><i class="fas fa-id-badge"></i> Meu perfil</a>`;
  if(isAdmin()) html += `<div class="nav-sep">Comando</div>
           <a class="nav-item" data-key="admin" href="#/admin"><i class="fas fa-sliders"></i> Painel Admin</a>`;
  nav.innerHTML = html;
  updateUserChip(); applyThemeIcon();
  if(STATE.settings.maintenance?.enabled && isAdmin()) document.getElementById('maintenance-banner').classList.remove('hidden');
}

/* ══════════ HOME ══════════ */
async function renderHome(c){
  const bundle = await cachedQuery('home:data', async ()=>{
    const [sections, subs, postsMeta, nMembers, newest, groups, allUG] = await Promise.all([
      supabase.from('sections').select('id,name,icon,slug,order_index,required_group_id').order('order_index'),
      supabase.from('subtopics').select('id,name,description,section_id,required_group_id,is_request_form,allow_posts').order('order_index'),
      supabase.from('posts').select('id,subtopic_id,title,created_at,profiles_view(nickname)').order('created_at',{ascending:false}).limit(500),
      supabase.from('profiles_view').select('*',{count:'exact',head:true}).eq('status','active').neq('nickname','admin master'),
      supabase.from('profiles_view').select('id,nickname,created_at').eq('status','active').eq('is_invisible',false).neq('nickname','admin master').order('created_at',{ascending:false}).limit(5),
      supabase.from('groups').select('id,name,color,icon,apply_color,group_type,order_index,parent_id').neq('group_type','invisible').order('order_index'),
      supabase.from('user_groups').select('group_id').limit(10000)
    ]);
    return { sections:sections.data||[], subs:subs.data||[], posts:postsMeta.data||[], members:nMembers.count||0, newest:newest.data||[], groups:groups.data||[], ug:allUG.data||[] };
  }, 45_000);
  const { sections, subs, posts, members:registeredCount, newest, groups, ug } = bundle;
  const memberCount={}; (ug||[]).forEach(m=>memberCount[m.group_id]=(memberCount[m.group_id]||0)+1);
  let lastChip='<em>nenhum</em>';
  if(newest?.[0]){
    const ic = userIconOf((await cachedQuery('lastug:'+newest[0].id, ()=> supabase.from('user_groups').select('groups(id,icon,order_index,apply_color)').eq('user_id',newest[0].id), 120_000)).data||[]);
    lastChip=`<span class="sg-link"><i class="fas ${ic}"></i> ${esc(newest[0].nickname)}</span>`;
  }
  const counts={},lastMap={};
  (posts||[]).forEach(p=>{counts[p.subtopic_id]=(counts[p.subtopic_id]||0)+1;if(!lastMap[p.subtopic_id])lastMap[p.subtopic_id]=p;});
  const visibleSubs=(subs||[]).filter(s=>canViewSub(s));
  const totalOnline=1, pubs=(posts||[]).length;
  const ann=(STATE.settings.announcement&&STATE.settings.announcement.text)?STATE.settings.announcement.text.trim():'';
  const legend=[
    {icon:'fa-comments',color:'#14563f',label:'Tópico aberto para publicação'},
    {icon:'fa-lock',color:'#c9a227',label:'Conteúdo reservado a companhia'},
    {icon:'fa-file-signature',color:'#a8861d',label:'Requerimento CRH/RH'},
    {icon:'fa-shield-halved',color:'#0e4433',label:'Sessão segura • expira em 1h'}
  ];
  const myIds=new Set((STATE.groups||[]).map(g=>g.id));
  c.innerHTML = `
  <section class="quartel-strip fade-up">
    <div class="qs-glow" aria-hidden="true"></div>
    <div class="qs-left"><span class="qs-badge"><i class="fas fa-shield-halved"></i></span>
      <div class="qs-txt"><b class="qs-title">Plantão do Quartel</b>
        <span class="qs-sub"><i class="far fa-clock"></i><span class="qs-clock">--:--:--</span>•<span id="qs-date"></span></span></div></div>
    <div class="qs-mid">
      <span class="qs-pill"><i class="fas fa-circle qs-on"></i> ${totalOnline} online</span>
      <span class="qs-pill"><i class="fas fa-users"></i> ${registeredCount} efetivo</span>
      <span class="qs-pill"><i class="fas fa-comments"></i> ${pubs} publicações</span>
      <span class="qs-pill"><i class="fas ${primaryGroupOf(STATE.groups)?.icon || 'fa-id-badge'}"></i> ${esc(STATE.profile.nickname)}</span>
    </div>
    ${ann ? `<div class="qs-notice" title="${esc(ann)}"><i class="fas fa-bullhorn"></i><span>${esc(ann)}</span></div>` : ``}
    <div class="qs-emblem"><img src="${CONFIG.logoUrl}" alt="" loading="lazy" onerror="this.parentElement.classList.add('qs-emblem-empty')"></div>
  </section>
  <section class="hero fade-up">
    <div class="hero-art" aria-hidden="true"><img src="${CONFIG.logoUrl}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>
    <div class="hero-inner flex flex-wrap items-center gap-6 justify-between">
      <div><p class="text-gold-300 text-xs font-bold tracking-[0.3em] uppercase">Índice do quartel • Habbo BR</p>
        <h1 class="font-display text-2xl md:text-3xl font-extrabold mt-1">Bem-vindo, ${esc(STATE.profile.nickname)}</h1>
        <div class="flex flex-wrap gap-2 mt-3">${(STATE.groups||[]).map(groupChip).join('') || '<span class="chip chip-neutral">Sem grupo</span>'}</div></div>
    </div>
  </section>
  <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 fade-up">
    <div class="stat-tile"><span class="forum-ico"><i class="fas fa-users"></i></span><div><p class="text-[10px] uppercase tracking-wider text-muted font-bold">Efetivo ativo</p><p class="font-display text-xl font-extrabold text-famr-800">${registeredCount}</p></div></div>
    <div class="stat-tile"><span class="forum-ico new"><i class="fas fa-comments"></i></span><div><p class="text-[10px] uppercase tracking-wider text-muted font-bold">Publicações</p><p class="font-display text-xl font-extrabold text-famr-800">${pubs}+</p></div></div>
    <div class="stat-tile"><span class="forum-ico"><i class="fas fa-folder-open"></i></span><div><p class="text-[10px] uppercase tracking-wider text-muted font-bold">Subtópicos</p><p class="font-display text-xl font-extrabold text-famr-800">${visibleSubs.length}</p></div></div>
    <div class="stat-tile"><span class="forum-ico new"><i class="fas fa-user-plus"></i></span><div><p class="text-[10px] uppercase tracking-wider text-muted font-bold">Mais recente</p><p class="font-display text-sm font-extrabold text-famr-800 truncate">${esc(newest?.[0]?.nickname || '—')}</p></div></div>
  </section>
  ${(sections||[]).map(sec => {
    if(!canSeeSection(sec)) return '';
    if(sectionNeedsGroup(sec)){
      const grows = (groups||[]).map(g => `<a href="#/grupo/${g.id}" class="forum-row">
        <span class="forum-ico"><i class="fas ${g.icon||'fa-shield-halved'}" style="color:${g.color}"></i></span>
        <div class="flex-1 min-w-0"><b class="text-sm text-famr-800">${esc(g.name)}</b>
          <p class="text-xs text-muted">${GROUP_TYPES[g.group_type]||''} • ${memberCount[g.id]||0} membro(s)</p></div>
        ${myIds.has(g.id)?'<span class="chip chip-ok">SEU GRUPO</span>':''}
        <i class="fas fa-chevron-right text-xs text-muted"></i></a>`).join('');
      return `<section class="card overflow-hidden fade-up">
        <div class="cat-head"><i class="fas ${esc(sec.icon)}"></i> ${esc(sec.name)}
          <a href="#/section/${sec.slug}" class="ml-auto text-[10px] font-bold text-gold-300 hover:text-white normal-case tracking-normal">ver todas →</a></div>
        <div class="divide-y divide-line">${grows || '<p class="p-5 text-sm text-muted text-center">Nenhuma companhia cadastrada.</p>'}</div>
      </section>`;
    }
    const rows = visibleSubs.filter(s => s.section_id === sec.id);
    if(rows.length === 0 && hasAnyRule('section', sec.id)) return '';
    return `<section class="card overflow-hidden fade-up">
      <div class="cat-head"><i class="fas ${esc(sec.icon)}"></i> ${esc(sec.name)}
        <a href="#/section/${sec.slug}" class="ml-auto text-[10px] font-bold text-gold-300 hover:text-white normal-case tracking-normal">ver setor →</a></div>
      <div class="divide-y divide-line">
        ${rows.map(s => forumRow(s, counts, lastMap)).join('') || '<p class="p-5 text-sm text-muted text-center">Nenhum subtópico visível neste setor.</p>'}
      </div>
    </section>`;
  }).join('')}
  <section class="stats-tabs fade-up">
    <div class="st-head">
      <button class="st-tab active" data-stab="usuarios"><i class="fas fa-users"></i> Usuários</button>
      <button class="st-tab" data-stab="aniversarios"><i class="fas fa-cake-candles"></i> Aniversários</button>
      <button class="st-tab" data-stab="grupos"><i class="fas fa-layer-group"></i> Grupos</button>
    </div>
    <div class="st-body stab-panel" id="stab-usuarios">Há <strong>${totalOnline}</strong> usuário online :: ${registeredCount} registrado${registeredCount!==1?'s':''}<br>Último recruta aprovado: ${lastChip}</div>
    <div class="st-body stab-panel hidden" id="stab-aniversarios"><p class="st-empty">Nenhum membro festeja aniversário hoje</p></div>
    <div class="st-body stab-panel hidden" id="stab-grupos"><div class="st-groups-list">
      ${(groups||[]).map(g => `<a href="#/grupo/${g.id}" class="sg-link"><i class="fas ${g.icon||'fa-shield-halved'}" style="color:${g.color}"></i><span>${esc(g.name)}</span><span class="text-[10px] text-muted">(${memberCount[g.id]||0})</span></a>`).join('') || '<em class="text-muted text-xs">Nenhum grupo.</em>'}
    </div></div>
    <div class="st-body st-legend"><strong class="text-famr-800">Legenda:</strong>
      <div class="flex flex-wrap gap-3 mt-1">${legend.map(i=>`<span class="inline-flex items-center gap-1.5"><i class="fas ${i.icon}" style="color:${i.color}"></i><span class="text-muted">${esc(i.label)}</span></span>`).join('')}</div>
    </div>
  </section>`;
  startQsClock(); bindHomeTabs();
}
function bindHomeTabs(){
  document.querySelectorAll('.st-tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.st-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.stab-panel').forEach(p => p.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('stab-'+btn.dataset.stab)?.classList.remove('hidden');
  }));
}
function forumRow(s, counts, lastMap){
  const locked = !canViewSub(s);
  const last = lastMap[s.id];
  const ico = locked ? 'fa-lock' : s.is_request_form ? 'fa-file-signature' : 'fa-comments';
  return `<a href="${locked?'#':'#/sub/'+s.id}" class="forum-row ${locked?'opacity-70 cursor-not-allowed':''}" ${locked?'onclick="return false"':''}>
    <span class="forum-ico ${locked?'lock':s.is_request_form?'new':''}"><i class="fas ${ico}"></i></span>
    <div class="flex-1 min-w-0"><b class="text-sm text-famr-800">${esc(s.name)}</b><p class="text-xs text-muted truncate">${esc(s.description||'')}</p></div>
    <div class="w-20 text-center hidden sm:block"><b class="text-sm">${locked?'—':(counts[s.id]||0)}</b><span class="block text-[10px] text-muted uppercase">tópicos</span></div>
    <div class="w-44 hidden md:block text-[11px] text-muted truncate">
      ${locked ? '<i class="fas fa-lock lock-badge"></i> reservado' : last ? `<i class="fas fa-clock text-gold-500 mr-1"></i>${fmtDate(last.created_at)}<br><span class="ml-4">por <b class="text-famr-700">${esc(last.profiles_view?.nickname||'—')}</b></span>` : 'sem publicações'}
    </div>
  </a>`;
}

/* ══════════ GRUPO ══════════ */
async function renderGroupPage(c, groupId){
  const [{ data: grp }, { data: members }] = await Promise.all([
    supabase.from('groups').select('*, groups(name)').eq('id', groupId).single(),
    supabase.from('user_groups').select('user_id, profiles_view(id,nickname,status)').eq('group_id', groupId)
  ]);
  if(!grp){ c.innerHTML = '<div class="card card-body text-sm text-muted">Grupo não encontrado.</div>'; return; }
  const list = (members||[]).map(m => m.profiles_view).filter(Boolean).filter(p => p.status==='active' && p.nickname !== 'admin master');
  const ids = list.map(m => m.id);
  const { data: ugIcons } = ids.length ? await supabase.from('user_groups').select('user_id, groups(id,icon,order_index,apply_color)').in('user_id', ids) : { data: [] };
  const iconByUser = {};
  (ugIcons||[]).forEach(r => { (iconByUser[r.user_id] = iconByUser[r.user_id] || []).push(r.groups); });
  const isMember = STATE.groups.some(g => g.id === groupId);
  const canManage = isModOf(groupId);
  c.innerHTML = `
  <div class="fade-up">
    <p class="text-xs text-muted mb-2"><a href="#/home" class="text-famr-700 font-bold hover:underline"><i class="fas fa-arrow-left mr-1"></i>Início</a> / <b>${esc(grp.name)}</b></p>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-display text-xl md:text-2xl font-extrabold text-famr-900"><i class="fas ${grp.icon||'fa-shield-halved'} mr-2" style="color:${grp.color}"></i>${esc(grp.name)}</h1>
      <span class="chip ${grp.group_type==='open'?'chip-ok':grp.group_type==='closed'?'chip-wait':'chip-neutral'}">${GROUP_TYPES[grp.group_type]||grp.group_type}</span>
    </div>
    <p class="text-sm text-muted mt-1">${grp.groups ? 'Subgrupo de <b>'+esc(grp.groups.name)+'</b>' : 'Companhia principal'} • ${list.length} membro(s)</p>
    <div class="flex gap-2 mt-3">
      ${!isMember && grp.group_type==='open' ? `<button class="btn btn-primary btn-sm" onclick="joinGroup('${grp.id}')"><i class="fas fa-right-to-bracket"></i> Entrar</button>` : ''}
      ${isMember && grp.group_type==='open' ? `<button class="btn btn-outline btn-sm" onclick="leaveGroup('${grp.id}')"><i class="fas fa-right-from-bracket"></i> Sair</button>` : ''}
      ${canManage ? `<button class="btn btn-gold btn-sm" onclick="groupMembers('${grp.id}')"><i class="fas fa-user-plus"></i> Gerenciar</button>` : ''}
    </div>
  </div>
  <section class="card overflow-hidden fade-up mt-4">
    <div class="cat-head"><i class="fas fa-users"></i> Membros (${list.length})</div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Membro</th><th>Status</th></tr></thead>
    <tbody>${list.map(m => `<tr><td><a href="#/perfil/${m.id}" class="font-bold text-famr-700 hover:underline"><i class="fas ${userIconOf(iconByUser[m.id]||[])} mr-2"></i>${esc(m.nickname)}</a></td><td><span class="chip chip-ok">ATIVO</span></td></tr>`).join('') || '<tr><td colspan="2" class="text-center text-muted py-8">Nenhum membro.</td></tr>'}</tbody></table></div>
  </section>`;
}
window.joinGroup = async id => { const { error } = await supabase.from('user_groups').insert([{ user_id: STATE.profile.id, group_id: id }]); if(error) return toast('Erro: '+error.message,'err'); toast('Você entrou no grupo.'); reloadSessionGroups(); };
window.leaveGroup = async id => { await supabase.from('user_groups').delete().eq('user_id', STATE.profile.id).eq('group_id', id); toast('Você saiu do grupo.'); reloadSessionGroups(); };

async function loadSessionGroups(userId){
  try{
    const { data, error } = await supabase.rpc('famr_get_my_groups');
    if(!error && Array.isArray(data)) return sortGroups(data);
  }catch(e){}
  const { data: ug } = await supabase.from('user_groups').select('group_id').eq('user_id', userId);
  const gids = (ug||[]).map(r=>r.group_id).filter(Boolean);
  if(!gids.length) return [];
  const { data: g } = await supabase.from('groups').select('*').in('id', gids);
  return sortGroups(g||[]);
}
async function reloadSessionGroups(){
  STATE.groups = await loadSessionGroups(STATE.profile.id);
  await loadPerms();
  invalidate('perms:'); invalidate('home:');
  updateUserChip(); route();
}

async function loadPerms(){
  const gids = new Set(STATE.groups.map(g=>g.id));
  const rows = await cachedQuery('perms:all', ()=> supabase.from('group_permissions').select('*'), 120_000);
  const all = rows.data||rows||[];
  STATE.ruleIndex = new Set(all.map(p=>p.target_type+':'+p.target_id));
  const merged={};
  all.forEach(p=>{
    if(p.group_id===null) return;
    if(!gids.has(p.group_id)) return;
    const k=p.target_type+':'+p.target_id;
    const m=merged[k]||(merged[k]={view:false,create:false,edit:false,del:false,mod:false});
    m.view=m.view||p.can_view;m.create=m.create||p.can_create;m.edit=m.edit||p.can_edit;m.del=m.del||p.can_delete;m.mod=m.mod||p.is_moderator;
  });
  STATE.perms=merged;
  const pa={};
  all.forEach(p=>{ if(p.group_id===null) pa[p.target_type+':'+p.target_id]={view:!!p.can_view,create:!!p.can_create,edit:!!p.can_edit,del:!!p.can_delete,mod:false}; });
  STATE.permAll=pa;
  STATE.modGroups=new Set(all.filter(p=>p.is_moderator&&p.group_id!==null&&gids.has(p.group_id)).map(p=>p.group_id));
}

/* ══════════ RENDER SECTION ══════════ */
async function renderSection(c, slug){
  const { data: sec } = await supabase.from('sections').select('*').eq('slug', slug).single();
  if(!sec){ c.innerHTML = '<div class="card card-body text-sm text-muted">Seção não encontrada.</div>'; return; }
  if(slug === 'listagem')      return await renderListagem(c, sec);
  if(slug === 'requerimentos') return await renderRequerimentos(c, sec);
  if(slug === 'documentos')    return await renderDocumentos(c, sec);
  if(slug === 'companhias')    return await renderCompanhias(c, sec);
  if(!canViewSection(sec)){ c.innerHTML = `<div class="card card-body text-center py-14"><i class="fas fa-lock text-3xl text-gold-500"></i><h2 class="font-display font-bold text-xl mt-3">Acesso restrito</h2></div>`; return; }
  const { data: subs } = await supabase.from('subtopics').select('*').eq('section_id', sec.id).order('order_index');
  const ids = (subs||[]).map(s => s.id);
  const { data: posts } = ids.length ? await supabase.from('posts').select('id,subtopic_id,title,created_at,profiles_view(nickname)').in('subtopic_id', ids).order('created_at',{ascending:false}).limit(300) : { data: [] };
  const counts = {}, lastMap = {};
  (posts||[]).forEach(p => { counts[p.subtopic_id]=(counts[p.subtopic_id]||0)+1; if(!lastMap[p.subtopic_id]) lastMap[p.subtopic_id]=p; });
  c.innerHTML = secHead(sec) + `
  <section class="card overflow-hidden fade-up">
    <div class="cat-head"><i class="fas ${esc(sec.icon)}"></i> ${esc(sec.name)}</div>
    <div class="divide-y divide-line">${(subs||[]).filter(canViewSub).map(s => forumRow(s, counts, lastMap)).join('') || '<p class="p-5 text-sm text-muted text-center">Nenhum subtópico.</p>'}</div>
  </section>`;
}
const secHead = sec => `<div class="flex flex-wrap items-center justify-between gap-3 fade-up">
  <div><p class="text-xs font-bold tracking-[0.3em] uppercase text-gold-600">Setor</p>
  <h1 class="font-display text-2xl md:text-3xl font-extrabold text-famr-900"><i class="fas ${esc(sec.icon)} text-gold-500 mr-2"></i>${esc(sec.name)}</h1>
  <p class="text-sm text-muted mt-1">${esc(sec.description||'')}</p></div><div class="star-row text-sm">★★★★</div></div>`;

/* ══════════ COMPANHIAS ══════════ */
async function renderCompanhias(c, sec){
  if(!isAdmin() && (STATE.groups||[]).length===0){
    c.innerHTML = secHead(sec) + `<div class="card card-body text-center py-14 fade-up"><i class="fas fa-user-shield text-4xl text-gold-500"></i><h2 class="font-display font-bold text-xl mt-3">Acesso restrito</h2><p class="text-sm text-muted mt-1">Você ainda não pertence a nenhuma companhia.</p></div>`;
    return;
  }
  const [{ data: groups }, { data: allUG }] = await Promise.all([
    supabase.from('groups').select('id,name,color,icon,group_type,order_index,parent_id').neq('group_type','invisible').order('order_index'),
    supabase.from('user_groups').select('group_id').limit(10000)
  ]);
  const cnt = {}; (allUG||[]).forEach(m => cnt[m.group_id] = (cnt[m.group_id]||0)+1);
  const myIds = new Set((STATE.groups||[]).map(g=>g.id));
  c.innerHTML = secHead(sec) + `
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-up">
    ${(groups||[]).map(g => `<div class="card card-hover p-5">
      <div class="flex items-center justify-between">
        <span class="forum-ico"><i class="fas ${g.icon||'fa-shield-halved'}" style="color:${g.color}"></i></span>
        <span class="chip ${g.group_type==='open'?'chip-ok':g.group_type==='closed'?'chip-wait':'chip-neutral'}">${GROUP_TYPES[g.group_type]||g.group_type}</span>
      </div>
      <h3 class="font-bold mt-3" style="color:${g.color}">${esc(g.name)}</h3>
      <p class="text-xs text-muted mt-1">${cnt[g.id]||0} membro(s)</p>
      ${myIds.has(g.id) ? '<span class="chip chip-ok mt-2"><i class="fas fa-check mr-1"></i>Seu grupo</span>' : ''}
      <a href="#/grupo/${g.id}" class="btn btn-outline btn-sm mt-3"><i class="fas fa-users"></i> Ver membros</a>
    </div>`).join('') || '<div class="card card-body text-sm text-muted col-span-full text-center py-10">Nenhuma companhia.</div>'}
  </div>`;
}

/* ══════════ SUBTÓPICO ══════════ */
async function renderSubtopic(c, id, page=0){
  const { data: sub } = await supabase.from('subtopics').select('*,sections(name,slug)').eq('id', id).single();
  if(!sub){ c.innerHTML = '<div class="card card-body text-sm text-muted">Subtópico não encontrado.</div>'; return; }
  if(!canViewSub(sub)){ c.innerHTML = `<div class="card card-body text-center py-14"><i class="fas fa-lock text-3xl text-gold-500"></i><h2 class="font-display font-bold text-xl mt-3">Acesso restrito</h2></div>`; return; }
  window._curSub = sub;
  const offset = page*PAGE_SIZE;
  const { data: posts, count } = await supabase.from('posts')
    .select('*,profiles_view(nickname)', { count:'exact' })
    .eq('subtopic_id', id).order('created_at',{ascending:false}).range(offset, offset+PAGE_SIZE-1);
  window._postsCache = Object.fromEntries((posts||[]).map(p => [p.id, p]));
  const totalPages = Math.ceil((count||0)/PAGE_SIZE);
  c.innerHTML = `
  <div class="fade-up">
    <p class="text-xs text-muted mb-2"><a href="#/section/${sub.sections?.slug}" class="text-famr-700 font-bold hover:underline"><i class="fas fa-arrow-left mr-1"></i>${esc(sub.sections?.name||'')}</a> / <b>${esc(sub.name)}</b></p>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-display text-xl md:text-2xl font-extrabold text-famr-900"><i class="fas fa-comments text-gold-500 mr-2"></i>${esc(sub.name)}</h1>
      ${sub.is_request_form ? `<button class="btn btn-gold btn-sm" onclick='openRequestForm(${JSON.stringify(sub).replace(/'/g,"&#39;")})'><i class="fas fa-pen-to-square"></i> Abrir protocolo</button>`
        : canCreateIn(sub) ? `<button class="btn btn-primary btn-sm" onclick="document.getElementById('new-topic').classList.toggle('hidden')"><i class="fas fa-plus"></i> Novo tópico</button>` : ''}
    </div>
  </div>
  ${canCreateIn(sub) && !sub.is_request_form ? `<form id="new-topic" class="hidden card card-body grid gap-3 fade-up" onsubmit="return newPost(event,'${sub.id}')">
      <input name="title" class="input" placeholder="Título do tópico" required>
      <textarea name="content" class="input" rows="4" placeholder="Conteúdo..." required></textarea>
      <input name="link" class="input" placeholder="Link de anexo (opcional)">
      <button class="btn btn-gold btn-sm justify-self-start"><i class="fas fa-paper-plane"></i> Publicar</button></form>` : ''}
  <section class="card overflow-hidden fade-up">
    <div class="cat-head"><i class="fas fa-inbox"></i> Tópicos <span class="ml-auto text-[10px] normal-case tracking-normal text-gold-300">${count||0} no total</span></div>
    <div class="divide-y divide-line">
      ${(posts||[]).map(p => `<div class="topic-row" onclick="openTopic('${p.id}')">
        <span class="forum-ico ${p.pinned?'new':''}"><i class="fas ${p.pinned?'fa-thumbtack':'fa-comment'}"></i></span>
        <div class="flex-1 min-w-0"><b class="text-sm text-famr-800">${esc(p.title)}</b><p class="text-[11px] text-muted">por <b class="text-famr-700">${esc(p.profiles_view?.nickname||'—')}</b> • ${fmtDate(p.created_at)}</p></div>
        <i class="fas fa-chevron-right text-xs text-muted"></i></div>`).join('') || '<p class="p-6 text-sm text-muted text-center">Nenhum tópico ainda.</p>'}
    </div>
    ${totalPages>1 ? `<div class="p-3 flex justify-center gap-2 items-center border-t border-line">
      ${page>0?`<button class="btn btn-outline btn-sm" onclick="renderSubtopic(document.getElementById('content'),'${id}',${page-1})">← Anterior</button>`:''}
      <span class="text-xs text-muted">Página ${page+1}/${totalPages}</span>
      ${page<totalPages-1?`<button class="btn btn-outline btn-sm" onclick="renderSubtopic(document.getElementById('content'),'${id}',${page+1})">Próxima →</button>`:''}
    </div>` : ''}
  </section>`;
}
window.openTopic = id => {
  const p = window._postsCache?.[id]; if(!p) return;
  const sub = window._curSub;
  const mine = p.author_id === STATE.profile.id;
  openModal(`<i class="fas fa-comment text-gold-500 mr-2"></i>${esc(p.title)}`,
    `<div class="text-[11px] text-muted mb-3">${esc(p.profiles_view?.nickname||'—')} • ${fmtDate(p.created_at)}</div>
     <p class="text-sm whitespace-pre-wrap text-ink">${esc(p.content)}</p>
     ${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm mt-4"><i class="fab fa-google-drive"></i> Abrir anexo</a>` : ''}`,
    `${mine && canEditIn(sub) ? `<button class="btn btn-outline btn-sm mr-auto" onclick="editPost('${p.id}')"><i class="fas fa-pen"></i> Editar</button>` : ''}
     ${mine || canDeleteIn(sub) ? `<button class="btn btn-danger btn-sm" onclick="delPost('${p.id}')"><i class="fas fa-trash"></i> Excluir</button>` : ''}
     <button class="btn btn-outline btn-sm" onclick="closeModal()">Fechar</button>`);
};
window.editPost = id => {
  const p = window._postsCache?.[id]; if(!p) return;
  openModal('<i class="fas fa-pen text-gold-500 mr-2"></i>Editar',
    `<label class="field"><span>Conteúdo</span><textarea id="edit-content" class="input" rows="6">${esc(p.content)}</textarea></label>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="saveEditPost('${id}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveEditPost = async id => {
  const content = document.getElementById('edit-content').value;
  const { error } = await supabase.from('posts').update({ content }).eq('id', id);
  if(error) return toast('Erro: '+error.message,'err');
  await famrLog('POST_EDITADO', { id });
  invalidate('posts:'); invalidate('home:'); closeModal(); toast('Atualizado.'); route();
};
window.newPost = async function(e, subtopicId){
  e.preventDefault(); const f = e.target;
  const { error } = await supabase.from('posts').insert([{ subtopic_id: subtopicId, title: f.title.value, content: f.content.value, link: f.link.value||null, author_id: STATE.profile.id }]);
  if(error){ toast('Erro: '+error.message,'err'); return false; }
  await famrLog('POST_CRIADO', { subtopicId });
  invalidate('posts:'); invalidate('home:'); toast('Publicado!'); route(); return false;
};
window.delPost = async function(id){
  if(!await confirmDlg('Excluir esta publicação?', { title:'Excluir', okText:'Excluir', danger:true })) return;
  await supabase.from('posts').delete().eq('id', id);
  await famrLog('POST_EXCLUIDO', { id });
  invalidate('posts:'); invalidate('home:'); closeModal(); toast('Excluída.'); route();
};

/* ══════════ LISTAGEM ══════════ */
async function renderListagem(c, sec){
  const { data: entries } = await supabase.from('listagem_entries').select('*').order('created_at',{ascending:false}).limit(100);
  c.innerHTML = secHead(sec) + `
  <div class="card fade-up">
    <div class="cat-head"><i class="fas fa-list-ul"></i> Registros oficiais</div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Registro</th><th>Categoria</th><th>Detalhes</th><th>Data</th></tr></thead>
    <tbody>${(entries||[]).map(e => `<tr>
      <td class="font-bold text-famr-800">${esc(e.title)}</td><td><span class="chip chip-neutral">${esc(e.category)}</span></td>
      <td class="text-xs text-muted">${Object.entries(e.data||{}).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join(' • ')}</td>
      <td class="text-xs text-muted">${fmtDate(e.created_at)}</td></tr>`).join('') || '<tr><td colspan="4" class="text-center text-muted py-8">Nenhum registro.</td></tr>'}</tbody></table></div>
  </div>`;
}

/* ══════════ REQUERIMENTOS ══════════ */
async function renderRequerimentos(c, sec){
  const { data: subs } = await supabase.from('subtopics').select('*').eq('section_id', sec.id).order('order_index');
  const { data: mine } = await supabase.from('requests').select('*,subtopics(name)').eq('author_id', STATE.profile.id).order('created_at',{ascending:false}).limit(30);
  c.innerHTML = secHead(sec) + `
  <div class="grid lg:grid-cols-3 gap-6">
    <div class="space-y-4 fade-up">
      ${(subs||[]).filter(canViewSub).map(s => `<div class="card card-hover p-5">
          <h3 class="font-display font-bold">${esc(s.name)}</h3>
          <p class="text-xs text-muted mt-1">${esc(s.description||'')}</p>
          <button class="btn btn-gold btn-sm mt-3" onclick='openRequestForm(${JSON.stringify(s).replace(/'/g,"&#39;")})'><i class="fas fa-pen-to-square"></i> Abrir protocolo</button>
        </div>`).join('') || '<div class="card card-body text-sm text-muted">Nenhum formulário disponível.</div>'}
    </div>
    <div class="lg:col-span-2 card fade-up">
      <div class="cat-head"><i class="fas fa-inbox"></i> Meus protocolos</div>
      <div class="divide-y divide-line max-h-[560px] overflow-auto">
        ${(mine||[]).map(r => `<div class="p-4 flex items-center justify-between gap-3">
          <div><p class="font-bold text-sm">${esc(r.title)}</p><p class="text-[11px] text-muted">${esc(r.subtopics?.name||'')} • ${fmtDate(r.created_at)}</p></div>
          ${statusChip(r.status)}</div>`).join('') || '<p class="p-8 text-center text-sm text-muted">Nenhum protocolo.</p>'}
      </div></div>
  </div>`;
}
window.openRequestForm = function(sub){
  const fields = sub.form_fields || [];
  openModal(`<i class="fas fa-file-signature text-gold-500 mr-2"></i>${esc(sub.name)}`,
    fields.map(f => `<label class="field"><span>${esc(f.label)}${f.required?' *':''}</span>
      ${f.type==='textarea' ? `<textarea data-f="${esc(f.label)}" data-req="${!!f.required}" class="input" rows="3"></textarea>` : `<input data-f="${esc(f.label)}" data-req="${!!f.required}" class="input" type="${f.type||'text'}">`}</label>`).join(''),
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="submitRequest('${sub.id}')"><i class="fas fa-paper-plane"></i> Enviar</button>`);
};
window.submitRequest = async function(subtopicId){
  const inputs = [...document.querySelectorAll('#modal-body [data-f]')];
  const data = {}; let ok = true;
  inputs.forEach(i => { data[i.dataset.f] = i.value.trim(); if(i.dataset.req==='true' && !i.value.trim()) ok = false; });
  if(!ok){ toast('Preencha campos obrigatórios.', 'warn'); return; }
  const title = (Object.values(data)[0] || 'Protocolo') + '';
  const { error } = await supabase.from('requests').insert([{ subtopic_id: subtopicId, author_id: STATE.profile.id, title, form_data: data }]);
  if(error){ toast('Erro: '+error.message, 'err'); return; }
  closeModal(); toast('Protocolo enviado!'); route();
};

/* ═══════════════════════════════════════════════════
   DOCUMENTOS PRINCIPAIS — COM SISTEMA DE PÁGINAS (v37)
   ═══════════════════════════════════════════════════ */
let _wsDirty=false, _wsSaving=false;

async function renderDocumentos(c, sec){
  if(!canViewSection(sec)){ c.innerHTML = secHead(sec)+lockCard(); return; }
  const canManage = isAdmin() || (STATE.perms?.['section:'+sec.id]?.create);
  
  /* Carrega páginas (doc_pages) e documentos gerais */
  const [{ data: pages }, { data: generalDocs }] = await Promise.all([
    cachedQuery('docpages:list', ()=> supabase.from('doc_pages').select('*').order('order_index'), 30_000),
    cachedQuery('docs:list-general', ()=> supabase.from('documents').select('id,title,category,cover_url,updated_at,author_id,profiles_view(nickname)').is('page_id', null).order('updated_at',{ascending:false}), 30_000)
  ]);
  
  c.innerHTML = secHead(sec) + `
  <div class="flex flex-wrap items-center gap-2 mb-4 fade-up">
    ${canManage?`
      <button class="btn btn-primary btn-sm" onclick="showNewDocDialog(null)"><i class="fas fa-plus"></i> Novo Documento</button>
      <button class="btn btn-gold btn-sm" onclick="docPageForm()"><i class="fas fa-file-circle-plus"></i> Nova Página</button>
    `:''}
    <input id="doc-q" class="input !py-1.5 w-56 ml-auto" placeholder="Buscar..." oninput="filterDocs(this.value)">
  </div>
  
  <!-- Páginas (sub-documentos) -->
  ${(pages||[]).length ? `
  <section class="mb-6 fade-up">
    <h2 class="font-display text-lg font-extrabold text-famr-900 mb-3"><i class="fas fa-layer-group text-gold-500 mr-2"></i>Páginas</h2>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      ${(pages||[]).map(p => docPageCard(p, canManage)).join('')}
    </div>
  </section>` : ''}
  
  <!-- Documentos Gerais (sem página) -->
  <section class="fade-up">
    <h2 class="font-display text-lg font-extrabold text-famr-900 mb-3"><i class="fas fa-file-lines text-famr-700 mr-2"></i>Documentos Gerais</h2>
    <div id="doc-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      ${(generalDocs||[]).map(d=>docCard(d, canManage, null)).join('') || '<div class="card card-body text-sm text-muted col-span-full text-center py-10">Nenhum documento geral.</div>'}
    </div>
  </section>`;
}

function lockCard(){ return `<div class="card card-body text-center py-14"><i class="fas fa-lock text-3xl text-gold-500"></i><h2 class="font-display font-bold text-xl mt-3">Acesso restrito</h2></div>`; }

function docPageCard(p, canManage){
  return `<div class="card card-hover overflow-hidden doc-page-item" data-name="${esc((p.name||'').toLowerCase())}">
    <div class="p-5">
      <div class="flex items-start justify-between gap-2">
        <span class="forum-ico"><i class="fas ${p.icon||'fa-folder-open'}" style="color:${p.color||'#14563f'}"></i></span>
        ${canManage?`
          <div class="flex gap-1">
            <button class="btn btn-outline btn-sm" onclick="docPageForm('${p.id}')" title="Editar"><i class="fas fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="delDocPage('${p.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
          </div>`:''}
      </div>
      <h3 class="font-bold mt-3 text-famr-800">${esc(p.name)}</h3>
      <p class="text-xs text-muted mt-1">${esc(p.description||'')}</p>
      <p class="text-[10px] text-muted mt-2"><i class="fas fa-hashtag mr-1"></i>/${esc(p.slug||'')}</p>
      <a href="#/doc-page/${p.id}" class="btn btn-primary btn-sm mt-3 w-full justify-center"><i class="fas fa-folder-open"></i> Abrir Página</a>
    </div>
  </div>`;
}

function docCard(d, canManage, pageId){
  return `<div class="card card-hover overflow-hidden doc-item" data-title="${esc((d.title||'').toLowerCase())}">
    ${d.cover_url?`<img src="${esc(d.cover_url)}" class="w-full h-32 object-cover" alt="" loading="lazy">`:''}
    <div class="p-4">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-bold text-famr-800 leading-snug">${esc(d.title)}</h3>
        ${d.category?`<span class="chip chip-neutral shrink-0">${esc(d.category)}</span>`:''}
      </div>
      <p class="text-[11px] text-muted mt-1">por <b>${esc(d.profiles_view?.nickname||'—')}</b> • ${fmtDate(d.updated_at)}</p>
      <div class="flex gap-1 mt-3">
        <button class="btn btn-outline btn-sm" onclick="viewDoc('${d.id}')"><i class="fas fa-book-open"></i> Ler</button>
        ${canManage?`<a href="#/doc-edit/${d.id}" class="btn btn-outline btn-sm"><i class="fas fa-pen"></i></a>
        <button class="btn btn-danger btn-sm" onclick="delDoc('${d.id}')"><i class="fas fa-trash"></i></button>`:''}
      </div>
    </div>
  </div>`;
}

/* Renderiza uma Página específica (lista seus documentos + botão novo) */
async function renderDocPage(c, pageId){
  const { data: pg } = await supabase.from('doc_pages').select('*').eq('id', pageId).single();
  if(!pg){ c.innerHTML = '<div class="card card-body text-sm text-muted">Página não encontrada.</div>'; return; }
  const canManage = isAdmin();
  const { data: docs } = await supabase.from('documents').select('id,title,category,cover_url,updated_at,author_id,profiles_view(nickname)').eq('page_id', pageId).order('updated_at',{ascending:false});
  c.innerHTML = `
  <div class="fade-up">
    <p class="text-xs text-muted mb-2"><a href="#/section/documentos" class="text-famr-700 font-bold hover:underline"><i class="fas fa-arrow-left mr-1"></i>Documentos Principais</a> / <b>${esc(pg.name)}</b></p>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-display text-xl md:text-2xl font-extrabold text-famr-900"><i class="fas ${pg.icon||'fa-folder-open'} mr-2" style="color:${pg.color||'#14563f'}"></i>${esc(pg.name)}</h1>
      ${canManage?`<button class="btn btn-primary btn-sm" onclick="showNewDocDialog('${pg.id}')"><i class="fas fa-plus"></i> Novo Documento</button>`:''}
    </div>
    <p class="text-sm text-muted mt-1">${esc(pg.description||'')}</p>
  </div>
  <section class="card overflow-hidden fade-up mt-4">
    <div class="cat-head"><i class="fas fa-file-lines"></i> Documentos nesta página <span class="ml-auto text-[10px] normal-case tracking-normal text-gold-300">${(docs||[]).length} item(ns)</span></div>
    <div class="p-4">
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        ${(docs||[]).map(d=>docCard(d, canManage, pg.id)).join('') || '<div class="card card-body text-sm text-muted col-span-full text-center py-10">Nenhum documento nesta página.</div>'}
      </div>
    </div>
  </section>`;
}

/* Diálogo para escolher onde criar o novo documento */
window.showNewDocDialog = async function(preferredPageId){
  const { data: pages } = await supabase.from('doc_pages').select('id,name,icon,color').order('order_index');
  const options = [
    `<option value="">📄 Sem página (geral)</option>`,
    ...(pages||[]).map(p => `<option value="${p.id}" ${preferredPageId===p.id?'selected':''}>${esc(p.name)}</option>`)
  ].join('');
  openModal('<i class="fas fa-file-circle-plus text-gold-500 mr-2"></i>Novo Documento',
    `<label class="field"><span>Título</span><input id="nd-title" class="input" placeholder="Ex.: Relatório Mensal S3"></label>
     <label class="field"><span>Categoria (opcional)</span><input id="nd-category" class="input" placeholder="Ex.: Operacional"></label>
     <label class="field"><span>Página destino</span><select id="nd-page" class="input">${options}</select></label>
     <p class="text-xs text-muted mt-2"><i class="fas fa-info-circle"></i> Após confirmar, você será levado ao editor completo.</p>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="confirmNewDoc()"><i class="fas fa-check"></i> Criar e abrir editor</button>`);
};

window.confirmNewDoc = async function(){
  const title = document.getElementById('nd-title').value.trim();
  const category = document.getElementById('nd-category').value.trim();
  const pageId = document.getElementById('nd-page').value || null;
  if(!title) return toast('Título obrigatório.','warn');
  closeModal();
  /* Navega para o workspace com metadados passados via hash query-like */
  const meta = encodeURIComponent(JSON.stringify({ title, category, page_id: pageId }));
  location.hash = `#/doc-new/${meta}`;
};

window.filterDocs = q => {
  q=q.toLowerCase().trim();
  document.querySelectorAll('.doc-item, .doc-page-item').forEach(el=>{
    const t = (el.dataset.title || el.dataset.name || '').toLowerCase();
    el.style.display = (!q || t.includes(q))?'':'none';
  });
};

window.viewDoc = async id => {
  const { data:d } = await supabase.from('documents').select('*,profiles_view(nickname)').eq('id',id).single();
  if(!d) return toast('Não encontrado.','err');
  openModal(`<i class="fas fa-book-open text-gold-500 mr-2"></i>${esc(d.title)}`,
    `<div class="text-[11px] text-muted mb-3">por <b>${esc(d.profiles_view?.nickname||'—')}</b> • ${fmtDate(d.updated_at)}</div>
     <article class="doc-body !bg-transparent !shadow-none !p-0 !min-h-0" style="pointer-events:none">${sanitizeHtml(d.body_html||'')}</article>`,
    `<button class="btn btn-outline btn-sm mr-auto" onclick="downloadDoc('${id}')"><i class="fas fa-download"></i> Baixar .doc</button>
     <button class="btn btn-outline btn-sm" onclick="closeModal()">Fechar</button>`);
};
window.downloadDoc = async id => {
  const { data:d } = await supabase.from('documents').select('title,body_html').eq('id',id).single();
  if(!d) return;
  const fullHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(d.title)}</title></head><body>${d.body_html}</body></html>`;
  const blob = new Blob(['\ufeff'+fullHtml], {type:'application/msword'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=(d.title||'documento').replace(/[^\w\-]+/g,'_')+'.doc'; a.click(); URL.revokeObjectURL(url);
};
window.delDoc = async id => {
  if(!await confirmDlg('Excluir este documento permanentemente?', { title:'Excluir', okText:'Excluir', danger:true })) return;
  await supabase.from('documents').delete().eq('id',id);
  await famrLog('DOC_DEL', { id });
  invalidate('docs:'); invalidate('docpages:'); closeModal(); toast('Excluído.'); route();
};

/* Formulário de criação/edição de Página */
window.docPageForm = async id => {
  let p = { name:'', slug:'', description:'', icon:'fa-folder-open', color:'#14563f', order_index:0 };
  if(id){
    const r = await supabase.from('doc_pages').select('*').eq('id', id).single();
    if(r.data) p = r.data;
  }
  openModal(`<i class="fas fa-file-circle-plus text-gold-500 mr-2"></i>${id?'Editar':'Nova'} Página`,
    `<label class="field"><span>Nome</span><input id="dp-name" class="input" value="${esc(p.name)}"></label>
     <label class="field"><span>Slug (URL amigável)</span><input id="dp-slug" class="input" value="${esc(p.slug)}" placeholder="ex.: relatorios-mensais"></label>
     <label class="field"><span>Descrição</span><textarea id="dp-desc" class="input" rows="2">${esc(p.description||'')}</textarea></label>
     <div class="grid grid-cols-2 gap-3">
       <label class="field"><span>Ícone</span>
         <div class="icon-grid" id="dp-icon-grid" style="max-height:200px;overflow:auto;border:1px solid #dee2e6;border-radius:8px;padding:6px;">
           ${SAFE_ICONS.slice(0,80).map(ic => `<button type="button" class="icon-opt ${p.icon===ic?'sel':''}" data-icon="${ic}" onclick="pickIconDP(this)" title="${ic}"><i class="fas ${ic}"></i></button>`).join('')}
         </div>
         <input type="hidden" id="dp-icon" value="${esc(p.icon||'fa-folder-open')}">
       </label>
       <label class="field"><span>Cor</span><input id="dp-color" type="color" class="input !p-1 h-11" value="${p.color||'#14563f'}"></label>
     </div>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="saveDocPage('${id||''}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.pickIconDP = btn => {
  document.querySelectorAll('#dp-icon-grid .icon-opt').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  document.getElementById('dp-icon').value = btn.dataset.icon;
};
window.saveDocPage = async id => {
  const row = {
    name: document.getElementById('dp-name').value.trim(),
    slug: document.getElementById('dp-slug').value.trim().toLowerCase().replace(/\s+/g,'-'),
    description: document.getElementById('dp-desc').value.trim(),
    icon: document.getElementById('dp-icon').value.trim() || 'fa-folder-open',
    color: document.getElementById('dp-color').value
  };
  if(!row.name || !row.slug) return toast('Nome e slug obrigatórios.','warn');
  let error;
  if(id){ ({ error } = await supabase.from('doc_pages').update(row).eq('id', id)); }
  else {
    const { count } = await supabase.from('doc_pages').select('*', { count:'exact', head:true });
    row.order_index = (count||0)+1;
    ({ error } = await supabase.from('doc_pages').insert([row]));
  }
  if(error) return toast('Erro: '+error.message,'err');
  await famrLog('DOC_PAGE_SAVE', row);
  invalidate('docpages:'); invalidate('docs:');
  closeModal(); toast('Página salva.'); route();
};
window.delDocPage = async id => {
  if(!await confirmDlg('Excluir esta página? Os documentos dentro dela ficarão como "gerais".', { title:'Excluir', okText:'Excluir', danger:true })) return;
  await supabase.from('documents').update({ page_id: null }).eq('page_id', id);
  await supabase.from('doc_pages').delete().eq('id', id);
  await famrLog('DOC_PAGE_DEL', { id });
  invalidate('docpages:'); invalidate('docs:'); toast('Excluída.'); route();
};

function closeDocWorkspace(){
  const old = document.getElementById('doc-workspace');
  if(old) old.remove();
  _wsDirty=false; _wsSaving=false;
  document.removeEventListener('keydown', ctrlSaveHandler);
}

window.renderDocWorkspace = async function(docId, metaEncoded){
  closeDocWorkspace();
  let d = { title:'', category:'', body_html:'', cover_url:null, page_id:null };
  
  /* Se vier metadados novos (criação via diálogo) */
  if(metaEncoded){
    try{
      const meta = JSON.parse(decodeURIComponent(metaEncoded));
      d.title = meta.title || '';
      d.category = meta.category || '';
      d.page_id = meta.page_id || null;
    }catch(e){}
  }
  
  if(docId){
    const r = await supabase.from('documents').select('*').eq('id',docId).single();
    if(!r.data){ toast('Documento não encontrado.','err'); location.hash='#/section/documentos'; return; }
    d = r.data;
  }
  
  /* Busca nome da página para exibir breadcrumb */
  let pageName = null;
  if(d.page_id){
    const pr = await supabase.from('doc_pages').select('name').eq('id', d.page_id).single();
    pageName = pr.data?.name || null;
  }
  
  const ws = document.createElement('div');
  ws.id = 'doc-workspace';
  ws.className = 'doc-workspace';
  ws.innerHTML = `
    <div class="dw-bar">
      <button class="dw-back" onclick="exitDocWorkspace()"><i class="fas fa-arrow-left"></i> Voltar</button>
      <span class="text-xs text-muted mx-2">${pageName ? `<i class="fas fa-folder-open mr-1"></i>${esc(pageName)} /` : '<i class="fas fa-file-lines mr-1"></i>Geral /'}</span>
      <input class="dw-title-in" id="dw-title" placeholder="Título do documento" value="${esc(d.title)}" maxlength="200">
      <input class="dw-cat-in" id="dw-category" placeholder="Categoria (opcional)" value="${esc(d.category||'')}">
      <span class="dw-status" id="dw-status">${docId?'carregado':'novo documento'}</span>
      <button class="dw-save" id="dw-save-btn" onclick="saveCurrentDoc('${docId||''}','${d.page_id||''}')"><i class="fas fa-floppy-disk"></i> Salvar</button>
    </div>
    <div class="dw-toolbar" id="dw-toolbar"></div>
    <div class="dw-canvas" id="dw-canvas">
      <div class="doc-page">
        <div class="doc-body" id="dw-body" contenteditable="true" spellcheck="false">${d.body_html || '<p class="doc-empty-hint">Comece a escrever...</p>'}</div>
      </div>
    </div>`;
  document.body.appendChild(ws);
  initToolbar();
  wireEvents();
  setupImageInteractivity();
  document.getElementById('dw-title').focus();
};

window.exitDocWorkspace = async function(){
  if(_wsDirty){
    const choice = await new Promise(res => {
      openModal('<i class="fas fa-triangle-exclamation text-gold-500 mr-2"></i>Alterações não salvas',
        `<p class="text-sm text-muted">Este documento tem alterações não salvas.</p>`,
        `<button class="btn btn-outline btn-sm" id="_ex-cancel">Continuar editando</button>
         <button class="btn btn-danger btn-sm" id="_ex-discard">Descartar</button>
         <button class="btn btn-primary btn-sm" id="_ex-save">Salvar e sair</button>`);
      document.getElementById('_ex-save').onclick = ()=>{ closeModal(); res('save'); };
      document.getElementById('_ex-discard').onclick = ()=>{ closeModal(); res('discard'); };
      document.getElementById('_ex-cancel').onclick = ()=>{ closeModal(); res('cancel'); };
    });
    if(choice==='cancel') return;
    if(choice==='save'){
      const did = location.hash.startsWith('#/doc-edit/')?location.hash.split('/')[2]:'';
      await saveCurrentDoc(did, '');
      if(_wsSaving) return;
      if(_wsDirty) return;
    }
  }
  closeDocWorkspace();
  if(location.hash==='#/doc-new'||location.hash.startsWith('#/doc-edit')) location.hash='#/section/documentos';
  else history.back();
};

/* ─── HELPERS DE EXECUÇÃO ROBUSTA ─── */
function getBody(){ return document.getElementById('dw-body'); }
function focusBody(){ 
  const b = getBody(); 
  if(b){ b.focus(); }
}

function execSafe(cmd, val=null){
  focusBody();
  try{
    if(cmd === 'formatBlock'){
      let success = false;
      try{ success = document.execCommand('formatBlock', false, val); }catch(e){}
      if(!success && val){
        const bare = val.replace(/[<>]/g,'');
        try{ success = document.execCommand('formatBlock', false, bare); }catch(e){}
      }
      if(!success && val){
        manuallyApplyTag(val.replace(/[<>]/g,''));
      }
    } else {
      document.execCommand(cmd, false, val);
    }
  }catch(e){ console.warn('[FAMR] Cmd fail:', cmd, e); }
  markDirty();
  syncState();
}

function manuallyApplyTag(tagName){
  const sel = window.getSelection();
  if(!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  let node = range.commonAncestorContainer;
  while(node.parentNode && node.parentNode !== getBody() && !['P','DIV','LI','BLOCKQUOTE'].includes(node.parentNode.tagName)){
    node = node.parentNode;
  }
  if(node.nodeType === 3){
     const parent = node.parentElement;
     if(parent && parent.tagName !== tagName.toUpperCase()){
        const newEl = document.createElement(tagName);
        newEl.innerHTML = parent ? parent.innerHTML : node.textContent;
        if(parent) parent.replaceWith(newEl);
        else node.replaceWith(newEl);
        const r = document.createRange();
        r.selectNodeContents(newEl);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
     }
  } else if(node.nodeType === 1){
     if(node.tagName !== tagName.toUpperCase()){
        const newEl = document.createElement(tagName);
        newEl.innerHTML = node.innerHTML;
        node.replaceWith(newEl);
     }
  }
}

/* ─── TOOLBAR v37 ─── */
function initToolbar(){
  const bar = document.getElementById('dw-toolbar');
  bar.innerHTML = '';

  const COLORS_TEXT = ['#000000','#434343','#666666','#999999','#b7b7b7','#cccccc','#efefef','#ffffff','#ff0000','#ff9900','#ffff00','#00ff00','#00ffff','#0000ff','#9900ff','#ff00ff'];
  const COLORS_HILITE = ['#fce8b2','#d9ead3','#c9daf8','#ead1dc','#fff2cc','#d0e3e3','#f4cccc','#e0e0e0'];

  function addBtn(label, iconClass, actionFn, isActiveCheck=null){
    const btn = document.createElement('button');
    btn.type='button'; btn.className='dw-tool-fixed'; btn.title=label;
    btn.innerHTML = `<i class="fas ${iconClass}"></i>`;
    btn.onclick = (e) => { e.preventDefault(); actionFn(); };
    if(isActiveCheck){ btn.dataset.check = 'true'; btn._checkFn = isActiveCheck; }
    bar.appendChild(btn);
    return btn;
  }

  function addSep(){ const s=document.createElement('span'); s.className='dw-sep'; bar.appendChild(s); }

  function addSelect(options, onChangeFn){
    const sel = document.createElement('select');
    sel.className='dw-select';
    options.forEach(([val,text])=>{
      const o=document.createElement('option'); o.value=val; o.textContent=text; sel.appendChild(o);
    });
    sel.onchange = () => onChangeFn(sel.value);
    bar.appendChild(sel);
    return sel;
  }

  function addColorPicker(label, cmd, palette){
    const wrap = document.createElement('div');
    wrap.style.position='relative'; wrap.style.display='inline-block';
    const btn = document.createElement('button');
    btn.className='dw-color-btn dw-tool-fixed'; btn.title=label;
    btn.innerHTML = `<i class="fas ${cmd==='foreColor'?'fa-font':'fa-highlighter'}"></i><span class="bar" style="background:${cmd==='hiliteColor'?'#fce8b2':'#000'}"></span>`;
    
    const pop = document.createElement('div');
    pop.className='dw-color-pop';
    const grid = document.createElement('div');
    grid.className='dw-color-grid';
    
    palette.forEach(c=>{
      const cb = document.createElement('button');
      cb.style.background=c; cb.title=c;
      cb.onclick = () => { execSafe(cmd, c); pop.classList.remove('open'); };
      grid.appendChild(cb);
    });
    
    pop.appendChild(grid);
    btn.onclick = (e) => { 
      e.stopPropagation(); 
      document.querySelectorAll('.dw-color-pop.open').forEach(p=>p.classList.remove('open')); 
      pop.classList.toggle('open'); 
    };
    
    wrap.appendChild(btn); wrap.appendChild(pop);
    bar.appendChild(wrap);
  }

  addSelect([['Arial','Arial'],['Georgia','Georgia'],['Times New Roman','TNR'],['Verdana','Verdana']], v => execSafe('fontName', v));
  addSelect([['1','Peq'],['2','Norm'],['3','Med'],['4','Grande'],['5','Maior'],['6','Enorme']], v => execSafe('fontSize', v));
  addSep();

  addBtn('Negrito','fa-bold', () => execSafe('bold'), () => document.queryCommandState('bold'));
  addBtn('Itálico','fa-italic', () => execSafe('italic'), () => document.queryCommandState('italic'));
  addBtn('Sublinhado','fa-underline', () => execSafe('underline'), () => document.queryCommandState('underline'));
  addBtn('Tachado','fa-strikethrough', () => execSafe('strikeThrough'), () => document.queryCommandState('strikeThrough'));
  
  addColorPicker('Cor Texto','foreColor',COLORS_TEXT);
  addColorPicker('Realce','hiliteColor',COLORS_HILITE);
  addSep();

  addBtn('Esquerda','fa-align-left', () => execSafe('justifyLeft'), () => document.queryCommandState('justifyLeft'));
  addBtn('Centro','fa-align-center', () => execSafe('justifyCenter'), () => document.queryCommandState('justifyCenter'));
  addBtn('Direita','fa-align-right', () => execSafe('justifyRight'), () => document.queryCommandState('justifyRight'));
  addBtn('Justificado','fa-align-justify', () => execSafe('justifyFull'), () => document.queryCommandState('justifyFull'));
  addSep();

  addBtn('Marcadores','fa-list-ul', () => execSafe('insertUnorderedList'), () => document.queryCommandState('insertUnorderedList'));
  addBtn('Numerada','fa-list-ol', () => execSafe('insertOrderedList'), () => document.queryCommandState('insertOrderedList'));
  addBtn('-Recuo','fa-outdent', () => execSafe('outdent'));
  addBtn('+Recuo','fa-indent', () => execSafe('indent'));
  addSep();

  addBtn('Título 1','fa-heading', () => execSafe('formatBlock','<h1>'));
  addBtn('Título 2','fa-heading', () => execSafe('formatBlock','<h2>'));
  addBtn('Título 3','fa-heading', () => execSafe('formatBlock','<h3>'));
  addBtn('Parágrafo','fa-paragraph', () => execSafe('formatBlock','<p>'));
  addSep();

  const quoteBtn = document.createElement('button');
  quoteBtn.type='button'; quoteBtn.className='dw-tool-fixed'; quoteBtn.title='Citação (Caixa Cinza)';
  quoteBtn.innerHTML = '<i class="fas fa-comment-dots"></i>';
  quoteBtn.onclick = () => {
    focusBody();
    const html = `<div class="famr-quote-box">Digite sua citação aqui...</div><p><br></p>`;
    document.execCommand('insertHTML', false, html);
    markDirty();
    setTimeout(()=>{
      const lastBox = getBody().querySelector('.famr-quote-box:last-of-type');
      if(lastBox){
        const range = document.createRange();
        range.selectNodeContents(lastBox);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 10);
  };
  bar.appendChild(quoteBtn);
  addSep();

  addBtn('Subscrito','fa-subscript', () => execSafe('subscript'));
  addBtn('Superscrito','fa-superscript', () => execSafe('superscript'));
  addSep();

  addBtn('Inserir Link','fa-link', async () => {
    const urlRaw = await promptDlg('Cole a URL completa (ex: https://site.com)','https://', { title:'Inserir Link', okText:'Aplicar' });
    if(urlRaw){ 
      let finalUrl = urlRaw.trim();
      if(finalUrl && !/^https?:\/\//i.test(finalUrl)){
        finalUrl = 'https://' + finalUrl;
      }
      focusBody();
      document.execCommand('createLink', false, finalUrl);
      markDirty();
    }
  });
  addBtn('Remover Link','fa-link-slash', () => execSafe('unlink'));
  addSep();

  addBtn('Imagem','fa-image', () => insertImage(getBody()));
  addSep();

  addBtn('Emoji','fa-face-smile', () => showEmojiPanel(getBody()));
  addSep();

  addBtn('Colar Código','fa-code', () => openCodeModal());
  addSep();

  addBtn('Linha Horiz.','fa-minus', () => execSafe('insertHorizontalRule'));
  addBtn('Limpar Formato','fa-eraser', () => execSafe('removeFormat'));
  addSep();
  addBtn('Desfazer','fa-undo', () => execSafe('undo'));
  addBtn('Refazer','fa-repeat', () => execSafe('redo'));

  document.addEventListener('click', e => {
    if(!e.target.closest('.dw-color-btn')&&!e.target.closest('.dw-color-pop')){
      document.querySelectorAll('.dw-color-pop.open').forEach(p=>p.classList.remove('open'));
    }
  });
}

function syncState(){
  const bar = document.getElementById('dw-toolbar');
  if(!bar) return;
  bar.querySelectorAll('.dw-tool-fixed').forEach(btn => {
    if(btn._checkFn){
      try{ btn.classList.toggle('is-active', btn._checkFn()); }catch(e){}
    }
  });
}

/* Modal Colar Código */
function openCodeModal(){
  const old = document.getElementById('code-modal-root');
  if(old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'code-modal-root';
  overlay.className = 'code-modal-overlay active';
  overlay.innerHTML = `
    <div class="code-modal-card">
      <div class="cm-header">
        <span class="cm-title"><i class="fas fa-code mr-2"></i>Inserir Código HTML/CSS Visual</span>
        <button class="cm-close" onclick="closeCodeModal()">&times;</button>
      </div>
      <div class="cm-body">
        <textarea id="html-input-area" class="cm-textarea" placeholder="Cole TODO o código HTML/CSS aqui..."></textarea>
        <p class="text-xs text-muted mt-2"><i class="fas fa-info-circle"></i> Scripts serão removidos por segurança, mas estilos e estrutura serão preservados.</p>
      </div>
      <div class="cm-footer">
        <button class="btn btn-outline btn-sm" onclick="closeCodeModal()">Cancelar</button>
        <button class="btn btn-primary btn-sm" onclick="applyCodeToDoc()"><i class="fas fa-check"></i> Inserir</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(()=>document.getElementById('html-input-area').focus(), 100);
}

window.closeCodeModal = function(){
  const m = document.getElementById('code-modal-root');
  if(m) m.remove();
};

window.applyCodeToDoc = function(){
  const input = document.getElementById('html-input-area');
  if(!input || !input.value.trim()) return closeCodeModal();
  
  let rawContent = input.value;
  
  let cssBlocks = [];
  let htmlPart = rawContent.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, p1) => {
    cssBlocks.push(p1);
    return '';
  });
  
  let cleanHtml = htmlPart
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
  
  if(cssBlocks.length > 0){
    const combinedCss = cssBlocks.join('\n');
    const styleTag = document.createElement('style');
    styleTag.innerHTML = combinedCss;
    document.head.appendChild(styleTag);
  }
  
  focusBody();
  document.execCommand('insertHTML', false, cleanHtml);
  markDirty();
  closeCodeModal();
  toast('Código inserido visualmente.');
};

function insertImage(body){
  const inp = document.createElement('input');
  inp.type='file'; inp.accept='image/*';
  inp.onchange = async () => {
    const f = inp.files[0]; if(!f) return;
    setStatus('enviando imagem...');
    const path = `docs-img/${Date.now()}_${f.name.replace(/\s+/g,'_')}`;
    const { error } = await supabase.storage.from('docs-media').upload(path, f, {contentType:f.type});
    if(error){ setStatus('falha upload'); return toast('Upload falhou.','err'); }
    const { data:{ publicUrl } } = supabase.storage.from('docs-media').getPublicUrl(path);
    
    focusBody();
    const wrapper = `<div class="img-wrapper drag-enabled" contenteditable="false" data-src="${publicUrl}" style="position:relative;display:inline-block;margin:8px;border:1px dashed transparent;">
      <div class="img-toolbar">
        <button title="Flutuar Esq." onclick="setImgFloat(this.parentNode.parentNode,'left')"><i class="fas fa-align-left"></i></button>
        <button title="Centralizar" onclick="setImgAlign(this.parentNode.parentNode,'center')"><i class="fas fa-align-center"></i></button>
        <button title="Flutuar Dir." onclick="setImgFloat(this.parentNode.parentNode,'right')"><i class="fas fa-align-right"></i></button>
        <span class="dw-sep"></span>
        <button title="Reduzir" onclick="resizeImg(this.parentNode.parentNode,-20)"><i class="fas fa-minus"></i></button>
        <button title="Ampliar" onclick="resizeImg(this.parentNode.parentNode,20)"><i class="fas fa-plus"></i></button>
        <button title="Original" onclick="resizeImg(this.parentNode.parentNode,0)"><i class="fas fa-expand"></i></button>
        <span class="dw-sep"></span>
        <button title="Remover" onclick="removeImg(this.parentNode.parentNode)"><i class="fas fa-trash"></i></button>
      </div>
      <img src="${publicUrl}" alt="${esc(f.name)}" draggable="false" style="max-width:100%;height:auto;display:block;">
      <div class="img-handle nw"></div><div class="img-handle ne"></div>
      <div class="img-handle sw"></div><div class="img-handle se"></div>
      <div class="img-handle e"></div><div class="img-handle w"></div>
    </div><p><br></p>`;
    document.execCommand('insertHTML', false, wrapper);
    markDirty(); setStatus('imagem pronta');
  };
  inp.click();
}

window.setImgFloat = function(wrapper, side){
  const img = wrapper.querySelector('img');
  if(!img) return;
  img.style.float = 'none';
  img.style.display = 'block';
  img.style.margin = '8px auto'; 
  
  if(side === 'left'){
    img.style.float = 'left';
    img.style.margin = '8px 12px 8px 0';
    img.style.display = 'inline-block';
  } else if(side === 'right'){
    img.style.float = 'right';
    img.style.margin = '8px 0 8px 12px';
    img.style.display = 'inline-block';
  }
  markDirty();
};

window.setImgAlign = function(wrapper, align){
  const img = wrapper.querySelector('img');
  if(!img) return;
  if(align === 'center'){
    img.style.float = 'none';
    img.style.display = 'block';
    img.style.margin = '8px auto';
  }
  markDirty();
};

window.resizeImg = function(wrapper, delta){
  const img = wrapper.querySelector('img');
  if(!img) return;
  if(delta===0){ img.style.width=''; img.style.height=''; }
  else {
    const w = img.offsetWidth || 300;
    img.style.width = Math.max(50, w+delta)+'px';
    img.style.height = 'auto';
  }
  markDirty();
};
window.removeImg = function(wrapper){ wrapper.remove(); markDirty(); };

function setupImageInteractivity(){
  const canvas = document.getElementById('dw-canvas');
  if(!canvas) return;
  let selectedWrapper = null;
  let dragHandle = null, startX=0, startY=0, startW=0;
  let isDraggingMove = false;

  canvas.addEventListener('mousedown', e => {
    const handle = e.target.closest('.img-handle');
    const wrapper = e.target.closest('.img-wrapper');
    
    if(wrapper && !handle && e.target.tagName === 'IMG'){
       e.preventDefault();
       selectWrapper(wrapper);
       isDraggingMove = true;
       startX = e.clientX;
       startY = e.clientY;
       return;
    }

    if(handle && wrapper){
      e.preventDefault();
      dragHandle = handle.className.replace('img-handle ','').trim();
      startX = e.clientX; startY = e.clientY;
      const img = wrapper.querySelector('img');
      startW = img.offsetWidth;
      selectWrapper(wrapper);
      return;
    }
    if(wrapper){ e.preventDefault(); selectWrapper(wrapper); return; }
    deselectAll();
  });

  document.addEventListener('mousemove', e => {
    if(!selectedWrapper) return;
    
    if(isDraggingMove){
       const dx = e.clientX - startX;
       const dy = e.clientY - startY;
       
       const currentMarginLeft = parseInt(selectedWrapper.style.marginLeft || '0');
       const currentMarginTop = parseInt(selectedWrapper.style.marginTop || '0');
       
       selectedWrapper.style.marginLeft = (currentMarginLeft + dx) + 'px';
       selectedWrapper.style.marginTop = (currentMarginTop + dy) + 'px';
       
       startX = e.clientX;
       startY = e.clientY;
       return;
    }

    if(!dragHandle) return;
    const img = selectedWrapper.querySelector('img');
    const dx = e.clientX - startX;
    if(dragHandle.includes('e') || dragHandle==='se' || dragHandle==='ne'){
      img.style.width = Math.max(40, startW+dx)+'px';
      img.style.height = 'auto';
    }
    if(dragHandle.includes('w') || dragHandle==='sw' || dragHandle==='nw'){
      img.style.width = Math.max(40, startW-dx)+'px';
      img.style.height = 'auto';
    }
  });

  document.addEventListener('mouseup', () => { 
    if(dragHandle || isDraggingMove){ markDirty(); } 
    dragHandle = null; 
    isDraggingMove = false;
  });

  function selectWrapper(w){ deselectAll(); selectedWrapper = w; w.classList.add('selected'); w.style.borderColor = '#c9a227'; }
  function deselectAll(){ 
    if(selectedWrapper) {
      selectedWrapper.classList.remove('selected'); 
      selectedWrapper.style.borderColor = 'transparent';
    }
    selectedWrapper = null; 
  }

  document.addEventListener('keydown', e => {
    if((e.key==='Delete'||e.key==='Backspace') && selectedWrapper){
      e.preventDefault();
      selectedWrapper.remove();
      selectedWrapper = null;
      markDirty();
    }
  });
}

function showEmojiPanel(body){
  const emojis = ['😀','😁','😂','','😊','🙂','😉','😍','','😘','😗','😙','😚','☺️','','🤩','','🤨','','😑','😶','','😏','😣','😥','😮','','','😪','😫','','','','','😜','😝','','😒','','😔','😕','','🤑','😲','🙁','','','😟','😤','😢','😭','😦','😧','😨','😩','🤯','','😰','😱','','','😳','','','','','😡','','😷','','','','','🤧','','🥳','','','🤡','','⭐','✅','❌','⚠️','📌','','❤️','🔥','✨','🎖️','','','','',''];
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:#fff;border:1px solid #dadce0;border-radius:12px;padding:12px;box-shadow:0 8px 32px rgba(0,0,0,.2);max-width:460px;max-height:360px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(30px,1fr));gap:2px';
  emojis.forEach(em=>{
    const b=document.createElement('button');
    b.type='button'; b.textContent=em;
    b.style.cssText='border:none;background:none;cursor:pointer;font-size:1.3rem;padding:3px;border-radius:6px';
    b.onmouseenter=()=>b.style.background='#e8eaed';
    b.onmouseleave=()=>b.style.background='none';
    b.onclick=()=>{ focusBody(); document.execCommand('insertText',false,em); cleanup(); markDirty(); };
    wrap.appendChild(b);
  });
  const overlay = document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.2)';
  const cleanup = () => { wrap.remove(); overlay.remove(); };
  overlay.onclick = cleanup;
  document.body.appendChild(overlay);
  document.body.appendChild(wrap);
}

function wireEvents(){
  const body = document.getElementById('dw-body');
  body.addEventListener('keyup', syncState);
  body.addEventListener('mouseup', syncState);
  body.addEventListener('input', ()=>{ _wsDirty=true; setStatus('não salvo'); });
  ['dw-title','dw-category'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('input', ()=>{ _wsDirty=true; setStatus('não salvo'); });
  });
  document.addEventListener('keydown', ctrlSaveHandler);
}

function setStatus(txt){ const el=document.getElementById('dw-status'); if(el) el.textContent=txt; }
function markDirty(){ _wsDirty=true; setStatus('não salvo'); }

function ctrlSaveHandler(e){
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){
    if(document.getElementById('doc-workspace')){ e.preventDefault(); const btn=document.getElementById('dw-save-btn'); if(btn) btn.click(); }
  }
}

window.saveCurrentDoc = async function(existingId, pageId){
  if(_wsSaving) return;
  const titleEl = document.getElementById('dw-title');
  const catEl = document.getElementById('dw-category');
  const bodyEl = document.getElementById('dw-body');
  const saveBtn = document.getElementById('dw-save-btn');
  if(!titleEl || !bodyEl) return;
  const title = titleEl.value.trim();
  if(!title){ toast('Título obrigatório.','warn'); titleEl.focus(); return; }
  const category = catEl.value.trim() || null;
  const body_html = bodyEl.innerHTML;
  const pid = pageId || null;
  _wsSaving = true;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spin-sm"></span> Salvando...';
  setStatus('salvando...');
  const payload = { title, category, body_html, page_id: pid };
  let error;
  if(existingId){ ({error} = await supabase.from('documents').update(payload).eq('id', existingId)); }
  else { payload.author_id = STATE.profile.id; ({error} = await supabase.from('documents').insert([payload])); }
  if(error){
    _wsSaving = false; saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-floppy-disk"></i> Salvar';
    setStatus('erro'); return toast('Erro: '+error.message,'err');
  }
  await famrLog(existingId?'DOC_UPDATE':'DOC_CREATE', { title, category, page_name: pid ? '(nesta página)' : '(geral)' });
  invalidate('docs:'); invalidate('docpages:');
  _wsDirty = false; _wsSaving = false;
  saveBtn.disabled = false;
  saveBtn.innerHTML = '<i class="fas fa-check"></i> Salvo';
  setStatus('salvo ✓');
  toast('Documento salvo.');
  setTimeout(()=>{
    if(saveBtn.isConnected){
      saveBtn.innerHTML = '<i class="fas fa-floppy-disk"></i> Salvar';
      setStatus(existingId?'atualizado':'novo');
    }
  }, 2000);
};

/* ══════════ PERFIL ══════════ */
async function renderProfile(c, param){
  const me = (!param || param === 'me');
  const id = me ? STATE.profile.id : param;
  const { data: p } = await supabase.from('profiles_view').select('*').eq('id', id).single();
  if(!p){ c.innerHTML = '<div class="card card-body text-sm text-muted">Perfil não encontrado.</div>'; return; }
  let gs = [];
  if(me){ gs = sortGroups(STATE.groups); }
  else {
    const { data: ug } = await supabase.from('user_groups').select('group_id').eq('user_id', id);
    const gids = (ug||[]).map(r => r.group_id).filter(Boolean);
    if(gids.length){ const { data: groups } = await supabase.from('groups').select('*').in('id', gids); gs = sortGroups(groups||[]); }
  }
  const viewerOk = me || isAdmin();
  gs = gs.filter(g => g.group_type !== 'invisible' || viewerOk || STATE.modGroups?.has(g.id));
  const main = primaryGroupOf(gs);
  const cg = colorGroupOf(gs);
  c.innerHTML = `
  <div class="card fade-up overflow-hidden">
    <div class="h-24" style="background:linear-gradient(120deg,#0e4433,#14563f 60%,#c9a227)"></div>
    <div class="p-6 -mt-12">
      <div class="flex flex-wrap items-end gap-4">
        <span class="w-20 h-20 rounded-2xl grid place-items-center text-3xl font-extrabold text-white border-4 border-white shadow-lg" style="background:${cg?.color || '#14563f'}"><i class="fas ${main?.icon || 'fa-user'}"></i></span>
        <div class="flex-1"><h1 class="font-display text-2xl font-extrabold">${esc(p.nickname)}</h1>
          <p class="text-xs text-muted">Desde ${fmtDate(p.created_at)} ${me ? `• ${esc(p.email)}` : ''}</p></div>
        <span class="chip ${p.status==='active'?'chip-ok':p.status==='pending'?'chip-wait':'chip-no'}">${p.status.toUpperCase()}</span>
        ${p.login_locked ? '<span class="chip chip-no"><i class="fas fa-lock mr-1"></i>BLOQUEADA</span>' : ''}
      </div>
      <div class="flex flex-wrap gap-2 mt-4">${gs.map(groupChip).join('') || '<span class="chip chip-neutral">Sem grupo</span>'}</div>
    </div>
  </div>`;
}

/* ══════════ SEARCH BAR ══════════ */
document.addEventListener('DOMContentLoaded', () => {
  applyThemeIcon();
  const bt = document.getElementById('btn-theme');
  if(bt) bt.addEventListener('click', toggleTheme);
  const inp = document.getElementById('global-search'), drop = document.getElementById('search-drop');
  if(!inp || !drop) return;
  let t;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const q = inp.value.trim();
      if(q.length < 2){ drop.classList.add('hidden'); return; }
      const { data } = await supabase.from('profiles_view').select('id,nickname').eq('status','active').eq('is_invisible', false).neq('nickname','admin master').ilike('nickname', `%${q}%`).limit(6);
      const ids = (data||[]).map(u=>u.id);
      const { data: ug } = ids.length ? await supabase.from('user_groups').select('user_id, groups(id,icon,order_index,apply_color)').in('user_id', ids) : { data: [] };
      const byUser = {}; (ug||[]).forEach(r => { (byUser[r.user_id] = byUser[r.user_id] || []).push(r.groups); });
      drop.innerHTML = (data||[]).map(u => `<a href="#/perfil/${u.id}" onclick="document.getElementById('search-drop').classList.add('hidden')" class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-famr-100 transition-colors">
        <span class="w-8 h-8 rounded-full bg-famr-700 text-white grid place-items-center text-xs"><i class="fas ${userIconOf(byUser[u.id]||[])}"></i></span>
        <span class="text-sm font-bold">${esc(u.nickname)}</span></a>`).join('') || '<p class="p-3 text-xs text-muted">Nenhum encontrado.</p>';
      drop.classList.remove('hidden');
    }, 300);
  });
  document.addEventListener('click', e => { if(!e.target.closest('#global-search')) drop.classList.add('hidden'); });
});

/* ══════════════════ PAINEL ADMIN ══════════════════ */
const A = { tab:'usuarios', page:0, q:'', logFilters:{ user:'', action:'', ip:'', dateFrom:'', dateTo:'', search:'' } };
const ADMIN_TABS = [['usuarios','fa-users','Usuários'],['grupos','fa-layer-group','Grupos'],['topicos','fa-sitemap','Tópicos'],['protocolos','fa-inbox','Protocolos'],['logs','fa-scroll','Logs'],['config','fa-sliders','Config']];
async function renderAdmin(c){
  if(!isAdmin()){ c.innerHTML = `<div class="card card-body text-center py-16"><i class="fas fa-lock text-3xl text-red-500"></i><h2 class="font-display font-bold text-xl mt-3">Acesso negado</h2></div>`; return; }
  c.innerHTML = `
  <div class="fade-up"><p class="text-xs font-bold tracking-[0.3em] uppercase text-gold-600">Comando</p>
  <h1 class="font-display text-2xl md:text-3xl font-extrabold text-famr-900"><i class="fas fa-shield-halved text-gold-500 mr-2"></i>Painel Administrativo</h1>
  <div id="admin-tabs" class="flex flex-wrap gap-2 mt-4"></div></div>
  <div id="admin-body" class="mt-6"></div>`;
  drawAdminTabs(); await adminTab(A.tab);
}
function drawAdminTabs(){
  const w = document.getElementById('admin-tabs'); if(!w) return;
  w.innerHTML = ADMIN_TABS.map(([k,i,l]) => `<button onclick="adminTab('${k}')" class="btn btn-sm ${A.tab===k?'btn-primary':'btn-outline'}"><i class="fas ${i}"></i> ${l}</button>`).join('');
}
window.adminTab = async function(tab){
  A.tab = tab; A.page = 0; drawAdminTabs();
  const b = document.getElementById('admin-body'); b.innerHTML = '<div class="skeleton h-64"></div>';
  ({usuarios:tabUsuarios, grupos:tabGrupos, topicos:tabTopicos, protocolos:tabProtocolos, logs:tabLogs, config:tabConfig})[tab](b);
};
async function tabUsuarios(b){
  const from = A.page*20;
  let q = supabase.from('profiles_view').select('*', { count:'exact' }).neq('nickname','admin master').order('created_at',{ascending:false}).range(from, from+19);
  if(A.q) q = q.ilike('nickname', `%${A.q}%`);
  const { data, count } = await q; const totalPages = Math.ceil((count||0)/20);
  b.innerHTML = `<div class="card fade-up">
    <div class="card-head justify-between gap-3 flex-wrap"><h2 class="font-display font-bold text-sm">Militares <span class="chip chip-neutral ml-2 normal-case">${count??0}</span></h2>
      <input class="input !py-1.5 !pl-3 w-56" placeholder="Filtrar..." value="${esc(A.q)}" oninput="A.q=this.value;clearTimeout(window._t);window._t=setTimeout(()=>tabUsuarios(document.getElementById('admin-body')),350)"></div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Nickname</th><th>Status</th><th>Tentativas</th><th>Desde</th><th class="text-right">Ações</th></tr></thead><tbody>
    ${(data||[]).map(u => `<tr>
      <td class="font-bold">${esc(u.nickname)}</td>
      <td>${u.login_locked ? '<span class="chip chip-no"><i class="fas fa-lock"></i> BLOQUEADO</span>' : `<span class="chip ${u.status==='active'?'chip-ok':u.status==='pending'?'chip-wait':'chip-no'}">${u.status.toUpperCase()}</span>`}</td>
      <td class="text-xs ${u.failed_logins>0?'text-red-600 font-bold':'text-muted'}">${u.failed_logins||0}/4</td>
      <td class="text-xs text-muted">${fmtDate(u.created_at)}</td>
      <td class="text-right space-x-1">
        ${u.login_locked ? `<button class="btn btn-gold btn-sm" onclick="unlockUser('${u.id}')"><i class="fas fa-unlock"></i></button>` : ''}
        ${u.status!=='active'?`<button class="btn btn-primary btn-sm" onclick="setUser('${u.id}','active')"><i class="fas fa-check"></i></button>`:''}
        ${u.status!=='banned'?`<button class="btn btn-danger btn-sm" onclick="setUser('${u.id}','banned')"><i class="fas fa-ban"></i></button>`:`<button class="btn btn-outline btn-sm" onclick="setUser('${u.id}','pending')"><i class="fas fa-rotate-left"></i></button>`}
        <button class="btn btn-outline btn-sm" onclick="manageGroups('${u.id}','${esc(u.nickname)}')"><i class="fas fa-layer-group"></i></button>
      </td></tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted py-8">Nada.</td></tr>'}
    </tbody></table></div>
    <div class="p-3 flex justify-center gap-2">${A.page>0?`<button class="btn btn-outline btn-sm" onclick="A.page--;tabUsuarios(document.getElementById('admin-body'))">←</button>`:''}
    <span class="text-xs text-muted self-center">Pág ${A.page+1}${totalPages>1?`/${totalPages}`:''}</span>
    ${(data||[]).length===20?`<button class="btn btn-outline btn-sm" onclick="A.page++;tabUsuarios(document.getElementById('admin-body'))">→</button>`:''}</div></div>`;
}
window.setUser = async (id, status) => { const { error } = await supabase.from('profiles').update({ status }).eq('id', id); if(error) return toast('Erro: '+error.message,'err'); await famrLog('USER_STATUS', { id, status }); toast('Status atualizado.'); tabUsuarios(document.getElementById('admin-body')); };
window.unlockUser = async (id) => { const { error } = await supabase.from('profiles').update({ login_locked:false, failed_logins:0 }).eq('id', id); if(error) return toast('Erro: '+error.message,'err'); await famrLog('LOCK_REMOVIDO_ADMIN', { id }); toast('Destravada.'); tabUsuarios(document.getElementById('admin-body')); };
window.manageGroups = async (userId, nick) => {
  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase.from('groups').select('id,name,color,icon,order_index').order('order_index'),
    supabase.from('user_groups').select('group_id').eq('user_id', userId)]);
  const has = new Set((mine||[]).map(m => m.group_id));
  openModal(`<i class="fas fa-layer-group text-gold-500 mr-2"></i>Grupos de ${esc(nick)}`,
    (all||[]).map(g => `<label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-famr-50 cursor-pointer">
      <input type="checkbox" value="${g.id}" ${has.has(g.id)?'checked':''} class="accent-[#14563f] w-4 h-4">
      <i class="fas ${g.icon||'fa-shield-halved'}" style="color:${g.color}"></i><span class="text-sm font-bold">${esc(g.name)}</span></label>`).join(''),
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-primary btn-sm" onclick="saveGroups('${userId}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveGroups = async userId => {
  const ids = [...document.querySelectorAll('#modal-body input:checked')].map(i => i.value);
  await supabase.from('user_groups').delete().eq('user_id', userId);
  if(ids.length) await supabase.from('user_groups').insert(ids.map(g => ({ user_id: userId, group_id: g })));
  await famrLog('USER_GROUPS', { userId, ids });
  invalidate('perms:'); invalidate('home:'); closeModal(); toast('Salvo.');
};
async function tabGrupos(b){
  const { data } = await supabase.from('groups').select('*, groups(name)').order('order_index');
  const { data: ug } = await supabase.from('user_groups').select('group_id').limit(10000);
  const cnt = {}; (ug||[]).forEach(m => cnt[m.group_id] = (cnt[m.group_id]||0)+1);
  b.innerHTML = `<div class="card fade-up">
    <div class="card-head justify-between"><h2 class="font-display font-bold text-sm">Grupos</h2>
    <button class="btn btn-gold btn-sm" onclick="groupForm()"><i class="fas fa-plus"></i> Novo</button></div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Ordem</th><th>Grupo</th><th>Tipo</th><th>Membros</th><th class="text-right">Ações</th></tr></thead><tbody>
    ${(data||[]).map((g,i,arr) => `<tr>
      <td><button class="ord-btn" onclick="moveGroup('${g.id}',-1)" ${i===0?'disabled':''}><i class="fas fa-chevron-up"></i></button>
          <button class="ord-btn" onclick="moveGroup('${g.id}',1)" ${i===arr.length-1?'disabled':''}><i class="fas fa-chevron-down"></i></button></td>
      <td><i class="fas ${g.icon||'fa-shield-halved'} mr-2" style="color:${g.color}"></i><b style="color:${g.color}">${esc(g.name)}</b></td>
      <td><span class="chip ${g.group_type==='open'?'chip-ok':g.group_type==='closed'?'chip-wait':'chip-neutral'}">${GROUP_TYPES[g.group_type]||g.group_type}</span></td>
      <td class="text-xs font-bold">${cnt[g.id]||0}</td>
      <td class="text-right space-x-1">
        <button class="btn btn-outline btn-sm" onclick="groupPermissions('${g.id}')"><i class="fas fa-key"></i></button>
        <button class="btn btn-outline btn-sm" onclick="groupMembers('${g.id}')"><i class="fas fa-users"></i></button>
        <button class="btn btn-outline btn-sm" onclick="groupForm('${g.id}')"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" onclick="delGroup('${g.id}')"><i class="fas fa-trash"></i></button></td></tr>`).join('')}
    </tbody></table></div></div>`;
}
window.moveGroup = async (id, dir) => {
  const { data } = await supabase.from('groups').select('id,order_index').order('order_index');
  const i = (data||[]).findIndex(g => g.id === id); const j = i + dir;
  if(i < 0 || j < 0 || j >= data.length) return;
  await supabase.from('groups').update({ order_index: data[j].order_index }).eq('id', data[i].id);
  await supabase.from('groups').update({ order_index: data[i].order_index }).eq('id', data[j].id);
  invalidate('home:'); tabGrupos(document.getElementById('admin-body'));
};
window.groupForm = async id => {
  let g = { name:'', color:'#14563f', icon:'fa-shield-halved', apply_color:true, group_type:'open', parent_id:null };
  if(id){ const r = await supabase.from('groups').select('*').eq('id', id).single(); g = r.data; }
  const { data: all } = await supabase.from('groups').select('id,name').neq('id', id||'').order('order_index');
  openModal(`<i class="fas fa-layer-group text-gold-500 mr-2"></i>${id?'Editar':'Novo'} grupo`, `
    <label class="field"><span>Nome</span><input id="g-name" class="input" value="${esc(g.name)}"></label>
    <div class="field"><span>Ícone</span>
      <div class="icon-grid" id="g-icon-grid" style="max-height:260px;overflow:auto">
        ${SAFE_ICONS.map(ic => `<button type="button" class="icon-opt ${g.icon===ic?'sel':''}" data-icon="${ic}" onclick="pickIcon(this)" title="${ic}"><i class="fas ${ic}"></i></button>`).join('')}
      </div>
      <input type="hidden" id="g-icon" value="${esc(g.icon||'fa-shield-halved')}">
    </div>
    <div class="grid grid-cols-2 gap-3">
      <label class="field"><span>Cor</span><input id="g-color" type="color" class="input !p-1 h-11" value="${g.color}"></label>
      <label class="field"><span>Tipo</span><select id="g-type" class="input">
        <option value="open" ${g.group_type==='open'?'selected':''}>Aberto</option>
        <option value="closed" ${g.group_type==='closed'?'selected':''}>Fechado</option>
        <option value="invisible" ${g.group_type==='invisible'?'selected':''}>Invisível</option>
      </select></label>
    </div>
    <label class="flex items-center gap-3 text-sm font-bold"><input id="g-applycolor" type="checkbox" class="w-4 h-4 accent-[#14563f]" ${g.apply_color?'checked':''}> Aplicar cor aos membros</label>
    <label class="field mt-3"><span>Subgrupo de</span><select id="g-parent" class="input"><option value="">— nenhum —</option>
      ${(all||[]).map(p => `<option value="${p.id}" ${g.parent_id===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="saveGroup('${id||''}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.pickIcon = btn => {
  document.querySelectorAll('#g-icon-grid .icon-opt').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  document.getElementById('g-icon').value = btn.dataset.icon;
};
window.saveGroup = async id => {
  const row = { name: document.getElementById('g-name').value.trim(), color: document.getElementById('g-color').value, icon: document.getElementById('g-icon').value, apply_color: document.getElementById('g-applycolor').checked, group_type: document.getElementById('g-type').value, parent_id: document.getElementById('g-parent').value || null };
  if(!row.name) return toast('Nome obrigatório.','warn');
  let error;
  if(id){ ({ error } = await supabase.from('groups').update(row).eq('id', id)); }
  else { const { count } = await supabase.from('groups').select('*', { count:'exact', head:true }); row.order_index = (count||0)+1; ({ error } = await supabase.from('groups').insert([row])); }
  if(error) return toast('Erro: '+error.message,'err');
  await famrLog('GROUP_SAVE', row);
  invalidate('home:'); closeModal(); toast('Grupo salvo.'); tabGrupos(document.getElementById('admin-body'));
};
window.delGroup = async id => {
  if(!await confirmDlg('Excluir grupo?', { title:'Excluir', okText:'Excluir', danger:true })) return;
  await supabase.from('groups').delete().eq('id', id);
  await famrLog('GROUP_DEL', { id });
  invalidate('home:'); invalidate('perms:'); tabGrupos(document.getElementById('admin-body'));
};
window.groupPermissions = async gid => {
  const [{ data: secs }, { data: subs }, { data: rows }, { data: grp }] = await Promise.all([
    supabase.from('sections').select('*').order('order_index'),
    supabase.from('subtopics').select('*').order('order_index'),
    supabase.from('group_permissions').select('*').eq('group_id', gid),
    supabase.from('groups').select('name,color,icon').eq('id', gid).single()
  ]);
  const cur = {}; (rows||[]).forEach(r => { cur[r.target_type+':'+r.target_id] = r; });
  const cb = (key, field, label) => `<td title="${label}"><input type="checkbox" data-key="${key}" data-f="${field}" ${cur[key]?.[field]?'checked':''}></td>`;
  openModal(`<i class="fas ${grp?.icon||'fa-shield-halved'}" style="color:${grp?.color}"></i> Permissões: ${esc(grp?.name||'')}`,
    `<div class="perm-wrap"><table class="perm-matrix">
      <thead><tr><th>Fórum</th><th>Ver</th><th>Criar</th><th>Editar</th><th>Excluir</th><th>Mod.</th></tr></thead>
      <tbody>${(secs||[]).map(s => `
        <tr class="pm-sec"><td><i class="fas ${esc(s.icon)} mr-2"></i>${esc(s.name)}</td>
          ${cb('section:'+s.id,'can_view','V')}${cb('section:'+s.id,'can_create','C')}${cb('section:'+s.id,'can_edit','E')}${cb('section:'+s.id,'can_delete','D')}${cb('section:'+s.id,'is_moderator','M')}</tr>
        ${(subs||[]).filter(x=>x.section_id===s.id).map(x => `
          <tr><td class="pm-sub1"><i class="fas fa-folder-open mr-2 text-muted"></i>${esc(x.name)}</td>
            ${cb('subtopic:'+x.id,'can_view','V')}${cb('subtopic:'+x.id,'can_create','C')}${cb('subtopic:'+x.id,'can_edit','E')}${cb('subtopic:'+x.id,'can_delete','D')}${cb('subtopic:'+x.id,'is_moderator','M')}</tr>`).join('')}`).join('')}
      </tbody></table></div>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="savePermissions('${gid}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.savePermissions = async gid => {
  const boxes = [...document.querySelectorAll('#modal-body .perm-matrix input[type=checkbox]')];
  const map = {};
  boxes.forEach(b => {
    const k = b.dataset.key;
    map[k] = map[k] || { group_id: gid, target_type: k.split(':')[0], target_id: k.split(':')[1], can_view:false, can_create:false, can_edit:false, can_delete:false, is_moderator:false };
    map[k][b.dataset.f] = b.checked;
  });
  const up = [], del = [];
  Object.values(map).forEach(r => { (r.can_view||r.can_create||r.can_edit||r.can_delete||r.is_moderator)?up.push(r):del.push(r); });
  if(up.length){ const { error } = await supabase.from('group_permissions').upsert(up, { onConflict:'group_id,target_type,target_id' }); if(error) return toast('Erro: '+error.message,'err'); }
  for(const r of del){ await supabase.from('group_permissions').delete().eq('group_id', gid).eq('target_type', r.target_type).eq('target_id', r.target_id); }
  invalidate('perms:'); invalidate('home:'); closeModal(); toast('Permissões salvas.');
};
window.targetPermissions = async (type, id, name) => {
  const [{ data: grps }, { data: rows }] = await Promise.all([
    supabase.from('groups').select('id,name,color,icon,order_index').order('order_index'),
    supabase.from('group_permissions').select('*').eq('target_type',type).eq('target_id',id)
  ]);
  const cur = {}; (rows||[]).forEach(r => cur[r.group_id] = r);
  const cb = (gid, field, label) => `<td title="${label}"><input type="checkbox" data-g="${gid}" data-f="${field}" ${cur[gid]?.[field]?'checked':''}></td>`;
  const cbAll = (field, label, dis) => `<td title="${label}"><input type="checkbox" data-g="__ALL__" data-f="${field}" ${dis?'disabled':''} ${(!dis&&cur[null]?.[field])?'checked':''}></td>`;
  openModal(`<i class="fas fa-key text-gold-500 mr-2"></i>Permissões: ${esc(name)}`,
    `<div class="perm-wrap"><table class="perm-matrix">
       <thead><tr><th>Grupo</th><th>Ver</th><th>Criar</th><th>Editar</th><th>Excluir</th><th>Mod.</th></tr></thead>
       <tbody>
         <tr class="pm-sec"><td><i class="fas fa-users mr-2"></i><b>Todos</b></td>
           ${cbAll('can_view','V')}${cbAll('can_create','C')}${cbAll('can_edit','E')}${cbAll('can_delete','D')}${cbAll('is_moderator','M',true)}</tr>
         ${(grps||[]).map(g => `<tr><td><i class="fas ${g.icon||'fa-shield-halved'} mr-2" style="color:${g.color}"></i><b>${esc(g.name)}</b></td>
           ${cb(g.id,'can_view','V')}${cb(g.id,'can_create','C')}${cb(g.id,'can_edit','E')}${cb(g.id,'can_delete','D')}${cb(g.id,'is_moderator','M')}</tr>`).join('')}
       </tbody></table></div>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="saveTargetPermissions('${type}','${id}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveTargetPermissions = async (type, id) => {
  const boxes = [...document.querySelectorAll('#modal-body .perm-matrix input[type=checkbox]:not([disabled])')];
  const allRow = { can_view:false, can_create:false, can_edit:false, can_delete:false, is_moderator:false };
  boxes.filter(b=>b.dataset.g==='__ALL__').forEach(b=> allRow[b.dataset.f]=b.checked);
  const anyAll = allRow.can_view||allRow.can_create||allRow.can_edit||allRow.can_delete;
  await supabase.from('group_permissions').delete().eq('target_type',type).eq('target_id',id).is('group_id',null);
  if(anyAll){ const { error } = await supabase.from('group_permissions').insert([{ group_id:null, target_type:type, target_id:id, ...allRow }]); if(error) return toast('Erro: '+error.message,'err'); }
  const map = {};
  boxes.filter(b=>b.dataset.g!=='__ALL__').forEach(bx => {
    const gid = bx.dataset.g;
    map[gid] = map[gid] || { group_id:gid, target_type:type, target_id:id, can_view:false, can_create:false, can_edit:false, can_delete:false, is_moderator:false };
    map[gid][bx.dataset.f] = bx.checked;
  });
  const up = [], del = [];
  Object.values(map).forEach(r => { (r.can_view||r.can_create||r.can_edit||r.can_delete||r.is_moderator)?up.push(r):del.push(r); });
  if(up.length){ const { error } = await supabase.from('group_permissions').upsert(up, { onConflict:'group_id,target_type,target_id' }); if(error) return toast('Erro: '+error.message,'err'); }
  for(const r of del){ await supabase.from('group_permissions').delete().eq('group_id', r.group_id).eq('target_type', type).eq('target_id', id); }
  invalidate('perms:'); invalidate('home:'); closeModal(); toast('Salvo.');
};
window.groupMembers = async gid => {
  const [{ data: grp }, { data: mem }] = await Promise.all([
    supabase.from('groups').select('name,color,icon,group_type').eq('id', gid).single(),
    supabase.from('user_groups').select('user_id, profiles_view(id,nickname)').eq('group_id', gid)
  ]);
  window._gmGroupId = gid;
  const list = (mem||[]).map(m => m.profiles_view).filter(Boolean);
  openModal(`<i class="fas ${grp?.icon||'fa-shield-halved'}" style="color:${grp?.color}"></i> Membros: ${esc(grp?.name||'')}`,
    `<div class="field"><span>Adicionar</span>
      <div class="input-wrap"><i class="fas fa-magnifying-glass"></i><input id="gm-search" class="input" placeholder="Nickname..." oninput="gmSearch(this.value)"></div>
      <div id="gm-results" class="mt-2 space-y-1"></div></div>
    <div class="field mt-3"><span>Atuais (${list.length})</span>
      <div id="gm-list" class="space-y-1 max-h-56 overflow-auto">
        ${list.map(m => `<div class="flex items-center justify-between p-2 rounded-lg bg-paper border border-line">
          <span class="text-sm font-bold">${esc(m.nickname)}</span>
          <button class="btn btn-danger btn-sm" onclick="gmRemove('${gid}','${m.id}')"><i class="fas fa-user-minus"></i></button></div>`).join('') || '<p class="text-xs text-muted">Nenhum.</p>'}
      </div></div>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Fechar</button>`);
};
window.gmSearch = async q => {
  const box = document.getElementById('gm-results');
  if((q||'').trim().length < 2){ box.innerHTML = ''; return; }
  const { data } = await supabase.from('profiles_view').select('id,nickname').eq('status','active').neq('nickname','admin master').ilike('nickname', `%${q.trim()}%`).limit(5);
  box.innerHTML = (data||[]).map(u => `<div class="flex items-center justify-between p-2 rounded-lg bg-famr-50 border border-line">
    <span class="text-sm font-bold">${esc(u.nickname)}</span>
    <button class="btn btn-primary btn-sm" onclick="gmAdd('${window._gmGroupId}','${u.id}')"><i class="fas fa-user-plus"></i></button></div>`).join('') || '<p class="text-xs text-muted">Ninguém.</p>';
};
window.gmAdd = async (gid, uid) => {
  const { error } = await supabase.from('user_groups').insert([{ user_id: uid, group_id: gid }]);
  if(error) return toast('Erro: '+error.message,'err');
  invalidate('home:'); toast('Adicionado.'); groupMembers(gid);
};
window.gmRemove = async (gid, uid) => {
  await supabase.from('user_groups').delete().eq('user_id', uid).eq('group_id', gid);
  invalidate('home:'); toast('Removido.'); groupMembers(gid);
};
async function tabTopicos(b){
  const [{ data: secs }, { data: subs }, { data: groups }, { data: docPages }] = await Promise.all([
    supabase.from('sections').select('*').order('order_index'),
    supabase.from('subtopics').select('*,groups(name)').order('order_index'),
    supabase.from('groups').select('id,name'),
    supabase.from('doc_pages').select('*').order('order_index')
  ]);
  window._groupsCache = groups || [];
  b.innerHTML = `<div class="space-y-4 fade-up">
    <div class="flex justify-end gap-2">
      <button class="btn btn-gold btn-sm" onclick="docPageForm()"><i class="fas fa-file-circle-plus"></i> Nova Página Doc</button>
      <button class="btn btn-primary btn-sm" onclick="sectionForm()"><i class="fas fa-plus"></i> Novo setor</button>
    </div>
    
    <!-- Páginas de Documentos -->
    ${(docPages||[]).length ? `
    <div class="card">
      <div class="cat-head"><i class="fas fa-file-lines"></i> Páginas de Documentos <span class="chip chip-neutral ml-2 normal-case">${(docPages||[]).length}</span></div>
      <div class="divide-y divide-line">
        ${(docPages||[]).map(p => `
          <div class="p-3.5 flex flex-wrap items-center gap-3 text-sm">
            <i class="fas ${p.icon||'fa-folder-open'}" style="color:${p.color||'#14563f'}"></i>
            <b>${esc(p.name)}</b>
            <span class="chip chip-neutral">/${esc(p.slug||'')}</span>
            <span class="ml-auto flex gap-1">
              <a href="#/doc-page/${p.id}" class="btn btn-outline btn-sm"><i class="fas fa-folder-open"></i></a>
              <button class="btn btn-outline btn-sm" onclick="docPageForm('${p.id}')"><i class="fas fa-pen"></i></button>
              <button class="btn btn-danger btn-sm" onclick="delDocPage('${p.id}')"><i class="fas fa-trash"></i></button>
            </span>
          </div>`).join('')}
      </div>
    </div>` : ''}
    
    <!-- Setores normais -->
    ${(secs||[]).map((s,i,arr) => `<div class="card">
      <div class="cat-head">
        <span class="flex items-center gap-1 mr-2">
          <button class="ord-btn" onclick="moveSection('${s.id}',-1)" ${i===0?'disabled':''}><i class="fas fa-chevron-up"></i></button>
          <button class="ord-btn" onclick="moveSection('${s.id}',1)" ${i===arr.length-1?'disabled':''}><i class="fas fa-chevron-down"></i></button>
        </span>
        <i class="fas ${esc(s.icon)}"></i> ${esc(s.name)} <span class="chip chip-neutral ml-2 normal-case">/${esc(s.slug)}</span>
        <span class="ml-auto flex gap-1">
          <button class="btn btn-outline btn-sm" onclick="targetPermissions('section','${s.id}','${esc(s.name)}')"><i class="fas fa-key"></i></button>
          <button class="btn btn-outline btn-sm" onclick="sectionForm('${s.id}')"><i class="fas fa-pen"></i></button>
          <button class="btn btn-outline btn-sm" onclick="subtopicForm('${s.id}')"><i class="fas fa-plus"></i> Sub</button>
          <button class="btn btn-danger btn-sm" onclick="delSection('${s.id}')"><i class="fas fa-trash"></i></button>
        </span>
      </div>
      <div class="divide-y divide-line">${(subs||[]).filter(x => x.section_id===s.id).map(x => `
        <div class="p-3.5 flex flex-wrap items-center gap-3 text-sm">
          <i class="fas fa-folder-open text-muted"></i><b>${esc(x.name)}</b>
          ${x.required_group_id?`<span class="chip chip-wait"><i class="fas fa-lock"></i> ${esc(x.groups?.name||'')}</span>`:'<span class="chip chip-ok">todos</span>'}
          ${x.is_request_form?'<span class="chip chip-neutral">formulário</span>':''}
          <span class="ml-auto flex gap-1">
            <button class="btn btn-outline btn-sm" onclick="targetPermissions('subtopic','${x.id}','${esc(x.name)}')"><i class="fas fa-key"></i></button>
            <button class="btn btn-outline btn-sm" onclick="subtopicForm('${s.id}','${x.id}')"><i class="fas fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="delSubtopic('${x.id}')"><i class="fas fa-trash"></i></button>
          </span>
        </div>`).join('') || '<p class="p-4 text-xs text-muted">Sem subtópicos.</p>'}</div>
    </div>`).join('')}
  </div>`;
}
window.moveSection = async (id, dir) => {
  const { data } = await supabase.from('sections').select('id,order_index').order('order_index');
  const i = (data||[]).findIndex(s => s.id === id); const j = i + dir;
  if(i < 0 || j < 0 || j >= data.length) return;
  await supabase.from('sections').update({ order_index: data[j].order_index }).eq('id', data[i].id);
  await supabase.from('sections').update({ order_index: data[i].order_index }).eq('id', data[j].id);
  invalidate('home:'); tabTopicos(document.getElementById('admin-body'));
};
window.sectionForm = async id => {
  let s = { name:'', slug:'', icon:'fa-folder-open', description:'', required_group_id:null };
  if(id){ const r = await supabase.from('sections').select('*').eq('id', id).single(); if(r.data) s = r.data; }
  openModal(`<i class="fas fa-sitemap text-gold-500 mr-2"></i>${id?'Editar':'Novo'} setor`, `
    <label class="field"><span>Nome</span><input id="s-name" class="input" value="${esc(s.name)}"></label>
    <label class="field"><span>Slug</span><input id="s-slug" class="input" value="${esc(s.slug)}"></label>
    <label class="field"><span>Ícone</span><input id="s-icon" class="input" value="${esc(s.icon)}"></label>
    <label class="field"><span>Descrição</span><textarea id="s-desc" class="input" rows="2">${esc(s.description||'')}</textarea></label>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-primary btn-sm" onclick="saveSection('${id||''}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveSection = async id => {
  const row = { name: document.getElementById('s-name').value.trim(), slug: document.getElementById('s-slug').value.trim().toLowerCase().replace(/\s+/g,'-'), icon: document.getElementById('s-icon').value.trim() || 'fa-folder-open', description: document.getElementById('s-desc').value, required_group_id: null };
  if(!row.name || !row.slug) return toast('Nome e slug obrigatórios.','warn');
  let error;
  if(id){ ({ error } = await supabase.from('sections').update(row).eq('id', id)); }
  else { const { count } = await supabase.from('sections').select('*', { count:'exact', head:true }); row.order_index = (count||0)+1; ({ error } = await supabase.from('sections').insert([row])); }
  if(error) return toast('Erro: '+error.message,'err');
  await famrLog('SECTION_SAVE', row);
  invalidate('home:'); closeModal(); toast('Setor salvo.'); buildSidebar(); tabTopicos(document.getElementById('admin-body'));
};
window.delSection = async id => { if(await confirmDlg('Excluir setor?', { title:'Excluir', okText:'Excluir', danger:true })) { await supabase.from('sections').delete().eq('id', id); invalidate('home:'); buildSidebar(); tabTopicos(document.getElementById('admin-body')); } };
window.delSubtopic = async id => { if(await confirmDlg('Excluir subtópico?', { title:'Excluir', okText:'Excluir', danger:true })) { await supabase.from('subtopics').delete().eq('id', id); invalidate('home:'); tabTopicos(document.getElementById('admin-body')); } };
window.subtopicForm = async (sid, tid) => {
  let t = { name:'', description:'', required_group_id:null, allow_posts:true, is_request_form:false, form_fields:[], auto_listagem_category:null };
  if(tid){ const r = await supabase.from('subtopics').select('*').eq('id', tid).single(); if(r.data) t = r.data; }
  const fieldsText = (t.form_fields||[]).map(f => `${f.label}:${f.type||'text'}`).join('\n');
  openModal(`<i class="fas fa-folder-plus text-gold-500 mr-2"></i>${tid?'Editar':'Novo'} subtópico`, `
    <label class="field"><span>Nome</span><input id="t-name" class="input" value="${esc(t.name)}"></label>
    <label class="field"><span>Descrição</span><textarea id="t-desc" class="input" rows="2">${esc(t.description||'')}</textarea></label>
    <label class="flex items-center gap-2 text-sm font-bold"><input id="t-posts" type="checkbox" ${t.allow_posts?'checked':''} class="w-4 h-4 accent-[#14563f]"> Permite publicações</label>
    <label class="flex items-center gap-2 text-sm font-bold"><input id="t-form" type="checkbox" ${t.is_request_form?'checked':''} class="w-4 h-4 accent-[#14563f]"> Formulário de requerimento</label>
    <label class="field"><span>Campos (Nome:tipo)</span><textarea id="t-fields" class="input" rows="3">${esc(fieldsText)}</textarea></label>
    <input type="hidden" id="t-sid" value="${sid}"><input type="hidden" id="t-tid" value="${tid||''}">`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-primary btn-sm" onclick="saveSubtopic()"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveSubtopic = async () => {
  const tid = document.getElementById('t-tid').value;
  const fields = document.getElementById('t-fields').value.split('\n').filter(Boolean).map(l => { const [label, type] = l.split(':'); return { label: (label||'').trim(), type: (type||'text').trim(), required: true }; }).filter(f => f.label);
  const row = { section_id: document.getElementById('t-sid').value, name: document.getElementById('t-name').value.trim(), description: document.getElementById('t-desc').value, required_group_id: null, allow_posts: document.getElementById('t-posts').checked, is_request_form: document.getElementById('t-form').checked, form_fields: fields, auto_listagem_category: null };
  if(!row.name) return toast('Nome obrigatório.','warn');
  let error;
  if(tid){ ({ error } = await supabase.from('subtopics').update(row).eq('id', tid)); }
  else { ({ error } = await supabase.from('subtopics').insert([row])); }
  if(error) return toast('Erro: '+error.message,'err');
  await famrLog('SUBTOPIC_SAVE', row);
  invalidate('home:'); closeModal(); toast('Salvo.'); tabTopicos(document.getElementById('admin-body'));
};
async function tabProtocolos(b){
  const { data } = await supabase.from('requests').select('*,profiles_view(nickname),subtopics(name,auto_listagem_category)').eq('status','pending').order('created_at');
  b.innerHTML = `<div class="card fade-up"><div class="cat-head"><i class="fas fa-inbox"></i> Pendentes (${(data||[]).length})</div>
  <div class="divide-y divide-line">${(data||[]).map(r => `<div class="p-4">
    <div class="flex flex-wrap items-center gap-3 justify-between"><div><b class="text-sm">${esc(r.title)}</b> <span class="chip chip-neutral ml-1">${esc(r.subtopics?.name||'')}</span>
      <p class="text-[11px] text-muted mt-1">${esc(r.profiles_view?.nickname||'')} • ${fmtDate(r.created_at)}</p></div>
      <div class="space-x-1"><button class="btn btn-primary btn-sm" onclick="review('${r.id}','approved')"><i class="fas fa-check"></i> Aprovar</button><button class="btn btn-danger btn-sm" onclick="review('${r.id}','rejected')"><i class="fas fa-xmark"></i> Reprovar</button></div></div>
    <div class="mt-3 grid sm:grid-cols-2 gap-2 text-xs bg-famr-50 rounded-lg p-3">${Object.entries(r.form_data||{}).map(([k,v])=>`<p><b class="text-famr-700">${esc(k)}:</b> ${esc(v)}</p>`).join('')}</div></div>`).join('') || '<p class="p-8 text-center text-sm text-muted">Nenhum pendente.</p>'}</div></div>`;
}
window.review = async (id, status) => {
  if(status === 'approved') return doReview(id, 'approved', '');
  const note = await promptDlg('Motivo (opcional)', '', { title:'Reprovar', okText:'Reprovar', multiline:true });
  if(note===null) return;
  doReview(id, 'rejected', note);
};
window.doReview = async (id, status, note) => { const { error } = await supabase.rpc('review_request', { req_id: id, new_status: status, note: note || null }); if(error) return toast('Erro: '+error.message,'err'); await famrLog('REVIEW_REQUEST', { req_id:id, new_status:status, note }); invalidate('home:'); closeModal(); toast(status==='approved'?'Aprovado!':'Reprovado.'); tabProtocolos(document.getElementById('admin-body')); };

async function tabLogs(b){
  const f = A.logFilters;
  const from = A.page*30;
  let query = supabase.from('logs').select('created_at,action,actor_name,details,ip', { count:'exact' }).order('created_at',{ascending:false}).range(from, from+29);
  if(f.search) query = query.or(`actor_name.ilike.%${f.search}%,details->>title.ilike.%${f.search}%,details->>nick.ilike.%${f.search}%`);
  if(f.user) query = query.ilike('actor_name', `%${f.user}%`);
  if(f.action) query = query.eq('action', f.action);
  if(f.ip) query = query.ilike('ip', `%${f.ip}%`);
  if(f.dateFrom) query = query.gte('created_at', f.dateFrom+'T00:00:00');
  if(f.dateTo) query = query.lte('created_at', f.dateTo+'T23:59:59');
  const { data, count } = await query;
  const totalPages = Math.ceil((count||0)/30);
  const actions = Object.keys(ACTION_PT);
  b.innerHTML = `<div class="card fade-up">
    <div class="cat-head"><i class="fas fa-scroll"></i> Logs de ações <span class="chip chip-neutral ml-2 normal-case">${count??0} registros</span></div>
    <div class="log-filters">
      <input placeholder="Busca livre (nome/título/nick)" value="${esc(f.search)}" onchange="A.logFilters.search=this.value;A.page=0;tabLogs(document.getElementById('admin-body'))">
      <input placeholder="Usuário" value="${esc(f.user)}" onchange="A.logFilters.user=this.value;A.page=0;tabLogs(document.getElementById('admin-body'))">
      <select onchange="A.logFilters.action=this.value;A.page=0;tabLogs(document.getElementById('admin-body'))">
        <option value="">Todas ações</option>
        ${actions.map(a=>`<option value="${a}" ${f.action===a?'selected':''}>${ACTION_PT[a]}</option>`).join('')}
      </select>
      <input placeholder="IP parcial" value="${esc(f.ip)}" onchange="A.logFilters.ip=this.value;A.page=0;tabLogs(document.getElementById('admin-body'))">
      <input type="date" value="${esc(f.dateFrom)}" onchange="A.logFilters.dateFrom=this.value;A.page=0;tabLogs(document.getElementById('admin-body'))">
      <input type="date" value="${esc(f.dateTo)}" onchange="A.logFilters.dateTo=this.value;A.page=0;tabLogs(document.getElementById('admin-body'))">
      <button class="log-clear-btn" onclick="A.logFilters={user:'',action:'',ip:'',dateFrom:'',dateTo:'',search:''};A.page=0;tabLogs(document.getElementById('admin-body'))"><i class="fas fa-xmark mr-1"></i>Limpar</button>
    </div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Data/Hora</th><th>Ação</th><th>Autor</th><th>Detalhes</th><th>IP</th></tr></thead><tbody>
    ${(data||[]).map(l => `<tr>
      <td class="text-xs text-muted whitespace-nowrap">${fmtDate(l.created_at)}</td>
      <td><span class="chip ${l.action==='LOGIN'?'chip-ok':(l.action.includes('DEL')||l.action.includes('BAN'))?'chip-no':'chip-wait'}">${esc(ptAction(l.action))}</span></td>
      <td class="text-xs font-bold">${esc(l.actor_name||'sistema')}</td>
      <td class="text-[11px] text-muted max-w-md truncate" title="${esc(JSON.stringify(l.details))}">${esc(ptDetails(l.details, l.action))}</td>
      <td class="text-xs font-mono text-muted">${esc(l.ip || '—')}</td>
    </tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted py-8">Nenhum log encontrado com esses filtros.</td></tr>'}
    </tbody></table></div>
    <div class="p-3 flex justify-center gap-2 items-center">
      ${A.page>0?`<button class="btn btn-outline btn-sm" onclick="A.page--;tabLogs(document.getElementById('admin-body'))">← Anterior</button>`:''}
      <span class="text-xs text-muted">Página ${A.page+1}${totalPages>1?` de ${totalPages}`:''}</span>
      ${(data||[]).length===30?`<button class="btn btn-outline btn-sm" onclick="A.page++;tabLogs(document.getElementById('admin-body'))">Próxima →</button>`:''}
    </div>
  </div>`;
}
async function tabConfig(b){
  const m = STATE.settings.maintenance || { enabled:false, message:'' }; const a = STATE.settings.announcement || { text:'' };
  b.innerHTML = `<div class="grid md:grid-cols-2 gap-4 fade-up">
    <div class="card"><div class="cat-head"><i class="fas fa-screwdriver-wrench"></i> Manutenção</div><div class="card-body space-y-3">
      <label class="flex items-center gap-3 text-sm font-bold"><input id="c-maint" type="checkbox" class="w-5 h-5 accent-[#c9a227]" ${m.enabled?'checked':''}> Ativar manutenção</label>
      <label class="field"><span>Mensagem</span><input id="c-maint-msg" class="input" value="${esc(m.message||'')}"></label>
      <button class="btn btn-primary btn-sm" onclick="saveMaint()"><i class="fas fa-floppy-disk"></i> Salvar</button></div></div>
    <div class="card"><div class="cat-head"><i class="fas fa-bullhorn"></i> Aviso home</div><div class="card-body space-y-3">
      <textarea id="c-ann" class="input" rows="4">${esc(a.text||'')}</textarea>
      <button class="btn btn-gold btn-sm" onclick="saveAnn()"><i class="fas fa-floppy-disk"></i> Publicar</button></div></div>
  </div>`;
}
window.saveMaint = async () => { const value = { enabled: document.getElementById('c-maint').checked, message: document.getElementById('c-maint-msg').value }; await supabase.from('settings').upsert({ key:'maintenance', value }); STATE.settings.maintenance = value; await famrLog('MANUTENCAO', value); toast('Salvo.'); document.getElementById('maintenance-banner').classList.toggle('hidden', !value.enabled); };
window.saveAnn = async () => { const value = { text: document.getElementById('c-ann').value }; await supabase.from('settings').upsert({ key:'announcement', value }); STATE.settings.announcement = value; await famrLog('AVISO', value); toast('Aviso publicado.'); };

function sanitizeHtml(h){ return String(h||'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/on\w+="[^"]*"/gi,'').replace(/on\w+='[^']*'/gi,''); }

/* ══════════ famrLog SEMPRE ENVIA NICK ══════════ */
async function famrLog(action, details={}){
  const enriched = { ...details };
  if(!enriched.nick){
    enriched.nick = STATE.profile?.nickname || details.nick || null;
  }
  try{
    const fnUrl = CONFIG.supabaseUrl + '/functions/v1/log-action';
    const { data:{ session } } = await supabase.auth.getSession();
    const headers = { 'Content-Type':'application/json', 'apikey': CONFIG.supabaseAnonKey };
    if(session?.access_token) headers['Authorization'] = 'Bearer ' + session.access_token;
    const res = await fetch(fnUrl, { method:'POST', headers, body: JSON.stringify({ action, details: enriched, nick: enriched.nick }) });
    if(res.ok) return;
    throw new Error('HTTP '+res.status);
  }catch(e){
    console.warn('[FAMR] log-action falhou, tentando rpc:', e.message);
    try{ await supabase.rpc('log_action', { action, details: enriched }); }catch(_){}
  }
}

/* ══════════ ENTER SYSTEM ══════════ */
async function enterSystem(userId){
  if(window._famrRecovery){ showScreen('screen-reset'); return; }
  const [profRes, groups, setsRes] = await Promise.all([
    supabase.from('profiles_view').select('*').eq('id', userId).single(),
    loadSessionGroups(userId),
    supabase.from('settings').select('*').in('key',['maintenance','announcement'])
  ]);
  const profile = profRes.data;
  if(profRes.error || !profile){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Perfil não encontrado.', 'err'); return; }
  if(profile.status==='banned'){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Conta BANIDA.', 'err'); return; }
  if(profile.status==='pending'){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Conta não ativada.', 'warn'); return; }
  if(profile.login_locked){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Conta BLOQUEADA.', 'err'); return; }
  STATE.profile = profile; STATE.groups = groups;
  (setsRes.data||[]).forEach(s => STATE.settings[s.key] = s.value);
  await loadPerms();
  if(STATE.settings.maintenance?.enabled && !isAdmin()){
    document.getElementById('maintenance-msg').textContent = STATE.settings.maintenance.message || '';
    showScreen('screen-maintenance'); return;
  }
  startWatchdog(); showScreen('shell');
  try{ await buildSidebar(); }catch(e){}
  if(!location.hash || location.hash==='#') location.hash='#/home';
  try{ await route(); }catch(e){}
}
