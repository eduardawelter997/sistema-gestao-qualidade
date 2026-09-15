# Sistema de Gestão da Qualidade — Grupo Setti

Aplicativo web (React Native + Expo + TypeScript, rodando como PWA no
navegador) com back-end no **Supabase** (Postgres + Auth + Storage). Projeto
desenvolvido por etapas.

> **Etapa atual (Grupo 1):** Autenticação (Login e Primeiro acesso) +
> Navegação por abas com as telas **Início**, **Busca**, **Favoritos** e
> **Mais**, todas conectadas ao Supabase.

---

## 1. Estrutura do projeto

```
sistema-gestao-qualidade/
├── app/                → Aplicativo (Expo + TypeScript), publicado como site/PWA
├── supabase/
│   ├── migrations/      → Schema do banco (tabelas, RLS, triggers) — rodar no SQL Editor
│   └── functions/       → Edge Function usada para cadastrar colaboradores
└── backend/             → (Descontinuado) API Express + SQLite antiga, mantida só de referência local
```

O app fala **direto com o Supabase** (`@supabase/supabase-js`) — não existe
mais um servidor próprio para hospedar. A pasta `backend/` não é mais usada
em produção.

---

## 2. Como colocar no ar (produção)

### Passo A — Banco de dados (Supabase)

1. Abra o projeto Supabase (`setti-qualidade`) → **SQL Editor** → New query.
2. Cole o conteúdo de `supabase/migrations/0001_schema_inicial.sql` inteiro e
   rode. Isso cria as tabelas, as regras de acesso (RLS) e o bucket de
   arquivos `anexos`.
3. Crie o primeiro administrador (não existe mais tela de "Cadastro"
   público — só um admin pode criar os demais acessos):
   - **Authentication > Users > Add user**: preencha e-mail e senha, marque
     **Auto Confirm User**.
   - No **SQL Editor**, rode (trocando o e-mail):
     ```sql
     update public.profiles
     set perfil = 'Administrador', status = 'Ativo'
     where email = 'seu-email@empresa.com';
     ```
   - Pronto: esse login já entra no app como administrador e pode cadastrar
     os demais colaboradores pela tela "Gestão de colaboradores".

### Passo B — Edge Function (cadastro de colaboradores)

O cadastro de novos colaboradores (feito pelo administrador, dentro do app)
precisa de uma função de borda porque cria um login novo no Supabase Auth.

Com a [Supabase CLI](https://supabase.com/docs/guides/cli) instalada e
logada (`supabase login`, depois `supabase link --project-ref SEU_PROJECT_REF`):

```bash
supabase functions deploy cadastrar-colaborador
```

Sem CLI: cole o conteúdo de `supabase/functions/cadastrar-colaborador/index.ts`
direto em **Edge Functions > Create a new function** no painel do Supabase.

### Passo C — Pegar as chaves do Supabase

Em **Project Settings > API**, copie:
- **Project URL**
- **anon public key**

### Passo D — Publicar o site (Vercel)

1. Crie uma conta na [Vercel](https://vercel.com) (dá pra logar com a conta
   do GitHub) e clique em **Add New > Project**, escolhendo o repositório
   `eduardawelter997/sistema-gestao-qualidade`.
2. Configure:
   - **Root Directory**: `app`
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `dist`
3. Em **Environment Variables**, adicione (com os valores do Passo C):
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. A Vercel gera um link (tipo
   `https://sistema-gestao-qualidade.vercel.app`) — esse é o link pra
   compartilhar com quem for usar o app.
5. Cada push na branch `main` gera um novo deploy automaticamente.

### Passo E — Usar no celular

Abra o link no navegador do celular (Chrome no Android, Safari no iPhone) e:
- **Android (Chrome)**: menu (⋮) > "Adicionar à tela inicial" / "Instalar app".
- **iPhone (Safari)**: botão de compartilhar (□↑) > "Adicionar à Tela de Início".

O app abre em tela cheia, como um aplicativo instalado.

---

## 3. Como rodar localmente (desenvolvimento)

```bash
cd app
npm install
cp .env.example .env      # preencha com a URL e a anon key do Supabase
npm start
```

Depois:
- **Navegador:** pressione `w` no terminal (ou `npm run web`).
- **Emulador Android:** pressione `a`.
- **Simulador iOS (Mac):** pressione `i`.
- **Celular físico:** abra o **Expo Go** e escaneie o QR Code.

Não é mais necessário rodar nenhum back-end local — o app conecta direto no
Supabase configurado no `.env`.

---

## 4. O que já funciona nesta etapa

- **Login / Primeiro acesso** via Supabase Auth. Sessão salva no dispositivo
  (não precisa logar toda vez).
- **Recuperação de senha** por e-mail (link enviado pelo Supabase).
- **Início (Dashboard):** números da "Visão geral" e registros recentes.
- **Busca:** pesquisa por texto e filtro por tipo (OP, Ocorrência, Ações).
- **Favoritos:** marcar/desmarcar registros com estrela.
- **Mais:** perfil do usuário logado, gestão de colaboradores (admin) e menu
  de navegação.

## 5. Próximas etapas (a desenvolver)

Fluxos de registro (Nova OP, Detalhes da OP, Nova ocorrência, Recebimento),
Gestão de funcionários e Indicadores gerenciais.

---

## 6. Tecnologias

**App:** React Native, Expo (SDK 51, exportado como web/PWA), TypeScript,
React Navigation (abas + pilha), `@supabase/supabase-js`.
**Banco/Backend:** Supabase (Postgres, Auth, Storage, Row Level Security,
Edge Functions).
