// Application Logic & UI Rendering

document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            setActiveNav(item);
            loadPageContent(page);
        });
    });

    // Global Search
    const searchInput = document.getElementById('global-search');
    if(searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchMilitary(searchInput.value);
            }
        });
    }
});

function setActiveNav(activeItem) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-green-600', 'text-white', 'shadow-md');
        item.classList.add('text-gray-400');
    });
    activeItem.classList.remove('text-gray-400');
    activeItem.classList.add('bg-green-600', 'text-white', 'shadow-md');
}

// --- RENDERIZAÇÃO DE PÁGINAS ---

async function loadDashboardContent() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div class="flex justify-center py-20"><i class="fas fa-circle-notch fa-spin text-4xl text-green-500"></i></div>';

    // Simulação de busca de tópicos visíveis para os grupos do usuário
    // Na prática, use RLS no Supabase para filtrar automaticamente
    const { data: topics, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    let html = `
        <div class="mb-8 fade-in">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-3xl font-bold text-white border-l-4 border-green-500 pl-4">Painel de Controle</h2>
                <span class="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">${new Date().toLocaleDateString()}</span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fas fa-newspaper text-6xl text-green-500"></i>
                    </div>
                    <h3 class="text-gray-400 text-xs uppercase font-bold tracking-wider">Notícias Recentes</h3>
                    <p class="text-4xl font-bold text-white mt-2">${topics ? topics.length : 0}</p>
                </div>
                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fas fa-users text-6xl text-blue-500"></i>
                    </div>
                    <h3 class="text-gray-400 text-xs uppercase font-bold tracking-wider">Meus Grupos</h3>
                    <p class="text-4xl font-bold text-white mt-2">${userGroups.length}</p>
                </div>
                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fas fa-check-circle text-6xl text-yellow-500"></i>
                    </div>
                    <h3 class="text-gray-400 text-xs uppercase font-bold tracking-wider">Status</h3>
                    <p class="text-2xl font-bold text-green-500 mt-3">ATIVO</p>
                </div>
            </div>

            <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                <i class="fas fa-bullhorn text-green-500 mr-2"></i> Feed de Ordens & Notícias
            </h3>
            <div class="space-y-4">
    `;

    if (!topics || topics.length === 0) {
        html += `<div class="bg-gray-800/50 p-8 rounded-lg border border-dashed border-gray-700 text-center text-gray-500">Nenhuma notícia disponível no momento.</div>`;
    } else {
        topics.forEach(topic => {
            // Verifica permissão de visualização (simulado, o RLS deve fazer isso no DB)
            html += `
                <div class="topic-card bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-start space-x-4 cursor-pointer">
                    <div class="w-12 h-12 rounded bg-gray-700 flex-shrink-0 flex items-center justify-center text-xl shadow-inner">
                        <i class="fas ${topic.icon || 'fa-newspaper'} text-green-500"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start mb-1">
                            <h4 class="text-lg font-bold text-white hover:text-green-400 transition-colors">${topic.title}</h4>
                            <span class="text-xs text-gray-500 font-mono">${new Date(topic.created_at).toLocaleString()}</span>
                        </div>
                        <p class="text-gray-400 text-sm line-clamp-2 mb-3">${topic.content}</p>
                        <div class="flex items-center space-x-2">
                            <span class="badge-group" style="background-color: ${topic.group_color || '#374151'}; color: white;">
                                ${topic.group_name || 'Geral'}
                            </span>
                            <span class="text-xs text-gray-500">Por: ${topic.author_nickname || 'Comando'}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    contentArea.innerHTML = html;
}

async function loadPageContent(page) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div class="flex justify-center py-20"><i class="fas fa-circle-notch fa-spin text-4xl text-green-500"></i></div>';

    if (page === 'admin') {
        loadAdminPanel(contentArea);
    } else if (page === 'listagem') {
        loadListagem(contentArea);
    } else if (page === 'requerimentos') {
        loadRequerimentos(contentArea);
    } else if (page === 'documentos') {
        contentArea.innerHTML = `<div class="fade-in text-center py-20"><i class="fas fa-book text-6xl text-gray-700 mb-4"></i><h2 class="text-2xl text-white">Documentos Oficiais</h2><p class="text-gray-500">Em desenvolvimento.</p></div>`;
    } else if (page === 'companhias') {
        contentArea.innerHTML = `<div class="fade-in text-center py-20"><i class="fas fa-shield-alt text-6xl text-gray-700 mb-4"></i><h2 class="text-2xl text-white">Companhias</h2><p class="text-gray-500">Em desenvolvimento.</p></div>`;
    } else {
        loadDashboardContent(); // Default to home
    }
}

// --- PAINEL ADMINISTRATIVO ---

async function loadAdminPanel(container) {
    // Segurança extra no frontend
    if (!currentUser || !userGroups.some(g => g.permissions && g.permissions.includes('admin'))) {
        container.innerHTML = '<div class="text-center text-red-500 py-10 font-bold text-xl"><i class="fas fa-lock text-4xl mb-2"></i><br>ACESSO NEGADO</div>';
        return;
    }

    container.innerHTML = `
        <div class="fade-in space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-white"><i class="fas fa-cogs text-yellow-500 mr-2"></i> Painel Administrativo</h2>
                <button onclick="toggleMaintenance()" id="btn-maintenance" class="bg-gray-700 hover:bg-yellow-600 text-white px-4 py-2 rounded text-xs font-bold transition-colors">
                    <i class="fas fa-tools mr-1"></i> Alternar Manutenção
                </button>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Gerenciamento de Usuários -->
                <div class="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
                    <h3 class="text-lg font-bold text-green-500 mb-4 border-b border-gray-700 pb-2">Militares Cadastrados</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm text-gray-400">
                            <thead class="bg-gray-900 text-white uppercase text-xs">
                                <tr>
                                    <th class="p-3">Nickname</th>
                                    <th class="p-3">Status</th>
                                    <th class="p-3">Grupo Principal</th>
                                    <th class="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="admin-user-list" class="divide-y divide-gray-700">
                                <!-- Populado via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Configurações Rápidas -->
                <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg space-y-4">
                    <h3 class="text-lg font-bold text-green-500 mb-2">Ações Rápidas</h3>
                    
                    <div class="p-4 bg-gray-900 rounded border border-gray-700">
                        <h4 class="text-xs font-bold text-gray-500 uppercase mb-2">Criar Novo Grupo</h4>
                        <input type="text" placeholder="Nome do Grupo" class="w-full bg-gray-800 border border-gray-600 rounded p-2 text-xs text-white mb-2">
                        <input type="color" class="w-full h-8 rounded cursor-pointer mb-2" value="#22c55e">
                        <button class="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded">CRIAR GRUPO</button>
                    </div>

                    <div class="p-4 bg-gray-900 rounded border border-gray-700">
                        <h4 class="text-xs font-bold text-gray-500 uppercase mb-2">Logs do Sistema</h4>
                        <div class="h-32 overflow-y-auto font-mono text-[10px] text-green-400 bg-black p-2 rounded">
                            <p>> System initialized...</p>
                            <p>> User ${currentUser.nickname} accessed admin panel...</p>
                            <p>> RLS policies active.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    loadAdminUsers();
}

async function loadAdminUsers() {
    const tbody = document.getElementById('admin-user-list');
    if(!tbody) return;

    const { data: users, error } = await supabase.from('profiles').select('id, nickname, status, groups').limit(20);
    
    if (users) {
        tbody.innerHTML = users.map(u => {
            const groupName = u.groups && u.groups[0] ? u.groups[0].name : 'Sem Grupo';
            const groupColor = u.groups && u.groups[0] ? u.groups[0].color : '#9ca3af';
            
            return `
            <tr class="hover:bg-gray-700/50 transition-colors">
                <td class="p-3 font-bold text-white">${u.nickname}</td>
                <td class="p-3">
                    <span class="text-[10px] px-2 py-1 rounded uppercase font-bold ${u.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}">
                        ${u.status}
                    </span>
                </td>
                <td class="p-3">
                    <span class="text-xs px-2 py-1 rounded text-white" style="background-color: ${groupColor}">${groupName}</span>
                </td>
                <td class="p-3 text-right space-x-2">
                    ${u.status === 'pending' ? `<button onclick="activateUser('${u.id}')" class="text-green-500 hover:text-white" title="Ativar"><i class="fas fa-check"></i></button>` : ''}
                    <button class="text-red-500 hover:text-white" title="Banir"><i class="fas fa-ban"></i></button>
                    <button class="text-blue-500 hover:text-white" title="Editar"><i class="fas fa-edit"></i></button>
                </td>
            </tr>
        `}).join('');
    }
}

// Funções globais para serem chamadas pelo HTML injetado
window.activateUser = async (userId) => {
    const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
    if (!error) {
        alert('Usuário ativado!');
        loadAdminUsers();
    } else {
        alert('Erro ao ativar.');
    }
};

window.toggleMaintenance = () => {
    const overlay = document.getElementById('maintenance-overlay');
    overlay.classList.toggle('hidden');
    // Aqui você salvaria o estado no Supabase para persistir entre sessões
    alert('Modo de manutenção alternado (Visual apenas nesta sessão).');
};

// --- OUTRAS PÁGINAS ---

async function loadListagem(container) {
    container.innerHTML = `
        <div class="fade-in">
            <h2 class="text-2xl font-bold text-white mb-6 border-l-4 border-green-500 pl-4">Listagem Oficial</h2>
            <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div class="flex flex-wrap gap-4 mb-6">
                    <input type="text" placeholder="Filtrar por nome..." class="bg-gray-900 border border-gray-600 rounded px-4 py-2 text-white text-sm">
                    <select class="bg-gray-900 border border-gray-600 rounded px-4 py-2 text-white text-sm">
                        <option>Todos os Grupos</option>
                        <option>Infantaria</option>
                        <option>Elite</option>
                    </select>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Cards de Militares -->
                    <div class="bg-gray-900 p-4 rounded border border-gray-700 flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">J</div>
                        <div>
                            <div class="font-bold text-white">Joao_Silva</div>
                            <div class="text-xs text-green-500">Capitão</div>
                        </div>
                    </div>
                    <!-- Mais cards... -->
                </div>
            </div>
        </div>
    `;
}

async function loadRequerimentos(container) {
    container.innerHTML = `
        <div class="fade-in">
            <h2 class="text-2xl font-bold text-white mb-6 border-l-4 border-green-500 pl-4">Central de Requerimentos</h2>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-1 bg-gray-800 p-6 rounded-lg border border-gray-700 h-fit">
                    <h3 class="font-bold text-green-500 mb-4 uppercase text-sm">Novo Requerimento</h3>
                    <form class="space-y-4" onsubmit="event.preventDefault(); alert('Requerimento enviado para análise do CRH!');">
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-bold">Tipo</label>
                            <select class="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm mt-1">
                                <option>Criação de Tag</option>
                                <option>Promoção</option>
                                <option>Transferência de Companhia</option>
                                <option>Denúncia</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-bold">Detalhes</label>
                            <textarea class="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm h-32 mt-1" placeholder="Descreva sua solicitação..."></textarea>
                        </div>
                        <button class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded text-sm uppercase tracking-wide">Enviar Solicitação</button>
                    </form>
                </div>
                <div class="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 class="font-bold text-white mb-4 uppercase text-sm">Meus Protocolos</h3>
                    <div class="space-y-3">
                        <div class="p-4 bg-gray-900 rounded border-l-4 border-yellow-500 flex justify-between items-center">
                            <div>
                                <div class="font-bold text-white text-sm">Solicitação de Tag #001</div>
                                <div class="text-xs text-gray-500">Enviado há 2 horas</div>
                            </div>
                            <span class="text-yellow-500 text-xs font-bold uppercase bg-yellow-900/20 px-2 py-1 rounded">Em Análise</span>
                        </div>
                        <div class="p-4 bg-gray-900 rounded border-l-4 border-green-500 flex justify-between items-center">
                            <div>
                                <div class="font-bold text-white text-sm">Pedido de Promoção</div>
                                <div class="text-xs text-gray-500">Enviado há 5 dias</div>
                            </div>
                            <span class="text-green-500 text-xs font-bold uppercase bg-green-900/20 px-2 py-1 rounded">Aprovado</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function searchMilitary(query) {
    if(!query) return;
    alert(`Buscando por: ${query} (Funcionalidade simulada)`);
    // Implementar busca real no Supabase aqui
}
