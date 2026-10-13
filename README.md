# 🏛️ FAMR System — Força Armada Militar Revolucionária

Sistema SaaS completo para gestão da polícia do Habbo Hotel (FAMR).

## 📋 Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Estilização | Tailwind-like custom + Bootstrap concepts |
| Backend/DB | Supabase (PostgreSQL + Auth + Edge Functions + RLS) |
| Imagens | Google Drive (links diretos) |
| Hospedagem | GitHub Pages → Vercel |

## 🚀 Setup Rápido

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito.
2. Vá em **SQL Editor** e cole todo o conteúdo de `sql-schema.sql`. Execute.
3. Vá em **Authentication → Providers** e garanta que **Email** está habilitado.
4. Em **Authentication → URL Configuration**, configure:
   - Site URL: `https://SEU_USUARIO.github.io/famr-system`
   - Redirect URLs: adicione `https://SEU_USUARIO.github.io/famr-system/reset-senha.html`

### 2. Configurar credenciais no `auth.js`

Abra `auth.js` e substitua:

```javascript
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY';
