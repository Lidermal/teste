// Supabase Configuration
// SUBSTITUA PELAS SUAS CREDENCIAIS DO SUPABASE
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_KEY = 'SUA_CHAVE_ANON_PUBLICA';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global State
let currentUser = null;
let userGroups = [];
let isMaintenanceMode = false;

// Contas Mestres (Hardcoded conforme solicitado para acesso imediato)
// Em produção, idealmente essas contas também estariam no banco com flags especiais
const MASTER_ACCOUNTS = [
    { username: 'Chefia de Polícia', password: '@pVQu8a8' },
    { username: 'admin master', password: '29112004' }
];

// Configurações
const RECOVERY_EMAIL_SENDER = 'pmfamr@gmail.com';
