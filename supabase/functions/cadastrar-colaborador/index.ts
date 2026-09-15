// Edge Function: cadastrar-colaborador
//
// Único fluxo que precisa de privilégio elevado (criar um usuário de Auth
// "pré-provisionado" por um administrador — equivalente ao antigo
// POST /api/auth/cadastrar-colaborador do backend Express). Roda no
// servidor do Supabase, nunca no app: a service role key fica só aqui.
//
// Deploy (uma vez, com a Supabase CLI já logada no projeto):
//   supabase functions deploy cadastrar-colaborador
//
// Ou cole este arquivo direto no dashboard: Edge Functions > Create a new
// function > cole o conteúdo.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ erro: 'Método não permitido.' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ erro: 'Não autenticado.' }, 401);
  }

  // Cliente "como o usuário que chamou" — só serve pra descobrir quem é e
  // conferir se é administrador ativo (mesma regra de autorizarAdministrador).
  const clienteChamador = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErro } = await clienteChamador.auth.getUser();
  if (userErro || !userData?.user) {
    return json({ erro: 'Não autenticado.' }, 401);
  }

  const { data: perfilChamador, error: perfilErro } = await clienteChamador
    .from('profiles')
    .select('perfil, status')
    .eq('id', userData.user.id)
    .single();

  const autorizado =
    !perfilErro &&
    perfilChamador?.status === 'Ativo' &&
    perfilChamador?.perfil?.toLowerCase() === 'administrador';

  if (!autorizado) {
    return json({ erro: 'Acesso permitido somente para administradores.' }, 403);
  }

  let corpo: any;
  try {
    corpo = await req.json();
  } catch {
    return json({ erro: 'Corpo da requisição inválido.' }, 400);
  }

  const { nome, email, senha, perfil, setor } = corpo ?? {};
  if (!nome || !email || !senha || !perfil || !setor) {
    return json({ erro: 'Preencha todos os campos obrigatórios.' }, 400);
  }

  // Cliente com service role: única peça com permissão de criar usuários de
  // Auth diretamente. Nunca exposto ao app — só existe dentro da function.
  const clienteAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: criado, error: erroCriacao } = await clienteAdmin.auth.admin.createUser({
    email: String(email).toLowerCase(),
    password: senha,
    email_confirm: true,
    user_metadata: { nome, perfil, setor, status: 'Pendente' },
  });

  if (erroCriacao) {
    const jaExiste = /already been registered|already exists/i.test(erroCriacao.message);
    return json(
      { erro: jaExiste ? 'Este e-mail já está cadastrado.' : erroCriacao.message },
      jaExiste ? 409 : 500
    );
  }

  return json(
    { mensagem: 'Colaborador cadastrado com sucesso!', usuario: { id: criado.user?.id, email, nome } },
    201
  );
});
