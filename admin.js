/* ══════════ FAMR • ADMIN.JS (Dashboard Completo, Senhas, IP Real) ══════════ */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = d => new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });

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

const A = { tab:'usuarios', page:0, q:'', statusFilter:'' };
const ADMIN_TABS = [['usuarios','fa-users','Usuários'],['conectados','fa-network-wired','Conectados'],['grupos','fa-layer-group','Grupos'],['topicos','fa-sitemap','Tópicos'],['protocolos','fa-inbox','Protocolos'],['logs','fa-scroll','Logs'],['config','fa-sliders','Config']];

document.addEventListener('DOMContentLoaded', async () => {
  const { data:{ session } } = await supabase.auth.getSession();
  if(!session){ location.href = 'index.html'; return; }
  
  const { data: profile } = await supabase.from('profiles_view').select('*').eq('id', session.user.id).single();
  if(!profile || profile.status !== 'active'){ location.href = 'index.html'; return; }
  
  const { data: ug } = await supabase.from('user_groups').select('group_id, groups(*)').eq('user_id', session.user.id);
  const groups = (ug||[]).map(r => r.groups).filter(Boolean);
  const isAdminUser = groups.some(g => (g.permissions||[]).includes('admin'));
  if(!isAdminUser){ location.href = 'index.html'; return; }

  drawAdminTabs(); switchTab(A.tab);
});

function drawAdminTabs(){
  const w = document.getElementById('admin-tabs'); if(!w) return;
  w.innerHTML = ADMIN_TABS.map(([k,i,l]) => `<button onclick="switchTab('${k}')" class="btn btn-sm ${A.tab===k?'btn-primary':'btn-outline'}"><i class="fas ${i}"></i> ${l}</button>`).join('');
}

window.switchTab = async function(tab){
  A.tab = tab; A.page = 0; drawAdminTabs();
  const b = document.getElementById('admin-content');
  b.innerHTML = '<div class="skeleton h-64"></div>';
  ({usuarios:tabUsuarios, conectados:tabConectados, grupos:tabGrupos, topicos:tabTopicos, protocolos:tabProtocolos, logs:tabLogs, config:tabConfig})[tab](b);
};

/* ── CONECTADOS (Real IP + Horário) ── */
async function tabConectados(b){
  const dezMinutosAtras = new Date(Date.now() - 10 * 60000).toISOString();
  const { data, error } = await supabase.from('profiles_view')
    .select('id,nickname,last_seen,current_ip')
    .gt('last_seen', dezMinutosAtras)
    .order('last_seen', {ascending:false});
  
  if(error) return b.innerHTML = `<div class="card card-body text-red-600 text-sm">Erro ao carregar conectados.</div>`;
  
  b.innerHTML = `<div class="card fade-up">
    <div class="cat-head"><i class="fas fa-network-wired"></i> Militares Conectados (Últimos 10 min) <span class="chip chip-neutral ml-2 normal-case">${(data||[]).length} online</span></div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Militar</th><th>Endereço IP (Real)</th><th>Visto por último</th></tr></thead><tbody>
    ${(data||[]).map(u => `<tr>
      <td class="font-bold text-famr-800">${esc(u.nickname)}</td>
      <td class="text-xs font-mono text-muted">${esc(u.current_ip||'IP não registrado')}</td>
      <td class="text-xs text-muted">${fmtDate(u.last_seen)}</td>
    </tr>`).join('') || '<tr><td colspan="3" class="text-center text-muted py-8">Nenhum militar online agora.</td></tr>'}
    </tbody></table></div></div>`;
}

/* ── USUÁRIOS & RESET DE SENHA ── */
async function tabUsuarios(b){
  const from = A.page*20;
  let q = supabase.from('profiles')
    .select('id,nickname,email,status,is_invisible,login_locked,failed_logins,created_at', { count:'exact' })
    .neq('nickname','admin master')
    .order('created_at',{ascending:false})
    .range(from, from+19);
  
  if(A.q) q = q.ilike('nickname', `%${A.q}%`);
  if(A.statusFilter) q = q.eq('status', A.statusFilter);
  const { data, count, error } = await q;
  if(error){ b.innerHTML = `<div class="card card-body text-red-600 text-sm">Erro: ${esc(error.message)}</div>`; return; }
  
  const totalPages = Math.ceil((count||0)/20);
  const pendingCount = (data||[]).filter(u => u.status === 'pending').length;
  
  b.innerHTML = `
  ${pendingCount > 0 ? `
  <div class="pending-alert fade-up">
    <i class="fas fa-user-clock"></i><span class="pa-text"><b>${pendingCount}</b> novo(s) militar(es) aguardando aprovação!</span>
    <button class="pa-btn" style="background:var(--green-700)" onclick="A.statusFilter='';A.page=0;switchTab('usuarios')">Ver todos</button>
  </div>` : ''}
  <div class="card fade-up">
    <div class="card-head justify-between gap-3 flex-wrap">
      <h2 class="font-display font-bold text-sm">Militares <span class="chip chip-neutral ml-2 normal-case">${count??0}</span></h2>
      <div class="flex gap-2 items-center admin-filter-bar">
        <select class="input !py-1.5 !pl-2 w-36" onchange="A.statusFilter=this.value;A.page=0;switchTab('usuarios')">
          <option value="">Todos status</option><option value="pending" ${A.statusFilter==='pending'?'selected':''}>Pendentes</option><option value="active" ${A.statusFilter==='active'?'selected':''}>Ativos</option>
        </select>
        <input class="input !py-1.5 !pl-3 w-48" placeholder="Filtrar nickname..." value="${esc(A.q)}" oninput="A.q=this.value;clearTimeout(window._t);window._t=setTimeout(()=>switchTab('usuarios'),350)">
      </div>
    </div>
    <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Nickname</th><th>Email</th><th>Status</th><th>Desde</th><th class="text-right">Ações</th></tr></thead><tbody>
    ${(data||[]).map(u => `<tr>
      <td class="font-bold">${esc(u.nickname)}</td>
      <td class="text-xs text-muted">${esc(u.email||'—')}</td>
      <td>${u.login_locked ? '<span class="chip chip-no"><i class="fas fa-lock"></i> BLOQUEADO</span>' : `<span class="chip ${u.status==='active'?'chip-ok':u.status==='pending'?'chip-wait':'chip-no'}">${u.status.toUpperCase()}</span>`}</td>
      <td class="text-xs text-muted">${fmtDate(u.created_at)}</td>
      <td class="text-right space-x-1">
        <button class="btn btn-outline btn-sm" onclick="resetUserPassword('${u.id}', '${esc(u.nickname)}')"><i class="fas fa-key"></i> Senha</button>
        ${u.login_locked ? `<button class="btn btn-gold btn-sm" onclick="unlockUser('${u.id}')"><i class="fas fa-unlock"></i></button>` : ''}
        ${u.status==='pending'?`<button class="btn btn-primary btn-sm" onclick="setUser('${u.id}','active')" title="Aprovar"><i class="fas fa-check"></i></button>`:''}
        ${u.status==='active'?`<button class="btn btn-danger btn-sm" onclick="setUser('${u.id}','banned')" title="Banir"><i class="fas fa-ban"></i></button>`:''}
        <button class="btn btn-outline btn-sm" onclick="manageGroups('${u.id}','${esc(u.nickname)}')"><i class="fas fa-layer-group"></i></button>
      </td></tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted py-8">Nenhum usuário.</td></tr>'}
    </tbody></table></div>
    <div class="p-3 flex justify-center gap-2 items-center">${A.page>0?`<button class="btn btn-outline btn-sm" onclick="A.page--;switchTab('usuarios')">← Anterior</button>`:''}
    <span class="text-xs text-muted">Pág ${A.page+1}${totalPages>1?`/${totalPages}`:''}</span>
    ${(data||[]).length===20?`<button class="btn btn-outline btn-sm" onclick="A.page++;switchTab('usuarios')">Próxima →</button>`:''}</div></div>`;
}

window.resetUserPassword = async (id, nick) => {
  const modalHTML = `
    <label class="field"><span>Nova Senha</span><input id="admin-new-pass" type="password" class="input" placeholder="Min. 6 caracteres"></label>
    <p class="text-xs text-muted mt-2 text-red-600"><i class="fas fa-circle-info"></i> Isto forçará a alteração da senha do militar.</p>
  `;
  openModal(`<i class="fas fa-key text-gold-500 mr-2"></i>Redefinir senha de ${esc(nick)}`, modalHTML, 
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="executePasswordReset('${id}', '${esc(nick)}')"><i class="fas fa-check"></i> Confirmar Alteração</button>`);
};

window.executePasswordReset = async (id, nick) => {
  const newPass = document.getElementById('admin-new-pass').value;
  if(!newPass || newPass.length < 6) return toast('A senha deve ter no mínimo 6 caracteres.', 'warn');
  closeModal();
  
  const { error } = await supabase.rpc('famr_admin_reset_password', { target_user_id: id, new_password: newPass });
  if(error) return toast('Erro ao alterar senha: ' + error.message, 'err');
  
  await supabase.rpc('log_action', { action: 'SENHA_REDEFINIDA', details: { target_user: nick, author: 'Admin' } });
  toast(`Senha de ${nick} redefinida com sucesso!`, 'ok');
};

window.setUser = async (id, status) => {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
  if(error) return toast('Erro: '+error.message,'err');
  toast('Status atualizado.'); switchTab('usuarios');
};
window.unlockUser = async (id) => {
  const { error } = await supabase.from('profiles').update({ login_locked:false, failed_logins:0 }).eq('id', id);
  if(error) return toast('Erro: '+error.message,'err');
  toast('Conta destravada.'); switchTab('usuarios');
};

window.manageGroups = async (userId, nick) => {
  const [{ data: all }, { data: mine }] = await Promise.all([
    supabase.from('groups').select('id,name,color,icon').order('order_index'),
    supabase.from('user_groups').select('group_id').eq('user_id', userId)]);
  const has = new Set((mine||[]).map(m => m.group_id));
  openModal(`<i class="fas fa-layer-group text-gold-500 mr-2"></i>Grupos de ${esc(nick)}`,
    (all||[]).map(g => `<label class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-famr-50 cursor-pointer">
      <input type="checkbox" value="${g.id}" ${has.has(g.id)?'checked':''} class="accent-[#14563f] w-4 h-4">
      <i class="fas ${g.icon||'fa-shield-halved'}" style="color:${g.color}"></i><span class="text-sm font-bold">${esc(g.name)}</span></label>`).join(''),
    `<button class="btn btn-outline btn-sm" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary btn-sm" onclick="saveGroups('${userId}')"><i class="fas fa-floppy-disk"></i> Salvar</button>`);
};
window.saveGroups = async userId => {
  const ids = [...document.querySelectorAll('#modal-body input:checked')].map(i => i.value);
  await supabase.from('user_groups').delete().eq('user_id', userId);
  if(ids.length) await supabase.from('user_groups').insert(ids.map(g => ({ user_id: userId, group_id: g })));
  closeModal(); toast('Grupos atualizados.');
};

/* ── OUTRAS ABAS ── */
async function tabGrupos(b){ b.innerHTML = '<div class="card card-body text-muted text-sm">Gerencie os grupos e permissões através do Supabase.</div>'; }
async function tabTopicos(b){ b.innerHTML = '<div class="card card-body text-muted text-sm">Controle as visualizações editando a coluna "required_group_id" nas tabelas "sections" e "subtopics" do seu banco de dados. Tópicos liberados aparecerão automaticamente na Home e no Menu.</div>'; }
async function tabProtocolos(b){ b.innerHTML = '<div class="card card-body text-muted text-sm">Protocolos em análise (Em breve).</div>'; }
async function tabLogs(b){
  const from = A.page*30;
  const { data } = await supabase.from('logs').select('*').order('created_at',{ascending:false}).range(from, from+29);
  b.innerHTML = `<div class="card fade-up"><div class="cat-head"><i class="fas fa-scroll"></i> Logs de Ações Oficiais</div>
  <div class="overflow-x-auto"><table class="table-famr"><thead><tr><th>Data</th><th>Ação</th><th>Autor</th><th>Detalhes</th><th>IP</th></tr></thead><tbody>
  ${(data||[]).map(l => `<tr><td class="text-xs text-muted whitespace-nowrap">${fmtDate(l.created_at)}</td>
    <td><span class="chip chip-wait">${esc(l.action)}</span></td>
    <td class="text-xs font-bold">${esc(l.actor_name||'sistema')}</td>
    <td class="text-[11px] text-muted max-w-md truncate" title="${esc(JSON.stringify(l.details))}">${esc(JSON.stringify(l.details))}</td>
    <td class="text-[11px] text-muted font-mono">${esc(l.ip||'')}</td></tr>`).join('')}
  </tbody></table></div></div>`;
}
async function tabConfig(b){ b.innerHTML = '<div class="card card-body text-muted text-sm">Configurações globais do sistema.</div>'; }
