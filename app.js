/* ══════════ FAMR • APP.JS COMPLETO v28.1 (Editor Nativo | Perf Cache | Permissão Estrita | Logs PT/IP) ══════════ */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = d => new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
const statusChip = s => s==='approved' ? '<span class="chip chip-ok">APROVADO</span>' : s==='rejected' ? '<span class="chip chip-no">REPROVADO</span>' : '<span class="chip chip-wait">EM ANÁLISE</span>';

const ICON_OPTIONS = ['fa-shield-halved','fa-crown','fa-star','fa-bolt','fa-gavel','fa-scale-balanced','fa-user-shield','fa-users','fa-hand-fist','fa-fire','fa-snowflake','fa-leaf','fa-anchor','fa-plane','fa-helicopter','fa-truck-fast','fa-wrench','fa-screwdriver-wrench','fa-graduation-cap','fa-book-open','fa-scroll','fa-flag','fa-bullhorn','fa-chart-pie','fa-coins','fa-heart','fa-person-dress','fa-paw','fa-dragon','fa-chess-knight','fa-crosshairs','fa-eye','fa-mask','fa-ghost','fa-robot'];
const GROUP_TYPES = { open:'ABERTO', closed:'FECHADO', invisible:'INVISÍVEL' };
const SLUGS_REQUIRE_GROUP = ['companhias'];

/* ══════════ TRADUÇÃO DE LOGS PARA PORTUGUÊS ══════════ */
const ACTION_PT = {
  LOGIN:'Login', LOGOUT:'Logout', REGISTRO:'Cadastro', USER_STATUS:'Alteração de status',
  USER_INVISIBLE:'Visibilidade alterada', LOCK_REMOVIDO_ADMIN:'Desbloqueio administrativo',
  SENHA_LINK_ENVIADO:'Link de senha enviado', SENHA_REDEFINIDA:'Senha redefinida',
  POST_CRIADO:'Publicação criada', POST_EDITADO:'Publicação editada', POST_EXCLUIDO:'Publicação excluída',
  SECTION_SAVE:'Setor salvo', SECTION_CRIADA:'Setor criado', SUBTOPIC_SAVE:'Subtópico salvo',
  GROUP_SAVE:'Grupo salvo', GROUP_DEL:'Grupo excluído', USER_GROUPS:'Grupos de usuário alterados',
  MANUTENCAO:'Modo manutenção', AVISO:'Aviso publicado', REVIEW_REQUEST:'Análise de protocolo',
  DOC_CREATE:'Documento criado', DOC_UPDATE:'Documento atualizado', DOC_DEL:'Documento excluído'
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
  else if(action==='POST_EDITADO')    out.push(`publicação ${shortId(d.id)}`);
  else if(action==='POST_EXCLUIDO')   out.push(`publicação ${shortId(d.id)}`);
  else if(action==='GROUP_SAVE')      out.push(`grupo "${d.name||'?'}" (${d.group_type||'?'} · ordem ${d.order_index??'-'})`);
  else if(action==='GROUP_DEL')       out.push(`grupo ${shortId(d.id)}`);
  else if(action==='USER_GROUPS')     out.push(`usuário ${shortId(d.userId)} recebeu ${Array.isArray(d.ids)?d.ids.length+' grupo(s)':d.ids}`);
  else if(action==='SECTION_SAVE'||action==='SECTION_CRIADA') out.push(`setor "${d.name||'?'}" (/ ${d.slug||'?'})`);
  else if(action==='SUBTOPIC_SAVE')   out.push(`subtópico "${d.name||'?'}"`);
  else if(action==='MANUTENCAO')      out.push(`manutenção ${d.enabled?'ATIVADA':'desativada'}${d.message?` · msg: "${truncate(d.message,40)}"`:''}`);
  else if(action==='AVISO')           out.push(d.text ? `aviso: "${truncate(d.text,60)}"` : 'aviso removido');
  else if(action==='SENHA_LINK_ENVIADO') out.push(`nickname: ${d.nick||'?'}`);
  else if(action==='REVIEW_REQUEST')  out.push(`protocolo ${shortId(d.req_id)} → ${statusLabel(d.new_status)}${d.note?` · motivo: "${truncate(d.note,40)}"`:''}`);
  else if(action==='DOC_CREATE')      out.push(`documento "${d.title||'?'}"${d.category?` (${d.category})`:''}`);
  else if(action==='DOC_UPDATE')      out.push(`documento "${d.title||'?'}" atualizado`);
  else if(action==='DOC_DEL')         out.push(`documento ${shortId(d.id)} excluído`);
  else { Object.entries(d).forEach(([k,v])=>out.push(`${k}: ${typeof v==='object'?JSON.stringify(v):v}`)); }
  return out.join(' · ') || '—';
}

/* ══════════ CACHE GLOBAL COM INVALIDAÇÃO POR EVENTO ══════════ */
const CACHE = { data:{}, ttl:{} };
function cacheGet(key){ const e=CACHE.data[key]; if(e && Date.now()-e.t < (CACHE.ttl[key]||60_000)) return e.v; return undefined; }
function cacheSet(key,v,ttl=60_000){ CACHE.data[key]={t:Date.now(),v}; CACHE.ttl[key]=ttl; return v; }
function invalidate(prefix){ 
  Object.keys(CACHE.data).forEach(k=>{ 
    if(!prefix||k.startsWith(prefix)) delete CACHE.data[k]; 
  }); 
}
async function cachedQuery(key, factory, ttl=60_000){
  const hit = cacheGet(key); 
  if(hit!==undefined) return hit;
  const r = await factory(); 
  cacheSet(key,r,ttl); 
  return r;
}
const PAGE_SIZE = 25;

/* ══════════ HELPERS DE GRUPO / CHIP ══════════ */
function groupChip(g){ return g ? `<span class="chip" style="background:${g.color}18;color:${g.color};border:1px solid ${g.color}55"><i class="fas ${g.icon||'fa-shield-halved'}"></i> ${esc(g.name)}</span>` : '<span class="chip chip-neutral">Geral</span>'; }
function sortGroups(list){ return [...(list||[])].sort((a,b)=>(a.order_index||0)-(b.order_index||0)); }
function primaryGroupOf(list){ return sortGroups(list)[0] || null; }
function colorGroupOf(list){ return sortGroups(list).find(g => g.apply_color) || null; }
function userIconOf(list){ return primaryGroupOf(list)?.icon || 'fa-user'; }

/* ══════════ RESOLUÇÃO ÚNICA E ESTRITA DE PERMISSÃO ══════════ */
function permOf(type,id){ return STATE.perms?.[type+':'+id] || null; }
function hasAnyRule(type,id){ return !!STATE.ruleIndex?.has(type+':'+id); }
function resolvePerm(type,id){
  const u = permOf(type,id);
  if(u) return u;
  const a = STATE.permAll?.[type+':'+id];
  if(a) return a;
  if(hasAnyRule(type,id))
    return {view:false,create:false,edit:false,del:false,mod:false};
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

/* ══════════ TEMA / UI UTILITIES ══════════ */
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
function openModal(title, bodyHTML, footerHTML=''){
  document.getElementById('modal-title').innerHTML = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML;
  document.getElementById('modal-root').classList.remove('hidden');
}
function closeModal(){ document.getElementById('modal-root').classList.add('hidden'); }
function confirmDlg(msg){ return new Promise(res => {
  openModal('<i class="fas fa-triangle-exclamation text-gold-500 mr-2"></i>Confirmar', `<p class="text-sm text-muted">${esc(msg)}</p>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal();window._cf(false)">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="closeModal();window._cf(true)">Confirmar</button>`);
  window._cf = res;
});}

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
  const key = (page==='home') ? 'home' : (param ? page+'/'+param : page);
  updateUserChip(); applyThemeIcon(); updateSidebarActive(key);
  if(window._qsTimer){ clearInterval(window._qsTimer); window._qsTimer = null; }
  const c = document.getElementById('content');
  if(!c) return;
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
function updateSidebarActive(key){
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.key === key));
}

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
    html += `<a class="nav-item" data-key="section/${s.slug}" href="#/section/${s.slug}">
      <i class="fas ${esc(s.icon||'fa-folder')}"></i> ${esc(s.name)}</a>`;
  }
  html += `<div class="nav-sep">Minha conta</div>
           <a class="nav-item" data-key="perfil/me" href="#/perfil/me"><i class="fas fa-id-badge"></i> Meu perfil</a>`;
  if(isAdmin()) html += `<div class="nav-sep">Comando</div>
           <a class="nav-item" data-key="admin" href="#/admin"><i class="fas fa-sliders"></i> Painel Admin</a>`;
  nav.innerHTML = html;
  updateUserChip(); applyThemeIcon();
  if(STATE.settings.maintenance?.enabled && isAdmin()) document.getElementById('maintenance-banner').classList.remove('hidden');
}

/* ══════════ HOME (com cache + paralelização máxima) ══════════ */
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
    <div class="qs-left">
      <span class="qs-badge"><i class="fas fa-shield-halved"></i></span>
      <div class="qs-txt"><b class="qs-title">Plantão do Quartel</b>
        <span class="qs-sub"><i class="far fa-clock"></i><span class="qs-clock">--:--:--</span>•<span id="qs-date"></span></span></div>
    </div>
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
      <div>
        <p class="text-gold-300 text-xs font-bold tracking-[0.3em] uppercase">Índice do quartel • Habbo BR</p>
        <h1 class="font-display text-2xl md:text-3xl font-extrabold mt-1">Bem-vindo, ${esc(STATE.profile.nickname)}</h1>
        <div class="flex flex-wrap gap-2 mt-3">${(STATE.groups||[]).map(groupChip).join('') || '<span class="chip chip-neutral">Sem grupo</span>'}</div>
      </div>
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
    <div class="st-body stab-panel" id="stab-usuarios">
      Há <strong>${totalOnline}</strong> usuário online :: ${registeredCount} registrado${registeredCount!==1?'s':''}, 0 invisíveis e 0 visitantes<br>
      Último recruta aprovado: ${lastChip}
    </div>
    <div class="st-body stab-panel hidden" id="stab-aniversarios">
      <p class="st-empty">Nenhum membro festeja o aniversário hoje</p>
      <p class="st-empty">Nenhum membro festeja o aniversário nos próximos 7 dias</p>
    </div>
    <div class="st-body stab-panel hidden" id="stab-grupos">
      <div class="st-groups-list">
        ${(groups||[]).map(g => `<a href="#/grupo/${g.id}" class="sg-link"><i class="fas ${g.icon||'fa-shield-halved'}" style="color:${g.color}"></i><span>${esc(g.name)}</span><span class="text-[10px] text-muted">(${memberCount[g.id]||0})</span></a>`).join('') || '<em class="text-muted text-xs">Nenhum grupo cadastrado.</em>'}
      </div>
    </div>
    <div class="st-body st-legend">
      <strong class="text-famr-800">Legenda:</strong>
      <div class="flex flex-wrap gap-3 mt-1">
        ${legend.map(i=>`<span class="inline-flex items-center gap-1.5"><i class="fas ${i.icon}" style="color:${i.color}"></i><span class="text-muted">${esc(i.label)}</span></span>`).join('')}
      </div>
    </div>
  </section>`;

  startQsClock();
  bindHomeTabs();
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
      ${locked ? '<i class="fas fa-lock lock-badge"></i> acesso reservado' : last ? `<i class="fas fa-clock text-gold-500 mr-1"></i>${fmtDate(last.created_at)}<br><span class="ml-4">por <b class="text-famr-700">${esc(last.profiles_view?.nickname||'—')}</b></span>` : 'sem publicações'}
    </div>
  </a>`;
}

/* ══════════ PÁGINA DE GRUPO ══════════ */
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
      ${!isMember && grp.group_type==='open' ? `<button class="btn btn-primary btn-sm" onclick="joinGroup('${grp.id}')"><i class="fas fa-right-to-bracket"></i> Entrar no grupo</button>` : ''}
      ${isMember && grp.group_type==='open' ? `<button class="btn btn-outline btn-sm" onclick="leaveGroup('${grp.id}')"><i class="fas fa-right-from-bracket"></i> Sair do grupo</button>` : ''}
      ${grp.group_type==='closed' && !isMember ? `<span class="chip chip-wait"><i class="fas fa-lock"></i> Entrada apenas por convite da liderança</span>` : ''}
      ${canManage ? `<button class="btn btn-gold btn-sm" onclick="groupMembers('${grp.id}')"><i class="fas fa-user-plus"></i> Gerenciar membros</button>` : ''}
    </div>
  </div>
  <section class="card overflow-hidden fade-up mt-4">
    <div class="cat-head"><i class="fas fa-users"></i> Membros efetivos (${list.length})</div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Membro</th><th>Status</th></tr></thead>
    <tbody>${list.map(m => `<tr>
      <td><a href="#/perfil/${m.id}" class="font-bold text-famr-700 hover:underline"><i class="fas ${userIconOf(iconByUser[m.id]||[])} mr-2" style="color:${(colorGroupOf(iconByUser[m.id]||[])||{}).color || 'var(--muted)'}"></i>${esc(m.nickname)}</a></td>
      <td><span class="chip chip-ok">ATIVO</span></td></tr>`).join('') || '<tr><td colspan="2" class="text-center text-muted py-8">Nenhum membro ativo neste grupo.</td></tr>'}</tbody></table></div>
  </section>`;
}
window.joinGroup = async id => { const { error } = await supabase.from('user_groups').insert([{ user_id: STATE.profile.id, group_id: id }]); if(error) return toast('Erro: '+error.message,'err'); toast('Você entrou no grupo.'); reloadSessionGroups(); };
window.leaveGroup = async id => { await supabase.from('user_groups').delete().eq('user_id', STATE.profile.id).eq('group_id', id); toast('Você saiu do grupo.'); reloadSessionGroups(); };

/* ══════════ CARREGAR GRUPOS DA SESSÃO ══════════ */
async function loadSessionGroups(userId){
  try{
    const { data, error } = await supabase.rpc('famr_get_my_groups');
    if(!error && Array.isArray(data)){
      const gs = sortGroups(data);
      console.log('[FAMR] grupos via RPC:', gs.map(x=>x.name), '| isAdmin?', gs.some(x=>(x.permissions||[]).includes('admin')));
      return gs;
    }
    if(error) console.warn('[FAMR] RPC famr_get_my_groups falhou, caindo p/ SELECT:', error.message||error);
  }catch(e){ console.warn('[FAMR] RPC indisponível, caindo p/ SELECT:', e); }
  const { data: ug, error: ugErr } = await supabase.from('user_groups').select('group_id').eq('user_id', userId);
  if(ugErr) console.error('[FAMR] fallback user_groups:', ugErr);
  const gids = (ug||[]).map(r=>r.group_id).filter(Boolean);
  let groups = [];
  if(gids.length){
    const { data: g, error: gErr } = await supabase.from('groups').select('*').in('id', gids);
    if(gErr) console.error('[FAMR] fallback groups:', gErr);
    groups = g || [];
  }
  console.log('[FAMR] grupos via SELECT:', groups.map(x=>x.name), '| isAdmin?', groups.some(x=>(x.permissions||[]).includes('admin')));
  return sortGroups(groups);
}
async function reloadSessionGroups(){
  STATE.groups = await loadSessionGroups(STATE.profile.id);
  await loadPerms();
  invalidate('perms:'); invalidate('home:');
  updateUserChip(); route();
}

/* ══════════ LOADPERMS EM UMA QUERY + RULE INDEX ══════════ */
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
    c.innerHTML = secHead(sec) + `<div class="card card-body text-center py-14 fade-up"><i class="fas fa-user-shield text-4xl text-gold-500"></i><h2 class="font-display font-bold text-xl mt-3">Acesso restrito</h2><p class="text-sm text-muted mt-1">Você ainda não pertence a nenhuma companhia. Aguarde o alistamento em um grupo pelo Alto Comando.</p></div>`;
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
    </div>`).join('') || '<div class="card card-body text-sm text-muted sm:col-span-2 lg:col-span-3 text-center py-10">Nenhuma companhia cadastrada.</div>'}
  </div>`;
}

/* ══════════ SUBTÓPICO (lista de tópicos com paginação) ══════════ */
async function renderSubtopic(c, id, page=0){
  const { data: sub } = await supabase.from('subtopics').select('*,sections(name,slug)').eq('id', id).single();
  if(!sub){ c.innerHTML = '<div class="card card-body text-sm text-muted">Subtópico não encontrado.</div>'; return; }
  if(!canViewSub(sub)){ c.innerHTML = `<div class="card card-body text-center py-14"><i class="fas fa-lock text-3xl text-gold-500"></i><h2 class="font-display font-bold text-xl mt-3">Acesso restrito</h2><p class="text-sm text-muted mt-1">Conteúdo exclusivo de grupo específico.</p></div>`; return; }
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
      <textarea name="content" class="input" rows="4" placeholder="Conteúdo da publicação..." required></textarea>
      <input name="link" class="input" placeholder="Link de anexo (Google Drive) — opcional">
      <button class="btn btn-gold btn-sm justify-self-start"><i class="fas fa-paper-plane"></i> Publicar tópico</button></form>` : ''}
  <section class="card overflow-hidden fade-up">
    <div class="cat-head"><i class="fas fa-inbox"></i> Tópicos de ${esc(sub.name)} <span class="ml-auto text-[10px] normal-case tracking-normal text-gold-300">${count||0} no total</span></div>
    <div class="divide-y divide-line">
      ${(posts||[]).map(p => `<div class="topic-row" onclick="openTopic('${p.id}')">
        <span class="forum-ico ${p.pinned?'new':''}"><i class="fas ${p.pinned?'fa-thumbtack':'fa-comment'}"></i></span>
        <div class="flex-1 min-w-0"><b class="text-sm text-famr-800">${esc(p.title)}</b><p class="text-[11px] text-muted">por <b class="text-famr-700">${esc(p.profiles_view?.nickname||'—')}</b> • ${fmtDate(p.created_at)}</p></div>
        <i class="fas fa-chevron-right text-xs text-muted"></i></div>`).join('') || '<p class="p-6 text-sm text-muted text-center">Nenhum tópico publicado ainda.</p>'}
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
    `<div class="text-[11px] text-muted mb-3"><i class="fas fa-user-pen text-gold-500 mr-1"></i>${esc(p.profiles_view?.nickname||'—')} • ${fmtDate(p.created_at)}</div>
     <p class="text-sm whitespace-pre-wrap text-ink">${esc(p.content)}</p>
     ${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm mt-4"><i class="fab fa-google-drive"></i> Abrir anexo</a>` : ''}`,
    `${mine && canEditIn(sub) ? `<button class="btn btn-outline btn-sm mr-auto" onclick="editPost('${p.id}')"><i class="fas fa-pen"></i> Editar</button>` : ''}
     ${mine || canDeleteIn(sub) ? `<button class="btn btn-danger btn-sm ${mine && canEditIn(sub) ? '' : 'mr-auto'}" onclick="delPost('${p.id}')"><i class="fas fa-trash"></i> Excluir</button>` : ''}
     <button class="btn btn-outline btn-sm" onclick="closeModal()">Fechar</button>`);
};
window.editPost = id => {
  const p = window._postsCache?.[id]; if(!p) return;
  openModal('<i class="fas fa-pen text-gold-500 mr-2"></i>Editar publicação',
    `<label class="field"><span>Conteúdo</span><textarea id="edit-content" class="input" rows="6">${esc(p.content)}</textarea></label>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="saveEditPost('${id}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveEditPost = async id => {
  const content = document.getElementById('edit-content').value;
  const { error } = await supabase.from('posts').update({ content }).eq('id', id);
  if(error) return toast('Erro: '+error.message,'err');
  try{ await supabase.rpc('log_action', { action:'POST_EDITADO', details:{ id } }); }catch(e){}
  invalidate('posts:'); invalidate('home:');
  closeModal(); toast('Publicação atualizada.'); route();
};
window.newPost = async function(e, subtopicId){
  e.preventDefault(); const f = e.target;
  const { error } = await supabase.from('posts').insert([{ subtopic_id: subtopicId, title: f.title.value, content: f.content.value, link: f.link.value||null, author_id: STATE.profile.id }]);
  if(error){ toast('Erro: '+error.message,'err'); return false; }
  try{ await supabase.rpc('log_action', { action:'POST_CRIADO', details:{ subtopicId } }); }catch(e){}
  invalidate('posts:'); invalidate('home:');
  toast('Tópico publicado!'); route(); return false;
};
window.delPost = async function(id){
  if(!await confirmDlg('Excluir esta publicação?')) return;
  await supabase.from('posts').delete().eq('id', id);
  try{ await supabase.rpc('log_action', { action:'POST_EXCLUIDO', details:{ id } }); }catch(e){}
  invalidate('posts:'); invalidate('home:');
  closeModal(); toast('Publicação excluída.'); route();
};

/* ══════════ LISTAGEM ══════════ */
async function renderListagem(c, sec){
  const { data: entries } = await supabase.from('listagem_entries').select('*').order('created_at',{ascending:false}).limit(100);
  const cats = [...new Set((entries||[]).map(e => e.category))];
  c.innerHTML = secHead(sec) + `
  <div class="card fade-up">
    <div class="cat-head"><i class="fas fa-list-ul"></i> Registros oficiais ${cats.map(k => `<span class="chip chip-neutral ml-2 normal-case">${esc(k)}</span>`).join('')}</div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Registro</th><th>Categoria</th><th>Detalhes</th><th>Origem</th><th>Data</th></tr></thead>
    <tbody>${(entries||[]).map(e => `<tr>
      <td class="font-bold text-famr-800">${esc(e.title)}</td><td><span class="chip chip-neutral">${esc(e.category)}</span></td>
      <td class="text-xs text-muted">${Object.entries(e.data||{}).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join(' • ')}</td>
      <td class="text-xs">${e.source_request_id ? '<span class="chip chip-ok"><i class="fas fa-link"></i> requerimento</span>' : '<span class="chip chip-neutral">manual</span>'}</td>
      <td class="text-xs text-muted">${fmtDate(e.created_at)}</td></tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted py-8">Nenhum registro publicado ainda.</td></tr>'}</tbody></table></div>
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
          <div class="flex items-center justify-between"><h3 class="font-display font-bold">${esc(s.name)}</h3></div>
          <p class="text-xs text-muted mt-1">${esc(s.description||'')}</p>
          <button class="btn btn-gold btn-sm mt-3" onclick='openRequestForm(${JSON.stringify(s).replace(/'/g,"&#39;")})'><i class="fas fa-pen-to-square"></i> Abrir protocolo</button>
        </div>`).join('') || '<div class="card card-body text-sm text-muted">Nenhum formulário disponível.</div>'}
    </div>
    <div class="lg:col-span-2 card fade-up">
      <div class="cat-head"><i class="fas fa-inbox"></i> Meus protocolos</div>
      <div class="divide-y divide-line max-h-[560px] overflow-auto">
        ${(mine||[]).map(r => `<div class="p-4 flex items-center justify-between gap-3 hover:bg-gold-100/40 transition-colors">
          <div><p class="font-bold text-sm">${esc(r.title)}</p><p class="text-[11px] text-muted mt-0.5">${esc(r.subtopics?.name||'')} • ${fmtDate(r.created_at)} ${r.review_note?`• <i>"${esc(r.review_note)}"</i>`:''}</p></div>
          ${statusChip(r.status)}</div>`).join('') || '<p class="p-8 text-center text-sm text-muted">Você ainda não abriu protocolos.</p>'}
      </div></div>
  </div>`;
}
window.openRequestForm = function(sub){
  const fields = sub.form_fields || [];
  openModal(`<i class="fas fa-file-signature text-gold-500 mr-2"></i>${esc(sub.name)}`,
    fields.map(f => `<label class="field"><span>${esc(f.label)}${f.required?' *':''}</span>
      ${f.type==='textarea' ? `<textarea data-f="${esc(f.label)}" data-req="${!!f.required}" class="input" rows="3"></textarea>` : `<input data-f="${esc(f.label)}" data-req="${!!f.required}" class="input" type="${f.type||'text'}">`}</label>`).join(''),
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="submitRequest('${sub.id}')"><i class="fas fa-paper-plane"></i> Enviar ao CRH</button>`);
};
window.submitRequest = async function(subtopicId){
  const inputs = [...document.querySelectorAll('#modal-body [data-f]')];
  const data = {}; let ok = true;
  inputs.forEach(i => { data[i.dataset.f] = i.value.trim(); if(i.dataset.req==='true' && !i.value.trim()) ok = false; });
  if(!ok){ toast('Preencha todos os campos obrigatórios.', 'warn'); return; }
  const title = (Object.values(data)[0] || 'Protocolo') + '';
  const { error } = await supabase.from('requests').insert([{ subtopic_id: subtopicId, author_id: STATE.profile.id, title, form_data: data }]);
  if(error){ toast('Erro ao enviar: '+error.message, 'err'); return; }
  closeModal(); toast('Protocolo enviado! Aguarde a análise do CRH/RH.'); route();
};

/* ══════════ DOCUMENTOS PRINCIPAIS (v28.1: Editor Nativo contenteditable) ══════════ */
let _docEditor=null, _currentDocId=null;

async function renderDocumentos(c, sec){
  if(!canViewSection(sec)){ c.innerHTML = secHead(sec)+lockCard('documentos'); return; }
  const canManage = isAdmin() || canCreateIn({section_id:sec.id, allow_posts:true}) || (STATE.perms?.['section:'+sec.id]?.create);
  const { data: docs } = await cachedQuery('docs:list', ()=> supabase.from('documents').select('id,title,category,cover_url,updated_at,author_id,profiles_view(nickname)').order('updated_at',{ascending:false}), 30_000);
  const cats = [...new Set((docs||[]).map(d=>d.category).filter(Boolean))];
  c.innerHTML = secHead(sec) + `
  <div class="flex flex-wrap items-center gap-2 mb-4 fade-up">
    ${canManage?`<button class="btn btn-primary btn-sm" onclick="openDocEditor(null)"><i class="fas fa-plus"></i> Novo tópico</button>`:''}
    <input id="doc-q" class="input !py-1.5 w-56 ml-auto" placeholder="Buscar documento..." oninput="filterDocs(this.value)">
  </div>
  <div id="doc-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-up">
    ${(docs||[]).map(d=>docCard(d, canManage)).join('') || '<div class="card card-body text-sm text-muted sm:col-span-2 lg:col-span-3 text-center py-10">Nenhum documento publicado.</div>'}
  </div>`;
  window._docsCache = docs||[];
}
function lockCard(t){ return `<div class="card card-body text-center py-14"><i class="fas fa-lock text-3xl text-gold-500"></i><h2 class="font-display font-bold text-xl mt-3">Acesso restrito</h2><p class="text-sm text-muted mt-1">Conteúdo exclusivo (${t}).</p></div>`; }
function docCard(d, canManage){
  return `<div class="card card-hover overflow-hidden doc-item" data-title="${esc((d.title||'').toLowerCase())}" data-cat="${esc((d.category||'').toLowerCase())}">
    ${d.cover_url?`<img src="${esc(d.cover_url)}" class="w-full h-32 object-cover" alt="" loading="lazy">`:''}
    <div class="p-4">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-bold text-famr-800 leading-snug">${esc(d.title)}</h3>
        ${d.category?`<span class="chip chip-neutral shrink-0">${esc(d.category)}</span>`:''}
      </div>
      <p class="text-[11px] text-muted mt-1">por <b>${esc(d.profiles_view?.nickname||'—')}</b> • ${fmtDate(d.updated_at)}</p>
      <div class="flex gap-1 mt-3">
        <button class="btn btn-outline btn-sm" onclick="viewDoc('${d.id}')"><i class="fas fa-book-open"></i> Ler</button>
        ${canManage?`<button class="btn btn-outline btn-sm" onclick="openDocEditor('${d.id}')"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" onclick="delDoc('${d.id}')"><i class="fas fa-trash"></i></button>`:''}
      </div>
    </div>
  </div>`;
}
window.filterDocs = q => {
  q=q.toLowerCase().trim();
  document.querySelectorAll('.doc-item').forEach(el=>{
    const ok=!q || el.dataset.title.includes(q) || (el.dataset.cat||'').includes(q);
    el.style.display = ok?'':'none';
  });
};
window.viewDoc = async id => {
  const { data:d } = await supabase.from('documents').select('*,profiles_view(nickname)').eq('id',id).single();
  if(!d) return toast('Documento não encontrado.','err');
  openModal(`<i class="fas fa-book-open text-gold-500 mr-2"></i>${esc(d.title)} ${d.category?`<span class="chip chip-neutral ml-1 normal-case">${esc(d.category)}</span>`:''}`,
    `<div class="text-[11px] text-muted mb-3">por <b>${esc(d.profiles_view?.nickname||'—')}</b> • atualizado ${fmtDate(d.updated_at)}</div>
     <article class="te-prose !max-h-none !overflow-visible bg-transparent border-0 p-0">${sanitizeHtml(d.body_html||'')}</article>`,
    `<button class="btn btn-outline btn-sm mr-auto" onclick="downloadDoc('${id}')"><i class="fas fa-download"></i> Baixar .doc</button>
     <button class="btn btn-outline btn-sm" onclick="closeModal()">Fechar</button>`);
};
window.downloadDoc = async id => {
  const { data:d } = await supabase.from('documents').select('title,body_html').eq('id',id).single();
  if(!d) return;
  /* Gera um arquivo .doc simples (HTML com extensão .doc abre no Word) */
  const fullHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(d.title)}</title></head><body>${d.body_html}</body></html>`;
  const blob = new Blob(['\ufeff'+fullHtml], {type:'application/msword'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=(d.title||'documento').replace(/[^\w\-]+/g,'_')+'.doc'; a.click(); URL.revokeObjectURL(url);
};
window.delDoc = async id => {
  if(!await confirmDlg('Excluir este documento permanentemente?')) return;
  await supabase.from('documents').delete().eq('id',id);
  try{ await supabase.rpc('log_action',{action:'DOC_DEL',details:{id}}); }catch(e){}
  invalidate('docs:'); closeModal(); toast('Documento excluído.'); route();
};

/* ── ABRE O EDITOR (criar/editar) ── */
window.openDocEditor = async id => {
  _currentDocId = id||null;
  let d = { title:'', category:'', body_html:'', cover_url:null };
  if(id){ const r=await supabase.from('documents').select('*').eq('id',id).single(); if(r.data)d=r.data; }
  openModal(`<i class="fas fa-${id?'pen-to-square':'file-circle-plus'} text-gold-500 mr-2"></i>${id?'Editar':'Novo'} documento`,
    `<div class="grid gap-3">
       <div class="grid sm:grid-cols-2 gap-3">
         <label class="field"><span>Título do tópico *</span><input id="dc-title" class="input !pl-3" value="${esc(d.title)}" required></label>
         <label class="field"><span>Categoria / Tag</span><input id="dc-cat" class="input !pl-3" value="${esc(d.category||'')}" placeholder="ex: Diretrizes Gerais"></label>
       </div>
       <label class="field"><span>Capa (imagem, opcional)</span>
         <div class="flex items-center gap-2">
           <input type="file" id="dc-cover" accept="image/*" class="text-xs">
           <span id="dc-cover-prev" class="text-xs text-muted">${d.cover_url?'capa atual definida':'sem capa'}</span>
         </div></label>
       <div class="doc-editor">
         <div class="te-toolbar" id="dc-toolbar"></div>
         <div class="te-prose" id="dc-prose" contenteditable="true" spellcheck="false">${d.body_html||'<p>Digite aqui o conteúdo do documento...</p>'}</div>
         <div class="te-status"><span id="dc-count">0 palavras</span></div>
       </div>
     </div>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="saveDoc()"><i class="fas fa-floppy-disk"></i> Salvar documento</button>`);
  initNativeEditor();
};

/* ── EDITOR NATIVO (contenteditable + execCommand) ── */
function initNativeEditor(){
  const prose = document.getElementById('dc-prose');
  const bar = document.getElementById('dc-toolbar');
  bar.innerHTML = '';
  
  const mkBtn = (label, icon, cmd, val=null) => {
    const b=document.createElement('button'); b.type='button'; b.className='te-btn'; b.title=label;
    b.innerHTML=`<i class="fas ${icon}"></i>`;
    b.onclick=()=>{ prose.focus(); document.execCommand(cmd,false,val); refreshToolbar(); };
    b.dataset.cmd=cmd; b.dataset.val=val;
    bar.appendChild(b); return b;
  };
  const mkSep = () => { const s=document.createElement('span'); s.className='te-sep'; bar.appendChild(s); };

  mkBtn('Negrito','fa-bold','bold');
  mkBtn('Itálico','fa-italic','italic');
  mkBtn('Sublinhado','fa-underline','underline');
  mkBtn('Tachado','fa-strikethrough','strikeThrough');
  mkSep();
  mkBtn('Título 1','fa-heading',[1],'formatBlock','<h1>');
  mkBtn('Título 2','fa-heading',[2],'formatBlock','<h2>');
  mkBtn('Título 3','fa-heading',[3],'formatBlock','<h3>');
  mkBtn('Parágrafo','fa-paragraph','','formatBlock','<p>');
  mkBtn('Citação','fa-quote-left','','formatBlock','<blockquote>');
  mkSep();
  mkBtn('Alinhar esq.','fa-align-left','justifyLeft');
  mkBtn('Centralizar','fa-align-center','justifyCenter');
  mkBtn('Alinhar dir.','fa-align-right','justifyRight');
  mkBtn('Justificar','fa-align-justify','justifyFull');
  mkSep();
  mkBtn('Lista','fa-list-ul','insertUnorderedList');
  mkBtn('Numeração','fa-list-ol','insertOrderedList');
  mkSep();
  mkBtn('Subscrito','fa-subscript','subscript');
  mkBtn('Superscrito','fa-superscript','superscript');
  mkSep();
  mkBtn('Link','fa-link','',()=>{ const u=prompt('URL do link:'); if(u) document.execCommand('createLink',false,u); });
  mkBtn('Remover link','fa-link-slash','unlink');
  mkBtn('Imagem','fa-image','',()=>pickAndInsertImage(prose));
  mkBtn('Emoji','fa-face-smile','',()=>insertEmojiPicker(prose));
  mkSep();
  mkBtn('Réguas horizontal','fa-minus','insertHorizontalRule');
  mkBtn('Limpar formato','fa-eraser','removeFormat');
  mkBtn('Desfazer','fa-undo','undo');
  mkBtn('Refazer','fa-repeat','redo');

  prose.addEventListener('keyup', refreshToolbar);
  prose.addEventListener('mouseup', refreshToolbar);
  prose.addEventListener('input', updateWordCount);
  updateWordCount();

  function refreshToolbar(){
    bar.querySelectorAll('.te-btn').forEach(b=>{
      const cmd=b.dataset.cmd;
      if(!cmd) return;
      try{ b.classList.toggle('is-active', document.queryCommandState(cmd)); }catch(e){}
    });
  }
  function updateWordCount(){
    const txt = prose.innerText.trim();
    const wc = txt ? txt.split(/\s+/).filter(Boolean).length : 0;
    document.getElementById('dc-count').textContent = wc+' palavra'+(wc!==1?'s':'');
  }
}
function pickAndInsertImage(prose){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=async()=>{
    const f=inp.files[0]; if(!f)return;
    const path=`${Date.now()}_${f.name.replace(/\s+/g,'_')}`;
    const { error } = await supabase.storage.from('docs-media').upload(path, f, {contentType:f.type});
    if(error) return toast('Upload falhou: '+error.message,'err');
    const { data:{ publicUrl } } = supabase.storage.from('docs-media').getPublicUrl(path);
    prose.focus();
    document.execCommand('insertImage', false, publicUrl);
  };
  inp.click();
}
function insertEmojiPicker(prose){
  const pops=['😀','😁','️','⭐','✅','❌','️','📌','💼','❤️','🔥','✨'];
  const wrap=document.createElement('div'); wrap.style.cssText='position:absolute;z-index:99;display:flex;gap:.2rem;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:.3rem;box-shadow:0 8px 20px -8px rgba(0,0,0,.3)';
  pops.forEach(em=>{ const b=document.createElement('button'); b.type='button'; b.textContent=em; b.style.cssText='border:none;background:none;cursor:pointer;font-size:1.1rem'; b.onclick=()=>{ prose.focus(); document.execCommand('insertText',false,em); wrap.remove(); }; wrap.appendChild(b); });
  document.body.appendChild(wrap);
  setTimeout(()=>document.addEventListener('click',()=>wrap.remove(),{once:true}),10);
}
window.saveDoc = async () => {
  const title=document.getElementById('dc-title').value.trim();
  if(!title) return toast('Informe o título.','warn');
  const category=document.getElementById('dc-cat').value.trim()||null;
  const body_html=document.getElementById('dc-prose').innerHTML;
  let cover_url=null;
  const covFile=document.getElementById('dc-cover').files[0];
  if(covFile){
    const p=`covers/${Date.now()}_${covFile.name.replace(/\s+/g,'_')}`;
    const up=await supabase.storage.from('docs-media').upload(p,covFile,{contentType:covFile.type});
    if(!up.error) cover_url=supabase.storage.from('docs-media').getPublicUrl(p).data.publicUrl;
  }
  const payload={ title, category, body_html, ...(cover_url?{cover_url}:{}) };
  let error;
  if(_currentDocId){ ({error}=await supabase.from('documents').update(payload).eq('id',_currentDocId)); }
  else { payload.author_id=STATE.profile.id; ({error}=await supabase.from('documents').insert([payload])); }
  if(error) return toast('Erro ao salvar: '+error.message,'err');
  try{ await supabase.rpc('log_action',{action:_currentDocId?'DOC_UPDATE':'DOC_CREATE',details:{title,category}}); }catch(e){}
  invalidate('docs:'); closeModal(); toast('Documento salvo com sucesso.'); route();
};
function sanitizeHtml(h){ return String(h||'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/on\w+="[^"]*"/gi,'').replace(/on\w+='[^']*'/gi,''); }

/* ══════════ PERFIL ══════════ */
async function renderProfile(c, param){
  const me = (!param || param === 'me');
  const id = me ? STATE.profile.id : param;
  const { data: p } = await supabase.from('profiles_view').select('*').eq('id', id).single();
  if(!p){ c.innerHTML = '<div class="card card-body text-sm text-muted">Perfil não encontrado.</div>'; return; }
  let gs = [];
  if(me){
    gs = sortGroups(STATE.groups);
  } else {
    const { data: ug, error: ugErr } = await supabase.from('user_groups').select('group_id').eq('user_id', id);
    if(ugErr) console.error('[FAMR] perfil → vínculos:', ugErr);
    const gids = (ug||[]).map(r => r.group_id).filter(Boolean);
    if(gids.length){
      const { data: groups, error: gErr } = await supabase.from('groups').select('*').in('id', gids);
      if(gErr) console.error('[FAMR] perfil → grupos:', gErr);
      gs = sortGroups(groups||[]);
    }
  }
  const viewerOk = me || isAdmin();
  gs = gs.filter(g => g.group_type !== 'invisible' || viewerOk || STATE.modGroups?.has(g.id));
  const main = primaryGroupOf(gs);
  const cg   = colorGroupOf(gs);
  c.innerHTML = `
  <div class="card fade-up overflow-hidden">
    <div class="h-24" style="background:linear-gradient(120deg,#0e4433,#14563f 60%,#c9a227)"></div>
    <div class="p-6 -mt-12">
      <div class="flex flex-wrap items-end gap-4">
        <span class="w-20 h-20 rounded-2xl grid place-items-center text-3xl font-extrabold text-white border-4 border-white shadow-lg"
              style="background:${cg?.color || '#14563f'}">
          <i class="fas ${main?.icon || 'fa-user'}"></i>
        </span>
        <div class="flex-1">
          <h1 class="font-display text-2xl font-extrabold">${esc(p.nickname)}</h1>
          <p class="text-xs text-muted">No sistema desde ${fmtDate(p.created_at)} ${me ? `• ${esc(p.email)}` : ''}</p>
        </div>
        <span class="chip ${p.status==='active'?'chip-ok':p.status==='pending'?'chip-wait':'chip-no'}">${p.status.toUpperCase()}</span>
        ${p.login_locked ? '<span class="chip chip-no"><i class="fas fa-lock mr-1"></i>BLOQUEADA</span>' : ''}
      </div>
      <div class="flex flex-wrap gap-2 mt-4">
        ${gs.map(groupChip).join('') || '<span class="chip chip-neutral">Sem grupo</span>'}
      </div>
      ${gs.length ? `<p class="text-[11px] text-muted mt-3"><i class="fas fa-circle-info mr-1"></i>Grupo prioritário (cor/ícone): <b style="color:${main.color}">${esc(main.name)}</b> — definido pela ordem dos grupos.</p>` : ''}
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
        <span class="text-sm font-bold">${esc(u.nickname)}</span></a>`).join('') || '<p class="p-3 text-xs text-muted">Nenhum militar encontrado.</p>';
      drop.classList.remove('hidden');
    }, 300);
  });
  document.addEventListener('click', e => { if(!e.target.closest('#global-search')) drop.classList.add('hidden'); });
});

/* ══════════════════ PAINEL ADMIN ══════════════════ */
const A = { tab:'usuarios', page:0, q:'' };
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
    <div class="card-head justify-between gap-3 flex-wrap"><h2 class="font-display font-bold text-sm">Militares cadastrados <span class="chip chip-neutral ml-2 normal-case">${count??0}</span></h2>
      <input class="input !py-1.5 !pl-3 w-56" placeholder="Filtrar nickname..." value="${esc(A.q)}" oninput="A.q=this.value;clearTimeout(window._t);window._t=setTimeout(()=>tabUsuarios(document.getElementById('admin-body')),350)"></div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Nickname</th><th>Status</th><th>Tentativas</th><th>Desde</th><th class="text-right">Ações</th></tr></thead><tbody>
    ${(data||[]).map(u => `<tr>
      <td class="font-bold">${esc(u.nickname)}</td>
      <td>${u.login_locked ? '<span class="chip chip-no"><i class="fas fa-lock"></i> BLOQUEADO</span>' : `<span class="chip ${u.status==='active'?'chip-ok':u.status==='pending'?'chip-wait':'chip-no'}">${u.status.toUpperCase()}</span>`}</td>
      <td class="text-xs ${u.failed_logins>0?'text-red-600 font-bold':'text-muted'}">${u.failed_logins||0}/4 ${u.is_invisible?'<i class="fas fa-eye-slash text-gold-500 ml-1"></i>':''}</td>
      <td class="text-xs text-muted">${fmtDate(u.created_at)}</td>
      <td class="text-right space-x-1">
        ${u.login_locked ? `<button class="btn btn-gold btn-sm" onclick="unlockUser('${u.id}')"><i class="fas fa-unlock"></i> Destravar</button>` : ''}
        ${u.status!=='active'?`<button class="btn btn-primary btn-sm" onclick="setUser('${u.id}','active')"><i class="fas fa-check"></i> Ativar</button>`:''}
        ${u.status!=='banned'?`<button class="btn btn-danger btn-sm" onclick="setUser('${u.id}','banned')"><i class="fas fa-ban"></i> Banir</button>`:`<button class="btn btn-outline btn-sm" onclick="setUser('${u.id}','pending')"><i class="fas fa-rotate-left"></i> Reativar</button>`}
        <button class="btn btn-outline btn-sm" onclick="manageGroups('${u.id}','${esc(u.nickname)}')"><i class="fas fa-layer-group"></i> Grupos</button>
        ${isMaster()?`<button class="btn btn-outline btn-sm" onclick="toggleInvisible('${u.id}',${!u.is_invisible})"><i class="fas fa-eye-slash"></i></button>`:''}
      </td></tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted py-8">Nada encontrado.</td></tr>'}
    </tbody></table></div>
    <div class="p-3 flex justify-center gap-2">${A.page>0?`<button class="btn btn-outline btn-sm" onclick="A.page--;tabUsuarios(document.getElementById('admin-body'))">← Anterior</button>`:''}
    <span class="text-xs text-muted self-center">Página ${A.page+1}${totalPages>1?` de ${totalPages}`:''}</span>
    ${(data||[]).length===20?`<button class="btn btn-outline btn-sm" onclick="A.page++;tabUsuarios(document.getElementById('admin-body'))">Próxima →</button>`:''}</div></div>`;
}
window.setUser = async (id, status) => { const { error } = await supabase.from('profiles').update({ status }).eq('id', id); if(error) return toast('Erro: '+error.message,'err'); try{ await supabase.rpc('log_action', { action:'USER_STATUS', details:{ id, status } }); }catch(e){} toast('Status atualizado.'); tabUsuarios(document.getElementById('admin-body')); };
window.toggleInvisible = async (id, v) => { await supabase.from('profiles').update({ is_invisible: v }).eq('id', id); try{ await supabase.rpc('log_action', { action:'USER_INVISIBLE', details:{ id, v } }); }catch(e){} tabUsuarios(document.getElementById('admin-body')); };
window.unlockUser = async (id) => { const { error } = await supabase.from('profiles').update({ login_locked:false, failed_logins:0 }).eq('id', id); if(error) return toast('Erro: '+error.message,'err'); try{ await supabase.rpc('log_action', { action:'LOCK_REMOVIDO_ADMIN', details:{ id } }); }catch(e){} toast('Conta destravada pelo comando.'); tabUsuarios(document.getElementById('admin-body')); };
window.manageGroups = async (userId, nick) => {
  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase.from('groups').select('id,name,color,icon,order_index').order('order_index'),
    supabase.from('user_groups').select('group_id').eq('user_id', userId)]);
  const has = new Set((mine||[]).map(m => m.group_id));
  openModal(`<i class="fas fa-layer-group text-gold-500 mr-2"></i>Grupos de ${esc(nick)}`,
    `<p class="text-xs text-muted mb-2">O primeiro grupo da lista define ícone e cor do militar.</p>` +
    (all||[]).map(g => `<label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-famr-50 cursor-pointer">
      <input type="checkbox" value="${g.id}" ${has.has(g.id)?'checked':''} class="accent-[#14563f] w-4 h-4">
      <i class="fas ${g.icon||'fa-shield-halved'}" style="color:${g.color}"></i><span class="text-sm font-bold">${esc(g.name)}</span></label>`).join(''),
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-primary btn-sm" onclick="saveGroups('${userId}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveGroups = async userId => {
  const ids = [...document.querySelectorAll('#modal-body input:checked')].map(i => i.value);
  await supabase.from('user_groups').delete().eq('user_id', userId);
  if(ids.length) await supabase.from('user_groups').insert(ids.map(g => ({ user_id: userId, group_id: g })));
  try{ await supabase.rpc('log_action', { action:'USER_GROUPS', details:{ userId, ids } }); }catch(e){}
  invalidate('perms:'); invalidate('home:');
  closeModal(); toast('Grupos atualizados.');
};
async function tabGrupos(b){
  const { data } = await supabase.from('groups').select('*, groups(name)').order('order_index');
  const { data: ug } = await supabase.from('user_groups').select('group_id').limit(10000);
  const cnt = {}; (ug||[]).forEach(m => cnt[m.group_id] = (cnt[m.group_id]||0)+1);
  b.innerHTML = `<div class="card fade-up">
    <div class="card-head justify-between"><h2 class="font-display font-bold text-sm">Grupos e subgrupos <span class="chip chip-neutral ml-2 normal-case">ordem = prioridade de cor/ícone</span></h2>
    <button class="btn btn-gold btn-sm" onclick="groupForm()"><i class="fas fa-plus"></i> Novo grupo</button></div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Ordem</th><th>Grupo</th><th>Tipo</th><th>Vínculo</th><th>Membros</th><th class="text-right">Ações</th></tr></thead><tbody>
    ${(data||[]).map((g,i,arr) => `<tr>
      <td><button class="ord-btn" onclick="moveGroup('${g.id}',-1)" ${i===0?'disabled':''}><i class="fas fa-chevron-up"></i></button>
          <button class="ord-btn" onclick="moveGroup('${g.id}',1)" ${i===arr.length-1?'disabled':''}><i class="fas fa-chevron-down"></i></button></td>
      <td><span class="group-dot mr-2" style="background:${g.color}"></span><i class="fas ${g.icon||'fa-shield-halved'} mr-2" style="color:${g.color}"></i><b style="color:${g.color}">${esc(g.name)}</b>${g.apply_color?'<i class="fas fa-palette ml-2 text-gold-500" title="Cor aplicada aos membros"></i>':''}</td>
      <td><span class="chip ${g.group_type==='open'?'chip-ok':g.group_type==='closed'?'chip-wait':'chip-neutral'}">${GROUP_TYPES[g.group_type]||g.group_type}</span></td>
      <td class="text-xs">${g.groups?esc(g.groups.name):'—'}</td>
      <td class="text-xs font-bold">${cnt[g.id]||0}</td>
      <td class="text-right space-x-1">
        <button class="btn btn-outline btn-sm" onclick="groupPermissions('${g.id}')" title="Permissões por tópico"><i class="fas fa-key"></i></button>
        <button class="btn btn-outline btn-sm" onclick="groupMembers('${g.id}')" title="Membros"><i class="fas fa-users"></i></button>
        <button class="btn btn-outline btn-sm" onclick="groupForm('${g.id}')"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" onclick="delGroup('${g.id}')"><i class="fas fa-trash"></i></button></td></tr>`).join('')}
    </tbody></table></div></div>`;
}
window.moveGroup = async (id, dir) => {
  const { data } = await supabase.from('groups').select('id,order_index').order('order_index');
  const i = (data||[]).findIndex(g => g.id === id);
  const j = i + dir;
  if(i < 0 || j < 0 || j >= data.length) return;
  const a = data[i], b2 = data[j];
  await supabase.from('groups').update({ order_index: b2.order_index }).eq('id', a.id);
  await supabase.from('groups').update({ order_index: a.order_index }).eq('id', b2.id);
  invalidate('home:');
  tabGrupos(document.getElementById('admin-body'));
};
window.groupForm = async id => {
  let g = { name:'', color:'#14563f', icon:'fa-shield-halved', apply_color:true, group_type:'open', parent_id:null };
  if(id){ const r = await supabase.from('groups').select('*').eq('id', id).single(); g = r.data; }
  const { data: all } = await supabase.from('groups').select('id,name').neq('id', id||'').order('order_index');
  openModal(`<i class="fas fa-layer-group text-gold-500 mr-2"></i>${id?'Editar':'Novo'} grupo`, `
    <label class="field"><span>Nome</span><input id="g-name" class="input" value="${esc(g.name)}"></label>
    <div class="field"><span>Ícone do grupo (usado nos membros)</span>
      <div class="icon-grid" id="g-icon-grid">
        ${ICON_OPTIONS.map(ic => `<button type="button" class="icon-opt ${g.icon===ic?'sel':''}" data-icon="${ic}" onclick="pickIcon(this)"><i class="fas ${ic}"></i></button>`).join('')}
      </div>
      <input type="hidden" id="g-icon" value="${esc(g.icon||'fa-shield-halved')}">
    </div>
    <div class="grid grid-cols-2 gap-3">
      <label class="field"><span>Cor</span><input id="g-color" type="color" class="input !p-1 h-11" value="${g.color}"></label>
      <label class="field"><span>Tipo do grupo</span><select id="g-type" class="input">
        <option value="open" ${g.group_type==='open'?'selected':''}>Aberto (membros podem entrar)</option>
        <option value="closed" ${g.group_type==='closed'?'selected':''}>Fechado (só a liderança adiciona)</option>
        <option value="invisible" ${g.group_type==='invisible'?'selected':''}>Invisível (não aparece na lista)</option>
      </select></label>
    </div>
    <label class="flex items-center gap-3 text-sm font-bold"><input id="g-applycolor" type="checkbox" class="w-4 h-4 accent-[#14563f]" ${g.apply_color?'checked':''}> Aplicar a cor aos membros (prioridade pela ordem)</label>
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
  const row = {
    name: document.getElementById('g-name').value.trim(),
    color: document.getElementById('g-color').value,
    icon: document.getElementById('g-icon').value,
    apply_color: document.getElementById('g-applycolor').checked,
    group_type: document.getElementById('g-type').value,
    parent_id: document.getElementById('g-parent').value || null,
    visible: document.getElementById('g-type').value !== 'invisible'
  };
  if(!row.name) return toast('Informe o nome.','warn');
  let error = null;
  if(id){ ({ error } = await supabase.from('groups').update(row).eq('id', id)); }
  else {
    const { count } = await supabase.from('groups').select('*', { count:'exact', head:true });
    row.order_index = (count||0)+1;
    ({ error } = await supabase.from('groups').insert([row]));
  }
  if(error) return toast('Erro: '+error.message,'err');
  try{ await supabase.rpc('log_action', { action:'GROUP_SAVE', details: row }); }catch(e){}
  invalidate('home:'); invalidate('groups:');
  closeModal(); toast('Grupo salvo.'); tabGrupos(document.getElementById('admin-body'));
};
window.delGroup = async id => {
  if(!await confirmDlg('Excluir grupo? Membros perdem o vínculo e as permissões dele.')) return;
  await supabase.from('groups').delete().eq('id', id);
  try{ await supabase.rpc('log_action', { action:'GROUP_DEL', details:{ id } }); }catch(e){}
  invalidate('home:'); invalidate('groups:'); invalidate('perms:');
  tabGrupos(document.getElementById('admin-body'));
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
    `<p class="text-xs text-muted mb-2">Marque por setor/subtópico: <b>Ver</b>, <b>Criar</b>, <b>Editar</b>, <b>Excluir</b> e <b>Moderador</b>. Linhas sem nenhuma marca = sem acesso (ou público, se nenhum grupo/Todos tiver regra para aquele tópico).</p>
    <div class="perm-wrap"><table class="perm-matrix">
      <thead><tr><th>Fórum</th><th>Ver</th><th>Criar</th><th>Editar</th><th>Excluir</th><th>Moderador</th></tr></thead>
      <tbody>
      ${(secs||[]).map(s => `
        <tr class="pm-sec"><td><i class="fas ${esc(s.icon)} mr-2"></i>${esc(s.name)}</td>
          ${cb('section:'+s.id,'can_view','Ver')} ${cb('section:'+s.id,'can_create','Criar')} ${cb('section:'+s.id,'can_edit','Editar')} ${cb('section:'+s.id,'can_delete','Excluir')} ${cb('section:'+s.id,'is_moderator','Moderador')}</tr>
        ${(subs||[]).filter(x=>x.section_id===s.id).map(x => `
          <tr><td class="pm-sub1"><i class="fas fa-folder-open mr-2 text-muted"></i>${esc(x.name)}</td>
            ${cb('subtopic:'+x.id,'can_view','Ver')} ${cb('subtopic:'+x.id,'can_create','Criar')} ${cb('subtopic:'+x.id,'can_edit','Editar')} ${cb('subtopic:'+x.id,'can_delete','Excluir')} ${cb('subtopic:'+x.id,'is_moderator','Moderador')}</tr>`).join('')}`).join('')}
      </tbody></table></div>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="savePermissions('${gid}')"><i class="fas fa-floppy-disk"></i> Salvar permissões</button>`);
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
  Object.values(map).forEach(r => {
    const any = r.can_view || r.can_create || r.can_edit || r.can_delete || r.is_moderator;
    if(any) up.push(r); else del.push(r);
  });
  if(up.length){ const { error } = await supabase.from('group_permissions').upsert(up, { onConflict:'group_id,target_type,target_id' }); if(error) return toast('Erro: '+error.message,'err'); }
  for(const r of del){ await supabase.from('group_permissions').delete().eq('group_id', gid).eq('target_type', r.target_type).eq('target_id', r.target_id); }
  invalidate('perms:'); invalidate('home:');
  closeModal(); toast('Permissões salvas.');
};

/* ══ MATRIZ POR TÓPICO com linha "Todos" no topo ══ */
window.targetPermissions = async (type, id, name) => {
  const [{ data: grps }, { data: rows }] = await Promise.all([
    supabase.from('groups').select('id,name,color,icon,order_index').order('order_index'),
    supabase.from('group_permissions').select('*').eq('target_type',type).eq('target_id',id)
  ]);
  const cur = {}; (rows||[]).forEach(r => cur[r.group_id] = r);
  const cb = (gid, field, label) => `<td title="${label}"><input type="checkbox" data-g="${gid}" data-f="${field}" ${cur[gid]?.[field]?'checked':''}></td>`;
  const cbAll = (field, label, dis) => `<td title="${label}"><input type="checkbox" data-g="__ALL__" data-f="${field}" ${dis?'disabled':''} ${(!dis&&cur[null]?.[field])?'checked':''}></td>`;
  openModal(`<i class="fas fa-key text-gold-500 mr-2"></i>Permissões: ${esc(name)} <span class="chip chip-neutral ml-1 normal-case">${type==='section'?'setor':'subtópico'}</span>`,
    `<p class="text-xs text-muted mb-2">A linha <b>Todos</b> controla o que os militares <b>sem grupo</b> podem fazer. Os demais grupos vêm abaixo; quando um grupo tem regra, ela <b>prevalece sobre Todos</b> para os membros dele. Sem marca em nenhum grupo e nem em Todos = tópico público total.</p>
     <div class="perm-wrap"><table class="perm-matrix">
       <thead><tr><th>Grupo</th><th>Ver</th><th>Criar</th><th>Editar</th><th>Excluir</th><th>Mod.</th></tr></thead>
       <tbody>
         <tr class="pm-sec"><td><i class="fas fa-users mr-2"></i><b>Todos</b> <span class="text-[10px] text-muted">· usuários sem grupo</span></td>
           ${cbAll('can_view','Ver')} ${cbAll('can_create','Criar')} ${cbAll('can_edit','Editar')} ${cbAll('can_delete','Excluir')} ${cbAll('is_moderator','Moderador',true)}</tr>
         ${(grps||[]).map(g => `<tr><td><i class="fas ${g.icon||'fa-shield-halved'} mr-2" style="color:${g.color}"></i><b>${esc(g.name)}</b></td>
           ${cb(g.id,'can_view','Ver')} ${cb(g.id,'can_create','Criar')} ${cb(g.id,'can_edit','Editar')} ${cb(g.id,'can_delete','Excluir')} ${cb(g.id,'is_moderator','Moderador')}</tr>`).join('')}
       </tbody>
     </table></div>`,
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
  Object.values(map).forEach(r => {
    const any = r.can_view||r.can_create||r.can_edit||r.can_delete||r.is_moderator;
    (any?up:del).push(r);
  });
  if(up.length){ const { error } = await supabase.from('group_permissions').upsert(up, { onConflict:'group_id,target_type,target_id' }); if(error) return toast('Erro: '+error.message,'err'); }
  for(const r of del){ await supabase.from('group_permissions').delete().eq('group_id', r.group_id).eq('target_type', type).eq('target_id', id); }
  invalidate('perms:'); invalidate('home:');
  closeModal(); toast('Permissões salvas.');
};

window.groupMembers = async gid => {
  const [{ data: grp }, { data: mem }] = await Promise.all([
    supabase.from('groups').select('name,color,icon,group_type').eq('id', gid).single(),
    supabase.from('user_groups').select('user_id, profiles_view(id,nickname)').eq('group_id', gid)
  ]);
  window._gmGroupId = gid;
  const list = (mem||[]).map(m => m.profiles_view).filter(Boolean);
  openModal(`<i class="fas ${grp?.icon||'fa-shield-halved'}" style="color:${grp?.color}"></i> Membros: ${esc(grp?.name||'')}`,
    `<div class="field"><span>Adicionar militar</span>
      <div class="input-wrap"><i class="fas fa-magnifying-glass"></i><input id="gm-search" class="input" placeholder="Buscar nickname..." oninput="gmSearch(this.value)"></div>
      <div id="gm-results" class="mt-2 space-y-1"></div></div>
    <div class="field mt-3"><span>Membros atuais (${list.length})</span>
      <div id="gm-list" class="space-y-1 max-h-56 overflow-auto">
        ${list.map(m => `<div class="flex items-center justify-between p-2 rounded-lg bg-paper border border-line">
          <span class="text-sm font-bold">${esc(m.nickname)}</span>
          <button class="btn btn-danger btn-sm" onclick="gmRemove('${gid}','${m.id}')"><i class="fas fa-user-minus"></i></button></div>`).join('') || '<p class="text-xs text-muted">Nenhum membro.</p>'}
      </div></div>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Fechar</button>`);
};
window.gmSearch = async q => {
  const box = document.getElementById('gm-results');
  if((q||'').trim().length < 2){ box.innerHTML = ''; return; }
  const { data } = await supabase.from('profiles_view').select('id,nickname').eq('status','active').neq('nickname','admin master').ilike('nickname', `%${q.trim()}%`).limit(5);
  box.innerHTML = (data||[]).map(u => `<div class="flex items-center justify-between p-2 rounded-lg bg-famr-50 border border-line">
    <span class="text-sm font-bold">${esc(u.nickname)}</span>
    <button class="btn btn-primary btn-sm" onclick="gmAdd('${window._gmGroupId}','${u.id}')"><i class="fas fa-user-plus"></i></button></div>`).join('') || '<p class="text-xs text-muted">Ninguém encontrado.</p>';
};
window.gmAdd = async (gid, uid) => {
  const { error } = await supabase.from('user_groups').insert([{ user_id: uid, group_id: gid }]);
  if(error) return toast('Erro: '+error.message,'err');
  invalidate('home:');
  toast('Membro adicionado.'); groupMembers(gid);
};
window.gmRemove = async (gid, uid) => {
  await supabase.from('user_groups').delete().eq('user_id', uid).eq('group_id', gid);
  invalidate('home:');
  toast('Membro removido.'); groupMembers(gid);
};

async function tabTopicos(b){
  const [{ data: secs }, { data: subs }, { data: groups }] = await Promise.all([
    supabase.from('sections').select('*').order('order_index'),
    supabase.from('subtopics').select('*,groups(name)').order('order_index'),
    supabase.from('groups').select('id,name')]);
  window._groupsCache = groups || [];
  b.innerHTML = `<div class="space-y-4 fade-up">
    <div class="flex justify-end"><button class="btn btn-gold btn-sm" onclick="sectionForm()"><i class="fas fa-plus"></i> Novo tópico (setor)</button></div>
    ${(secs||[]).map((s,i,arr) => `<div class="card">
      <div class="cat-head">
        <span class="flex items-center gap-1 mr-2">
          <button class="ord-btn" onclick="moveSection('${s.id}',-1)" ${i===0?'disabled':''}><i class="fas fa-chevron-up"></i></button>
          <button class="ord-btn" onclick="moveSection('${s.id}',1)" ${i===arr.length-1?'disabled':''}><i class="fas fa-chevron-down"></i></button>
        </span>
        <i class="fas ${esc(s.icon)}"></i> ${esc(s.name)} <span class="chip chip-neutral ml-2 normal-case">/${esc(s.slug)}</span>
        ${SLUGS_REQUIRE_GROUP.includes(s.slug) ? '<span class="chip chip-wait ml-1 normal-case"><i class="fas fa-users mr-1"></i>só com grupo</span>' : ''}
        <span class="ml-auto flex gap-1">
          <button class="btn btn-outline btn-sm" onclick="targetPermissions('section','${s.id}','${esc(s.name)}')" title="Permissões deste setor"><i class="fas fa-key"></i></button>
          <button class="btn btn-outline btn-sm" onclick="sectionForm('${s.id}')" title="Editar setor"><i class="fas fa-pen"></i></button>
          <button class="btn btn-outline btn-sm" onclick="subtopicForm('${s.id}')" title="Novo subtópico"><i class="fas fa-plus"></i> Subtópico</button>
          <button class="btn btn-danger btn-sm" onclick="delSection('${s.id}')"><i class="fas fa-trash"></i></button>
        </span>
      </div>
      <div class="divide-y divide-line">${(subs||[]).filter(x => x.section_id===s.id).map(x => `
        <div class="p-3.5 flex flex-wrap items-center gap-3 text-sm">
          <i class="fas fa-folder-open text-muted"></i><b>${esc(x.name)}</b>
          ${x.required_group_id?`<span class="chip chip-wait"><i class="fas fa-lock"></i> ${esc(x.groups?.name||'')}</span>`:'<span class="chip chip-ok">todos</span>'}
          ${x.is_request_form?'<span class="chip chip-neutral">formulário</span>':''}
          ${x.auto_listagem_category?`<span class="chip chip-ok">→ listagem: ${esc(x.auto_listagem_category)}</span>`:''}
          <span class="ml-auto flex gap-1">
            <button class="btn btn-outline btn-sm" onclick="targetPermissions('subtopic','${x.id}','${esc(x.name)}')" title="Permissões deste subtópico"><i class="fas fa-key"></i></button>
            <button class="btn btn-outline btn-sm" onclick="subtopicForm('${s.id}','${x.id}')" title="Editar subtópico"><i class="fas fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="delSubtopic('${x.id}')"><i class="fas fa-trash"></i></button>
          </span>
        </div>`).join('') || '<p class="p-4 text-xs text-muted">Sem subtópicos.</p>'}</div>
    </div>`).join('')}
  </div>`;
}
window.moveSection = async (id, dir) => {
  const { data } = await supabase.from('sections').select('id,order_index').order('order_index');
  const i = (data||[]).findIndex(s => s.id === id);
  const j = i + dir;
  if(i < 0 || j < 0 || j >= data.length) return;
  const a = data[i], b2 = data[j];
  await supabase.from('sections').update({ order_index: b2.order_index }).eq('id', a.id);
  await supabase.from('sections').update({ order_index: a.order_index }).eq('id', b2.id);
  invalidate('home:'); invalidate('sections:');
  tabTopicos(document.getElementById('admin-body'));
};
window.sectionForm = async id => {
  let s = { name:'', slug:'', icon:'fa-folder-open', description:'', required_group_id:null };
  if(id){ const r = await supabase.from('sections').select('*').eq('id', id).single(); if(r.data) s = r.data; }
  openModal(`<i class="fas fa-sitemap text-gold-500 mr-2"></i>${id?'Editar':'Novo'} setor`, `
    <label class="field"><span>Nome</span><input id="s-name" class="input" value="${esc(s.name)}" placeholder="Ex: Condecorações"></label>
    <label class="field"><span>Slug (url)</span><input id="s-slug" class="input" value="${esc(s.slug)}" placeholder="condecoracoes"></label>
    <label class="field"><span>Ícone (FontAwesome)</span><input id="s-icon" class="input" value="${esc(s.icon)}"></label>
    <label class="field"><span>Descrição</span><textarea id="s-desc" class="input" rows="2">${esc(s.description||'')}</textarea></label>
    <label class="field"><span>Restrito ao grupo (legado)</span><select id="s-group" class="input"><option value="">— todos —</option>${(window._groupsCache||[]).map(g=>`<option value="${g.id}" ${s.required_group_id===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></label>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-primary btn-sm" onclick="saveSection('${id||''}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveSection = async id => {
  const row = { name: document.getElementById('s-name').value.trim(), slug: document.getElementById('s-slug').value.trim().toLowerCase().replace(/\s+/g,'-'), icon: document.getElementById('s-icon').value.trim() || 'fa-folder-open', description: document.getElementById('s-desc').value, required_group_id: document.getElementById('s-group').value || null };
  if(!row.name || !row.slug) return toast('Nome e slug são obrigatórios.','warn');
  let error = null;
  if(id){ ({ error } = await supabase.from('sections').update(row).eq('id', id)); }
  else {
    const { count } = await supabase.from('sections').select('*', { count:'exact', head:true });
    row.order_index = (count||0)+1;
    ({ error } = await supabase.from('sections').insert([row]));
  }
  if(error) return toast('Erro: '+error.message,'err');
  try{ await supabase.rpc('log_action', { action:'SECTION_SAVE', details: row }); }catch(e){}
  invalidate('home:'); invalidate('sections:');
  closeModal(); toast('Setor salvo.'); buildSidebar(); tabTopicos(document.getElementById('admin-body'));
};
window.delSection = async id => { if(await confirmDlg('Excluir setor e todos os subtópicos?')) { await supabase.from('sections').delete().eq('id', id); invalidate('home:'); invalidate('sections:'); buildSidebar(); tabTopicos(document.getElementById('admin-body')); } };
window.delSubtopic = async id => { if(await confirmDlg('Excluir subtópico?')) { await supabase.from('subtopics').delete().eq('id', id); invalidate('home:'); tabTopicos(document.getElementById('admin-body')); } };
window.subtopicForm = async (sid, tid) => {
  let t = { name:'', description:'', required_group_id:null, allow_posts:true, is_request_form:false, form_fields:[], auto_listagem_category:null };
  if(tid){ const r = await supabase.from('subtopics').select('*').eq('id', tid).single(); if(r.data) t = r.data; }
  const fieldsText = (t.form_fields||[]).map(f => `${f.label}:${f.type||'text'}`).join('\n');
  openModal(`<i class="fas fa-folder-plus text-gold-500 mr-2"></i>${tid?'Editar':'Novo'} subtópico`, `
    <label class="field"><span>Nome</span><input id="t-name" class="input" value="${esc(t.name)}"></label>
    <label class="field"><span>Descrição</span><textarea id="t-desc" class="input" rows="2">${esc(t.description||'')}</textarea></label>
    <label class="field"><span>Restrito ao grupo (legado)</span><select id="t-group" class="input"><option value="">— todos —</option>${(window._groupsCache||[]).map(g=>`<option value="${g.id}" ${t.required_group_id===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></label>
    <label class="flex items-center gap-2 text-sm font-bold"><input id="t-posts" type="checkbox" ${t.allow_posts?'checked':''} class="w-4 h-4 accent-[#14563f]"> Permite publicações</label>
    <label class="flex items-center gap-2 text-sm font-bold"><input id="t-form" type="checkbox" ${t.is_request_form?'checked':''} class="w-4 h-4 accent-[#14563f]"> É formulário de requerimento</label>
    <label class="field"><span>Campos (um por linha: Nome:tipo → text|textarea|number)</span><textarea id="t-fields" class="input" rows="3" placeholder="Nome da Tag:text&#10;Descrição:textarea">${esc(fieldsText)}</textarea></label>
    <label class="field"><span>Ao aprovar, publicar na listagem como categoria</span><input id="t-cat" class="input" value="${esc(t.auto_listagem_category||'')}" placeholder="ex: tags"></label>
    <input type="hidden" id="t-sid" value="${sid}">
    <input type="hidden" id="t-tid" value="${tid||''}">`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-primary btn-sm" onclick="saveSubtopic()"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveSubtopic = async () => {
  const tid = document.getElementById('t-tid').value;
  const fields = document.getElementById('t-fields').value.split('\n').filter(Boolean).map(l => { const [label, type] = l.split(':'); return { label: (label||'').trim(), type: (type||'text').trim(), required: true }; }).filter(f => f.label);
  const row = { section_id: document.getElementById('t-sid').value, name: document.getElementById('t-name').value.trim(), description: document.getElementById('t-desc').value, required_group_id: document.getElementById('t-group').value || null, allow_posts: document.getElementById('t-posts').checked, is_request_form: document.getElementById('t-form').checked, form_fields: fields, auto_listagem_category: document.getElementById('t-cat').value.trim() || null };
  if(!row.name) return toast('Informe o nome.','warn');
  let error = null;
  if(tid){ ({ error } = await supabase.from('subtopics').update(row).eq('id', tid)); }
  else { ({ error } = await supabase.from('subtopics').insert([row])); }
  if(error) return toast('Erro: '+error.message,'err');
  try{ await supabase.rpc('log_action', { action:'SUBTOPIC_SAVE', details: row }); }catch(e){}
  invalidate('home:'); invalidate('subs:');
  closeModal(); toast('Subtópico salvo.'); tabTopicos(document.getElementById('admin-body'));
};
async function tabProtocolos(b){
  const { data } = await supabase.from('requests').select('*,profiles_view(nickname),subtopics(name,auto_listagem_category)').eq('status','pending').order('created_at');
  b.innerHTML = `<div class="card fade-up"><div class="cat-head"><i class="fas fa-inbox"></i> Pendentes de análise (${(data||[]).length})</div>
  <div class="divide-y divide-line">${(data||[]).map(r => `<div class="p-4">
    <div class="flex flex-wrap items-center gap-3 justify-between"><div><b class="text-sm">${esc(r.title)}</b> <span class="chip chip-neutral ml-1">${esc(r.subtopics?.name||'')}</span>
      ${r.subtopics?.auto_listagem_category?`<span class="chip chip-ok">→ vira "${esc(r.subtopics.auto_listagem_category)}" na Listagem</span>`:''}
      <p class="text-[11px] text-muted mt-1">${esc(r.profiles_view?.nickname||'')} • ${fmtDate(r.created_at)}</p></div>
      <div class="space-x-1"><button class="btn btn-primary btn-sm" onclick="review('${r.id}','approved')"><i class="fas fa-check"></i> Aprovar</button><button class="btn btn-danger btn-sm" onclick="review('${r.id}','rejected')"><i class="fas fa-xmark"></i> Reprovar</button></div></div>
    <div class="mt-3 grid sm:grid-cols-2 gap-2 text-xs bg-famr-50 rounded-lg p-3">${Object.entries(r.form_data||{}).map(([k,v])=>`<p><b class="text-famr-700">${esc(k)}:</b> ${esc(v)}</p>`).join('')}</div></div>`).join('') || '<p class="p-8 text-center text-sm text-muted">Nenhum protocolo pendente. ✦</p>'}</div></div>`;
}
window.review = (id, status) => { if(status === 'approved') return doReview(id, 'approved', ''); openModal('<i class="fas fa-xmark text-red-500 mr-2"></i>Motivo da reprovação', `<label class="field"><span>Motivo (opcional, aparece ao militar)</span><input id="rev-note" class="input"></label>`, `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button><button class="btn btn-danger btn-sm" onclick="doReview('${id}','rejected', document.getElementById('rev-note').value)">Reprovar</button>`); };
window.doReview = async (id, status, note) => { const { error } = await supabase.rpc('review_request', { req_id: id, new_status: status, note: note || null }); if(error) return toast('Erro: '+error.message,'err'); invalidate('home:'); closeModal(); toast(status==='approved' ? 'Aprovado! Registro publicado na Listagem automaticamente.' : 'Protocolo reprovado.'); tabProtocolos(document.getElementById('admin-body')); };

/* ══════════ LOGS COM TRADUÇÃO PT E COLUNA IP ══════════ */
async function tabLogs(b){
  const from = A.page*30; 
  const { data } = await supabase.from('logs').select('created_at,action,actor_name,details,ip').order('created_at',{ascending:false}).range(from, from+29);
  b.innerHTML = `<div class="card fade-up"><div class="cat-head"><i class="fas fa-scroll"></i> Logs de ações e logins</div>
  <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Data</th><th>Ação</th><th>Autor</th><th>Detalhes</th><th>IP</th></tr></thead><tbody>
  ${(data||[]).map(l => `<tr>
    <td class="text-xs text-muted whitespace-nowrap">${fmtDate(l.created_at)}</td>
    <td><span class="chip ${l.action==='LOGIN'?'chip-ok':(l.action.includes('DEL')||l.action.includes('BAN')||l.action.includes('BLOQ'))?'chip-no':'chip-wait'}">${esc(ptAction(l.action))}</span></td>
    <td class="text-xs font-bold">${esc(l.actor_name||'sistema')}</td>
    <td class="text-[11px] text-muted max-w-md truncate" title="${esc(JSON.stringify(l.details))}">${esc(ptDetails(l.details, l.action))}</td>
    <td class="text-xs font-mono text-muted">${esc(l.ip || '—')}</td>
  </tr>`).join('')}
  </tbody></table></div><div class="p-3 flex justify-center gap-2">${A.page>0?`<button class="btn btn-outline btn-sm" onclick="A.page--;tabLogs(document.getElementById('admin-body'))">←</button>`:''}${(data||[]).length===30?`<button class="btn btn-outline btn-sm" onclick="A.page++;tabLogs(document.getElementById('admin-body'))">→</button>`:''}</div></div>`;
}
async function tabConfig(b){
  const m = STATE.settings.maintenance || { enabled:false, message:'' }; const a = STATE.settings.announcement || { text:'' };
  b.innerHTML = `<div class="grid md:grid-cols-2 gap-4 fade-up">
    <div class="card"><div class="cat-head"><i class="fas fa-screwdriver-wrench"></i> Modo manutenção</div><div class="card-body space-y-3">
      <label class="flex items-center gap-3 text-sm font-bold"><input id="c-maint" type="checkbox" class="w-5 h-5 accent-[#c9a227]" ${m.enabled?'checked':''}> Sistema em manutenção (bloqueia não-admins)</label>
      <label class="field"><span>Mensagem exibida</span><input id="c-maint-msg" class="input" value="${esc(m.message||'')}"></label>
      <button class="btn btn-primary btn-sm" onclick="saveMaint()"><i class="fas fa-floppy-disk"></i> Salvar</button></div></div>
    <div class="card"><div class="cat-head"><i class="fas fa-bullhorn"></i> Aviso do comando (home)</div><div class="card-body space-y-3">
      <textarea id="c-ann" class="input" rows="4">${esc(a.text||'')}</textarea>
      <button class="btn btn-gold btn-sm" onclick="saveAnn()"><i class="fas fa-floppy-disk"></i> Publicar aviso</button></div></div>
  </div>`;
}
window.saveMaint = async () => { const value = { enabled: document.getElementById('c-maint').checked, message: document.getElementById('c-maint-msg').value }; await supabase.from('settings').upsert({ key:'maintenance', value }); STATE.settings.maintenance = value; try{ await supabase.rpc('log_action', { action:'MANUTENCAO', details: value }); }catch(e){} toast('Configuração salva.'); document.getElementById('maintenance-banner').classList.toggle('hidden', !value.enabled); };
window.saveAnn = async () => { const value = { text: document.getElementById('c-ann').value }; await supabase.from('settings').upsert({ key:'announcement', value }); STATE.settings.announcement = value; try{ await supabase.rpc('log_action', { action:'AVISO', details: value }); }catch(e){} toast('Aviso publicado na home.'); };

/* ══════════ ENTER SYSTEM PARALELIZADO MÁXIMO ══════════ */
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
  if(profile.status==='pending'){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('Conta ainda não ativada.', 'warn'); return; }
  if(profile.login_locked){ await supabase.auth.signOut(); showScreen('screen-login'); loginAlert('<i class="fas fa-lock mr-1"></i> Conta BLOQUEADA.', 'err'); return; }

  STATE.profile = profile;
  STATE.groups  = groups;
  (setsRes.data||[]).forEach(s => STATE.settings[s.key] = s.value);

  await loadPerms();

  if(STATE.settings.maintenance?.enabled && !isAdmin()){
    document.getElementById('maintenance-msg').textContent = STATE.settings.maintenance.message || '';
    showScreen('screen-maintenance'); return;
  }

  startWatchdog(); showScreen('shell');
  try{ await buildSidebar(); }catch(e){ console.error('[FAMR] sidebar:', e); }
  if(!location.hash || location.hash==='#') location.hash='#/home';
  try{ await route(); }catch(e){ console.error('[FAMR] route:', e); }
}
