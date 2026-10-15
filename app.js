/* ══════════ FAMR • APP.JS COMPLETO v7 (todas as alterações) ══════════ */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = d => new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
const groupChip = g => g ? `<span class="chip" style="background:${g.color}18;color:${g.color};border:1px solid ${g.color}55">${esc(g.name)}</span>` : '<span class="chip chip-neutral">Geral</span>';
const statusChip = s => s==='approved' ? '<span class="chip chip-ok">APROVADO</span>' : s==='rejected' ? '<span class="chip chip-no">REPROVADO</span>' : '<span class="chip chip-wait">EM ANÁLISE</span>';
const powerStars = p => '★'.repeat(Math.max(1, Math.min(5, Math.ceil((p||0)/20)))) + '☆'.repeat(Math.max(0, 5-Math.min(5, Math.ceil((p||0)/20))));

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

/* ── ROUTER ── */
window.addEventListener('hashchange', route);
async function route(){
  if(!STATE.profile) return;
  const [, page, param] = location.hash.replace('#/','').split('/');
  const c = document.getElementById('content');
  c.innerHTML = '<div class="skeleton h-40"></div><div class="skeleton h-64 mt-4"></div>';
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === (page||'home')));
  try{
    if(page === 'section') return await renderSection(c, param);
    if(page === 'sub')     return await renderSubtopic(c, param);
    return await renderHome(c);
  }catch(err){ console.error(err); c.innerHTML = `<div class="card card-body text-red-600 text-sm"><i class="fas fa-plug-circle-xmark mr-2"></i>Falha de conexão. Tente novamente.</div>`; }
}

/* ── SIDEBAR (links para páginas externas: perfil.html, companhias.html, admin.html) ── */
async function buildSidebar(){
  const { data: sections } = await supabase.from('sections').select('*').order('order_index');
  STATE.sections = sections || [];
  let html = `<a class="nav-item active" data-route="home" href="#/home"><i class="fas fa-house"></i> Início</a>
              <div class="nav-sep">Tópicos oficiais</div>`;
  for(const s of STATE.sections){
    const locked = s.required_group_id && !canAccessGroup(s.required_group_id) && !isAdmin();
    html += `<a class="nav-item" data-route="section" href="#/section/${s.slug}">
      <i class="fas ${esc(s.icon)}"></i> ${esc(s.name)} ${locked?'<i class="fas fa-lock lock-badge ml-auto text-xs"></i>':''}</a>`;
  }
  html += `<div class="nav-sep">Minha conta</div>
           <a class="nav-item" href="perfil.html"><i class="fas fa-id-badge"></i> Meu perfil</a>
           <a class="nav-item" href="companhias.html"><i class="fas fa-shield-halved"></i> Companhias</a>`;
  if(isAdmin()) html += `<div class="nav-sep">Comando</div>
           <a class="nav-item" href="admin.html"><i class="fas fa-sliders"></i> Painel Admin</a>`;
  document.getElementById('sidebar-nav').innerHTML = html;
  if(STATE.settings.maintenance?.enabled && isAdmin()) document.getElementById('maintenance-banner').classList.remove('hidden');
}
function canAccessGroup(gid){
  if(!gid) return true;
  if(isAdmin()) return true;
  return STATE.groups.some(g => g.id === gid);
}

/* ══════════ HOME (índice estilo fórum — SEM termos técnicos, COM ambiente dos grupos) ══════════ */
async function renderHome(c){
  const [{ data: sections }, { data: subs }, { data: posts }, { count: nMembers }, 
         { data: newest }, { data: groups }] = await Promise.all([
    supabase.from('sections').select('*').order('order_index'),
    supabase.from('subtopics').select('id,name,description,section_id,required_group_id,is_request_form,allow_posts').order('order_index'),
    supabase.from('posts').select('id,subtopic_id,title,created_at,profiles_view(nickname)').order('created_at',{ascending:false}).limit(300),
    supabase.from('profiles_view').select('*', { count:'planned', head:true }).eq('status','active'),
    supabase.from('profiles_view').select('nickname,created_at').eq('status','active').eq('is_invisible',false).order('created_at',{ascending:false}).limit(5),
    supabase.from('groups').select('id,name,color,power_level,visible,parent_id').eq('visible',true).order('power_level',{ascending:false})
  ]);
  
  // contagem de membros por grupo
  const { data: allUG } = await supabase.from('user_groups').select('group_id').limit(5000);
  const memberCount = {}; (allUG||[]).forEach(m => memberCount[m.group_id] = (memberCount[m.group_id]||0)+1);

  const counts = {}, lastMap = {};
  (posts||[]).forEach(p => { counts[p.subtopic_id] = (counts[p.subtopic_id]||0)+1; if(!lastMap[p.subtopic_id]) lastMap[p.subtopic_id] = p; });
  const visibleSubs = (subs||[]).filter(s => canAccessGroup(s.required_group_id));

  c.innerHTML = `
  <!-- HERO -->
  <section class="hero p-6 md:p-8 fade-up">
    <div class="relative flex flex-wrap items-center gap-6 justify-between">
      <div>
        <p class="text-gold-300 text-xs font-bold tracking-[0.3em] uppercase">Índice do quartel • Habbo BR</p>
        <h1 class="font-display text-2xl md:text-3xl font-extrabold mt-1">Bem-vindo, ${esc(STATE.profile.nickname)}</h1>
        <div class="flex flex-wrap gap-2 mt-3">${STATE.groups.map(groupChip).join('') || '<span class="chip">Sem grupo</span>'}</div>
      </div>
      <img src="${CONFIG.logoUrl}" class="w-20 md:w-28 drop-shadow-xl hidden sm:block" onerror="this.style.display='none'">
    </div>
  </section>

  <!-- STATS -->
  <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 fade-up">
    <div class="stat-tile"><span class="forum-ico"><i class="fas fa-users"></i></span><div><p class="text-[10px] uppercase tracking-wider text-muted font-bold">Efetivo ativo</p><p class="font-display text-xl font-extrabold text-famr-800">${nMembers ?? 0}</p></div></div>
    <div class="stat-tile"><span class="forum-ico new"><i class="fas fa-comments"></i></span><div><p class="text-[10px] uppercase tracking-wider text-muted font-bold">Publicações</p><p class="font-display text-xl font-extrabold text-famr-800">${(posts||[]).length}+</p></div></div>
    <div class="stat-tile"><span class="forum-ico"><i class="fas fa-folder-open"></i></span><div><p class="text-[10px] uppercase tracking-wider text-muted font-bold">Subtópicos</p><p class="font-display text-xl font-extrabold text-famr-800">${visibleSubs.length}</p></div></div>
    <div class="stat-tile"><span class="forum-ico new"><i class="fas fa-user-plus"></i></span><div><p class="text-[10px] uppercase tracking-wider text-muted font-bold">Mais recente</p><p class="font-display text-sm font-extrabold text-famr-800 truncate">${esc(newest?.[0]?.nickname || '—')}</p></div></div>
  </section>

  <!-- AMBIENTE DOS GRUPOS (novidade!) -->
  ${(groups||[]).length > 0 ? `
  <section class="fade-up">
    <h2 class="font-display font-bold text-sm mb-3"><i class="fas fa-building-columns text-gold-500 mr-2"></i>Ambiente das Companhias</h2>
    <div class="group-env">
      ${(groups||[]).map(g => `
        <a href="companhias.html#${g.id}" class="group-card">
          <div class="gc-bar" style="background:linear-gradient(90deg,${g.color},${g.color}88)"></div>
          <span class="gc-name" style="color:${g.color}">${esc(g.name)}</span>
          <span class="gc-count"><i class="fas fa-users mr-1"></i>${memberCount[g.id]||0} membro(s)</span>
          <span class="gc-stars">${powerStars(g.power_level)}</span>
        </a>`).join('')}
    </div>
  </section>` : ''}

  <!-- ÍNDICE POR SETORES (fórum) -->
  ${(sections||[]).map(sec => {
    const rows = visibleSubs.filter(s => s.section_id === sec.id);
    const secLocked = sec.required_group_id && !canAccessGroup(sec.required_group_id);
    if(secLocked && rows.length === 0) return '';
    return `<section class="card overflow-hidden fade-up">
      <div class="cat-head"><i class="fas ${esc(sec.icon)}"></i> ${esc(sec.name)}
        <a href="#/section/${sec.slug}" class="ml-auto text-[10px] font-bold text-gold-300 hover:text-white normal-case tracking-normal">ver setor →</a></div>
      <div class="divide-y divide-line">
        ${rows.map(s => forumRow(s, counts, lastMap)).join('') || '<p class="p-5 text-sm text-muted text-center">Nenhum subtópico visível neste setor.</p>'}
      </div>
    </section>`;
  }).join('')}

  <!-- RODAPÉ: ÚLTIMOS ALISTAMENTOS + LEGENDA LIMPA -->
  <div class="grid md:grid-cols-2 gap-4 fade-up">
    <div class="card"><div class="card-head"><h2 class="font-display font-bold text-sm"><i class="fas fa-user-clock text-gold-500 mr-2"></i>Últimos alistamentos</h2></div>
      <div class="p-4 flex flex-wrap gap-2">${(newest||[]).map(u => `<span class="chip chip-ok"><i class="fas fa-user"></i> ${esc(u.nickname)}</span>`).join('') || '<span class="text-xs text-muted">—</span>'}</div>
      <div class="px-4 pb-4 text-xs text-muted">Total de militares ativos: <b>${nMembers ?? 0}</b></div></div>
    
    <div class="card"><div class="card-head"><h2 class="font-display font-bold text-sm"><i class="fas fa-circle-info text-gold-500 mr-2"></i>Legenda do índice</h2></div>
      <div class="p-4 space-y-2 text-xs text-muted">
        <p><span class="forum-ico inline-grid !w-6 !h-6 text-[10px] mr-2"><i class="fas fa-comments"></i></span> Subtópico aberto para publicação</p>
        <p><span class="forum-ico lock inline-grid !w-6 !h-6 text-[10px] mr-2"><i class="fas fa-lock"></i></span> Conteúdo reservado a companhia específica</p>
        <p><span class="forum-ico new inline-grid !w-6 !h-6 text-[10px] mr-2"><i class="fas fa-file-signature"></i></span> Formulário de requerimento ao CRH/RH</p>
        <p class="pt-2 border-t border-line"><i class="fas fa-shield-halved text-famr-600 mr-1"></i> Sessão segura • expira após 1h de inatividade</p>
      </div></div>
  </div>`;
}

function forumRow(s, counts, lastMap){
  const locked = s.required_group_id && !canAccessGroup(s.required_group_id);
  const last = lastMap[s.id];
  const icoClass = locked ? 'lock fa-lock' : s.is_request_form ? 'new fa-file-signature' : 'fa-comments';
  const icoParts = icoClass.split(' ');
  return `<a href="${locked ? '#' : '#/sub/'+s.id}" class="forum-row ${locked?'opacity-70 cursor-not-allowed':''}" ${locked?'onclick="return false"':''}>
    <span class="forum-ico ${locked?'lock':s.is_request_form?'new':''}"><i class="fas ${icoParts[icoParts.length-1]}"></i></span>
    <div class="flex-1 min-w-0">
      <b class="text-sm text-famr-800">${esc(s.name)}</b>
      <p class="text-xs text-muted truncate">${esc(s.description||'')}</p>
    </div>
    <div class="w-20 text-center hidden sm:block"><b class="text-sm">${locked?'—':(counts[s.id]||0)}</b><span class="block text-[10px] text-muted uppercase">tópicos</span></div>
    <div class="w-44 hidden md:block text-[11px] text-muted truncate">
      ${locked ? '<i class="fas fa-lock lock-badge"></i> acesso reservado' : last ? `<i class="fas fa-clock text-gold-500 mr-1"></i>${fmtDate(last.created_at)}<br><span class="ml-4">por <b class="text-famr-700">${esc(last.profiles_view?.nickname||'—')}</b></span>` : 'sem publicações'}
    </div>
  </a>`;
}

/* ── SETOR (categoria) ── */
async function renderSection(c, slug){
  const { data: sec } = await supabase.from('sections').select('*').eq('slug', slug).single();
  if(!sec){ c.innerHTML = '<div class="card card-body text-sm text-muted">Seção não encontrada.</div>'; return; }
  if(slug === 'listagem')      return await renderListagem(c, sec);
  if(slug === 'requerimentos') return await renderRequerimentos(c, sec);
  if(slug === 'documentos')    return await renderDocumentos(c, sec);
  if(sec.required_group_id && !canAccessGroup(sec.required_group_id)){
    c.innerHTML = `<div class="card card-body text-center py-14"><i class="fas fa-lock text-3xl text-gold-500"></i>
      <h2 class="font-display font-bold text-xl mt-3">Acesso restrito</h2></div>`; return;
  }
  const { data: subs } = await supabase.from('subtopics').select('*').eq('section_id', sec.id).order('order_index');
  const ids = (subs||[]).map(s => s.id);
  const { data: posts } = ids.length ? await supabase.from('posts').select('id,subtopic_id,title,created_at,profiles_view(nickname)').in('subtopic_id', ids).order('created_at',{ascending:false}).limit(300) : { data: [] };
  const counts = {}, lastMap = {};
  (posts||[]).forEach(p => { counts[p.subtopic_id] = (counts[p.subtopic_id]||0)+1; if(!lastMap[p.subtopic_id]) lastMap[p.subtopic_id] = p; });
  c.innerHTML = `
  <div class="flex flex-wrap items-center justify-between gap-3 fade-up">
    <div><p class="text-xs font-bold tracking-[0.3em] uppercase text-gold-600">Setor</p>
    <h1 class="font-display text-2xl md:text-3xl font-extrabold text-famr-900"><i class="fas ${esc(sec.icon)} text-gold-500 mr-2"></i>${esc(sec.name)}</h1>
    <p class="text-sm text-muted mt-1">${esc(sec.description||'')}</p></div><div class="star-row text-sm">★★★★</div></div>
  <section class="card overflow-hidden fade-up">
    <div class="cat-head"><i class="fas ${esc(sec.icon)}"></i> ${esc(sec.name)}</div>
    <div class="divide-y divide-line">${(subs||[]).map(s => forumRow(s, counts, lastMap)).join('') || '<p class="p-5 text-sm text-muted text-center">Nenhum subtópico.</p>'}</div>
  </section>`;
}

/* ── SUBTÓPICO (fórum → lista de tópicos) ── */
async function renderSubtopic(c, id){
  const { data: sub } = await supabase.from('subtopics').select('*,sections(name,slug)').eq('id', id).single();
  if(!sub){ c.innerHTML = '<div class="card card-body text-sm text-muted">Subtópico não encontrado.</div>'; return; }
  if(sub.required_group_id && !canAccessGroup(sub.required_group_id)){
    c.innerHTML = `<div class="card card-body text-center py-14"><i class="fas fa-lock text-3xl text-gold-500"></i>
      <h2 class="font-display font-bold text-xl mt-3">Acesso restrito</h2><p class="text-sm text-muted mt-1">Conteúdo exclusivo de grupo específico.</p></div>`; return;
  }
  const { data: posts } = await supabase.from('posts').select('*,profiles_view(nickname)').eq('subtopic_id', id).order('created_at',{ascending:false}).limit(50);
  window._postsCache = Object.fromEntries((posts||[]).map(p => [p.id, p]));
  c.innerHTML = `
  <div class="fade-up">
    <p class="text-xs text-muted mb-2"><a href="#/section/${sub.sections?.slug}" class="text-famr-700 font-bold hover:underline"><i class="fas fa-arrow-left mr-1"></i>${esc(sub.sections?.name||'')}</a> / <b>${esc(sub.name)}</b></p>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-display text-xl md:text-2xl font-extrabold text-famr-900"><i class="fas fa-comments text-gold-500 mr-2"></i>${esc(sub.name)}</h1>
      ${sub.is_request_form ? `<button class="btn btn-gold btn-sm" onclick='openRequestForm(${JSON.stringify(sub).replace(/'/g,"&#39;")})'><i class="fas fa-pen-to-square"></i> Abrir protocolo</button>`
        : sub.allow_posts ? `<button class="btn btn-primary btn-sm" onclick="document.getElementById('new-topic').classList.toggle('hidden')"><i class="fas fa-plus"></i> Novo tópico</button>` : ''}
    </div>
  </div>
  ${sub.allow_posts && !sub.is_request_form ? `<form id="new-topic" class="hidden card card-body grid gap-3 fade-up" onsubmit="return newPost(event,'${sub.id}')">
      <input name="title" class="input" placeholder="Título do tópico" required>
      <textarea name="content" class="input" rows="4" placeholder="Conteúdo da publicação..." required></textarea>
      <input name="link" class="input" placeholder="Link de anexo (Google Drive) — opcional">
      <button class="btn btn-gold btn-sm justify-self-start"><i class="fas fa-paper-plane"></i> Publicar tópico</button></form>` : ''}
  <section class="card overflow-hidden fade-up">
    <div class="cat-head"><i class="fas fa-inbox"></i> Tópicos de ${esc(sub.name)}</div>
    <div class="divide-y divide-line">
      ${(posts||[]).map(p => `<div class="topic-row" onclick="openTopic('${p.id}')">
        <span class="forum-ico ${p.pinned?'new':''}"><i class="fas ${p.pinned?'fa-thumbtack':'fa-comment'}"></i></span>
        <div class="flex-1 min-w-0"><b class="text-sm text-famr-800">${esc(p.title)}</b>
          <p class="text-[11px] text-muted">por <b class="text-famr-700">${esc(p.profiles_view?.nickname||'—')}</b> • ${fmtDate(p.created_at)}</p></div>
        <i class="fas fa-chevron-right text-xs text-muted"></i>
      </div>`).join('') || '<p class="p-6 text-sm text-muted text-center">Nenhum tópico publicado ainda.</p>'}
    </div>
  </section>`;
}
window.openTopic = id => {
  const p = window._postsCache?.[id]; if(!p) return;
  const mine = p.author_id === STATE.profile.id;
  openModal(`<i class="fas fa-comment text-gold-500 mr-2"></i>${esc(p.title)}`,
    `<div class="text-[11px] text-muted mb-3"><i class="fas fa-user-pen text-gold-500 mr-1"></i>${esc(p.profiles_view?.nickname||'—')} • ${fmtDate(p.created_at)}</div>
     <p class="text-sm whitespace-pre-wrap text-ink">${esc(p.content)}</p>
     ${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm mt-4"><i class="fab fa-google-drive"></i> Abrir anexo</a>` : ''}`,
    `${mine||isAdmin() ? `<button class="btn btn-danger btn-sm mr-auto" onclick="delPost('${p.id}')"><i class="fas fa-trash"></i> Excluir</button>` : ''}
     <button class="btn btn-outline btn-sm" onclick="closeModal()">Fechar</button>`);
};
window.newPost = async function(e, subtopicId){
  e.preventDefault();
  const f = e.target;
  const { error } = await supabase.from('posts').insert([{ subtopic_id: subtopicId, title: f.title.value, content: f.content.value, link: f.link.value||null, author_id: STATE.profile.id }]);
  if(error){ toast('Erro: '+error.message,'err'); return false; }
  try{ await supabase.rpc('log_action', { action:'POST_CRIADO', details:{ subtopicId } }); }catch(e){}
  toast('Tópico publicado!'); route(); return false;
};
window.delPost = async function(id){
  if(!await confirmDlg('Excluir esta publicação?')) return;
  await supabase.from('posts').delete().eq('id', id);
  try{ await supabase.rpc('log_action', { action:'POST_EXCLUIDO', details:{ id } }); }catch(e){}
  closeModal(); toast('Publicação excluída.'); route();
};

/* ── LISTAGEM ── */
async function renderListagem(c, sec){
  const head = secHead(sec);
  const { data: entries } = await supabase.from('listagem_entries').select('*').order('created_at',{ascending:false}).limit(100);
  const cats = [...new Set((entries||[]).map(e => e.category))];
  c.innerHTML = head + `
  <div class="card fade-up">
    <div class="cat-head"><i class="fas fa-list-ul"></i> Registros oficiais ${cats.map(k => `<span class="chip chip-neutral ml-2 normal-case">${esc(k)}</span>`).join('')}</div>
    <div class="overflow-x-auto"><table class="table-famr">
      <thead><tr><th>Registro</th><th>Categoria</th><th>Detalhes</th><th>Origem</th><th>Data</th></tr></thead>
      <tbody>${(entries||[]).map(e => `<tr>
        <td class="font-bold text-famr-800">${esc(e.title)}</td>
        <td><span class="chip chip-neutral">${esc(e.category)}</span></td>
        <td class="text-xs text-muted">${Object.entries(e.data||{}).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join(' • ')}</td>
        <td class="text-xs">${e.source_request_id ? '<span class="chip chip-ok"><i class="fas fa-link"></i> requerimento</span>' : '<span class="chip chip-neutral">manual</span>'}</td>
        <td class="text-xs text-muted">${fmtDate(e.created_at)}</td></tr>`).join('')
        || '<tr><td colspan="5" class="text-center text-muted py-8">Nenhum registro publicado ainda.</td></tr>'}</tbody>
    </table></div></div>`;
}
const secHead = sec => `<div class="flex flex-wrap items-center justify-between gap-3 fade-up">
  <div><p class="text-xs font-bold tracking-[0.3em] uppercase text-gold-600">Setor</p>
  <h1 class="font-display text-2xl md:text-3xl font-extrabold text-famr-900"><i class="fas ${esc(sec.icon)} text-gold-500 mr-2"></i>${esc(sec.name)}</h1>
  <p class="text-sm text-muted mt-1">${esc(sec.description||'')}</p></div><div class="star-row text-sm">★★★★</div></div>`;

/* ── REQUERIMENTOS ── */
async function renderRequerimentos(c, sec){
  const { data: subs } = await supabase.from('subtopics').select('*').eq('section_id', sec.id).order('order_index');
  const { data: mine } = await supabase.from('requests').select('*,subtopics(name)').eq('author_id', STATE.profile.id).order('created_at',{ascending:false}).limit(30);
  c.innerHTML = secHead(sec) + `
  <div class="grid lg:grid-cols-3 gap-6">
    <div class="space-y-4 fade-up">
      ${(subs||[]).map(s => {
        const locked = s.required_group_id && !canAccessGroup(s.required_group_id);
        return `<div class="card card-hover p-5 ${locked?'opacity-60':''}">
          <div class="flex items-center justify-between"><h3 class="font-display font-bold">${esc(s.name)}</h3>${locked?'<i class="fas fa-lock lock-badge"></i>':''}</div>
          <p class="text-xs text-muted mt-1">${esc(s.description||'')}</p>
          ${locked ? '' : `<button class="btn btn-gold btn-sm mt-3" onclick='openRequestForm(${JSON.stringify(s).replace(/'/g,"&#39;")})'><i class="fas fa-pen-to-square"></i> Abrir protocolo</button>`}
        </div>`; }).join('') || '<div class="card card-body text-sm text-muted">Nenhum formulário disponível.</div>'}
    </div>
    <div class="lg:col-span-2 card fade-up">
      <div class="cat-head"><i class="fas fa-inbox"></i> Meus protocolos</div>
      <div class="divide-y divide-line max-h-[560px] overflow-auto">
        ${(mine||[]).map(r => `<div class="p-4 flex items-center justify-between gap-3 hover:bg-gold-100/40 transition-colors">
          <div><p class="font-bold text-sm">${esc(r.title)}</p>
          <p class="text-[11px] text-muted mt-0.5">${esc(r.subtopics?.name||'')} • ${fmtDate(r.created_at)} ${r.review_note?`• <i>"${esc(r.review_note)}"</i>`:''}</p></div>
          ${statusChip(r.status)}</div>`).join('') || '<p class="p-8 text-center text-sm text-muted">Você ainda não abriu protocolos.</p>'}
      </div></div>
  </div>`;
}
window.openRequestForm = function(sub){
  const fields = sub.form_fields || [];
  openModal(`<i class="fas fa-file-signature text-gold-500 mr-2"></i>${esc(sub.name)}`,
    fields.map(f => `<label class="field"><span>${esc(f.label)}${f.required?' *':''}</span>
      ${f.type==='textarea' ? `<textarea data-f="${esc(f.label)}" data-req="${!!f.required}" class="input" rows="3"></textarea>`
                            : `<input data-f="${esc(f.label)}" data-req="${!!f.required}" class="input" type="${f.type||'text'}">`}</label>`).join(''),
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

/* ── DOCUMENTOS ── */
async function renderDocumentos(c, sec){
  const { data: subs } = await supabase.from('subtopics').select('*').eq('section_id', sec.id);
  const ids = (subs||[]).map(s => s.id);
  const { data: docs } = ids.length ? await supabase.from('posts').select('*,subtopics(name,required_group_id)').in('subtopic_id', ids).order('created_at',{ascending:false}).limit(60) : { data: [] };
  c.innerHTML = secHead(sec) + `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-up">
    ${(docs||[]).filter(d => canAccessGroup(d.subtopics?.required_group_id)).map(d => `
      <div class="card card-hover p-5">
        <div class="flex items-center justify-between"><span class="forum-ico"><i class="fas fa-file-lines"></i></span>
        <span class="chip chip-neutral">${esc(d.subtopics?.name||'')}</span></div>
        <h3 class="font-bold mt-3">${esc(d.title)}</h3>
        <p class="text-xs text-muted mt-1 line-clamp-3">${esc(d.content)}</p>
        ${d.link ? `<a href="${esc(d.link)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm mt-3"><i class="fab fa-google-drive"></i> Abrir documento</a>` : ''}
      </div>`).join('') || '<div class="card card-body text-sm text-muted sm:col-span-2 lg:col-span-3">Nenhum documento publicado.</div>'}
  </div>`;
}

/* ── BUSCA GLOBAL ── */
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('global-search'), drop = document.getElementById('search-drop');
  if(!inp || !drop) return;
  let t;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const q = inp.value.trim();
      if(q.length < 2){ drop.classList.add('hidden'); return; }
      const { data } = await supabase.from('profiles_view').select('id,nickname').eq('status','active').eq('is_invisible', false).ilike('nickname', `%${q}%`).limit(6);
      drop.innerHTML = (data||[]).map(u => `<a href="perfil.html?id=${u.id}" onclick="document.getElementById('search-drop').classList.add('hidden')" class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-famr-100 transition-colors">
        <span class="w-8 h-8 rounded-full bg-famr-700 text-white grid place-items-center text-xs font-bold">${esc(u.nickname.charAt(0).toUpperCase())}</span>
        <span class="text-sm font-bold">${esc(u.nickname)}</span></a>`).join('') || '<p class="p-3 text-xs text-muted">Nenhum militar encontrado.</p>';
      drop.classList.remove('hidden');
    }, 300);
  });
  document.addEventListener('click', e => { if(!e.target.closest('#global-search')) drop.classList.add('hidden'); });
});

/* ══════════════════ PAINEL ADMIN (mantido na íntegra) ══════════════════ */
const A = { tab:'usuarios', page:0, q:'' };
async function renderAdmin(c){
  if(!isAdmin()){ c.innerHTML = `<div class="card card-body text-center py-16"><i class="fas fa-lock text-3xl text-red-500"></i><h2 class="font-display font-bold text-xl mt-3">Acesso negado</h2></div>`; return; }
  const tabs = [['usuarios','fa-users','Usuários'],['grupos','fa-layer-group','Grupos'],['topicos','fa-sitemap','Tópicos'],['protocolos','fa-inbox','Protocolos'],['logs','fa-scroll','Logs'],['config','fa-sliders','Config']];
  c.innerHTML = `
  <div class="fade-up"><p class="text-xs font-bold tracking-[0.3em] uppercase text-gold-600">Comando</p>
  <h1 class="font-display text-2xl md:text-3xl font-extrabold text-famr-900"><i class="fas fa-shield-halved text-gold-500 mr-2"></i>Painel Administrativo</h1>
  <div class="flex flex-wrap gap-2 mt-4">${tabs.map(([k,i,l]) => `<button onclick="adminTab('${k}')" class="btn btn-sm ${A.tab===k?'btn-primary':'btn-outline'}"><i class="fas ${i}"></i> ${l}</button>`).join('')}</div></div>
  <div id="admin-body" class="mt-6"></div>`;
  await adminTab(A.tab);
}
window.adminTab = async function(tab){
  A.tab = tab; A.page = 0;
  const b = document.getElementById('admin-body');
  b.innerHTML = '<div class="skeleton h-64"></div>';
  ({usuarios:tabUsuarios, grupos:tabGrupos, topicos:tabTopicos, protocolos:tabProtocolos, logs:tabLogs, config:tabConfig})[tab](b);
};

async function tabUsuarios(b){
  const from = A.page*20;
  let q = supabase.from('profiles_view').select('*').order('created_at',{ascending:false}).range(from, from+19);
  if(A.q) q = q.ilike('nickname', `%${A.q}%`);
  const { data } = await q;
  b.innerHTML = `<div class="card fade-up">
    <div class="card-head justify-between gap-3 flex-wrap">
      <h2 class="font-display font-bold text-sm">Militares cadastrados</h2>
      <input class="input !py-1.5 !pl-3 w-56" placeholder="Filtrar nickname..." value="${esc(A.q)}" oninput="A.q=this.value;clearTimeout(window._t);window._t=setTimeout(()=>tabUsuarios(document.getElementById('admin-body')),350)">
    </div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Nickname</th><th>Status</th><th>Tentativas</th><th>Desde</th><th class="text-right">Ações</th></tr></thead><tbody>
    ${(data||[]).map(u => `<tr>
      <td class="font-bold">${esc(u.nickname)}</td>
      <td>${u.login_locked ? '<span class="chip chip-no"><i class="fas fa-lock"></i> BLOQUEADO</span>'
           : `<span class="chip ${u.status==='active'?'chip-ok':u.status==='pending'?'chip-wait':'chip-no'}">${u.status.toUpperCase()}</span>`}</td>
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
    ${(data||[]).length===20?`<button class="btn btn-outline btn-sm" onclick="A.page++;tabUsuarios(document.getElementById('admin-body'))">Próxima →</button>`:''}</div></div>`;
}
window.setUser = async (id, status) => {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
  if(error) return toast('Erro: '+error.message,'err');
  try{ await supabase.rpc('log_action', { action:'USER_STATUS', details:{ id, status } }); }catch(e){}
  toast('Status atualizado.'); tabUsuarios(document.getElementById('admin-body'));
};
window.toggleInvisible = async (id, v) => {
  await supabase.from('profiles').update({ is_invisible: v }).eq('id', id);
  try{ await supabase.rpc('log_action', { action:'USER_INVISIBLE', details:{ id, v } }); }catch(e){}
  tabUsuarios(document.getElementById('admin-body'));
};
window.unlockUser = async (id) => {
  const { error } = await supabase.from('profiles').update({ login_locked:false, failed_logins:0 }).eq('id', id);
  if(error) return toast('Erro: '+error.message,'err');
  try{ await supabase.rpc('log_action', { action:'LOCK_REMOVIDO_ADMIN', details:{ id } }); }catch(e){}
  toast('Conta destravada pelo comando.'); tabUsuarios(document.getElementById('admin-body'));
};
window.manageGroups = async (userId, nick) => {
  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase.from('groups').select('id,name,color').order('power_level',{ascending:false}),
    supabase.from('user_groups').select('group_id').eq('user_id', userId)]);
  const has = new Set((mine||[]).map(m => m.group_id));
  openModal(`<i class="fas fa-layer-group text-gold-500 mr-2"></i>Grupos de ${esc(nick)}`,
    (all||[]).map(g => `<label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-famr-50 cursor-pointer">
      <input type="checkbox" value="${g.id}" ${has.has(g.id)?'checked':''} class="accent-[#14563f] w-4 h-4">
      <span class="group-dot" style="background:${g.color}"></span><span class="text-sm font-bold">${esc(g.name)}</span></label>`).join(''),
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="saveGroups('${userId}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveGroups = async userId => {
  const ids = [...document.querySelectorAll('#modal-body input:checked')].map(i => i.value);
  await supabase.from('user_groups').delete().eq('user_id', userId);
  if(ids.length) await supabase.from('user_groups').insert(ids.map(g => ({ user_id: userId, group_id: g })));
  try{ await supabase.rpc('log_action', { action:'USER_GROUPS', details:{ userId, ids } }); }catch(e){}
  closeModal(); toast('Grupos atualizados.');
};

async function tabGrupos(b){
  const { data } = await supabase.from('groups').select('*, groups(name)').order('power_level',{ascending:false});
  b.innerHTML = `<div class="card fade-up">
    <div class="card-head justify-between"><h2 class="font-display font-bold text-sm">Grupos, subgrupos e poder</h2>
    <button class="btn btn-gold btn-sm" onclick="groupForm()"><i class="fas fa-plus"></i> Novo grupo</button></div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Grupo</th><th>Poder</th><th>Vínculo</th><th>Visível</th><th>Permissões</th><th class="text-right">Ações</th></tr></thead><tbody>
    ${(data||[]).map(g => `<tr>
      <td><span class="group-dot mr-2" style="background:${g.color}"></span><b style="color:${g.color}">${esc(g.name)}</b></td>
      <td class="text-gold-500 text-xs">${powerStars(g.power_level)} <span class="text-muted">(${g.power_level})</span></td>
      <td class="text-xs">${g.groups?esc(g.groups.name):'—'}</td>
      <td>${g.visible?'<span class="chip chip-ok">VISÍVEL</span>':'<span class="chip chip-neutral">INVISÍVEL</span>'}</td>
      <td class="text-xs">${(g.permissions||[]).map(p=>`<span class="chip chip-wait">${p}</span>`).join(' ')||'—'}</td>
      <td class="text-right space-x-1"><button class="btn btn-outline btn-sm" onclick="groupForm('${g.id}')"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="delGroup('${g.id}')"><i class="fas fa-trash"></i></button></td></tr>`).join('')}
    </tbody></table></div></div>`;
}
window.groupForm = async id => {
  let g = { name:'', color:'#14563f', power_level:10, visible:true, parent_id:null, permissions:[] };
  if(id){ const r = await supabase.from('groups').select('*').eq('id', id).single(); g = r.data; }
  const { data: all } = await supabase.from('groups').select('id,name').neq('id', id||'');
  openModal(`<i class="fas fa-layer-group text-gold-500 mr-2"></i>${id?'Editar':'Novo'} grupo`, `
    <label class="field"><span>Nome</span><input id="g-name" class="input" value="${esc(g.name)}"></label>
    <div class="grid grid-cols-2 gap-3">
      <label class="field"><span>Cor</span><input id="g-color" type="color" class="input !p-1 h-11" value="${g.color}"></label>
      <label class="field"><span>Poder (0-100)</span><input id="g-power" type="number" min="0" max="100" class="input" value="${g.power_level}"></label>
    </div>
    <label class="field"><span>Subgrupo de</span><select id="g-parent" class="input"><option value="">— nenhum —</option>
      ${(all||[]).map(p => `<option value="${p.id}" ${g.parent_id===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
    <label class="flex items-center gap-3 text-sm font-bold"><input id="g-visible" type="checkbox" class="w-4 h-4 accent-[#14563f]" ${g.visible?'checked':''}> Grupo visível no sistema</label>
    <div><span class="text-xs font-bold uppercase tracking-wider text-muted">Permissões</span>
      <div class="grid grid-cols-3 gap-2 mt-2">${['admin','master','review'].map(p => `<label class="chip chip-neutral cursor-pointer"><input type="checkbox" class="g-perm mr-1 accent-[#14563f]" value="${p}" ${(g.permissions||[]).includes(p)?'checked':''}>${p}</label>`).join('')}</div></div>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="saveGroup('${id||''}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveGroup = async id => {
  const row = { name: document.getElementById('g-name').value.trim(), color: document.getElementById('g-color').value,
    power_level: +document.getElementById('g-power').value || 0, parent_id: document.getElementById('g-parent').value || null,
    visible: document.getElementById('g-visible').checked, permissions: [...document.querySelectorAll('.g-perm:checked')].map(i => i.value) };
  if(!row.name) return toast('Informe o nome.','warn');
  const q = id ? supabase.from('groups').update(row).eq('id', id) : supabase.from('groups').insert([row]);
  const { error } = await q;
  if(error) return toast('Erro: '+error.message,'err');
  try{ await supabase.rpc('log_action', { action:'GROUP_SAVE', details: row }); }catch(e){}
  closeModal(); toast('Grupo salvo.'); buildSidebar(); tabGrupos(document.getElementById('admin-body'));
};
window.delGroup = async id => {
  if(!await confirmDlg('Excluir grupo? Membros perdem acesso aos tópicos dele.')) return;
  await supabase.from('groups').delete().eq('id', id);
  try{ await supabase.rpc('log_action', { action:'GROUP_DEL', details:{ id } }); }catch(e){}
  tabGrupos(document.getElementById('admin-body'));
};

async function tabTopicos(b){
  const [{ data: secs }, { data: subs }, { data: groups }] = await Promise.all([
    supabase.from('sections').select('*').order('order_index'),
    supabase.from('subtopics').select('*,groups(name)').order('order_index'),
    supabase.from('groups').select('id,name')]);
  window._groupsCache = groups || [];
  b.innerHTML = `<div class="space-y-4 fade-up">
    <div class="flex justify-end"><button class="btn btn-gold btn-sm" onclick="sectionForm()"><i class="fas fa-plus"></i> Novo tópico (setor)</button></div>
    ${(secs||[]).map(s => `<div class="card">
      <div class="cat-head"><i class="fas ${esc(s.icon)}"></i> ${esc(s.name)} <span class="chip chip-neutral ml-2 normal-case">/${esc(s.slug)}</span>
        <span class="ml-auto flex gap-1"><button class="btn btn-outline btn-sm" onclick="subtopicForm('${s.id}')"><i class="fas fa-plus"></i> Subtópico</button>
        <button class="btn btn-danger btn-sm" onclick="delSection('${s.id}')"><i class="fas fa-trash"></i></button></span></div>
      <div class="divide-y divide-line">${(subs||[]).filter(x => x.section_id===s.id).map(x => `
        <div class="p-3.5 flex flex-wrap items-center gap-3 text-sm">
          <i class="fas fa-folder-open text-muted"></i><b>${esc(x.name)}</b>
          ${x.required_group_id?`<span class="chip chip-wait"><i class="fas fa-lock"></i> ${esc(x.groups?.name||'')}</span>`:'<span class="chip chip-ok">todos</span>'}
          ${x.is_request_form?'<span class="chip chip-neutral">formulário</span>':''}
          ${x.auto_listagem_category?`<span class="chip chip-ok">→ listagem: ${esc(x.auto_listagem_category)}</span>`:''}
          <button class="btn btn-danger btn-sm ml-auto" onclick="delSubtopic('${x.id}')"><i class="fas fa-trash"></i></button>
        </div>`).join('') || '<p class="p-4 text-xs text-muted">Sem subtópicos.</p>'}</div></div>`).join('')}
  </div>`;
}
window.sectionForm = () => openModal('<i class="fas fa-sitemap text-gold-500 mr-2"></i>Novo setor', `
  <label class="field"><span>Nome</span><input id="s-name" class="input" placeholder="Ex: Condecorações"></label>
  <label class="field"><span>Slug (url)</span><input id="s-slug" class="input" placeholder="condecoracoes"></label>
  <label class="field"><span>Ícone (FontAwesome)</span><input id="s-icon" class="input" value="fa-folder-open"></label>
  <label class="field"><span>Descrição</span><textarea id="s-desc" class="input" rows="2"></textarea></label>
  <label class="field"><span>Restrito ao grupo</span><select id="s-group" class="input"><option value="">— todos —</option>${(window._groupsCache||[]).map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select></label>`,
  `<button class="btn btn-primary btn-sm" onclick="saveSection()"><i class="fas fa-floppy-disk"></i> Criar</button>`);
window.saveSection = async () => {
  const { count } = await supabase.from('sections').select('*', { count:'exact', head:true });
  const { error } = await supabase.from('sections').insert([{
    name: document.getElementById('s-name').value.trim(), slug: document.getElementById('s-slug').value.trim().toLowerCase().replace(/\s+/g,'-'),
    icon: document.getElementById('s-icon').value.trim() || 'fa-folder-open', description: document.getElementById('s-desc').value,
    required_group_id: document.getElementById('s-group').value || null, order_index: (count||0)+1 }]);
  if(error) return toast('Erro: '+error.message,'err');
  try{ await supabase.rpc('log_action', { action:'SECTION_CRIADA', details:{} }); }catch(e){}
  closeModal(); toast('Setor criado.'); buildSidebar(); tabTopicos(document.getElementById('admin-body'));
};
window.delSection = async id => { if(await confirmDlg('Excluir setor e todos os subtópicos?')) { await supabase.from('sections').delete().eq('id', id); buildSidebar(); tabTopicos(document.getElementById('admin-body')); } };
window.delSubtopic = async id => { if(await confirmDlg('Excluir subtópico?')) { await supabase.from('subtopics').delete().eq('id', id); tabTopicos(document.getElementById('admin-body')); } };
window.subtopicForm = sid => openModal('<i class="fas fa-folder-plus text-gold-500 mr-2"></i>Novo subtópico', `
  <label class="field"><span>Nome</span><input id="t-name" class="input"></label>
  <label class="field"><span>Descrição</span><textarea id="t-desc" class="input" rows="2"></textarea></label>
  <label class="field"><span>Restrito ao grupo</span><select id="t-group" class="input"><option value="">— todos —</option>${(window._groupsCache||[]).map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select></label>
  <label class="flex items-center gap-2 text-sm font-bold"><input id="t-posts" type="checkbox" checked class="w-4 h-4 accent-[#14563f]"> Permite publicações</label>
  <label class="flex items-center gap-2 text-sm font-bold"><input id="t-form" type="checkbox" class="w-4 h-4 accent-[#14563f]"> É formulário de requerimento</label>
  <label class="field"><span>Campos (um por linha: Nome:tipo → text|textarea|number)</span><textarea id="t-fields" class="input" rows="3" placeholder="Nome da Tag:text&#10;Descrição:textarea"></textarea></label>
  <label class="field"><span>Ao aprovar, publicar na listagem como categoria</span><input id="t-cat" class="input" placeholder="ex: tags"></label>
  <input type="hidden" id="t-sid" value="${sid}">`,
  `<button class="btn btn-primary btn-sm" onclick="saveSubtopic()"><i class="fas fa-floppy-disk"></i> Criar</button>`);
window.saveSubtopic = async () => {
  const fields = document.getElementById('t-fields').value.split('\n').filter(Boolean).map(l => {
    const [label, type] = l.split(':'); return { label: label.trim(), type: (type||'text').trim(), required: true };
  });
  const { error } = await supabase.from('subtopics').insert([{
    section_id: document.getElementById('t-sid').value, name: document.getElementById('t-name').value.trim(),
    description: document.getElementById('t-desc').value, required_group_id: document.getElementById('t-group').value || null,
    allow_posts: document.getElementById('t-posts').checked, is_request_form: document.getElementById('t-form').checked,
    form_fields: fields, auto_listagem_category: document.getElementById('t-cat').value.trim() || null }]);
  if(error) return toast('Erro: '+error.message,'err');
  closeModal(); toast('Subtópico criado.'); tabTopicos(document.getElementById('admin-body'));
};

async function tabProtocolos(b){
  const { data } = await supabase.from('requests').select('*,profiles_view(nickname),subtopics(name,auto_listagem_category)').eq('status','pending').order('created_at');
  b.innerHTML = `<div class="card fade-up"><div class="cat-head"><i class="fas fa-inbox"></i> Pendentes de análise (${(data||[]).length})</div>
  <div class="divide-y divide-line">${(data||[]).map(r => `<div class="p-4">
    <div class="flex flex-wrap items-center gap-3 justify-between">
      <div><b class="text-sm">${esc(r.title)}</b> <span class="chip chip-neutral ml-1">${esc(r.subtopics?.name||'')}</span>
      ${r.subtopics?.auto_listagem_category?`<span class="chip chip-ok">→ vira "${esc(r.subtopics.auto_listagem_category)}" na Listagem</span>`:''}
      <p class="text-[11px] text-muted mt-1">${esc(r.profiles_view?.nickname||'')} • ${fmtDate(r.created_at)}</p></div>
      <div class="space-x-1"><button class="btn btn-primary btn-sm" onclick="review('${r.id}','approved')"><i class="fas fa-check"></i> Aprovar</button>
      <button class="btn btn-danger btn-sm" onclick="review('${r.id}','rejected')"><i class="fas fa-xmark"></i> Reprovar</button></div></div>
    <div class="mt-3 grid sm:grid-cols-2 gap-2 text-xs bg-famr-50 rounded-lg p-3">${Object.entries(r.form_data||{}).map(([k,v])=>`<p><b class="text-famr-700">${esc(k)}:</b> ${esc(v)}</p>`).join('')}</div>
  </div>`).join('') || '<p class="p-8 text-center text-sm text-muted">Nenhum protocolo pendente. ✦</p>'}</div></div>`;
}
window.review = (id, status) => {
  if(status === 'approved') return doReview(id, 'approved', '');
  openModal('<i class="fas fa-xmark text-red-500 mr-2"></i>Motivo da reprovação',
    `<label class="field"><span>Motivo (opcional, aparece ao militar)</span><input id="rev-note" class="input"></label>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-danger btn-sm" onclick="doReview('${id}','rejected', document.getElementById('rev-note').value)">Reprovar</button>`);
};
window.doReview = async (id, status, note) => {
  const { error } = await supabase.rpc('review_request', { req_id: id, new_status: status, note: note || null });
  if(error) return toast('Erro: '+error.message,'err');
  closeModal();
  toast(status==='approved' ? 'Aprovado! Registro publicado na Listagem automaticamente.' : 'Protocolo reprovado.');
  tabProtocolos(document.getElementById('admin-body'));
};

async function tabLogs(b){
  const from = A.page*30;
  const { data } = await supabase.from('logs').select('*').order('created_at',{ascending:false}).range(from, from+29);
  b.innerHTML = `<div class="card fade-up"><div class="cat-head"><i class="fas fa-scroll"></i> Logs de ações e logins</div>
  <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Data</th><th>Ação</th><th>Autor</th><th>Detalhes</th></tr></thead><tbody>
  ${(data||[]).map(l => `<tr><td class="text-xs text-muted whitespace-nowrap">${fmtDate(l.created_at)}</td>
    <td><span class="chip ${l.action==='LOGIN'?'chip-ok':(l.action.includes('DEL')||l.action.includes('BAN')||l.action.includes('BLOQ'))?'chip-no':'chip-wait'}">${esc(l.action)}</span></td>
    <td class="text-xs font-bold">${esc(l.actor_name||'sistema')}</td>
    <td class="text-[11px] text-muted max-w-md truncate" title="${esc(JSON.stringify(l.details))}">${esc(JSON.stringify(l.details))}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="p-3 flex justify-center gap-2">${A.page>0?`<button class="btn btn-outline btn-sm" onclick="A.page--;tabLogs(document.getElementById('admin-body'))">←</button>`:''}
  ${(data||[]).length===30?`<button class="btn btn-outline btn-sm" onclick="A.page++;tabLogs(document.getElementById('admin-body'))">→</button>`:''}</div></div>`;
}

async function tabConfig(b){
  const m = STATE.settings.maintenance || { enabled:false, message:'' };
  const a = STATE.settings.announcement || { text:'' };
  b.innerHTML = `<div class="grid md:grid-cols-2 gap-4 fade-up">
    <div class="card"><div class="cat-head"><i class="fas fa-screwdriver-wrench"></i> Modo manutenção</div>
      <div class="card-body space-y-3">
        <label class="flex items-center gap-3 text-sm font-bold"><input id="c-maint" type="checkbox" class="w-5 h-5 accent-[#c9a227]" ${m.enabled?'checked':''}> Sistema em manutenção (bloqueia não-admins)</label>
        <label class="field"><span>Mensagem exibida</span><input id="c-maint-msg" class="input" value="${esc(m.message||'')}"></label>
        <button class="btn btn-primary btn-sm" onclick="saveMaint()"><i class="fas fa-floppy-disk"></i> Salvar</button></div></div>
    <div class="card"><div class="cat-head"><i class="fas fa-bullhorn"></i> Aviso do comando (home)</div>
      <div class="card-body space-y-3">
        <textarea id="c-ann" class="input" rows="4">${esc(a.text||'')}</textarea>
        <button class="btn btn-gold btn-sm" onclick="saveAnn()"><i class="fas fa-floppy-disk"></i> Publicar aviso</button></div></div>
  </div>`;
}
window.saveMaint = async () => {
  const value = { enabled: document.getElementById('c-maint').checked, message: document.getElementById('c-maint-msg').value };
  await supabase.from('settings').upsert({ key:'maintenance', value });
  STATE.settings.maintenance = value;
  try{ await supabase.rpc('log_action', { action:'MANUTENCAO', details: value }); }catch(e){}
  toast('Configuração salva.'); document.getElementById('maintenance-banner').classList.toggle('hidden', !value.enabled);
};
window.saveAnn = async () => {
  const value = { text: document.getElementById('c-ann').value };
  await supabase.from('settings').upsert({ key:'announcement', value });
  STATE.settings.announcement = value;
  try{ await supabase.rpc('log_action', { action:'AVISO', details: value }); }catch(e){}
  toast('Aviso publicado na home.');
};
