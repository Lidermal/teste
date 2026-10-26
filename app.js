/* ══════════ FAMR • APP.JS (Rápido, Focado nas Regras de Negócio de Cargos e Documentos) ══════════ */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = d => new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
const statusChip = s => s==='approved' ? '<span class="chip chip-ok">APROVADO</span>' : s==='rejected' ? '<span class="chip chip-no">REPROVADO</span>' : '<span class="chip chip-wait">EM ANÁLISE</span>';

const GROUP_TYPES = { open:'ABERTO', closed:'FECHADO', invisible:'INVISÍVEL' };
const SLUGS_REQUIRE_GROUP = ['companhias'];
const DOC_TYPES = { general:'GERAL', request:'REQUERIMENTO', listing:'LISTAGEM' };
const DOC_SEL = 'id,title,category,cover_url,updated_at,author_id,doc_type,page_id,views,body_html,post_replies(count),profiles_view(nickname)';
const PAGE_SEL = 'id,name,slug,description,icon,color,order_index,documents(count)';
const replyCountOf = d => (Array.isArray(d.post_replies) && d.post_replies[0]) ? (d.post_replies[0].count||0) : 0;
const docCountOf = p => (Array.isArray(p.documents) && p.documents[0]) ? (p.documents[0].count||0) : 0;

/* ══════════ CACHE GLOBAL (Deixa o sistema fluido, minimiza chamadas ao BD) ══════════ */
const CACHE = { data:{}, ttl:{} };
function cacheGet(key){ const e=CACHE.data[key]; if(e && Date.now()-e.t < (CACHE.ttl[key]||60_000)) return e.v; return undefined; }
function cacheSet(key,v,ttl=60_000){ CACHE.data[key]={t:Date.now(),v}; CACHE.ttl[key]=ttl; return v; }
function invalidate(prefix){ Object.keys(CACHE.data).forEach(k=>{ if(!prefix||k.startsWith(prefix)) delete CACHE.data[k]; }); }

/* ══════════ HELPERS E HIERARQUIA (Apenas UM cargo/patente por vez) ══════════ */
function groupBg(g){ return g?.color || '#14563f'; }
function groupBorder(g){ return (g?.color || '#14563f') + '55'; }
function groupChip(g){
  if(!g) return '<span class="chip chip-neutral">Geral</span>';
  return `<span class="chip" style="background:${g.color}18;color:${g.color};border:1px solid ${groupBorder(g)}"><i class="fas ${g.icon||'fa-shield-halved'}"></i> ${esc(g.name)}</span>`;
}
function sortGroups(list){ return [...(list||[])].sort((a,b)=>(a.order_index||0)-(b.order_index||0)); }
function priorityGroupOf(list){
  const sorted = sortGroups(list);
  let best = null;
  for(const g of sorted){ if(g.is_priority){ if(!best || (g.priority_level||0) >= (best.priority_level||0)) best = g; } }
  return best || sorted[0] || null;
}
function colorGroupOf(list){ return sortGroups(list).find(g => g.apply_color) || null; }

function canViewSection(sec){
  if(isAdmin()) return true;
  if(sec.required_group_id && !STATE.groups.some(g=>g.id===sec.required_group_id)) return false;
  return true;
}
function canViewSub(sub){
  if(isAdmin()) return true;
  if(sub.required_group_id && !STATE.groups.some(g=>g.id===sub.required_group_id)) return false;
  return true;
}
function canSeeSection(sec){
  if(!canViewSection(sec)) return false;
  if(SLUGS_REQUIRE_GROUP.includes(sec?.slug) && !isAdmin() && (STATE.groups||[]).length===0) return false;
  return true;
}

/* ══════════ TEMA / UI / ROUTER ══════════ */
function applyThemeIcon(){
  const b = document.getElementById('btn-theme'); if(!b) return;
  const dark = document.documentElement.getAttribute('data-theme')==='dark';
  b.innerHTML = `<i class="fas ${dark?'fa-sun':'fa-moon'}"></i>`;
}
window.toggleTheme = function(){
  const dark = document.documentElement.getAttribute('data-theme')==='dark';
  if(dark) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme','dark');
  try{ localStorage.setItem('famr-theme', dark?'light':'dark'); }catch(e){}
  applyThemeIcon();
};

function getDisplayRole(groupName) {
  if (!groupName) return 'Militar';
  if (groupName.toLowerCase() === 'donos') return 'Administração'; // Cargos administrativos traduzidos aqui
  return groupName; // Mostra estritamente o cargo OU patente (um ou outro)
}

function updateUserChip(){
  if(!STATE.profile) return;
  const nick = STATE.profile.nickname || '—';
  const main = priorityGroupOf(STATE.groups);
  const cg = colorGroupOf(STATE.groups);
  
  const displayRole = getDisplayRole(main?.name);

  const av = document.getElementById('user-avatar');
  const nk = document.getElementById('user-nick');
  const gp = document.getElementById('user-group');
  
  if(nk) nk.textContent = nick;
  if(gp){ gp.textContent = displayRole; if(main) gp.style.color = main.color; }
  if(av){ av.textContent = nick.charAt(0).toUpperCase(); av.style.background = groupBg(cg); }
}

window.addEventListener('hashchange', route);
async function route(){
  if(!STATE.profile) return;
  const raw = location.hash || '#/home';
  const clean = raw.startsWith('#/') ? raw.slice(2) : raw.replace(/^#/,'');
  const parts = clean.split('/');
  const page = parts[0] || 'home';
  const param = parts[1] || null;
  
  updateUserChip(); applyThemeIcon(); updateSidebarActive(clean);
  const c = document.getElementById('content');
  if(!c) return;
  
  if(page==='doc-page'){ await renderDocPage(c, param); return; }
  
  c.innerHTML = '<div class="skeleton h-40"></div><div class="skeleton h-64 mt-4"></div>';
  try{
    switch(page){
      case 'perfil':  await renderProfile(c, param); break;
      case 'section': await renderSection(c, param); break;
      case 'sub':     await renderSubtopic(c, param); break;
      default:        await renderHome(c);
    }
  }catch(err){
    console.error('[FAMR]', err);
    c.innerHTML = `<div class="card card-body text-red-600">Erro: ${esc(err.message)}</div>`;
  }
}
function updateSidebarActive(key){ 
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    // Para subtópicos, verifica se a key do link bate com a rota
    if(n.dataset.key === key) n.classList.add('active');
  }); 
}

/* ══════════ SIDEBAR (Espelho exato das permissões da Home) ══════════ */
async function buildSidebar(){
  const nav = document.getElementById('sidebar-nav');
  if(!nav) return;
  const [{ data: sections }, { data: subs }] = await Promise.all([
    supabase.from('sections').select('*').order('order_index'),
    supabase.from('subtopics').select('*').order('order_index')
  ]);
  STATE.sections = sections || [];
  
  let html = `<a class="nav-item" data-key="home" href="#/home"><i class="fas fa-house"></i> Início</a>`;
  
  for(const s of STATE.sections){
    if(!canSeeSection(s)) continue;
    
    // As páginas de Listagem e Documentos possuem rotas especiais em "section"
    if(s.slug === 'documentos') {
       html += `<div class="nav-sep">Central de Arquivos</div>`;
       html += `<a class="nav-item" data-key="section/documentos" href="#/section/documentos"><i class="fas fa-file-lines"></i> Acessar Documentos</a>`;
       continue;
    }
    if(s.slug === 'listagem') {
       html += `<div class="nav-sep">Registros (CRH)</div>`;
       html += `<a class="nav-item" data-key="section/listagem" href="#/section/listagem"><i class="fas fa-list-ul"></i> Ver Listagem Oficial</a>`;
       continue;
    }
    
    html += `<div class="nav-sep">${esc(s.name)}</div>`;
    const sectionSubs = (subs||[]).filter(sub => sub.section_id === s.id && canViewSub(sub));
    
    // Subtópicos apontam diretamente para #/sub/ID (mesmo link do Home)
    for(const sub of sectionSubs) {
       html += `<a class="nav-item" data-key="sub/${sub.id}" href="#/sub/${sub.id}"><i class="fas fa-caret-right text-[10px]"></i> ${esc(sub.name)}</a>`;
    }
  }
  
  html += `<div class="nav-sep">Minha conta</div><a class="nav-item" data-key="perfil/me" href="#/perfil/me"><i class="fas fa-id-badge"></i> Meu perfil</a>`;
  nav.innerHTML = html;
  updateUserChip(); applyThemeIcon();
}

/* ══════════ ÍNDICE FÓRUM / DOCUMENTOS ══════════ */
function stripHtml(h){ return String(h||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); }

function docForumRow(d){
  const excerpt = stripHtml(d.body_html).slice(0,150);
  return `<a href="#/doc-view/${d.id}" class="forum-row fi-row">
    <span class="forum-ico"><i class="fas fa-file-alt"></i></span>
    <div class="flex-1 min-w-0">
      <b class="text-sm text-famr-800">${esc(d.title)}</b>
      <p class="text-xs text-muted truncate">${esc(excerpt)||'Sem conteúdo.'}</p>
    </div>
    <div class="fi-last">
      <div><b>${esc(d.profiles_view?.nickname||'—')}</b><br>→ ${fmtDate(d.updated_at)}</div>
    </div>
  </a>`;
}

function pageForumRow(p, fallbackCount){
  const cnt = docCountOf(p) || fallbackCount || 0;
  return `<a href="#/doc-page/${p.id}" class="forum-row fi-row">
    <span class="forum-ico" style="background:${p.color||'#14563f'};color:#fff"><i class="fas ${p.icon||'fa-folder-open'}"></i></span>
    <div class="flex-1 min-w-0"><b class="text-sm text-famr-800">${esc(p.name)}</b><p class="text-xs text-muted truncate">${esc(p.description||'')}</p></div>
    <div class="fi-stats"><div class="fi-stat"><b>${cnt}</b><span>arquivos</span></div></div>
  </a>`;
}

/* ══════════ HOME ══════════ */
async function renderHome(c){
  const bundle = await cachedQuery('home:data', async ()=>{
    const [sections, subs, recentDocs, docPages] = await Promise.all([
      supabase.from('sections').select('*').order('order_index'),
      supabase.from('subtopics').select('*').order('order_index'),
      // BUG FIX: Isola os documentos que estão dentro de páginas. Apenas documentos globais vazam para a home!
      supabase.from('documents').select(DOC_SEL).is('page_id', null).order('updated_at',{ascending:false}).limit(5),
      supabase.from('doc_pages').select(PAGE_SEL).order('order_index')
    ]);
    return { sections:sections.data||[], subs:subs.data||[], docs:recentDocs.data||[], pages:docPages.data||[] };
  }, 45_000);
  
  const visibleSubs = (bundle.subs||[]).filter(s=>canViewSub(s));
  
  c.innerHTML = `
<section class="hero fade-up">
  <div class="hero-art" aria-hidden="true"><img src="${CONFIG.logoUrl}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>
  <div class="hero-inner">
    <p class="text-gold-300 text-xs font-bold tracking-[0.3em] uppercase">Índice do quartel</p>
    <h1 class="font-display text-2xl font-extrabold mt-1">Bem-vindo(a), ${esc(STATE.profile.nickname)}</h1>
  </div>
</section>

${((bundle.pages||[]).length || (bundle.docs||[]).length) ? `
<section class="card overflow-hidden fade-up">
  <!-- FIX CORES: Padrão verde, não gold -->
  <div class="cat-head"><i class="fas fa-folder-open"></i> Documentos Principais</div>
  <div class="divide-y divide-line">
    ${(bundle.pages||[]).map(p=>pageForumRow(p, 0)).join('')}
    ${(bundle.docs||[]).map(d=>docForumRow(d)).join('')}
  </div>
</section>` : ''}

${(bundle.sections||[]).map(sec => {
    // Listagem e Documentos já foram tratados fora do looping
    if(sec.slug==='documentos' || sec.slug==='listagem') return '';
    if(!canSeeSection(sec)) return '';
    
    const rows = visibleSubs.filter(s => s.section_id === sec.id);
    return `<section class="card overflow-hidden fade-up mt-4">
      <div class="cat-head"><i class="fas ${esc(sec.icon)}"></i> ${esc(sec.name)}</div>
      <div class="divide-y divide-line">
        ${rows.map(s => `
          <a href="#/sub/${s.id}" class="forum-row">
            <span class="forum-ico"><i class="fas fa-comments"></i></span>
            <div class="flex-1 min-w-0"><b class="text-sm text-famr-800">${esc(s.name)}</b><p class="text-xs text-muted truncate">${esc(s.description||'')}</p></div>
          </a>`).join('') || '<p class="p-5 text-sm text-muted text-center">Nenhum subtópico visível.</p>'}
      </div>
    </section>`;
  }).join('')}`;
}

/* ══════════ LISTAGEM E CRH ══════════ */
async function renderListagem(c, sec){
  // Puxa as entradas que são criadas pelos requerimentos do CRH.
  const { data: entries } = await supabase.from('listagem_entries').select('*').order('created_at',{ascending:false});
  
  const categories = ["Tag's", "Corpo de Praças", "Corpo de Oficiais", "Corpo de Executivos", "Desligados", "Exonerados", "Licença"];
  const grouped = {}; categories.forEach(cat => grouped[cat] = []); // Garante todas as categorias presentes
  
  (entries||[]).forEach(e => {
     const cat = e.category || 'Outros';
     if(!grouped[cat]) grouped[cat] = [];
     grouped[cat].push(e);
  });
  
  // Custom sort para a seção Tag's mantendo admins/institucionais em cima
  if(grouped["Tag's"].length > 0) {
     const adminTags = ["[CDP]", "[COR]", "[CRH]", "[GIT]", "[AM]", "[DEC]"];
     grouped["Tag's"].sort((a,b) => {
        const aIsAdmin = adminTags.some(t => a.title.includes(t));
        const bIsAdmin = adminTags.some(t => b.title.includes(t));
        if(aIsAdmin && !bIsAdmin) return -1;
        if(!aIsAdmin && bIsAdmin) return 1;
        return new Date(b.created_at) - new Date(a.created_at); // Depois as militares
     });
  }

  const secHeadHTML = `<div class="flex flex-wrap items-center justify-between gap-3 fade-up">
    <div><p class="text-xs font-bold tracking-[0.3em] uppercase text-gold-600">Listagem Geral</p>
    <h1 class="font-display text-2xl md:text-3xl font-extrabold text-famr-900"><i class="fas fa-list-ul text-gold-500 mr-2"></i>Registros Oficiais (CRH)</h1></div></div>`;

  c.innerHTML = secHeadHTML + `
    <div class="mt-6 space-y-6">
      ${Object.keys(grouped).map(cat => grouped[cat].length > 0 ? `
        <div class="card overflow-hidden fade-up">
          <div class="cat-head"><i class="fas fa-tag"></i> ${esc(cat)}</div>
          <div class="overflow-x-auto">
            <table class="table-famr w-full">
              <thead><tr><th class="w-1/3">Militar / Título</th><th>Alterações de Status e Tags</th><th class="text-right">Última Atualização</th></tr></thead>
              <tbody>
                ${grouped[cat].map(e => `
                  <tr class="hover:bg-gold-100 transition-colors">
                    <td class="font-bold text-famr-800 align-top">${esc(e.title)}</td>
                    <td class="text-xs text-muted align-top leading-relaxed">
                      ${Object.entries(e.data||{}).map(([k,v])=>`<span class="inline-block bg-paper border border-line rounded px-2 py-0.5 mr-1 mb-1"><b>${esc(k)}:</b> ${esc(v)}</span>`).join('')}
                    </td>
                    <td class="text-xs text-muted text-right align-top">${fmtDate(e.created_at)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : '').join('') || '<div class="card card-body text-center text-muted">Ainda não existem registros em listagem.</div>'}
    </div>`;
}

async function renderSection(c, slug){
  const { data: sec } = await supabase.from('sections').select('*').eq('slug', slug).single();
  if(!sec) return c.innerHTML = '<div class="card card-body text-sm">Seção não encontrada.</div>';
  if(slug === 'listagem') return await renderListagem(c, sec);
  c.innerHTML = `<div class="card card-body">Seção ${esc(sec.name)} (Por favor navegue usando os Subtópicos na barra lateral)</div>`;
}

async function renderSubtopic(c, id){
  const { data: sub } = await supabase.from('subtopics').select('*,sections(name,slug)').eq('id', id).single();
  if(!sub) return c.innerHTML = '<div class="card card-body text-sm text-muted">Subtópico não encontrado.</div>';
  c.innerHTML = `<div class="card card-body">
    <h2 class="font-display font-bold text-xl">${esc(sub.name)}</h2>
    <p class="text-sm text-muted">${esc(sub.description)}</p>
  </div>`;
}

/* ══════════ PERFIL (Hierarquia Ajustada) ══════════ */
async function renderProfile(c, param){
  const me = (!param || param === 'me');
  const id = me ? STATE.profile.id : param;
  const { data: p } = await supabase.from('profiles_view').select('*').eq('id', id).single();
  
  let gs = me ? sortGroups(STATE.groups) : [];
  if(!me){
    const { data: ug } = await supabase.from('user_groups').select('group_id').eq('user_id', id);
    const gids = (ug||[]).map(r => r.group_id).filter(Boolean);
    if(gids.length){ const { data: groups } = await supabase.from('groups').select('*').in('id', gids); gs = sortGroups(groups||[]); }
  }
  
  const main = priorityGroupOf(gs);
  const displayRole = getDisplayRole(main?.name); // Mostra estritamente patente OU cargo executivo (ou Administração se for dono)

  c.innerHTML = `
<div class="card fade-up overflow-hidden">
  <div class="h-24" style="background:${groupBg(colorGroupOf(gs))}"></div>
  <div class="p-6 -mt-12">
    <div class="flex flex-wrap items-end gap-4">
      <span class="w-20 h-20 rounded-2xl grid place-items-center text-3xl font-extrabold text-white border-4 border-white shadow-lg" style="background:${groupBg(colorGroupOf(gs))}"><i class="fas fa-user"></i></span>
      <div class="flex-1">
        <h1 class="font-display text-2xl font-extrabold">${esc(p.nickname)}</h1>
        <p class="text-xs text-muted font-bold tracking-widest uppercase mt-1 text-gold-600">${displayRole}</p>
        <p class="text-xs text-muted mt-1">Desde ${fmtDate(p.created_at)}</p>
      </div>
      <span class="chip ${p.status==='active'?'chip-ok':'chip-no'}">${p.status.toUpperCase()}</span>
    </div>
    <div class="flex flex-wrap gap-2 mt-4">${gs.map(groupChip).join('')}</div>
  </div>
</div>`;
}
