/* ══════════ FAMR • CONFIGURAÇÃO ══════════
   1) Crie um projeto em https://supabase.com
   2) Cole abaixo a URL e a chave ANON (Settings > API)
   3) Deixe o arquivo famrlogo.png NA RAIZ do repositório (GitHub Pages / Vercel) */

const CONFIG = {
  supabaseUrl: 'https://SEU_PROJETO.supabase.co',
  supabaseAnonKey: 'COLE_SUA_CHAVE_ANON_AQUI',
  logoUrl: 'famrlogo.png',
  orgName: 'Polícia FAMR',
  // Contas mestres — crie estes usuários EXATAMENTE com estas senhas no
  // Supabase (Authentication > Add user) e rode o database.sql:
  masters: [
    { nickname: 'Chefia de Polícia', email: 'chefia@famr.system',  password: '@pVQu8a8' },
    { nickname: 'admin master',      email: 'adminmaster@famr.system', password: '29112004' }
  ]
};

const supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

// Estado global leve (cache em memória p/ fluidez com grande volume de dados)
const STATE = { profile: null, groups: [], settings: {}, sections: [], page: 0 };

const PERMS = { ADMIN:'admin', MASTER:'master', REVIEW:'review' };
const hasPerm = p => STATE.groups.some(g => (g.permissions||[]).includes(p));
const isAdmin = () => hasPerm(PERMS.ADMIN);
const isMaster = () => hasPerm(PERMS.MASTER);
