// FAMR System - Core Application Logic
// Integrates with Supabase, handles UI rendering, permissions, and dynamic content.

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Navigation
    setupNavigation();
    
    // Initialize Global Search
    setupGlobalSearch();

    // Check if user is logged in (handled by auth.js, but we ensure UI state here)
    if (!currentUser) {
        // If no user is loaded yet, ensure login screen is visible (fallback)
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    } else {
        loadDashboardContent();
    }
});

// --- NAVIGATION & SETUP ---

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-link');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            
            // Update Active State
            navItems.forEach(nav => {
                nav.classList.remove('active', 'bg-famr-gold/10', 'text-famr-gold', 'border-l-2', 'border-famr-gold');
                nav.classList.add('text-gray-400');
            });
            item.classList.remove('text-gray-400');
            item.classList.add('active', 'bg-famr-gold/10', 'text-famr-gold', 'border-l-2', 'border-famr-gold');

            // Load Content
            loadPageContent(page);
        });
    });
}

function setupGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query.length > 2) {
                    performSearch(query);
                }
            }
        });
    }
}

// --- CONTENT LOADING ENGINE ---

async function loadPageContent(page) {
    const contentArea = document.getElementById('content-area');
    
    // Loading Spinner
    contentArea.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 fade-in">
            <i class="fas fa-circle-notch fa-spin text-5xl text-famr-gold mb-4"></i>
            <p class="text-gray-400 text-sm uppercase tracking-widest">Carregando Módulo...</p>
        </div>
    `;

    try {
        switch (page) {
            case 'home':
                await loadDashboardContent();
                break;
            case 'listagem':
                await loadListagem(contentArea);
                break;
            case 'requerimentos':
                await loadRequerimentos(contentArea);
                break;
            case 'documentos':
                await loadDocumentos(contentArea);
                break;
            case 'admin':
                await loadAdminPanel(contentArea);
                break;
            default:
                contentArea.innerHTML = `<div class="text-center text-gray-500 py-10">Módulo em desenvolvimento.</div>`;
        }
    } catch (error) {
        console.error("Erro ao carregar página:", error);
        contentArea.innerHTML = `
            <div class="bg-red-900/20 border border-red-500/50 p-6 rounded-lg text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
                <h3 class="text-white font-bold">Erro de Conexão</h3>
                <p class="text-gray-400 text-sm">Não foi possível carregar os dados. Verifique sua conexão ou tente novamente.</p>
            </div>
        `;
    }
}

// --- PAGE: DASHBOARD (HOME) ---

async function loadDashboardContent() {
    const contentArea = document.getElementById('content-area');
    
    // Fetch News/Topics from Supabase (Filtered by RLS automatically)
    // Assumindo tabela 'topics' com colunas: id, title, content, author_nickname, created_at, group_id, icon
    const { data: topics, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) throw error;

    // Determine User's Main Group Color for Banner
    const mainGroup = currentUser.groups && currentUser.groups[0] ? currentUser.groups[0] : { color: '#14532d', name: 'Recruta' };

    let html = `
        <!-- Hero Banner -->
        <div class="relative rounded-xl overflow-hidden shadow-2xl border border-famr-gold/30 mb-8 group fade-in">
            <div class="absolute inset-0 bg-gradient-to-r from-[${mainGroup.color}] to-famr-dark/95 z-10 opacity-90"></div>
            <!-- Placeholder Background Image -->
            <img src="https://raw.githubusercontent.com/SEU_USUARIO/famrlogo/main/background.png" class="w-full h-48 object-cover opacity-30 group-hover:scale-105 transition-transform duration-700">
            <div class="absolute inset-0 z-20 flex flex-col justify-center px-8">
                <span class="text-famr-gold text-xs font-bold tracking-[0.3em] uppercase mb-2">Bem-vindo, ${currentUser.nickname}</span>
                <h2 class="font-serif text-3xl md:text-4xl text-white font-bold drop-shadow-lg">Painel de Controle</h2>
                <p class="text-gray-300 mt-2 max-w-lg text-sm">Você está acessando como <span class="text-white font-bold">${mainGroup.name}</span>. Mantenha a disciplina revolucionária.</p>
            </div>
        </div>

        <!-- Grid Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
            
            <!-- Feed de Notícias (Esquerda/Centro) -->
            <div class="lg:col-span-2 space-y-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-serif text-xl text-famr-gold"><i class="fas fa-newspaper mr-2"></i> Ordens do Dia</h3>
                    <button onclick="loadPageContent('listagem')" class="text-xs text-gray-400 hover:text-white underline cursor-pointer">Ver Arquivo Completo</button>
                </div>

                ${topics && topics.length > 0 ? topics.map(topic => `
                    <div class="widget-box flex items-start p-4 hover:border-famr-gold/50 transition-colors cursor-pointer group" onclick="alert('Visualização detalhada em breve')">
                        <div class="w-12 h-12 rounded bg-gray-800 flex-shrink-0 flex items-center justify-center text-xl text-gray-500 group-hover:text-famr-gold transition-colors">
                            <i class="fas ${topic.icon || 'fa-bullhorn'}"></i>
                        </div>
                        <div class="ml-4 flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/50 text-blue-400 border border-blue-500/30">OFICIAL</span>
                                <span class="text-xs text-gray-500">Por <span class="text-gray-300">${topic.author_nickname || 'Comando'}</span> • ${new Date(topic.created_at).toLocaleDateString()}</span>
                            </div>
                            <h4 class="text-lg font-bold text-white group-hover:text-famr-gold transition-colors">${topic.title}</h4>
                            <p class="text-sm text-gray-400 line-clamp-2 mt-1">${topic.content}</p>
                        </div>
                    </div>
                `).join('') : `
                    <div class="widget-box p-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                        <p>Nenhuma ordem recente para seu nível de acesso.</p>
                    </div>
                `}
            </div>

            <!-- Sidebar Direita (Estatísticas & Avisos) -->
            <div class="space-y-6">
                <!-- Aviso de Manutenção (Simulado) -->
                <div class="widget-box p-4 border-l-4 border-yellow-500 bg-yellow-900/10">
                    <h4 class="font-bold text-white mb-2 flex items-center"><i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i> Aviso</h4>
                    <p class="text-xs text-gray-400 leading-relaxed">
                        O sistema de requerimentos passará por manutenção na próxima sexta-feira às 03:00h.
                    </p>
                </div>

                <!-- Quem está Online (Mockup visual, idealmente viria do DB) -->
                <div class="widget-box">
                    <div class="bg-gray-800 p-3 border-b border-gray-700 font-bold text-sm text-gray-300 flex justify-between">
                        <span><i class="fas fa-users mr-2"></i> Online Agora</span>
                        <span class="text-green-500 text-xs">● 12 Militares</span>
                    </div>
                    <div class="p-3 text-xs text-gray-400 flex flex-wrap gap-2">
                        <span class="text-famr-gold font-bold cursor-pointer hover:underline">Chefia_Policial</span>,
                        <span class="text-blue-400 cursor-pointer hover:underline">Coronel_Silva</span>,
                        <span class="text-green-400 cursor-pointer hover:underline">Major_Costa</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    contentArea.innerHTML = html;
}

// --- PAGE: LISTAGEM (EFETIVO) ---

async function loadListagem(container) {
    // Busca perfis ativos
    const { data: users, error } = await supabase
        .from('profiles')
        .select('nickname, status, groups')
        .eq('status', 'active')
        .order('nickname');

    if (error) throw error;

    container.innerHTML = `
        <div class="widget-box fade-in">
            <div class="widget-header bg-gradient-to-r from-famr-green to-famr-dark border-b border-famr-gold/50 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 class="font-serif text-xl text-famr-gold"><i class="fas fa-list mr-2"></i> Efetivo Ativo</h2>
                <div class="relative w-full md:w-64">
                    <input type="text" id="filter-listagem" placeholder="Filtrar por nome..." class="w-full bg-black/30 border border-gray-600 rounded px-3 py-2 text-xs text-white focus:border-famr-gold outline-none">
                    <i class="fas fa-search absolute right-3 top-2.5 text-gray-500 text-xs"></i>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-gray-400">
                    <thead class="bg-gray-800 text-gray-200 uppercase text-xs">
                        <tr>
                            <th class="p-4 w-12">#</th>
                            <th class="p-4">Posto/Graduação</th>
                            <th class="p-4">Nickname</th>
                            <th class="p-4">Companhia</th>
                            <th class="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700" id="listagem-body">
                        ${users ? users.map((u, index) => {
                            const groupName = u.groups && u.groups[0] ? u.groups[0].name : 'Recruta';
                            const groupColor = u.groups && u.groups[0] ? u.groups[0].color : '#9ca3af';
                            return `
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="p-4 text-gray-600 font-mono">${index + 1}</td>
                                <td class="p-4 font-bold" style="color: ${groupColor}">${groupName}</td>
                                <td class="p-4 font-bold text-white">${u.nickname}</td>
                                <td class="p-4">1ª Companhia</td>
                                <td class="p-4 text-right">
                                    <button class="text-famr-gold hover:text-white text-xs border border-famr-gold/50 px-2 py-1 rounded transition-colors">Perfil</button>
                                </td>
                            </tr>
                        `}).join('') : '<tr><td colspan="5" class="p-4 text-center">Nenhum militar encontrado.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Simple Filter Logic
    const filterInput = document.getElementById('filter-listagem');
    if(filterInput) {
        filterInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#listagem-body tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }
}

// --- PAGE: REQUERIMENTOS ---

async function loadRequerimentos(container) {
    // Busca requerimentos do usuário atual
    const { data: requests, error } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in">
            <!-- Formulário -->
            <div class="md:col-span-1 widget-box h-fit">
                <div class="widget-header bg-gradient-to-r from-famr-green to-famr-dark border-b border-famr-gold/50 p-3">
                    <span class="font-serif font-bold text-famr-gold text-sm">NOVO PROTOCOLO</span>
                </div>
                <div class="p-4 space-y-4">
                    <div>
                        <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Tipo de Solicitação</label>
                        <select id="req-type" class="w-full bg-black/30 border border-gray-600 rounded p-2 text-white text-sm focus:border-famr-gold outline-none">
                            <option value="tag">Solicitação de Tag</option>
                            <option value="promocao">Promoção por Mérito</option>
                            <option value="transferencia">Transferência de Companhia</option>
                            <option value="outros">Outros Assuntos</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-xs text-gray-400 uppercase font-bold block mb-1">Detalhes</label>
                        <textarea id="req-content" class="w-full bg-black/30 border border-gray-600 rounded p-2 text-white text-sm h-32 focus:border-famr-gold outline-none" placeholder="Descreva sua solicitação detalhadamente..."></textarea>
                    </div>
                    <button onclick="submitRequest()" class="w-full bg-famr-gold hover:bg-yellow-600 text-black font-bold py-2 rounded text-sm uppercase transition-colors shadow-lg">
                        <i class="fas fa-paper-plane mr-2"></i> Enviar Protocolo
                    </button>
                </div>
            </div>

            <!-- Lista de Meus Requerimentos -->
            <div class="md:col-span-2 widget-box">
                <div class="widget-header bg-gradient-to-r from-famr-green to-famr-dark border-b border-famr-gold/50 p-3 flex justify-between items-center">
                    <span class="font-serif font-bold text-famr-gold text-sm">MEUS PROTOCOLOS</span>
                    <span class="text-xs text-gray-500">Total: ${requests ? requests.length : 0}</span>
                </div>
                <div class="p-4 space-y-3" id="my-requests-list">
                    ${requests && requests.length > 0 ? requests.map(req => `
                        <div class="flex items-center justify-between p-3 bg-black/20 rounded border-l-4 ${getStatusColor(req.status)} mb-2">
                            <div>
                                <div class="font-bold text-white text-sm capitalize">${req.type}</div>
                                <div class="text-xs text-gray-500">${new Date(req.created_at).toLocaleDateString()} • ID: #${req.id.toString().slice(0,4)}</div>
                            </div>
                            <span class="text-xs font-bold px-2 py-1 rounded uppercase bg-opacity-20 border border-current" style="color: ${getStatusTextColor(req.status)}; background-color: ${getStatusBgColor(req.status)}">
                                ${req.status}
                            </span>
                        </div>
                    `).join('') : `
                        <div class="text-center py-10 text-gray-500">
                            <i class="fas fa-folder-open text-3xl mb-2 opacity-50"></i>
                            <p class="text-sm">Nenhum requerimento aberto.</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

// Helper Functions for Request Status Colors
function getStatusColor(status) {
    if (status === 'approved') return 'border-green-500';
    if (status === 'rejected') return 'border-red-500';
    return 'border-yellow-500';
}
function getStatusTextColor(status) {
    if (status === 'approved') return '#22c55e';
    if (status === 'rejected') return '#ef4444';
    return '#eab308';
}
function getStatusBgColor(status) {
    if (status === 'approved') return 'rgba(34, 197, 94, 0.1)';
    if (status === 'rejected') return 'rgba(239, 68, 68, 0.1)';
    return 'rgba(234, 179, 8, 0.1)';
}

// Function to Submit Request
window.submitRequest = async () => {
    const type = document.getElementById('req-type').value;
    const content = document.getElementById('req-content').value;

    if (!content.trim()) {
        alert("Por favor, preencha os detalhes da solicitação.");
        return;
    }

    const btn = document.querySelector('button[onclick="submitRequest()"]');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    btn.disabled = true;

    const { error } = await supabase.from('requests').insert([
        { user_id: currentUser.id, nickname: currentUser.nickname, type: type, content: content, status: 'pending' }
    ]);

    if (!error) {
        alert("Protocolo enviado com sucesso! Aguarde a análise do RH.");
        loadRequerimentos(document.getElementById('content-area')); // Reload list
    } else {
        alert("Erro ao enviar: " + error.message);
        btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Enviar Protocolo';
        btn.disabled = false;
    }
};

// --- PAGE: DOCUMENTOS ---

async function loadDocumentos(container) {
    container.innerHTML = `
        <div class="widget-box fade-in p-8 text-center">
            <i class="fas fa-book-open text-6xl text-famr-gold mb-4"></i>
            <h2 class="text-2xl font-serif text-white mb-2">Código Penal & Documentos</h2>
            <p class="text-gray-400 max-w-md mx-auto mb-6">Aqui você encontra todas as leis, regulamentos e documentos oficiais da FAMR.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                <a href="#" class="block p-4 bg-gray-800 rounded border border-gray-700 hover:border-famr-gold transition-colors group">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-file-pdf text-red-500 text-2xl"></i>
                        <div>
                            <h4 class="font-bold text-white group-hover:text-famr-gold">Código Penal Militar</h4>
                            <span class="text-xs text-gray-500">PDF • 2.4 MB</span>
                        </div>
                    </div>
                </a>
                <a href="#" class="block p-4 bg-gray-800 rounded border border-gray-700 hover:border-famr-gold transition-colors group">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-file-word text-blue-500 text-2xl"></i>
                        <div>
                            <h4 class="font-bold text-white group-hover:text-famr-gold">Regulamento de Uniformes</h4>
                            <span class="text-xs text-gray-500">DOCX • 1.1 MB</span>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    `;
}

// --- PAGE: ADMIN PANEL (RESTRICTED) ---

async function loadAdminPanel(container) {
    // Security Check
    if (!currentUser || !currentUser.groups.some(g => g.permissions && g.permissions.includes('admin'))) {
        container.innerHTML = `
            <div class="text-center py-20 fade-in">
                <i class="fas fa-lock text-6xl text-red-500 mb-4"></i>
                <h2 class="text-2xl font-bold text-white">ACESSO NEGADO</h2>
                <p class="text-gray-400">Você não possui permissão de administrador para visualizar esta área.</p>
            </div>
        `;
        return;
    }

    // Fetch Users for Management
    const { data: users, error } = await supabase.from('profiles').select('id, nickname, status, email').limit(50);
    if (error) throw error;

    container.innerHTML = `
        <div class="fade-in space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-serif text-famr-gold"><i class="fas fa-cogs mr-2"></i> Painel Administrativo</h2>
                <button onclick="toggleMaintenanceMode()" class="bg-gray-700 hover:bg-yellow-600 text-white px-4 py-2 rounded text-xs font-bold transition-colors border border-gray-600">
                    <i class="fas fa-tools mr-1"></i> Alternar Manutenção
                </button>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Gerenciamento de Usuários -->
                <div class="lg:col-span-2 widget-box">
                    <div class="widget-header bg-gradient-to-r from-famr-green to-famr-dark border-b border-famr-gold/50 p-3">
                        <span class="font-serif font-bold text-famr-gold text-sm">GERENCIAR MILITARES</span>
                    </div>
                    <div class="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table class="w-full text-left text-sm text-gray-400">
                            <thead class="bg-gray-800 text-gray-200 uppercase text-xs sticky top-0">
                                <tr>
                                    <th class="p-3">Nickname</th>
                                    <th class="p-3">Status</th>
                                    <th class="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-700" id="admin-user-list">
                                ${users.map(u => `
                                    <tr class="hover:bg-white/5">
                                        <td class="p-3 font-bold text-white">${u.nickname}</td>
                                        <td class="p-3">
                                            <span class="text-[10px] px-2 py-1 rounded uppercase font-bold ${u.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}">
                                                ${u.status}
                                            </span>
                                        </td>
                                        <td class="p-3 text-right space-x-2">
                                            ${u.status !== 'active' ? `<button onclick="activateUser('${u.id}')" class="text-green-500 hover:text-white" title="Ativar"><i class="fas fa-check"></i></button>` : ''}
                                            <button class="text-red-500 hover:text-white" title="Banir"><i class="fas fa-ban"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Logs do Sistema -->
                <div class="widget-box flex flex-col h-full">
                    <div class="widget-header bg-gradient-to-r from-famr-green to-famr-dark border-b border-famr-gold/50 p-3">
                        <span class="font-serif font-bold text-famr-gold text-sm">LOGS DE AÇÃO</span>
                    </div>
                    <div class="p-0 flex-1 bg-black/40 font-mono text-[10px] text-green-400 overflow-y-auto h-[500px]" id="system-logs">
                        <div class="p-2 border-b border-gray-800">[SYSTEM] Admin panel accessed by ${currentUser.nickname}</div>
                        <div class="p-2 border-b border-gray-800">[AUTH] Session validated via RLS</div>
                        <div class="p-2 border-b border-gray-800">[DB] Connected to Supabase Project</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Admin Actions
window.activateUser = async (userId) => {
    if(!confirm("Tem certeza que deseja ativar este usuário?")) return;
    
    const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
    if (!error) {
        addLog(`User ${userId} activated by Admin.`);
        loadAdminPanel(document.getElementById('content-area')); // Refresh
    } else {
        alert("Erro ao ativar usuário.");
    }
};

window.toggleMaintenanceMode = () => {
    const overlay = document.getElementById('maintenance-overlay');
    overlay.classList.toggle('hidden');
    addLog("Maintenance mode toggled.");
    alert("Modo de manutenção alternado. (Nota: Para persistir, salve no banco de dados)");
};

function addLog(message) {
    const logContainer = document.getElementById('system-logs');
    if(logContainer) {
        const time = new Date().toLocaleTimeString();
        const div = document.createElement('div');
        div.className = "p-2 border-b border-gray-800";
        div.innerText = `[${time}] ${message}`;
        logContainer.prepend(div);
    }
}

// --- GLOBAL SEARCH FUNCTION ---

async function performSearch(query) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `<div class="flex justify-center py-20"><i class="fas fa-circle-notch fa-spin text-4xl text-famr-gold"></i></div>`;

    // Search in Profiles
    const { data: users, error } = await supabase
        .from('profiles')
        .select('nickname, status')
        .ilike('nickname', `%${query}%`)
        .limit(10);

    if (error) {
        contentArea.innerHTML = `<div class="text-center text-red-500">Erro na busca.</div>`;
        return;
    }

    let html = `
        <div class="widget-box fade-in p-6">
            <h2 class="text-xl font-bold text-white mb-4">Resultados para: "${query}"</h2>
            ${users && users.length > 0 ? `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${users.map(u => `
                        <div class="bg-gray-800 p-4 rounded border border-gray-700 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white">${u.nickname.charAt(0)}</div>
                            <div>
                                <div class="font-bold text-white">${u.nickname}</div>
                                <div class="text-xs text-gray-500 uppercase">${u.status}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `<p class="text-gray-400">Nenhum militar encontrado com esse nome.</p>`}
        </div>
    `;
    contentArea.innerHTML = html;
}
