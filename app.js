/* ══════════ FAMR • NÚCLEO (router, home, seções, listagem, requerimentos...) ══════════ */

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

/* ── ROUTER (hash = funciona no GitHub Pages e Vercel) ── */
window.addEventListener('hashchange', route);
async function route(){
  if(!STATE.profile) return;
  const [, page, param] = location.hash.replace('#/','').split('/');
  const c = document.getElementById('content');
  c.innerHTML = '<div class="skeleton h-40"></div><div class="skeleton h-64 mt-4"></div>';
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.route === (page||'home')));
  try{
    if(page === 'admin')        return await renderAdmin(c);          // admin.js
    if(page === 'perfil')       return await renderProfile(c, param);
    if(page === 'section')      return await renderSection(c, param);
    return await renderHome(c);
  }catch(err){ console.error(err); c.innerHTML = `<div class="card card-body text-red-600 text-sm"><i class="fas fa-plug-circle-xmark mr-2"></i>Falha de conexão com o Supabase. Tente novamente.</div>`; }
}

/* ── SIDEBAR dinâmica (tópicos criados pelo admin) ── */
async function buildSidebar(){
  const { data: sections } = await supabase.from('sections').select('*').order('order_index');
  STATE.sections = sections || [];
  let html = `<a class="nav-item" data-route="home" href="#/home"><i class="fas fa-house"></i> Início</a>
              <div class="nav-sep">Tópicos oficiais</div>`;
  for(const s of STATE.sections){
    const locked = s.required_group_id && !canAccessGroup(s.required_group_id) && !isAdmin();
    html += `<a class="nav-item" data-route="section" href="#/section/${s.slug}">
      <i class="fas ${esc(s.icon)}"></i> ${esc(s.name)} ${locked?'<i class="fas fa-lock lock-badge ml-auto text-xs"></i>':''}</a>`;
  }
  html += `<div class="nav-sep">Minha conta</div>
           <a class="nav-item" href="#/perfil/me"><i class="fas fa-id-badge"></i> Meu perfil</a>`;
  if(isAdmin()) html += `<div class="nav-sep">Comando</div>
           <a class="nav-item" data-route="admin" href="#/admin"><i class="fas fa-shield-halved"></i> Painel Admin</a>`;
  document.getElementById('sidebar-nav').innerHTML = html;
  if(STATE.settings.maintenance?.enabled && isAdmin()) document.getElementById('maintenance-banner').classList.remove('hidden');
}

/* Acesso a grupo: membro direto, membro do grupo-pai ou admin */
function canAccessGroup(gid){
  if(!gid) return true;
  if(isAdmin()) return true;
  return STATE.groups.some(g => g.id === gid);
}

/* ── HOME ── */
async function renderHome(c){
  const [{ count: nEff }, { count: nPosts }, { data: myReq }, { data: groups }] = await Promise.all([
    supabase.from('profiles').select('*', { count:'planned', head:true }).eq('status','active'),
    supabase.from('posts').select('*', { count:'planned', head:true }),
    supabase.from('requests').select('status').eq('author_id', STATE.profile.id).eq('status','pending'),
    supabase.from('groups').select('name,color,power_level').eq('visible', true).order('power_level',{ascending:false}).limit(6)
  ]);
  const { data: feed } = await supabase.from('posts')
    .select('id,title,content,created_at,author_id,profiles(nickname),subtopics(name,required_group_id,sections(name))')
    .order('created_at',{ascending:false}).limit(6);

  const visibleFeed = (feed||[]).filter(p => canAccessGroup(p.subtopics?.required_group_id));

  c.innerHTML = `
  <section class="hero p-8 md:p-10 fade-up">
    <div class="stars-pattern absolute inset-0"></div>
    <div class="relative flex flex-wrap items-center gap-6 justify-between">
      <div>
        <p class="text-gold-300 text-xs font-bold tracking-[0.3em] uppercase">Quartel-general • Habbo BR</p>
        <h1 class="font-display text-3xl md:text-4xl font-extrabold mt-2">Bem-vindo, ${esc(STATE.profile.nickname)}</h1>
        <div class="flex flex-wrap gap-2 mt-4">${STATE.groups.map(groupChip).join('') || '<span class="chip chip-neutral">Sem grupo</span>'}</div>
      </div>
      <img src="${CONFIG.logoUrl}" class="w-24 md:w-32 drop-shadow-xl hidden sm:block" onerror="this.style.display='none'">
    </div>
  </section>

  <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up">
    ${statCard('fa-users','Efetivo ativo', nEff ?? '—')}
    ${statCard('fa-inbox','Meus protocolos pendentes', (myReq||[]).length)}
    ${statCard('fa-newspaper','Publicações', nPosts ?? '—')}
    ${statCard('fa-shield-halved','Companhias visíveis', (groups||[]).length)}
  </section>

  <div class="grid lg:grid-cols-3 gap-6">
    <section class="lg:col-span-2 space-y-4 fade-up">
      <div class="card"><div class="card-head"><h2 class="font-display font-bold"><i class="fas fa-bullhorn text-gold-500 mr-2"></i>Ordens & Comunicados</h2></div>
        <div class="divide-y divide-line">
          ${visibleFeed.map(p => `
            <article class="p-4 hover:bg-gold-100/50 transition-colors">
              <div class="flex items-start justify-between gap-3">
                <h3 class="font-bold text-famr-800">${esc(p.title)}</h3>
                <time class="text-[11px] text-muted shrink-0">${fmtDate(p.created_at)}</time>
              </div>
              <p class="text-sm text-muted mt-1 line-clamp-2">${esc(p.content)}</p>
              <div class="flex items-center gap-2 mt-2 text-[11px] text-muted">
                <i class="fas fa-user-pen text-gold-500"></i>${esc(p.profiles?.nickname||'—')}
                <span class="chip chip-neutral ml-auto">${esc(p.subtopics?.sections?.name||'')} / ${esc(p.subtopics?.name||'')}</span>
              </div>
            </article>`).join('') || '<p class="p-6 text-sm text-muted text-center">Nenhuma publicação visível para o seu nível de acesso.</p>'}
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        ${STATE.sections.map(s => {
          const locked = s.required_group_id && !canAccessGroup(s.required_group_id);
          return `<a href="#/section/${s.slug}" class="card card-hover p-5 block ${locked?'opacity-70':''}">
            <div class="flex items-center justify-between">
              <span class="w-11 h-11 rounded-xl grid place-items-center text-white text-lg" style="background:linear-gradient(135deg,#1a6b4f,#0b3d2c)"><i class="fas ${esc(s.icon)}"></i></span>
              ${locked ? '<i class="fas fa-lock lock-badge"></i>' : '<i class="fas fa-arrow-right text-gold-500"></i>'}
            </div>
            <h3 class="font-display font-bold mt-3">${esc(s.name)}</h3>
            <p class="text-xs text-muted mt-1 line-clamp-2">${esc(s.description||'')}</p>
          </a>`; }).join('')}
      </div>
    </section>

    <aside class="space-y-4 fade-up">
      <div class="card"><div class="card-head"><h2 class="font-display font-bold text-sm"><i class="fas fa-bell text-gold-500 mr-2"></i>Aviso do comando</h2></div>
        <p class="card-body text-sm text-muted">${esc(STATE.settings.announcement?.text || 'Sem avisos no momento.')}</p></div>
      <div class="card"><div class="card-head"><h2 class="font-display font-bold text-sm"><i class="fas fa-ranking-star text-gold-500 mr-2"></i>Hierarquia visível</h2></div>
        <div class="card-body space-y-2">
          ${(groups||[]).map(g => `<div class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2"><span class="group-dot" style="background:${g.color}"></span>${esc(g.name)}</span>
            <span class="text-gold-500 text-xs">${powerStars(g.power_level)}</span></div>`).join('') || '<p class="text-xs text-muted">Nenhuma companhia visível.</p>'}
        </div></div>
      <div class="card p-4 text-[11px] text-muted flex items-center gap-3">
        <span class="w-2 h-2 rounded-full bg-famr-500 animate-pulse"></span> Sistema online • Banco Supabase com RLS ativo • Imagens via Google Drive
      </div>
    </aside>
  </div>`;
}
const statCard = (icon,label,val) => `
  <div class="card card-hover card-body flex items-center gap-4">
    <span class="w-11 h-11 rounded-xl grid place-items-center bg-famr-100 text-famr-700 text-lg"><i class="fas ${icon}"></i></span>
    <div><p class="text-[11px] uppercase tracking-wider text-muted font-bold">${label}</p>
    <p class="font-display text-2xl font-extrabold text-famr-800">${val}</p></div>
  </div>`;

/* ── SEÇÃO GENÉRICA (listagem / requerimentos / documentos / companhias / custom) ── */
async function renderSection(c, slug){
  const { data: sec } = await supabase.from('sections').select('*').eq('slug', slug).single();
  if(!sec) { c.innerHTML = '<div class="card card-body text-sm text-muted">Seção não encontrada.</div>'; return; }
  if(sec.required_group_id && !canAccessGroup(sec.required_group_id)){
    c.innerHTML = `<div class="card card-body text-center py-14"><i class="fas fa-lock text-3xl text-gold-500"></i>
      <h2 class="font-display font-bold text-xl mt-3">Acesso restrito</h2>
      <p class="text-sm text-muted mt-1">Somente membros do grupo designado podem visualizar "${esc(sec.name)}".</p></div>`;
    return;
  }

  let head = `<div class="flex flex-wrap items-center justify-between gap-3 fade-up">
    <div><p class="text-xs font-bold tracking-[0.3em] uppercase text-gold-600">Tópico oficial</p>
    <h1 class="font-display text-2xl md:text-3xl font-extrabold text-famr-900"><i class="fas ${esc(sec.icon)} text-gold-500 mr-2"></i>${esc(sec.name)}</h1>
    <p class="text-sm text-muted mt-1">${esc(sec.description||'')}</p></div><div class="star-row text-sm">★★★★</div></div>`;

  if(slug === 'listagem')      return await renderListagem(c, head);
  if(slug === 'requerimentos') return await renderRequerimentos(c, head, sec);
  if(slug === 'companhias')    return await renderCompanhias(c, head);
  if(slug === 'documentos')    return await renderDocumentos(c, head, sec);
  return await renderGenericSection(c, head, sec);
}

/* LISTAGEM: entradas oficiais + originadas de requerimentos aprovados */
async function renderListagem(c, head, offset=0, cat=null){
  let q = supabase.from('listagem_entries').select('*').order('created_at',{ascending:false}).range(offset, offset+24);
  if(cat) q = q.eq('category', cat);
  const [{ data: entries }, { data: allCats }] = await Promise.all([
    q, supabase.from('listagem_entries').select('category').limit(1000)
  ]);
  const cats = [...new Set((allCats||[]).map(e => e.category))];
  c.innerHTML = head + `
  <div class="card fade-up">
    <div class="card-head flex-wrap gap-2">
      <button class="chip ${!cat?'chip-ok':'chip-neutral'} cursor-pointer" onclick="renderListagem(document.getElementById('content'),'',0,null)">TODAS</button>
      ${cats.map(k => `<button class="chip ${cat===k?'chip-ok':'chip-neutral'} cursor-pointer" onclick="renderListagem(document.getElementById('content'),'',0,'${esc(k)}')">${esc(k).toUpperCase()}</button>`).join('')}
    </div>
    <div class="overflow-x-auto"><table class="table-famr">
      <thead><tr><th>Registro</th><th>Categoria</th><th>Detalhes</th><th>Origem</th><th>Data</th></tr></thead>
      <tbody>${(entries||[]).map(e => `<tr>
        <td class="font-bold text-famr-800">${esc(e.title)}</td>
        <td><span class="chip chip-neutral">${esc(e.category)}</span></td>
        <td class="text-xs text-muted">${Object.entries(e.data||{}).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join(' • ')}</td>
        <td class="text-xs">${e.source_request_id ? '<span class="chip chip-ok"><i class="fas fa-link"></i> requerimento</span>' : '<span class="chip chip-neutral">manual</span>'}</td>
        <td class="text-xs text-muted">${fmtDate(e.created_at)}</td></tr>`).join('')
        || '<tr><td colspan="5" class="text-center text-muted py-8">Nenhum registro publicado ainda.</td></tr>'}</tbody>
    </table></div>
    ${(entries||[]).length === 25 ? `<div class="p-3 text-center"><button class="btn btn-outline btn-sm" onclick="renderListagem(document.getElementById('content'),'',${offset+25},'${esc(cat||'')}')">Carregar mais</button></div>` : ''}
  </div>`;
}

/* REQUERIMENTOS: formulários por subtópico + meus protocolos */
async function renderRequerimentos(c, head, sec){
  const { data: subs } = await supabase.from('subtopics').select('*').eq('section_id', sec.id).order('order_index');
  const { data: mine } = await supabase.from('requests').select('*,subtopics(name)').eq('author_id', STATE.profile.id).order('created_at',{ascending:false}).limit(30);
  c.innerHTML = head + `
  <div class="grid lg:grid-cols-3 gap-6">
    <div class="space-y-4 fade-up">
      ${(subs||[]).map(s => {
        const locked = s.required_group_id && !canAccessGroup(s.required_group_id);
        return `<div class="card card-hover p-5 ${locked?'opacity-60':''}">
          <div class="flex items-center justify-between"><h3 class="font-display font-bold">${esc(s.name)}</h3>
          ${locked?'<i class="fas fa-lock lock-badge"></i>':''}</div>
          <p class="text-xs text-muted mt-1">${esc(s.description||'')}</p>
          ${locked ? '' : `<button class="btn btn-gold btn-sm mt-3" onclick='openRequestForm(${JSON.stringify(s).replace(/'/g,"&#39;")})'><i class="fas fa-pen-to-square"></i> Abrir protocolo</button>`}
        </div>`; }).join('') || '<div class="card card-body text-sm text-muted">Nenhum formulário disponível.</div>'}
    </div>
    <div class="lg:col-span-2 card fade-up">
      <div class="card-head"><h2 class="font-display font-bold text-sm"><i class="fas fa-inbox text-gold-500 mr-2"></i>Meus protocolos</h2></div>
      <div class="divide-y divide-line max-h-[560px] overflow-auto">
        ${(mine||[]).map(r => `<div class="p-4 flex items-center justify-between gap-3 hover:bg-gold-100/40 transition-colors">
          <div><p class="font-bold text-sm">${esc(r.title)}</p>
          <p class="text-[11px] text-muted mt-0.5">${esc(r.subtopics?.name||'')} • ${fmtDate(r.created_at)} ${r.review_note?`• <i>"${esc(r.review_note)}"</i>`:''}</p></div>
          ${statusChip(r.status)}</div>`).join('') || '<p class="p-8 text-center text-sm text-muted">Você ainda não abriu protocolos.</p>'}
      </div>
    </div>
  </div>`;
}

/* Formulário dinâmico (campos definidos pelo admin) */
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
  closeModal(); toast('Protocolo enviado! Aguarde a análise do CRH/RH.');
  route();
};

/* DOCUMENTOS: publicações com link (Google Drive) */
async function renderDocumentos(c, head, sec){
  const { data: subs } = await supabase.from('subtopics').select('*').eq('section_id', sec.id);
  const ids = (subs||[]).map(s => s.id);
  const { data: docs } = ids.length ? await supabase.from('posts').select('*,subtopics(name,required_group_id),profiles(nickname)').in('subtopic_id', ids).order('created_at',{ascending:false}).limit(60) : { data: [] };
  c.innerHTML = head + `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-up">
    ${(docs||[]).filter(d => canAccessGroup(d.subtopics?.required_group_id)).map(d => `
      <div class="card card-hover p-5">
        <div class="flex items-center justify-between"><span class="w-10 h-10 rounded-lg grid place-items-center bg-gold-100 text-gold-600"><i class="fas fa-file-lines"></i></span>
        <span class="chip chip-neutral">${esc(d.subtopics?.name||'')}</span></div>
        <h3 class="font-bold mt-3">${esc(d.title)}</h3>
        <p class="text-xs text-muted mt-1 line-clamp-3">${esc(d.content)}</p>
        ${d.link ? `<a href="${esc(d.link)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm mt-3"><i class="fab fa-google-drive"></i> Abrir documento</a>` : ''}
      </div>`).join('') || '<div class="card card-body text-sm text-muted sm:col-span-2 lg:col-span-3">Nenhum documento publicado.</div>'}
  </div>`;
}

/* COMPANHIAS: grupos visíveis */
async function renderCompanhias(c, head){
  const { data: groups } = await supabase.from('groups').select('*, groups(name)').eq('visible', true).order('power_level',{ascending:false});
  const { data: members } = await supabase.from('user_groups').select('group_id').limit(5000);
  const count = {}; (members||[]).forEach(m => count[m.group_id] = (count[m.group_id]||0)+1);
  c.innerHTML = head + `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-up">
    ${(groups||[]).map(g => `<div class="card card-hover overflow-hidden">
      <div class="h-2" style="background:linear-gradient(90deg,${g.color},${g.color}88)"></div>
      <div class="p-5">
        <div class="flex items-center justify-between"><h3 class="font-display font-bold" style="color:${g.color}">${esc(g.name)}</h3>
        <span class="text-gold-500 text-xs">${powerStars(g.power_level)}</span></div>
        <p class="text-xs text-muted mt-1">${g.groups ? 'Subgrupo de <b>'+esc(g.groups.name)+'</b>' : 'Companhia principal'}</p>
        <div class="flex items-center justify-between mt-4 text-xs text-muted">
          <span><i class="fas fa-users mr-1 text-famr-600"></i>${count[g.id]||0} membro(s)</span>
          <span class="chip chip-ok">VISÍVEL</span></div>
      </div></div>`).join('') || '<div class="card card-body text-sm text-muted">Nenhuma companhia visível.</div>'}
  </div>`;
}

/* SEÇÃO GENÉRICA: subtópicos + posts + publicação */
async function renderGenericSection(c, head, sec){
  const { data: subs } = await supabase.from('subtopics').select('*').eq('section_id', sec.id).order('order_index');
  const ids = (subs||[]).map(s => s.id);
  const { data: posts } = ids.length ? await supabase.from('posts').select('*,profiles(nickname)').in('subtopic_id', ids).order('created_at',{ascending:false}).limit(40) : { data: [] };
  c.innerHTML = head + `<div class="space-y-5 fade-up">` + (subs||[]).map(s => {
    const locked = s.required_group_id && !canAccessGroup(s.required_group_id);
    const list = (posts||[]).filter(p => p.subtopic_id === s.id);
    return `<div class="card">
      <div class="card-head justify-between">
        <h2 class="font-display font-bold text-sm"><i class="fas fa-folder-open text-gold-500 mr-2"></i>${esc(s.name)}
        ${locked?'<i class="fas fa-lock lock-badge ml-2"></i>':''}</h2>
        ${!locked && s.allow_posts ? `<button class="btn btn-primary btn-sm" onclick="document.getElementById('nf-${s.id}').classList.toggle('hidden')"><i class="fas fa-plus"></i> Publicar</button>` : ''}
      </div>
      ${!locked && s.allow_posts ? `<form id="nf-${s.id}" class="hidden p-4 grid gap-3 bg-famr-50 border-b border-line" onsubmit="return newPost(event,'${s.id}')">
        <input name="title" class="input" placeholder="Título da publicação" required>
        <textarea name="content" class="input" rows="3" placeholder="Conteúdo..." required></textarea>
        <input name="link" class="input" placeholder="Link (Google Drive) — opcional">
        <button class="btn btn-gold btn-sm justify-self-start"><i class="fas fa-paper-plane"></i> Publicar</button></form>` : ''}
      <div class="divide-y divide-line">
        ${locked ? '<p class="p-6 text-sm text-muted text-center"><i class="fas fa-lock mr-2"></i>Conteúdo exclusivo de grupo específico.</p>' :
          list.map(p => `<article class="p-4">
            <div class="flex justify-between gap-3"><h3 class="font-bold text-famr-800">${p.pinned?'<i class="fas fa-thumbtack text-gold-500 mr-1"></i>':''}${esc(p.title)}</h3>
            <time class="text-[11px] text-muted shrink-0">${fmtDate(p.created_at)}</time></div>
            <p class="text-sm text-muted mt-1 whitespace-pre-wrap">${esc(p.content)}</p>
            <div class="flex items-center gap-3 mt-2 text-[11px] text-muted"><i class="fas fa-user-pen text-gold-500"></i>${esc(p.profiles?.nickname||'—')}
              ${p.link?`<a class="text-famr-700 font-bold hover:underline" target="_blank" rel="noopener" href="${esc(p.link)}"><i class="fas fa-arrow-up-right-from-square"></i> anexo</a>`:''}
              ${(p.author_id===STATE.profile.id||isAdmin())?`<button class="ml-auto text-red-500 hover:underline" onclick="delPost('${p.id}')"><i class="fas fa-trash"></i></button>`:''}</div>
          </article>`).join('') || '<p class="p-6 text-sm text-muted text-center">Nenhuma publicação neste subtópico.</p>'}
      </div></div>`;
  }).join('') + `</div>`;
}
window.newPost = async function(e, subtopicId){
  e.preventDefault();
  const f = e.target;
  const { error } = await supabase.from('posts').insert([{ subtopic_id: subtopicId, title: f.title.value, content: f.content.value, link: f.link.value||null, author_id: STATE.profile.id }]);
  if(error){ toast('Erro: '+error.message,'err'); return false; }
  await supabase.rpc('log_action', { action:'POST_CRIADO', details:{ subtopicId } });
  toast('Publicação criada!'); route(); return false;
};
window.delPost = async function(id){
  if(!await confirmDlg('Excluir esta publicação?')) return;
  await supabase.from('posts').delete().eq('id', id);
  await supabase.rpc('log_action', { action:'POST_EXCLUIDO', details:{ id } });
  toast('Publicação excluída.'); route();
};

/* PERFIL */
async function renderProfile(c, param){
  const me = (!param || param === 'me');
  const id = me ? STATE.profile.id : param;
  const { data: p } = await supabase.from('profiles').select('*').eq('id', id).single();
  if(!p){ c.innerHTML = '<div class="card card-body text-sm text-muted">Perfil não encontrado.</div>'; return; }
  const { data: ug } = await supabase.from('user_groups').select('groups(*)').eq('user_id', id);
  const gs = (ug||[]).map(r => r.groups).filter(g => g && (g.visible || me || isAdmin()));
  c.innerHTML = `
  <div class="card fade-up overflow-hidden">
    <div class="h-24" style="background:linear-gradient(120deg,#0e4433,#14563f 60%,#c9a227)"></div>
    <div class="p-6 -mt-12">
      <div class="flex flex-wrap items-end gap-4">
        <span class="w-20 h-20 rounded-2xl grid place-items-center text-3xl font-extrabold text-white border-4 border-white shadow-lg" style="background:${gs[0]?.color||'#14563f'}">${esc(p.nickname.charAt(0).toUpperCase())}</span>
        <div class="flex-1"><h1 class="font-display text-2xl font-extrabold">${esc(p.nickname)}</h1>
        <p class="text-xs text-muted">No sistema desde ${fmtDate(p.created_at)} ${me?`• ${esc(p.email)}`:''}</p></div>
        <span class="chip ${p.status==='active'?'chip-ok':p.status==='pending'?'chip-wait':'chip-no'}">${p.status.toUpperCase()}</span>
      </div>
      <div class="flex flex-wrap gap-2 mt-4">${gs.map(groupChip).join('') || '<span class="chip chip-neutral">Sem grupo</span>'}</div>
    </div>
  </div>`;
}

/* BUSCA GLOBAL (dropdown fluido) */
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('global-search'), drop = document.getElementById('search-drop');
  let t;
  inp?.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const q = inp.value.trim();
      if(q.length < 2){ drop.classList.add('hidden'); return; }
      const { data } = await supabase.from('profiles').select('id,nickname').eq('status','active').eq('is_invisible', false).ilike('nickname', `%${q}%`).limit(6);
      drop.innerHTML = (data||[]).map(u => `<a href="#/perfil/${u.id}" onclick="document.getElementById('search-drop').classList.add('hidden')" class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-famr-100 transition-colors">
        <span class="w-8 h-8 rounded-full bg-famr-700 text-white grid place-items-center text-xs font-bold">${esc(u.nickname.charAt(0).toUpperCase())}</span>
        <span class="text-sm font-bold">${esc(u.nickname)}</span></a>`).join('') || '<p class="p-3 text-xs text-muted">Nenhum militar encontrado.</p>';
      drop.classList.remove('hidden');
    }, 300);
  });
  document.addEventListener('click', e => { if(!e.target.closest('#global-search')) drop?.classList.add('hidden'); });
});
