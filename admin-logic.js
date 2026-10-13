// ============================================================
// admin-logic.js - Painel Administrativo FAMR
// ============================================================

let adminTab = 'usuarios';
let adminUsersPage = 0;
let adminLogsPage = 0;
const PAGE_SIZE = 20;

// ---- Inicializar Admin ----
async function initAdmin() {
  await window.initProtectedPage('admin');
  if (!window.requireAdmin()) return;

  renderAdminTabs();
  loadAdminTab('usuarios');
}

// ---- Renderizar abas ----
function renderAdminTabs() {
  const tabs = [
    { id: 'dashboard', label: '📊 Visão Geral' },
    { id: 'usuarios', label: '👥 Usuários' },
    { id: 'grupos', label: '🏷️ Grupos' },
    { id: 'subgrupos', label: '🔹 Subgrupos' },
    { id: 'topicos', label: '📌 Tópicos' },
    { id: 'requerimentos', label: '📝 Requerimentos' },
    { id: 'logs-acoes', label: '📋 Logs de Ações' },
    { id: 'logs-login', label: '🔑 Logs de Login' },
    { id: 'config', label: '⚙️ Configurações' },
  ];

  const tabBar = document.getElementById('adminTabBar');
  if (tabBar) {
    tabBar.innerHTML = tabs.map(t =>
      `<button class="admin-tab ${adminTab === t.id ? 'active' : ''}" onclick="loadAdminTab('${t.id}')">${t.label}</button>`
    ).join('');
  }
}

// ---- Carregar aba ----
async function loadAdminTab(tab) {
  adminTab = tab;
  renderAdminTabs();
  const content = document.getElementById('adminContent');
  if (!content) return;
  content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Carregando...</p></div>';

  switch (tab) {
    case 'dashboard': await renderAdminDashboard(content); break;
    case 'usuarios': await renderAdminUsuarios(content); break;
    case 'grupos': await renderAdminGrupos(content); break;
    case 'subgrupos': await renderAdminSubgrupos(content); break;
    case 'topicos': await renderAdminTopicos(content); break;
    case 'requerimentos': await renderAdminRequerimentos(content); break;
    case 'logs-acoes': await renderAdminLogsAcoes(content); break;
    case 'logs-login': await renderAdminLogsLogin(content); break;
    case 'config': await renderAdminConfig(content); break;
  }
}

// ---- Dashboard Admin ----
async function renderAdminDashboard(el) {
  const [{ count: totalUsers }, { count: pendingUsers }, { count: totalGroups }, { count: pendingReqs }] = await Promise.all([
    window.sb.from('profiles').select('*', { count: 'exact', head: true }),
    window.sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
    window.sb.from('groups').select('*', { count: 'exact', head: true }),
    window.sb.from('requirements').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
  ]);

  el.innerHTML = `
    <div class="admin-stats-grid">
      <div class="stat-card"><div class="stat-number">${totalUsers || 0}</div><div class="stat-label">Total de Militares</div></div>
      <div class="stat-card stat-warning"><div class="stat-number">${pendingUsers || 0}</div><div class="stat-label">Pendentes de Ativação</div></div>
      <div class="stat-card"><div class="stat-number">${totalGroups || 0}</div><div class="stat-label">Grupos</div></div>
      <div class="stat-card stat-info"><div class="stat-number">${pendingReqs || 0}</div><div class="stat-label">Requerimentos Pendentes</div></div>
    </div>
    <div class="admin-section">
      <h3>Últimas Ações</h3>
      <div id="recentActions"></div>
    </div>`;

  const { data: logs } = await window.sb
    .from('action_logs')
    .select('*, profiles(nickname)')
    .order('created_at', { ascending: false })
    .limit(10);

  const recentEl = document.getElementById('recentActions');
  if (recentEl && logs) {
    recentEl.innerHTML = logs.length === 0
      ? '<p class="text-muted">Nenhuma ação registrada.</p>'
      : `<table class="admin-table"><thead><tr><th>Data</th><th>Usuário</th><th>Ação</th><th>Detalhes</th></tr></thead><tbody>
        ${logs.map(l => `<tr><td>${window.formatDate(l.created_at)}</td><td>${l.profiles?.nickname || 'N/A'}</td><td><code>${l.action}</code></td><td>${JSON.stringify(l.details).substring(0, 80)}</td></tr>`).join('')}
      </tbody></table>`;
  }
}

// ---- Usuários ----
async function renderAdminUsuarios(el) {
  const { data: users, count } = await window.sb
    .from('profiles')
    .select('*, groups(name,color), subgroups(name)')
    .order('created_at', { ascending: false })
    .range(adminUsersPage * PAGE_SIZE, (adminUsersPage + 1) * PAGE_SIZE - 1);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const profile = window.currentProfile();
  const isMaster = profile.role === 'master';

  el.innerHTML = `
    <div class="admin-section">
      <div class="admin-section-header">
        <h3>Gerenciamento de Usuários <small>(${count || 0} total)</small></h3>
        <input type="text" id="userSearchInput" placeholder="Buscar por nickname..." class="admin-search-input">
      </div>
      <div class="table-responsive">
        <table class="admin-table" id="usersTable">
          <thead>
            <tr>
              <th>Nickname</th>
              <th>Email</th>
              <th>Role</th>
              <th>Grupo</th>
              <th>Status</th>
              <th>Último Login</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${(users || []).map(u => `
              <tr data-uid="${u.id}" class="${u.is_invisible && !isMaster ? 'hidden-row' : ''}">
                <td><strong>${window.escapeHtml(u.nickname)}</strong>${u.is_invisible ? ' 🔒' : ''}</td>
                <td>${u.email}</td>
                <td><span class="role-badge role-${u.role}">${u.role}</span></td>
                <td>${u.groups ? `<span style="color:${u.groups.color}">${u.groups.name}</span>` : '-'}</td>
                <td>
                  ${u.is_banned ? '<span class="status-badge status-banned">BANIDO</span>' :
                    u.is_active ? '<span class="status-badge status-active">ATIVO</span>' :
                    '<span class="status-badge status-pending">PENDENTE</span>'}
                </td>
                <td>${u.last_login ? window.formatDate(u.last_login) : 'Nunca'}</td>
                <td class="actions-cell">
                  ${!u.is_active && !u.is_banned ? `<button class="btn btn-sm btn-success" onclick="adminApproveUser('${u.id}')">✓ Ativar</button>` : ''}
                  ${u.is_active && !u.is_banned ? `<button class="btn btn-sm btn-warning" onclick="adminDeactivateUser('${u.id}')">⏸ Desativar</button>` : ''}
                  ${!u.is_banned ? `<button class="btn btn-sm btn-danger" onclick="adminBanUser('${u.id}')">🚫 Banir</button>` :
                    `<button class="btn btn-sm btn-outline" onclick="adminUnbanUser('${u.id}')">↩ Desbanir</button>`}
                  <select onchange="adminChangeRole('${u.id}', this.value)" class="btn-sm-select">
                    <option value="">Role...</option>
                    ${['militar','oficial','crh','admin'].map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                    ${isMaster ? `<option value="master" ${u.role === 'master' ? 'selected' : ''}>master</option>` : ''}
                  </select>
                  <select onchange="adminChangeGroup('${u.id}', this.value)" class="btn-sm-select">
                    <option value="">Grupo...</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button class="btn btn-sm" onclick="adminUsersPage=Math.max(0,adminUsersPage-1);loadAdminTab('usuarios')" ${adminUsersPage === 0 ? 'disabled' : ''}>← Anterior</button>
        <span>Página ${adminUsersPage + 1} de ${totalPages || 1}</span>
        <button class="btn btn-sm" onclick="adminUsersPage++;loadAdminTab('usuarios')" ${adminUsersPage >= totalPages - 1 ? 'disabled' : ''}>Próxima →</button>
      </div>
    </div>`;

  // Carregar grupos para os selects
  const { data: groups } = await window.sb.from('groups').select('id,name').order('hierarchy_level', { ascending: false });
  document.querySelectorAll('.btn-sm-select').forEach(sel => {
    if (sel.options.length <= 1 && groups) {
      groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        sel.appendChild(opt);
      });
    }
  });

  // Search
  const searchInput = document.getElementById('userSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#usersTable tbody tr').forEach(row => {
        const nick = row.cells[0]?.textContent?.toLowerCase() || '';
        row.style.display = nick.includes(q) ? '' : 'none';
      });
    });
  }
}

async function adminApproveUser(userId) {
  if (!confirm('Ativar este usuário?')) return;
  const { error } = await window.sb.from('profiles').update({ is_active: true }).eq('id', userId);
  if (error) return window.showToast('Erro: ' + error.message, 'error');
  await logAction('USER_APPROVED', 'profile', userId);
  window.showToast('Usuário ativado com sucesso!');
  loadAdminTab('usuarios');
}

async function adminDeactivateUser(userId) {
  if (!confirm('Desativar este usuário?')) return;
  const { error } = await window.sb.from('profiles').update({ is_active: false }).eq('id', userId);
  if (error) return window.showToast('Erro: ' + error.message, 'error');
  await logAction('USER_DEACTIVATED', 'profile', userId);
  window.showToast('Usuário desativado.');
  loadAdminTab('usuarios');
}

async function adminBanUser(userId) {
  const reason = prompt('Motivo do banimento:');
  if (reason === null) return;
  const { error } = await window.sb.from('profiles').update({ is_banned: true, ban_reason: reason || 'Não informado' }).eq('id', userId);
  if (error) return window.showToast('Erro: ' + error.message, 'error');
  await logAction('USER_BANNED', 'profile', userId, { reason });
  window.showToast('Usuário banido.');
  loadAdminTab('usuarios');
}

async function adminUnbanUser(userId) {
  if (!confirm('Desbanir este usuário?')) return;
  const { error } = await window.sb.from('profiles').update({ is_banned: false, ban_reason: '' }).eq('id', userId);
  if (error) return window.showToast('Erro: ' + error.message, 'error');
  await logAction('USER_UNBANNED', 'profile', userId);
  window.showToast('Usuário desbanido.');
  loadAdminTab('usuarios');
}

async function adminChangeRole(userId, newRole) {
  if (!newRole) return;
  const { error } = await window.sb.from('profiles').update({ role: newRole }).eq('id', userId);
  if (error) return window.showToast('Erro: ' + error.message, 'error');
  await logAction('ROLE_CHANGED', 'profile', userId, { new_role: newRole });
  window.showToast('Role alterada para ' + newRole);
}

async function adminChangeGroup(userId, groupId) {
  if (!groupId) return;
  const { error } = await window.sb.from('profiles').update({ group_id: groupId }).eq('id', userId);
  if (error) return window.showToast('Erro: ' + error.message, 'error');
  await logAction('GROUP_CHANGED', 'profile', userId, { group_id: groupId });
  window.showToast('Grupo alterado.');
}

// ---- Grupos ----
async function renderAdminGrupos(el) {
  const { data: groups } = await window.sb.from('groups').select('*').order('hierarchy_level', { ascending: false });

  el.innerHTML = `
    <div class="admin-section">
      <div class="admin-section-header">
        <h3>Gerenciamento de Grupos</h3>
        <button class="btn btn-primary" onclick="showGroupModal()">+ Novo Grupo</button>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead><tr><th>Nome</th><th>Cor</th><th>Hierarquia</th><th>Visível</th><th>Descrição</th><th>Ações</th></tr></thead>
          <tbody>
            ${(groups || []).map(g => `
              <tr>
                <td><strong>${window.escapeHtml(g.name)}</strong></td>
                <td><span class="color-dot" style="background:${g.color}"></span> ${g.color}</td>
                <td>${g.hierarchy_level}</td>
                <td>${g.is_visible ? '✅ Sim' : '🚫 Não'}</td>
                <td>${window.escapeHtml(g.description || '').substring(0, 60)}</td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick="showGroupModal('${g.id}')">✏️ Editar</button>
                  <button class="btn btn-sm btn-danger" onclick="adminDeleteGroup('${g.id}')">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div id="groupModalContainer"></div>`;
}

function showGroupModal(groupId = null) {
  const container = document.getElementById('groupModalContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)this.parentElement.remove()">
      <div class="modal-box">
        <h3>${groupId ? 'Editar Grupo' : 'Novo Grupo'}</h3>
        <form id="groupForm" onsubmit="saveGroup(event, '${groupId || ''}')">
          <label>Nome <input type="text" name="name" required class="form-input" id="gName"></label>
          <label>Descrição <textarea name="description" class="form-input" id="gDesc"></textarea></label>
          <label>Cor <input type="color" name="color" value="#2E7D32" class="form-color" id="gColor"></label>
          <label>Hierarquia (0-100) <input type="number" name="hierarchy_level" min="0" max="100" value="50" class="form-input" id="gHier"></label>
          <label class="checkbox-label"><input type="checkbox" name="is_visible" checked id="gVisible"> Visível no sistema</label>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">Salvar</button>
            <button type="button" class="btn btn-outline" onclick="document.querySelector('.modal-overlay').remove()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>`;

  if (groupId) {
    window.sb.from('groups').select('*').eq('id', groupId).single().then(({ data }) => {
      if (data) {
        document.getElementById('gName').value = data.name;
        document.getElementById('gDesc').value = data.description || '';
        document.getElementById('gColor').value = data.color;
        document.getElementById('gHier').value = data.hierarchy_level;
        document.getElementById('gVisible').checked = data.is_visible;
      }
    });
  }
}

async function saveGroup(e, groupId) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    name: form.name.value,
    description: form.description.value,
    color: form.color.value,
    hierarchy_level: parseInt(form.hierarchy_level.value),
    is_visible: form.is_visible.checked
  };

  let error;
  if (groupId) {
    ({ error } = await window.sb.from('groups').update(payload).eq('id', groupId));
    await logAction('GROUP_UPDATED', 'group', groupId, payload);
  } else {
    ({ error } = await window.sb.from('groups').insert(payload));
    await logAction('GROUP_CREATED', 'group', '', payload);
  }

  if (error) return window.showToast('Erro: ' + error.message, 'error');
  window.showToast(groupId ? 'Grupo atualizado!' : 'Grupo criado!');
  document.querySelector('.modal-overlay')?.remove();
  loadAdminTab('grupos');
}

async function adminDeleteGroup(groupId) {
  if (!confirm('Excluir este grupo? Esta ação é irreversível.')) return;
  const { error } = await window.sb.from('groups').delete().eq('id', groupId);
  if (error) return window.showToast('Erro: ' + error.message, 'error');
  await logAction('GROUP_DELETED', 'group', groupId);
  window.showToast('Grupo excluído.');
  loadAdminTab('grupos');
}

// ---- Subgrupos ----
async function renderAdminSubgrupos(el) {
  const [{ data: subgroups }, { data: groups }] = await Promise.all([
    window.sb.from('subgroups').select('*, groups(name)').order('hierarchy_level', { ascending: false }),
    window.sb.from('groups').select('id,name').order('hierarchy_level', { ascending: false })
  ]);

  el.innerHTML = `
    <div class="admin-section">
      <div class="admin-section-header">
        <h3>Gerenciamento de Subgrupos</h3>
        <button class="btn btn-primary" onclick="showSubgroupModal()">+ Novo Subgrupo</button>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead><tr><th>Nome</th><th>Grupo Pai</th><th>Cor</th><th>Hierarquia</th><th>Visível</th><th>Ações</th></tr></thead>
          <tbody>
            ${(subgroups || []).map(s => `
              <tr>
                <td><strong>${window.escapeHtml(s.name)}</strong></td>
                <td>${s.groups?.name || '-'}</td>
                <td><span class="color-dot" style="background:${s.color}"></span> ${s.color}</td>
                <td>${s.hierarchy_level}</td>
                <td>${s.is_visible ? '✅' : '🚫'}</td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick="showSubgroupModal('${s.id}')">✏️</button>
                  <button class="btn btn-sm btn-danger" onclick="adminDeleteSubgroup('${s.id}')">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div id="subgroupModalContainer"></div>`;

  window._adminGroups = groups;
}

function showSubgroupModal(sgId = null) {
  const container = document.getElementById('subgroupModalContainer');
  if (!container) return;
  const groups = window._adminGroups || [];

  container.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)this.parentElement.remove()">
      <div class="modal-box">
        <h3>${sgId ? 'Editar Subgrupo' : 'Novo Subgrupo'}</h3>
        <form onsubmit="saveSubgroup(event, '${sgId || ''}')">
          <label>Grupo Pai
            <select name="group_id" required class="form-input" id="sgGroup">
              <option value="">Selecione...</option>
              ${groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
            </select>
          </label>
          <label>Nome <input type="text" name="name" required class="form-input" id="sgName"></label>
          <label>Descrição <textarea name="description" class="form-input" id="sgDesc"></textarea></label>
          <label>Cor <input type="color" name="color" value="#43A047" class="form-color" id="sgColor"></label>
          <label>Hierarquia <input type="number" name="hierarchy_level" min="0" max="100" value="40" class="form-input" id="sgHier"></label>
          <label class="checkbox-label"><input type="checkbox" name="is_visible" checked id="sgVisible"> Visível</label>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">Salvar</button>
            <button type="button" class="btn btn-outline" onclick="document.querySelector('.modal-overlay').remove()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>`;

  if (sgId) {
    window.sb.from('subgroups').select('*').eq('id', sgId).single().then(({ data }) => {
      if (data) {
        document.getElementById('sgGroup').value = data.group_id;
        document.getElementById('sgName').value = data.name;
        document.getElementById('sgDesc').value = data.description || '';
        document.getElementById('sgColor').value = data.color;
        document.getElementById('sgHier').value = data.hierarchy_level;
        document.getElementById('sgVisible').checked = data.is_visible;
      }
    });
  }
}

async function saveSubgroup(e, sgId) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    group_id: form.group_id.value,
    name: form.name.value,
    description: form.description.value,
    color: form.color.value,
    hierarchy_level: parseInt(form.hierarchy_level.value),
    is_visible: form.is_visible.checked
  };

  let error;
  if (sgId) {
    ({ error } = await window.sb.from('subgroups').update(payload).eq('id', sgId));
    await logAction('SUBGROUP_UPDATED', 'subgroup', sgId, payload);
  } else {
    ({ error } = await window.sb.from('subgroups').insert(payload));
    await logAction('SUBGROUP_CREATED', 'subgroup', '', payload);
  }

  if (error) return window.showToast('Erro: ' + error.message, 'error');
  window.showToast(sgId ? 'Subgrupo atualizado!' : 'Subgrupo criado!');
  document.querySelector('.modal-overlay')?.remove();
  loadAdminTab('subgrupos');
}

async function adminDeleteSubgroup(sgId) {
  if (!confirm('Excluir este subgrupo?')) return;
  const { error } = await window.sb.from('subgroups').delete().eq('id', sgId);
  if (error) return window.showToast('Erro: ' + error.message, 'error');
  await logAction('SUBGROUP_DELETED', 'subgroup', sgId);
  window.showToast('Subgrupo excluído.');
  loadAdminTab('subgrupos');
}

// ---- Tópicos ----
async function renderAdminTopicos(el) {
  const [{ data: topics }, { data: groups }] = await Promise.all([
    window.sb.from('topics').select('*').order('section').order('sort_order'),
    window.sb.from('groups').select('id,name').order('hierarchy_level', { ascending: false })
  ]);

  window._adminGroupsForTopics = groups;

  el.innerHTML = `
    <div class="admin-section">
      <div class="admin-section-header">
        <h3>Gerenciamento de Tópicos</h3>
        <button class="btn btn-primary" onclick="showTopicModal()">+ Novo Tópico</button>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead><tr><th>Título</th><th>Seção</th><th>Fixado</th><th>Grupos Permitidos</th><th>Ações</th></tr></thead>
          <tbody>
            ${(topics || []).map(t => `
              <tr>
                <td><strong>${window.escapeHtml(t.title)}</strong></td>
                <td><span class="section-badge">${t.section}</span></td>
                <td>${t.is_pinned ? '📌' : '-'}</td>
                <td>${(t.allowed_groups || []).length === 0 ? 'Todos' : (t.allowed_groups || []).length + ' grupo(s)'}</td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick="showTopicModal('${t.id}')">✏️</button>
                  <button class="btn btn-sm btn-danger" onclick="adminDeleteTopic('${t.id}')">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div id="topicModalContainer"></div>`;
}

function showTopicModal(topicId = null) {
  const container = document.getElementById('topicModalContainer');
  if (!container) return;
  const groups = window._adminGroupsForTopics || [];

  container.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)this.parentElement.remove()">
      <div class="modal-box modal-lg">
        <h3>${topicId ? 'Editar Tópico' : 'Novo Tópico'}</h3>
        <form onsubmit="saveTopic(event, '${topicId || ''}')">
          <label>Título <input type="text" name="title" required class="form-input" id="tTitle"></label>
          <label>Seção
            <select name="section" class="form-input" id="tSection">
              <option value="dashboard">Dashboard</option>
              <option value="listagem">Listagem</option>
              <option value="requerimentos">Requerimentos</option>
              <option value="documentos">Documentos</option>
              <option value="companhias">Companhias</option>
            </select>
          </label>
          <label>Conteúdo <textarea name="content" rows="6" class="form-input form-mono" id="tContent"></textarea></label>
          <label>Tipo de Conteúdo
            <select name="content_type" class="form-input" id="tContentType">
              <option value="text">Texto</option>
              <option value="html">HTML</option>
              <option value="markdown">Markdown</option>
            </select>
          </label>
          <label>Ordem <input type="number" name="sort_order" value="0" class="form-input" id="tSort"></label>
          <label class="checkbox-label"><input type="checkbox" name="is_pinned" id="tPinned"> Fixado</label>
          <label>Grupos Permitidos (deixe vazio = todos)
            <select name="allowed_groups" multiple class="form-input form-multiselect" id="tGroups" size="5">
              ${groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
            </select>
          </label>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">Salvar</button>
            <button type="button" class="btn btn-outline" onclick="document.querySelector('.modal-overlay').remove()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>`;

  if (topicId) {
    window.sb.from('topics').select('*').eq('id', topicId).single().then(({ data }) => {
      if (data) {
        document.getElementById('tTitle').value = data.title;
        document.getElementById('tSection').value = data.section;
        document.getElementById('tContent').value = data.content || '';
        document.getElementById('tContentType').value = data.content_type;
        document.getElementById('tSort').value = data.sort_order;
        document.getElementById('tPinned').checked = data.is_pinned;
        const sel = document.getElementById('tGroups');
        (data.allowed_groups || []).forEach(gid => {
          const opt = sel.querySelector(`option[value="${gid}"]`);
          if (opt) opt.selected = true;
        });
      }
    });
  }
}

async function saveTopic(e, topicId) {
  e.preventDefault();
  const form = e.target;
  const selectedGroups = Array.from(form.allowed_groups.selectedOptions).map(o => o.value);

  const payload = {
    title: form.title.value,
    section: form.section.value,
    content: form.content.value,
    content_type: form.content_type.value,
    sort_order: parseInt(form.sort_order.value) || 0,
    is_pinned: form.is_pinned.checked,
    allowed_groups: selectedGroups,
    created_by: window.currentProfile()?.id
  };

  let error;
  if (topicId) {
    ({ error } = await window.sb.from('topics').update(payload).eq('id', topicId));
    await logAction('TOPIC_UPDATED', 'topic', topicId, payload);
  } else {
    ({ error } = await window.sb.from('topics').insert(payload));
    await logAction('TOPIC_CREATED', 'topic', '', payload);
  }

  if (error) return window.showToast('Erro: ' + error.message, 'error');
  window.showToast(topicId ? 'Tópico atualizado!' : 'Tópico criado!');
  document.querySelector('.modal-overlay')?.remove();
  loadAdminTab('topicos');
}

async function adminDeleteTopic(topicId) {
  if (!confirm('Excluir este tópico?')) return;
  const { error } = await window.sb.from('topics').delete().eq('id', topicId);
  if (error) return window.showToast('Erro: ' + error.message, 'error');
  await logAction('TOPIC_DELETED', 'topic', topicId);
  window.showToast('Tópico excluído.');
  loadAdminTab('topicos');
}

// ---- Requerimentos ----
async function renderAdminRequerimentos(el) {
  const { data: reqs } = await window.sb
    .from('requirements')
    .select('*, profiles(nickname), groups(name,color)')
    .order('created_at', { ascending: false });

  el.innerHTML = `
    <div class="admin-section">
      <h3>Requerimentos <small>(${reqs?.length || 0})</small></h3>
      <div class="table-responsive">
        <table class="admin-table">
          <thead><tr><th>Data</th><th>Militar</th><th>Categoria</th><th>Título</th><th>Status</th><th>Dados</th><th>Ações</th></tr></thead>
          <tbody>
            ${(reqs || []).map(r => `
              <tr>
                <td>${window.formatDate(r.created_at)}</td>
                <td>${r.profiles?.nickname || 'N/A'}</td>
                <td><span class="category-badge">${r.category}</span></td>
                <td>${window.escapeHtml(r.title)}</td>
                <td><span class="status-badge status-${r.status}">${r.status.toUpperCase()}</span></td>
                <td><code class="json-preview">${JSON.stringify(r.form_data).substring(0, 60)}...</code></td>
                <td>
                  ${r.status === 'pendente' ? `
                    <button class="btn btn-sm btn-success" onclick="adminApproveReq('${r.id}')">✓ Aprovar</button>
                    <button class="btn btn-sm btn-danger" onclick="adminRejectReq('${r.id}')">✗ Rejeitar</button>
                  ` : `<small>Revisado por: ${r.reviewed_by ? 'Admin' : '-'}</small>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

async function adminApproveReq(reqId) {
  const note = prompt('Observação (opcional):') || '';
  const { error } = await window.sb.rpc('approve_requirement', { req_id: reqId, reviewer: window.currentProfile().id, note: note });
  if (error) return window.showToast('Erro: ' + error.message, 'error');
  window.showToast('Requerimento aprovado!');
  loadAdminTab('requerimentos');
}

async function adminRejectReq(reqId) {
  const note = prompt('Motivo da rejeição:') || '';
  const { error } = await window.sb.rpc('reject_requirement', { req_id: reqId, reviewer: window.currentProfile().id, note: note });
  if (error) return window.showToast('Erro: ' + error.message, 'error');
  window.showToast('Requerimento rejeitado.');
  loadAdminTab('requerimentos');
}

// ---- Logs de Ações ----
async function renderAdminLogsAcoes(el) {
  const { data: logs, count } = await window.sb
    .from('action_logs')
    .select('*, profiles(nickname)')
    .order('created_at', { ascending: false })
    .range(adminLogsPage * PAGE_SIZE, (adminLogsPage + 1) * PAGE_SIZE - 1);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  el.innerHTML = `
    <div class="admin-section">
      <h3>Logs de Ações <small>(${count || 0} registros)</small></h3>
      <div class="table-responsive">
        <table class="admin-table">
          <thead><tr><th>Data</th><th>Usuário</th><th>Ação</th><th>Tipo</th><th>ID Alvo</th><th>Detalhes</th></tr></thead>
          <tbody>
            ${(logs || []).map(l => `
              <tr>
                <td>${window.formatDate(l.created_at)}</td>
                <td>${l.profiles?.nickname || l.user_nickname || 'Sistema'}</td>
                <td><code>${l.action}</code></td>
                <td>${l.target_type}</td>
                <td><small>${l.target_id?.substring(0, 8)}...</small></td>
                <td><code class="json-preview">${JSON.stringify(l.details).substring(0, 80)}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button class="btn btn-sm" onclick="adminLogsPage=Math.max(0,adminLogsPage-1);loadAdminTab('logs-acoes')" ${adminLogsPage === 0 ? 'disabled' : ''}>← Anterior</button>
        <span>Página ${adminLogsPage + 1} de ${totalPages || 1}</span>
        <button class="btn btn-sm" onclick="adminLogsPage++;loadAdminTab('logs-acoes')" ${adminLogsPage >= totalPages - 1 ? 'disabled' : ''}>Próxima →</button>
      </div>
    </div>`;
}

// ---- Logs de Login ----
async function renderAdminLogsLogin(el) {
  const { data: logs, count } = await window.sb
    .from('login_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(adminLogsPage * PAGE_SIZE, (adminLogsPage + 1) * PAGE_SIZE - 1);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  el.innerHTML = `
    <div class="admin-section">
      <h3>Logs de Login <small>(${count || 0} registros)</small></h3>
      <div class="table-responsive">
        <table class="admin-table">
          <thead><tr><th>Data</th><th>Nickname</th><th>Email</th><th>Sucesso</th><th>IP</th><th>User Agent</th></tr></thead>
          <tbody>
            ${(logs || []).map(l => `
              <tr>
                <td>${window.formatDate(l.created_at)}</td>
                <td>${l.nickname || '-'}</td>
                <td>${l.email || '-'}</td>
                <td>${l.success ? '<span class="status-badge status-active">SIM</span>' : '<span class="status-badge status-banned">NÃO</span>'}</td>
                <td><small>${l.ip_address || '-'}</small></td>
                <td><small>${(l.user_agent || '-').substring(0, 40)}...</small></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button class="btn btn-sm" onclick="adminLogsPage=Math.max(0,adminLogsPage-1);loadAdminTab('logs-login')" ${adminLogsPage === 0 ? 'disabled' : ''}>← Anterior</button>
        <span>Página ${adminLogsPage + 1} de ${totalPages || 1}</span>
        <button class="btn btn-sm" onclick="adminLogsPage++;loadAdminTab('logs-login')" ${adminLogsPage >= totalPages - 1 ? 'disabled' : ''}>Próxima →</button>
      </div>
    </div>`;
}

// ---- Configurações ----
async function renderAdminConfig(el) {
  const { data: settings } = await window.sb.from('system_settings').select('*').eq('id', 1).single();
  const profile = window.currentProfile();
  const isMaster = profile.role === 'master';

  el.innerHTML = `
    <div class="admin-section">
      <h3>Configurações do Sistema</h3>
      <form onsubmit="saveSettings(event)" class="admin-form">
        <label class="checkbox-label">
          <input type="checkbox" id="cfgMaintenance" ${settings?.maintenance_mode ? 'checked' : ''} ${!isMaster ? 'disabled' : ''}>
          Modo Manutenção (bloqueia acesso de não-admins)
        </label>
        <label>Mensagem de Manutenção
          <input type="text" id="cfgMaintMsg" value="${window.escapeHtml(settings?.maintenance_message || '')}" class="form-input" ${!isMaster ? 'disabled' : ''}>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="cfgRegOpen" ${settings?.registration_open !== false ? 'checked' : ''} ${!isMaster ? 'disabled' : ''}>
          Registro Aberto
        </label>
        ${isMaster ? `<button type="submit" class="btn btn-primary">Salvar Configurações</button>` : '<p class="text-muted">Apenas a Chefia de Polícia pode alterar configurações.</p>'}
      </form>
    </div>

    <div class="admin-section">
      <h3>Conta Master (Invisível)</h3>
      ${isMaster ? `
        <p>Para criar/tornar uma conta master invisível, registre-a normalmente e execute no SQL Editor:</p>
        <pre class="code-block">UPDATE public.profiles SET role='master', is_active=true, is_invisible=true WHERE nickname='SEU_NICK';</pre>
      ` : '<p class="text-muted">Apenas master.</p>'}
    </div>`;
}

async function saveSettings(e) {
  e.preventDefault();
  if (window.currentProfile().role !== 'master') return window.showToast('Apenas master.', 'error');

  const { error } = await window.sb.from('system_settings').update({
    maintenance_mode: document.getElementById('cfgMaintenance').checked,
    maintenance_message: document.getElementById('cfgMaintMsg').value,
    registration_open: document.getElementById('cfgRegOpen').checked
  }).eq('id', 1);

  if (error) return window.showToast('Erro: ' + error.message, 'error');
  await logAction('SETTINGS_UPDATED', 'system', '1');
  window.showToast('Configurações salvas!');
}

// ---- Log de ação helper ----
async function logAction(action, targetType, targetId, details = {}) {
  const profile = window.currentProfile();
  if (!profile) return;
  await window.sb.from('action_logs').insert({
    user_id: profile.id,
    user_nickname: profile.nickname,
    action: action,
    target_type: targetType,
    target_id: String(targetId),
    details: details
  });
}

// Expor
window.initAdmin = initAdmin;
window.loadAdminTab = loadAdminTab;
