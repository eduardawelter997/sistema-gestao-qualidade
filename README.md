# Sistema de Gestão da Qualidade — Grupo Setti

Aplicativo mobile (React Native + Expo + TypeScript) com back-end próprio
(Node.js + Express + SQLite). Projeto desenvolvido por etapas.

> **Etapa atual (Grupo 1):** Autenticação (Login e Cadastro) + Navegação por
> abas com as telas **Início**, **Busca**, **Favoritos** e **Mais**, todas
> conectadas a uma **API real** com banco de dados.

---

## 1. Estrutura do projeto

```
sistema-gestao-qualidade/
├── app/         → Aplicativo mobile (Expo + TypeScript)
└── backend/     → API REST (Node.js + Express + SQLite)
```

- **app/** — o que roda no celular/emulador.
- **backend/** — a API que guarda usuários e registros num banco SQLite
  (um único arquivo `database.sqlite`).

O app conversa com o back-end pela rede local.

---

## 2. Pré-requisitos (instalar uma vez)

1. **Node.js LTS 18+** — https://nodejs.org
2. App **Expo Go** no celular (Play Store / App Store) **ou** um
   emulador Android (Android Studio) / simulador iOS (Xcode, só no Mac).

---

## 3. Como rodar (passo a passo)

O projeto tem **duas partes que rodam ao mesmo tempo**: primeiro o back-end,
depois o app. Use **dois terminais**.

### Passo A — Back-end (API)

```bash
cd backend
npm install        # instala as dependências (só na 1ª vez)
npm run seed       # cria o banco e insere dados de exemplo (só na 1ª vez)
npm start          # inicia a API em http://localhost:3000
```

Deixe esse terminal aberto. Para testar se subiu, acesse
`http://localhost:3000` no navegador — deve aparecer um JSON com `ok: true`.

### Passo B — Aplicativo

Abra **outro terminal**:

```bash
cd app
npm install        # instala as dependências (só na 1ª vez)
npm start          # inicia o Expo
```

Depois:

- **Emulador Android:** pressione `a` no terminal.
- **Simulador iOS (Mac):** pressione `i`.
- **Celular físico:** abra o **Expo Go** e escaneie o QR Code.

### Passo C — Apontar o app para a API (importante!)

Abra `app/src/config/api.ts` e escolha a URL certa conforme onde vai testar:

| Onde você testa           | URL a usar                       |
|---------------------------|----------------------------------|
| Emulador Android          | `http://10.0.2.2:3000`           |
| Simulador iOS (Mac)       | `http://localhost:3000`          |
| Celular físico (Expo Go)  | `http://SEU_IP_LOCAL:3000`       |

Para descobrir seu IP local: `ipconfig` (Windows) ou `ifconfig` / `ip a`
(Mac/Linux). O celular e o PC precisam estar na **mesma rede Wi-Fi**.

---

## 4. Usuário de teste

O comando `npm run seed` cria um usuário pronto para login:

- **E-mail:** `carlos@setti.com`
- **Senha:** `123456`

Você também pode criar uma conta nova pela tela de **Cadastro** — ela grava
de verdade no banco.

---

## 5. O que já funciona nesta etapa

- **Login / Cadastro** reais: senha criptografada (bcrypt) e autenticação por
  token (JWT). O login fica salvo no aparelho (não precisa logar toda vez).
- **Início (Dashboard):** números da "Visão geral" e registros recentes vindos
  da API.
- **Busca:** pesquisa por texto e filtro por tipo (OP, Ocorrência, Ações),
  consultando o banco em tempo real.
- **Favoritos:** marcar/desmarcar registros com estrela — a mudança é gravada
  no banco.
- **Mais:** perfil do usuário logado e menu de navegação. Sair do app.

## 6. Próximas etapas (a desenvolver)

Fluxos de registro (Nova OP, Detalhes da OP, Nova ocorrência, Recebimento),
Gestão de funcionários e Indicadores gerenciais.

---

## 7. Tecnologias

**App:** React Native, Expo (SDK 51), TypeScript, React Navigation
(abas + pilha), AsyncStorage.
**Back-end:** Node.js, Express, SQLite (better-sqlite3), JWT, bcryptjs.
