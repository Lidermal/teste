/* ══════════ FAMR • PAINEL ADMINISTRATIVO (usuários, grupos, tópicos, protocolos, logs, config) ══════════ */

const A = { tab:'usuarios', page:0, q:'' };

async function renderAdmin(c){
  if(!isAdmin()){ c.innerHTML = `<div class="card card-body text-center py-16"><i class="fas fa-lock text-3xl text-red-500"></i><h2 class="font-display font-bold text-xl mt-3">Acesso negado</h2></div>`; return; }
  const tabs = [['usuarios','fa-users','Usuários'],['grupos','fa-layer-group','Grupos & Hierarquia'],['topicos','fa-sitemap','Tópicos'],['protocolos','fa-inbox','Protocolos'],['logs','fa-scroll','Logs'],['config','fa-sliders','Configurações']];
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

/* ── USUÁRIOS ── */
async function tabUsuarios(b){
  const from = A.page*20;
  let q = supabase.from('profiles').select('*').order('created_at',{ascending:false}).range(from, from+19);
  if(A.q) q = q.ilike('nickname', `%${A.q}%`);
  const { data } = await q;
  b.innerHTML = `<div class="card fade-up">
    <div class="card-head justify-between gap-3 flex-wrap">
      <h2 class="font-display font-bold text-sm">Militares cadastrados</h2>
      <input class="input !py-1.5 !pl-3 w-56" placeholder="Filtrar nickname..." value="${esc(A.q)}" oninput="A.q=this.value;clearTimeout(window._t);window._t=setTimeout(()=>tabUsuarios(document.getElementById('admin-body')),350)">
    </div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Nickname</th><th>Status</th><th>Invisível</th><th>Desde</th><th class="text-right">Ações</th></tr></thead><tbody>
    ${(data||[]).map(u => `<tr>
      <td class="font-bold">${esc(u.nickname)}${CONFIG.masters.some(m=>m.email===u.email)?' <span class="chip chip-wait">MESTRE</span>':''}</td>
      <td><span class="chip ${u.status==='active'?'chip-ok':u.status==='pending'?'chip-wait':'chip-no'}">${u.status.toUpperCase()}</span></td>
      <td>${u.is_invisible?'<i class="fas fa-eye-slash text-gold-500"></i>':'<i class="fas fa-eye text-muted/40"></i>'}</td>
      <td class="text-xs text-muted">${fmtDate(u.created_at)}</td>
      <td class="text-right space-x-1">
        ${u.status!=='active'?`<button class="btn btn-primary btn-sm" onclick=" setUser('${u.id}','active')"><i class="fas fa-check"></i> Ativar</button>`:''}
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
  await supabase.rpc('log_action', { action:'USER_STATUS', details:{ id, status } });
  toast('Status atualizado.'); tabUsuarios(document.getElementById('admin-body'));
};
window.toggleInvisible = async (id, v) => {
  await supabase.from('profiles').update({ is_invisible: v }).eq('id', id);
  await supabase.rpc('log_action', { action:'USER_INVISIBLE', details:{ id, v } });
  tabUsuarios(document.getElementById('admin-body'));
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
  await supabase.rpc('log_action', { action:'USER_GROUPS', details:{ userId, ids } });
  closeModal(); toast('Grupos atualizados.');
};

/* ── GRUPOS ── */
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
      <label class="field"><span>Cor no sistema</span><input id="g-color" type="color" class="input !p-1 h-11" value="${g.color}"></label>
      <label class="field"><span>Nível de poder (0-100)</span><input id="g-power" type="number" min="0" max="100" class="input" value="${g.power_level}"></label>
    </div>
    <label class="field"><span>Subgrupo de (opcional)</span><select id="g-parent" class="input"><option value="">— nenhum —</option>
      ${(all||[]).map(p => `<option value="${p.id}" ${g.parent_id===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
    <label class="flex items-center gap-3 text-sm font-bold"><input id="g-visible" type="checkbox" class="w-4 h-4 accent-[#14563f]" ${g.visible?'checked':''}> Grupo visível no sistema</label>
    <div><span class="text-xs font-bold uppercase tracking-wider text-muted">Permissões</span>
      <div class="grid grid-cols-3 gap-2 mt-2">${['admin','master','review'].map(p => `<label class="chip chip-neutral cursor-pointer"><input type="checkbox" class="g-perm mr-1 accent-[#14563f]" value="${p}" ${(g.permissions||[]).includes(p)?'checked':''}>${p}</label>`).join('')}</div></div>`,
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="saveGroup('${id||''}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveGroup = async id => {
  const row = {
    name: document.getElementById('g-name').value.trim(),
    color: document.getElementById('g-color').value,
    power_level: +document.getElementById('g-power').value || 0,
    parent_id: document.getElementById('g-parent').value || null,
    visible: document.getElementById('g-visible').checked,
    permissions: [...document.querySelectorAll('.g-perm:checked')].map(i => i.value)
  };
  if(!row.name) return toast('Informe o nome.','warn');
  const q = id ? supabase.from('groups').update(row).eq('id', id) : supabase.from('groups').insert([row]);
  const { error } = await q;
  if(error) return toast('Erro: '+error.message,'err');
  await supabase.rpc('log_action', { action:'GROUP_SAVE', details: row });
  closeModal(); toast('Grupo salvo.'); buildSidebar(); tabGrupos(document.getElementById('admin-body'));
};
window.delGroup = async id => {
  if(!await confirmDlg('Excluir grupo? Membros perdem o acesso aos tópicos dele.')) return;
  await supabase.from('groups').delete().eq('id', id);
  await supabase.rpc('log_action', { action:'GROUP_DEL', details:{ id } });
  tabGrupos(document.getElementById('admin-body'));
};

/* ── TÓPICOS / SUBTÓPICOS ── */
async function tabTopicos(b){
  const [{ data: secs }, { data: subs }, { data: groups }] = await Promise.all([
    supabase.from('sections').select('*').order('order_index'),
    supabase.from('subtopics').select('*,groups(name)').order('order_index'),
    supabase.from('groups').select('id,name')]);
  window._groupsCache = groups || [];
  b.innerHTML = `<div class="space-y-4 fade-up">
    <div class="flex justify-end"><button class="btn btn-gold btn-sm" onclick="sectionForm()"><i class="fas fa-plus"></i> Novo tópico (seção)</button></div>
    ${(secs||[]).map(s => `<div class="card">
      <div class="card-head justify-between"><h2 class="font-display font-bold text-sm"><i class="fas ${esc(s.icon)} text-gold-500 mr-2"></i>${esc(s.name)} <span class="chip chip-neutral ml-2">/${esc(s.slug)}</span></h2>
      <div class="space-x-1"><button class="btn btn-outline btn-sm" onclick="subtopicForm('${s.id}')"><i class="fas fa-plus"></i> Subtópico</button>
      <button class="btn btn-danger btn-sm" onclick="delSection('${s.id}')"><i class="fas fa-trash"></i></button></div></div>
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
window.sectionForm = () => openModal('<i class="fas fa-sitemap text-gold-500 mr-2"></i>Novo tópico', `
  <label class="field"><span>Nome</span><input id="s-name" class="input" placeholder="Ex: Condecorações"></label>
  <label class="field"><span>Slug (url)</span><input id="s-slug" class="input" placeholder="condecoracoes"></label>
  <label class="field"><span>Ícone (FontAwesome)</span><input id="s-icon" class="input" value="fa-folder-open"></label>
  <label class="field"><span>Descrição</span><textarea id="s-desc" class="input" rows="2"></textarea></label>
  <label class="field"><span>Restrito ao grupo (opcional)</span><select id="s-group" class="input"><option value="">— todos —</option>${(window._groupsCache||[]).map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select></label>`,
  `<button class="btn btn-primary btn-sm" onclick="saveSection()"><i class="fas fa-floppy-disk"></i> Criar</button>`);
window.saveSection = async () => {
  const { count } = await supabase.from('sections').select('*', { count:'exact', head:true });
  const { error } = await supabase.from('sections').insert([{
    name: document.getElementById('s-name').value.trim(), slug: document.getElementById('s-slug').value.trim().toLowerCase().replace(/\s+/g,'-'),
    icon: document.getElementById('s-icon').value.trim() || 'fa-folder-open', description: document.getElementById('s-desc').value,
    required_group_id: document.getElementById('s-group').value || null, order_index: (count||0)+1 }]);
  if(error) return toast('Erro: '+error.message,'err');
  await supabase.rpc('log_action', { action:'SECTION_CRIADA', details:{} });
  closeModal(); toast('Tópico criado.'); buildSidebar(); tabTopicos(document.getElementById('admin-body'));
};
window.delSection = async id => { if(await confirmDlg('Excluir seção e todos os subtópicos?')) { await supabase.from('sections').delete().eq('id', id); buildSidebar(); tabTopicos(document.getElementById('admin-body')); } };
window.delSubtopic = async id => { if(await confirmDlg('Excluir subtópico?')) { await supabase.from('subtopics').delete().eq('id', id); tabTopicos(document.getElementById('admin-body')); } };
window.subtopicForm = sid => openModal('<i class="fas fa-folder-plus text-gold-500 mr-2"></i>Novo subtópico', `
  <label class="field"><span>Nome</span><input id="t-name" class="input"></label>
  <label class="field"><span>Descrição</span><textarea id="t-desc" class="input" rows="2"></textarea></label>
  <label class="field"><span>Restrito ao grupo</span><select id="t-group" class="input"><option value="">— todos —</option>${(window._groupsCache||[]).map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select></label>
  <label class="flex items-center gap-2 text-sm font-bold"><input id="t-posts" type="checkbox" checked class="w-4 h-4 accent-[#14563f]"> Permite publicações</label>
  <label class="flex items-center gap-2 text-sm font-bold"><input id="t-form" type="checkbox" class="w-4 h-4 accent-[#14563f]"> É formulário de requerimento</label>
  <label class="field"><span>Campos do formulário (um por linha: Nome:tipo → text|textarea|number)</span><textarea id="t-fields" class="input" rows="3" placeholder="Nome da Tag:text&#10;Descrição:textarea"></textarea></label>
  <label class="field"><span>Ao aprovar, publicar na listagem como categoria (opcional)</span><input id="t-cat" class="input" placeholder="ex: tags"></label>
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

/* ── PROTOCOLOS (revisão CRH/RH → alimenta a Listagem automaticamente) ── */
async function tabProtocolos(b){
  const { data } = await supabase.from('requests').select('*,profiles(nickname),subtopics(name,auto_listagem_category)').eq('status','pending').order('created_at');
  b.innerHTML = `<div class="card fade-up"><div class="card-head"><h2 class="font-display font-bold text-sm">Pendentes de análise (${(data||[]).length})</h2></div>
  <div class="divide-y divide-line">${(data||[]).map(r => `<div class="p-4">
    <div class="flex flex-wrap items-center gap-3 justify-between">
      <div><b class="text-sm">${esc(r.title)}</b> <span class="chip chip-neutral ml-1">${esc(r.subtopics?.name||'')}</span>
      ${r.subtopics?.auto_listagem_category?`<span class="chip chip-ok">→ vira "${esc(r.subtopics.auto_listagem_category)}" na Listagem</span>`:''}
      <p class="text-[11px] text-muted mt-1">${esc(r.profiles?.nickname||'')} • ${fmtDate(r.created_at)}</p></div>
      <div class="space-x-1"><button class="btn btn-primary btn-sm" onclick="review('${r.id}','approved')"><i class="fas fa-check"></i> Aprovar</button>
      <button class="btn btn-danger btn-sm" onclick="review('${r.id}','rejected')"><i class="fas fa-xmark"></i> Reprovar</button></div></div>
    <div class="mt-3 grid sm:grid-cols-2 gap-2 text-xs bg-famr-50 rounded-lg p-3">${Object.entries(r.form_data||{}).map(([k,v])=>`<p><b class="text-famr-700">${esc(k)}:</b> ${esc(v)}</p>`).join('')}</div>
  </div>`).join('') || '<p class="p-8 text-center text-sm text-muted">Nenhum protocolo pendente. ✦</p>'}</div></div>`;
}
window.review = async (id, status) => {
  const note = status==='rejected' ? (prompt('Motivo da reprovação (opcional):') || '') : '';
  const { error } = await supabase.rpc('review_request', { req_id: id, new_status: status, note });
  if(error) return toast('Erro: '+error.message,'err');
  toast(status==='approved' ? 'Aprovado! Registro publicado na Listagem automaticamente.' : 'Protocolo reprovado.');
  tabProtocolos(document.getElementById('admin-body'));
};

/* ── LOGS (ações + logins) ── */
async function tabLogs(b){
  const from = A.page*30;
  const { data } = await supabase.from('logs').select('*').order('created_at',{ascending:false}).range(from, from+29);
  b.innerHTML = `<div class="card fade-up"><div class="card-head"><h2 class="font-display font-bold text-sm"><i class="fas fa-scroll text-gold-500 mr-2"></i>Logs de ações e logins</h2></div>
  <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Data</th><th>Ação</th><th>Autor</th><th>Detalhes</th></tr></thead><tbody>
  ${(data||[]).map(l => `<tr><td class="text-xs text-muted whitespace-nowrap">${fmtDate(l.created_at)}</td>
    <td><span class="chip ${l.action==='LOGIN'?'chip-ok':l.action.includes('DEL')||l.action.includes('BAN')?'chip-no':'chip-wait'}">${esc(l.action)}</span></td>
    <td class="text-xs font-bold">${esc(l.actor_name||'sistema')}</td>
    <td class="text-[11px] text-muted max-w-md truncate">${esc(JSON.stringify(l.details))}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="p-3 flex justify-center gap-2">${A.page>0?`<button class="btn btn-outline btn-sm" onclick="A.page--;tabLogs(document.getElementById('admin-body'))">←</button>`:''}
  ${(data||[]).length===30?`<button class="btn btn-outline btn-sm" onclick="A.page++;tabLogs(document.getElementById('admin-body'))">→</button>`:''}</div></div>`;
}

/* ── CONFIGURAÇÕES (manutenção + aviso) ── */
async function tabConfig(b){
  const m = STATE.settings.maintenance || { enabled:false, message:'' };
  const a = STATE.settings.announcement || { text:'' };
  b.innerHTML = `<div class="grid md:grid-cols-2 gap-4 fade-up">
    <div class="card"><div class="card-head"><h2 class="font-display font-bold text-sm"><i class="fas fa-screwdriver-wrench text-gold-500 mr-2"></i>Modo manutenção</h2></div>
      <div class="card-body space-y-3">
        <label class="flex items-center gap-3 text-sm font-bold"><input id="c-maint" type="checkbox" class="w-5 h-5 accent-[#c9a227]" ${m.enabled?'checked':''}> Sistema em manutenção (bloqueia não-admins)</label>
        <label class="field"><span>Mensagem exibida</span><input id="c-maint-msg" class="input" value="${esc(m.message||'')}"></label>
        <button class="btn btn-primary btn-sm" onclick="saveMaint()"><i class="fas fa-floppy-disk"></i> Salvar</button></div></div>
    <div class="card"><div class="card-head"><h2 class="font-display font-bold text-sm"><i class="fas fa-bullhorn text-gold-500 mr-2"></i>Aviso do comando (home)</h2></div>
      <div class="card-body space-y-3">
        <textarea id="c-ann" class="input" rows="4">${esc(a.text||'')}</textarea>
        <button class="btn btn-gold btn-sm" onclick="saveAnn()"><i class="fas fa-floppy-disk"></i> Publicar aviso</button></div></div>
  </div>`;
}
window.saveMaint = async () => {
  const value = { enabled: document.getElementById('c-maint').checked, message: document.getElementById('c-maint-msg').value };
  await supabase.from('settings').upsert({ key:'maintenance', value });
  STATE.settings.maintenance = value;
  await supabase.rpc('log_action', { action:'MANUTENCAO', details: value });
  toast('Configuração salva.'); document.getElementById('maintenance-banner').classList.toggle('hidden', !value.enabled);
};
window.saveAnn = async () => {
  const value = { text: document.getElementById('c-ann').value };
  await supabase.from('settings').upsert({ key:'announcement', value });
  STATE.settings.announcement = value;
  await supabase.rpc('log_action', { action:'AVISO', details: value });
  toast('Aviso publicado na home.');
};
