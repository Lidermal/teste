// Authentication Logic

document.addEventListener('DOMContentLoaded', () => {
    checkSession();

    // Event Listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('forgot-password-form').addEventListener('submit', handleForgotPassword);
    
    // Navigation Links
    document.getElementById('register-link').addEventListener('click', (e) => { e.preventDefault(); showScreen('register-screen'); });
    document.getElementById('forgot-password-link').addEventListener('click', (e) => { e.preventDefault(); showScreen('forgot-password-screen'); });
    document.getElementById('back-to-login').addEventListener('click', () => showScreen('login-screen'));
    document.getElementById('back-to-login-reg').addEventListener('click', () => showScreen('login-screen'));
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
});

function showScreen(screenId) {
    ['login-screen', 'forgot-password-screen', 'register-screen', 'dashboard'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById(screenId);
    if(target) target.classList.remove('hidden');
}

async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await loadUserData(session.user.id);
    } else {
        showScreen('login-screen');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const nickname = document.getElementById('login-nickname').value.trim();
    const password = document.getElementById('login-password').value;

    // Verificação de Contas Mestres
    const master = MASTER_ACCOUNTS.find(m => m.username.toLowerCase() === nickname.toLowerCase() && m.password === password);
    
    if (master) {
        // Simulação de login para mestres (idealmente crie esses usuários no Supabase Auth manualmente)
        console.log("Login Mestre Detectado:", master.username);
        // Para fins de demonstração, vamos criar um objeto de usuário falso para o mestre
        const mockUser = {
            id: 'master-id-' + Date.now(),
            email: 'master@famr.local',
            user_metadata: { nickname: master.username }
        };
        // Forçamos o carregamento como se fosse logado
        currentUser = { ...mockUser, status: 'active', groups: [{ name: 'Chefia', color: '#ef4444', permissions: ['admin', 'all'] }] };
        userGroups = currentUser.groups;
        updateUIForUser(currentUser);
        showScreen('dashboard');
        loadDashboardContent();
        return;
    }

    // Login Padrão Supabase
    // Nota: O Supabase usa email. Aqui assumimos que o usuário digita o nickname, 
    // mas no banco o email pode ser algo como nickname@famr.local ou ter uma tabela de ligação.
    // Para simplificar este exemplo, usaremos o email direto se o usuário souber, 
    // ou faremos uma busca pelo nickname para pegar o email associado.
    
    // Busca email pelo nickname na tabela profiles
    const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('nickname', nickname)
        .single();

    if (!profileData || !profileData.email) {
        alert('Usuário não encontrado ou não ativado.');
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: password
    });

    if (error) {
        alert('Senha incorreta ou erro de conexão.');
        console.error(error);
        return;
    }

    await loadUserData(data.user.id);
}

async function loadUserData(userId) {
    // Fetch user profile and groups
    // Nota: A query abaixo assume que você tem uma tabela 'profiles' e uma relação com 'groups'
    // Ou que os grupos estão armazenados como JSON no profile. Vamos assumir uma estrutura simples.
    
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        console.error("Erro ao carregar perfil", error);
        alert("Erro ao carregar dados do usuário.");
        return;
    }

    // Se o status não for ativo, bloqueia
    if (profile.status !== 'active' && !MASTER_ACCOUNTS.some(m => m.username === profile.nickname)) {
        alert('Sua conta ainda não foi ativada por um administrador.');
        supabase.auth.signOut();
        showScreen('login-screen');
        return;
    }

    // Buscar grupos do usuário (assumindo uma tabela de junção 'user_groups' ou campo JSON)
    // Para este exemplo, vamos assumir que o profile tem um campo 'groups' JSON ou faremos uma query separada
    // Vou simplificar assumindo que o profile já vem com os dados necessários ou faremos uma query de grupos
    
    /* Exemplo de query de grupos se houver tabela de junção:
    const { data: userGroupsData } = await supabase
        .from('user_groups')
        .select('groups(name, color, permissions)')
        .eq('user_id', userId);
    */
   
    // Mock de grupos para o exemplo funcionar sem o schema exato do DB
    let groups = profile.groups || [{ name: 'Recruta', color: '#9ca3af', permissions: [] }];
    
    currentUser = { ...profile, groups: groups };
    userGroups = groups;
    
    updateUIForUser(currentUser);
    showScreen('dashboard');
    loadDashboardContent();
}

function updateUIForUser(user) {
    document.getElementById('user-name-display').textContent = user.nickname;
    document.getElementById('user-avatar-initials').textContent = user.nickname.charAt(0).toUpperCase();
    
    // Define a cor do avatar baseada no grupo principal
    const mainGroup = user.groups[0];
    if(mainGroup && mainGroup.color) {
        document.getElementById('user-avatar-initials').style.backgroundColor = mainGroup.color;
    }

    // Verifica Permissões de Admin
    const isAdmin = user.groups.some(g => g.permissions && g.permissions.includes('admin'));
    if (isAdmin) {
        document.getElementById('admin-menu-items').classList.remove('hidden');
    } else {
        document.getElementById('admin-menu-items').classList.add('hidden');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const nickname = document.getElementById('reg-nickname').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    // Cria usuário no Auth
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                nickname: nickname,
                status: 'pending' // Pendente de aprovação
            }
        }
    });

    if (error) {
        alert('Erro no registro: ' + error.message);
        return;
    }

    // Cria entrada na tabela profiles (se não usar trigger no DB)
    if (data.user) {
        await supabase.from('profiles').insert([
            { id: data.user.id, nickname: nickname, email: email, status: 'pending' }
        ]);
    }

    alert('Registro realizado! Aguarde a ativação de um superior da FAMR.');
    showScreen('login-screen');
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const nickname = document.getElementById('recovery-nickname').value;
    
    // Busca email pelo nickname
    const { data: profile } = await supabase.from('profiles').select('email').eq('nickname', nickname).single();
    
    if (profile && profile.email) {
        const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
            redirectTo: 'https://seusite.github.io/reset-password.html' // Link para página de redefinição
        });
        
        if (!error) {
            alert(`Link de recuperação enviado para o e-mail cadastrado. Válido por 10 minutos.`);
        } else {
            alert('Erro ao enviar link.');
        }
    } else {
        alert('Nickname não encontrado.');
    }
    
    showScreen('login-screen');
}

function handleLogout() {
    supabase.auth.signOut();
    location.reload();
}
