-- Sistema de Gestão da Qualidade — schema inicial no Supabase (Postgres)
-- Substitui o backend Express + SQLite. Cole este arquivo inteiro no
-- SQL Editor do Supabase (Project > SQL Editor > New query) e rode uma vez.
--
-- Espelha as tabelas de backend/src/db.js, mas com:
--  - usuários geridos pelo Supabase Auth (auth.users) + tabela `profiles`
--    para os dados extras (nome, cargo, setor, perfil, status);
--  - toda a autorização que antes vivia nas rotas Express (auth-middleware,
--    autorizacao-middleware, permissao-middleware) reimplementada como
--    Row Level Security (RLS) + triggers.

-- =========================================================================
-- 1. PROFILES (dados extras de cada usuário, 1:1 com auth.users)
-- =========================================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  email      text not null,
  cargo      text not null default 'Colaborador',
  setor      text not null default 'Qualidade',
  perfil     text not null default 'Colaborador',
  status     text not null default 'Ativo', -- 'Ativo' | 'Pendente' | 'Inativo'
  criado_em  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- =========================================================================
-- 2. PERMISSÕES POR USUÁRIO (mesmas 7 permissões do sistema atual)
-- =========================================================================
create table public.permissoes_usuario (
  usuario_id              uuid primary key references public.profiles(id) on delete cascade,
  registrar_recebimentos  boolean not null default false,
  cadastrar_clientes      boolean not null default false,
  adicionar_fotos         boolean not null default false,
  registrar_problemas     boolean not null default false,
  definir_causa_raiz      boolean not null default false,
  encerrar_acoes          boolean not null default false,
  avaliar_eficacia        boolean not null default false
);

alter table public.permissoes_usuario enable row level security;

-- =========================================================================
-- 3. Funções auxiliares usadas pelas policies e triggers
-- =========================================================================
create or replace function public.usuario_ativo()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'Ativo'
  );
$$;

create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'Ativo' and lower(perfil) = 'administrador'
  );
$$;

create or replace function public.tem_permissao(permissao text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select case permissao
      when 'registrar_recebimentos' then pu.registrar_recebimentos
      when 'cadastrar_clientes'     then pu.cadastrar_clientes
      when 'adicionar_fotos'        then pu.adicionar_fotos
      when 'registrar_problemas'    then pu.registrar_problemas
      when 'definir_causa_raiz'     then pu.definir_causa_raiz
      when 'encerrar_acoes'         then pu.encerrar_acoes
      when 'avaliar_eficacia'       then pu.avaliar_eficacia
      else false
    end
    from public.permissoes_usuario pu
    join public.profiles p on p.id = pu.usuario_id
    where pu.usuario_id = auth.uid() and p.status = 'Ativo'
  ), false);
$$;

-- =========================================================================
-- 4. Criação automática do profile + permissões quando um usuário é criado
--    no Supabase Auth (self-service ou via Edge Function de convite).
--    Lê nome/perfil/setor/status de user_metadata quando presentes
--    (é o que a Edge Function `cadastrar-colaborador` envia).
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email, cargo, setor, perfil, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'perfil', 'Colaborador'),
    coalesce(new.raw_user_meta_data->>'setor', 'Qualidade'),
    coalesce(new.raw_user_meta_data->>'perfil', 'Colaborador'),
    coalesce(new.raw_user_meta_data->>'status', 'Ativo')
  );
  insert into public.permissoes_usuario (usuario_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- 5. Policies de profiles / permissoes_usuario
-- =========================================================================

-- Qualquer autenticado vê seu próprio perfil, perfis Ativos (dropdown de
-- "Responsável") e administradores veem todo mundo (Gestão de Colaboradores).
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or status = 'Ativo' or public.eh_admin());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.eh_admin())
  with check (id = auth.uid() or public.eh_admin());

-- Trava a nível de coluna: um usuário comum só edita nome/email do próprio
-- perfil; cargo/setor/perfil/status só um administrador pode alterar
-- (equivalente às rotas /atualizar-perfil-setor, /ativar-colaborador,
-- /desativar-colaborador, que hoje exigem autorizarAdministrador).
create or replace function public.verificar_update_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() só existe quando a query passa pelo PostgREST/Auth do
  -- Supabase (o app). Uma query direta no SQL Editor (só quem tem acesso
  -- ao painel do projeto) não tem esse contexto — libera nesse caso.
  if auth.uid() is null then
    return new;
  end if;
  if not public.eh_admin() then
    if old.id <> auth.uid() then
      raise exception 'Você só pode editar o seu próprio perfil.' using errcode = '42501';
    end if;
    if new.perfil is distinct from old.perfil
      or new.cargo is distinct from old.cargo
      or new.setor is distinct from old.setor then
      raise exception 'Você não possui permissão para alterar esses dados.' using errcode = '42501';
    end if;
    -- Única transição de status que um usuário comum pode fazer em si mesmo:
    -- autoativação no fluxo "Primeiro acesso" (Pendente -> Ativo).
    if new.status is distinct from old.status
      and not (old.status = 'Pendente' and new.status = 'Ativo') then
      raise exception 'Você não possui permissão para alterar esses dados.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_profiles_bu
  before update on public.profiles
  for each row execute function public.verificar_update_profile();

-- Permissões: só administrador lê/edita (igual a GET/PUT /permissoes/:id).
create policy permissoes_admin on public.permissoes_usuario
  for all to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

-- =========================================================================
-- 6. REGISTROS (tabela polimórfica: OP, ocorrência, ação, recebimento,
--    cliente, fornecedor — igual à tabela `registros` do SQLite)
-- =========================================================================
create sequence public.registros_codigo_seq;

create table public.registros (
  id                        bigint generated always as identity primary key,
  tipo                      text not null,
  codigo                    text not null,
  titulo                    text not null,
  descricao                 text,
  status                    text not null,
  data                      text not null,       -- mantido como "DD/MM/AAAA" (mesmo formato usado nas telas)
  -- data_iso não é coluna gerada porque to_date() não é IMMUTABLE no Postgres
  -- (exigido para "generated always as ... stored"); é preenchida pela
  -- trigger verificar_registro() abaixo, em INSERT e UPDATE.
  data_iso                  date,
  favorito                  boolean not null default false,
  criado_por                uuid references public.profiles(id),
  criado_em                 timestamptz not null default now(),
  op_id                     bigint references public.registros(id),
  responsavel               text,
  produto                   text,
  processo                  text,
  lote                      text,
  quantidade                text,
  disposicao                text,
  origem                    text,
  metodo_analise            text,
  analise_causa             text,
  op_relacionada_id         bigint references public.registros(id),
  ocorrencia_relacionada_id bigint references public.registros(id),
  cliente_fornecedor_id     bigint references public.registros(id),
  nota_fiscal               text,
  com_problema              boolean not null default false,
  avaliacao_eficacia        text default 'Aguardando avaliação',
  concluido_em              timestamptz
);

create index registros_tipo_idx on public.registros (tipo);
create index registros_op_id_idx on public.registros (op_id);
create index registros_data_iso_idx on public.registros (data_iso);
create index registros_favorito_idx on public.registros (favorito) where favorito;

alter table public.registros enable row level security;

create policy registros_select on public.registros
  for select to authenticated
  using (public.usuario_ativo());

-- As permissões específicas por tipo (cadastrar_clientes, registrar_recebimentos
-- etc.) ficam na trigger abaixo em vez de aqui, pra poder devolver a mesma
-- mensagem de erro amigável que o backend antigo devolvia (RLS sozinha só
-- devolveria "new row violates row-level security policy").
create policy registros_insert on public.registros
  for insert to authenticated
  with check (public.usuario_ativo());

create policy registros_update on public.registros
  for update to authenticated
  using (public.usuario_ativo())
  with check (public.usuario_ativo());

-- Gera o código automático (OP-2026-000123 etc, igual ao PREFIXOS_CODIGO do
-- backend antigo) e marca concluido_em/valida permissões de edição.
create or replace function public.verificar_registro()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  prefixo text;
begin
  if TG_OP = 'INSERT' then
    if new.codigo is null or new.codigo = '' then
      prefixo := case new.tipo
        when 'op' then 'OP' when 'ocorrencia' then 'OC'
        when 'acao' then 'AC' when 'recebimento' then 'REC'
        else 'REG' end;
      new.codigo := prefixo || '-' || extract(year from now())::text || '-'
        || lpad(nextval('public.registros_codigo_seq')::text, 6, '0');
    end if;
    if new.status is null or new.status = '' then
      new.status := 'Em andamento';
    end if;
    if new.data is null or new.data = '' then
      new.data := to_char(now(), 'DD/MM/YYYY');
    end if;
    if new.data ~ '^\d{2}/\d{2}/\d{4}$' then
      new.data_iso := to_date(new.data, 'DD/MM/YYYY');
    else
      new.data_iso := null;
    end if;
    if new.tipo in ('cliente', 'fornecedor') and not public.tem_permissao('cadastrar_clientes') then
      raise exception 'Você não possui permissão para cadastrar clientes ou fornecedores.' using errcode = '42501';
    end if;
    if new.tipo = 'recebimento' and not public.tem_permissao('registrar_recebimentos') then
      raise exception 'Você não possui permissão para registrar recebimentos.' using errcode = '42501';
    end if;
    if new.tipo = 'recebimento' and new.com_problema and not public.tem_permissao('registrar_problemas') then
      raise exception 'Você não possui permissão para registrar problemas no recebimento.' using errcode = '42501';
    end if;
    if new.tipo = 'acao' and new.analise_causa is not null and not public.tem_permissao('definir_causa_raiz') then
      raise exception 'Você não possui permissão para definir a causa raiz.' using errcode = '42501';
    end if;
    return new;
  end if;

  -- TG_OP = 'UPDATE'
  if new.data ~ '^\d{2}/\d{2}/\d{4}$' then
    new.data_iso := to_date(new.data, 'DD/MM/YYYY');
  else
    new.data_iso := null;
  end if;
  if old.op_id is not null and old.status <> 'Em andamento' then
    raise exception 'Só é possível editar registros que estejam "Em andamento".' using errcode = '42501';
  end if;
  if new.analise_causa is distinct from old.analise_causa
    and not public.tem_permissao('definir_causa_raiz') then
    raise exception 'Você não possui permissão para definir a causa raiz.' using errcode = '42501';
  end if;
  if new.tipo = 'acao' and new.status = 'Concluído' and old.status is distinct from 'Concluído'
    and not public.tem_permissao('encerrar_acoes') then
    raise exception 'Você não possui permissão para encerrar ações corretivas.' using errcode = '42501';
  end if;
  if new.avaliacao_eficacia is distinct from old.avaliacao_eficacia
    and not public.tem_permissao('avaliar_eficacia') then
    raise exception 'Você não possui permissão para avaliar a eficácia.' using errcode = '42501';
  end if;
  if new.tipo = 'recebimento' and new.com_problema is distinct from old.com_problema
    and not public.tem_permissao('registrar_problemas') then
    raise exception 'Você não possui permissão para registrar problemas no recebimento.' using errcode = '42501';
  end if;
  if new.status = 'Concluído' and old.status is distinct from 'Concluído' then
    new.concluido_em := now();
  end if;
  return new;
end;
$$;

create trigger trg_registros_bi before insert on public.registros
  for each row execute function public.verificar_registro();

create trigger trg_registros_bu before update on public.registros
  for each row execute function public.verificar_registro();

-- =========================================================================
-- 7. ANEXOS (metadados dos arquivos; os arquivos em si ficam no Storage)
-- =========================================================================
create table public.anexos (
  id            bigint generated always as identity primary key,
  registro_id   bigint not null references public.registros(id) on delete cascade,
  nome_arquivo  text not null,
  caminho       text not null, -- caminho do objeto no bucket "anexos"
  tamanho       bigint,
  tipo_mime     text,
  criado_em     timestamptz not null default now()
);

create index anexos_registro_id_idx on public.anexos (registro_id);

alter table public.anexos enable row level security;

create policy anexos_select on public.anexos
  for select to authenticated
  using (public.usuario_ativo());

create policy anexos_insert on public.anexos
  for insert to authenticated
  with check (public.usuario_ativo() and public.tem_permissao('adicionar_fotos'));

create policy anexos_delete on public.anexos
  for delete to authenticated
  using (public.usuario_ativo() and public.tem_permissao('adicionar_fotos'));

-- =========================================================================
-- 8. STORAGE — bucket "anexos" (fotos/documentos), mesmo limite/allowlist
--    de backend/src/upload.js (5MB, jpeg/png/webp/pdf)
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'anexos', 'anexos', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
)
on conflict (id) do nothing;

create policy anexos_storage_select on storage.objects
  for select to authenticated
  using (bucket_id = 'anexos' and public.usuario_ativo());

create policy anexos_storage_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'anexos' and public.usuario_ativo() and public.tem_permissao('adicionar_fotos'));

create policy anexos_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'anexos' and public.usuario_ativo() and public.tem_permissao('adicionar_fotos'));

-- =========================================================================
-- 9. Bootstrap do primeiro administrador (leia antes de usar o app)
-- =========================================================================
-- Não existe mais tela de "Cadastro" público — contas só são criadas por um
-- administrador (tela "Cadastrar novo acesso"). Para o primeiríssimo acesso,
-- que precisa ser administrador, crie o usuário manualmente:
--
--   1. No painel do Supabase: Authentication > Users > Add user
--      (preencha e-mail e senha, marque "Auto Confirm User").
--   2. Rode no SQL Editor (troque o e-mail):
--
--      update public.profiles
--      set perfil = 'Administrador', status = 'Ativo'
--      where email = 'seu-email@empresa.com';
--
-- A partir daí, esse administrador consegue cadastrar os demais
-- colaboradores pela própria tela do app.
