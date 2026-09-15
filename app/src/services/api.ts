/**
 * Camada de acesso a dados do app.
 * Antes falava com o backend Express via fetch(); agora fala direto com o
 * Supabase (Postgres + Auth + Storage). Os nomes e formatos exportados aqui
 * foram mantidos iguais aos de antes de propósito, pra não precisar mexer
 * nas telas que os consomem — só a implementação por dentro mudou.
 */
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// Tipos usados pelas telas
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  perfil: string;
  status: string;
}

export interface Registro {
  id: number;
  tipo: string;
  codigo: string;
  titulo: string;
  descricao: string;
  status: string;
  data: string;
  data_iso?: string | null;
  favorito: number;
  criado_em?: string;
  concluido_em?: string | null;
  responsavel?: string | null;
  produto?: string | null;
  processo?: string | null;
  op_id?: number | null;
  lote?: string | null;
  quantidade?: string | null;
  disposicao?: string | null;
  origem?: string | null;
  metodo_analise?: string | null;
  analise_causa?: string | null;
  op_relacionada_id?: number | null;
  ocorrencia_relacionada_id?: number | null;
  cliente_fornecedor_id?: number | null;
  nota_fiscal?: string | null;
  com_problema?: number | null;
  avaliacao_eficacia?: string | null;
}

export interface Anexo {
  id: number;
  registro_id: number;
  nome_arquivo: string;
  url: string;
  tamanho?: number | null;
  tipo_mime?: string | null;
  criado_em?: string;
}

export interface UsuarioResumo {
  id: string;
  nome: string;
  cargo: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  perfil: string;
  status: string;
  criado_em?: string;
}

export interface Permissoes {
  registrarRecebimentos: boolean;
  cadastrarClientes: boolean;
  adicionarFotos: boolean;
  registrarProblemas: boolean;
  definirCausaRaiz: boolean;
  encerrarAcoes: boolean;
  avaliarEficacia: boolean;
}

function tratarErro(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// O banco guarda favorito/com_problema como boolean (true/false); as telas
// já esperam 0/1 (era assim que o SQLite devolvia) — converte na fronteira
// pra não precisar tocar nas telas.
function mapRegistro(row: any): Registro {
  return {
    ...row,
    favorito: row.favorito ? 1 : 0,
    com_problema: row.com_problema ? 1 : 0,
  };
}

function mapUsuario(p: any): Usuario {
  return {
    id: p.id,
    nome: p.nome,
    email: p.email,
    cargo: p.cargo,
    setor: p.setor,
    perfil: p.perfil,
    status: p.status,
  };
}

// ---- Autenticação ----
export async function login(email: string, senha: string): Promise<{ usuario: Usuario }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password: senha,
  });
  if (error || !data.user) {
    throw new Error('E-mail ou senha inválidos.');
  }

  const { data: perfil, error: erroPerfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (erroPerfil || !perfil) {
    await supabase.auth.signOut();
    throw new Error('Não foi possível carregar seu perfil.');
  }
  if (perfil.status === 'Pendente') {
    await supabase.auth.signOut();
    throw new Error(
      'Este acesso ainda não foi ativado. Use "Primeiro acesso" com a senha inicial cadastrada pelo gestor.'
    );
  }
  if (perfil.status === 'Inativo') {
    await supabase.auth.signOut();
    throw new Error('Este acesso foi desativado. Fale com o administrador.');
  }

  return { usuario: mapUsuario(perfil) };
}

// Recuperação de senha: agora usa o fluxo nativo de e-mail do Supabase (um
// link, não mais um código fixo). solicitarRecuperacaoSenha manda o link;
// redefinirSenhaComSessaoRecuperacao troca a senha usando a sessão temporária
// que o Supabase cria quando a pessoa clica no link.
export async function solicitarRecuperacaoSenha(email: string): Promise<void> {
  const redirectTo =
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), { redirectTo });
  tratarErro(error);
}

export async function redefinirSenhaComSessaoRecuperacao(novaSenha: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  tratarErro(error);
}

export async function buscarPerfil(): Promise<{ usuario: Usuario }> {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) throw new Error('Não autenticado.');

  const { data, error } = await supabase.from('profiles').select('*').eq('id', sessao.user.id).single();
  tratarErro(error);

  return { usuario: mapUsuario(data) };
}

export async function atualizarMeuPerfil(nome: string, email: string): Promise<{ mensagem: string }> {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) throw new Error('Não autenticado.');

  const { error } = await supabase
    .from('profiles')
    .update({ nome, email: email.toLowerCase() })
    .eq('id', sessao.user.id);
  tratarErro(error);

  return { mensagem: 'Perfil atualizado com sucesso!' };
}

export async function alterarSenha(senhaAtual: string, novaSenha: string): Promise<{ mensagem: string }> {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user?.email) throw new Error('Não autenticado.');

  // Confere a senha atual reautenticando (o Supabase não expõe "verificar
  // senha" direto); se a senha atual estiver errada, isso já falha aqui.
  const { error: erroConferencia } = await supabase.auth.signInWithPassword({
    email: sessao.user.email,
    password: senhaAtual,
  });
  if (erroConferencia) {
    throw new Error('A senha atual está incorreta.');
  }

  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  tratarErro(error);

  return { mensagem: 'Senha alterada com sucesso!' };
}

// ---- Gestão de colaboradores (só administrador) ----
export async function listarColaboradores(): Promise<{ colaboradores: Colaborador[] }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, email, cargo, setor, perfil, status, criado_em')
    .order('criado_em', { ascending: false });
  tratarErro(error);

  return { colaboradores: data ?? [] };
}

export async function cadastrarColaborador(dados: {
  nome: string;
  email: string;
  senha: string;
  perfil: string;
  setor: string;
}): Promise<{ mensagem: string }> {
  const { data, error } = await supabase.functions.invoke('cadastrar-colaborador', {
    body: dados,
  });
  if (error) {
    const mensagem = (data as any)?.erro || error.message || 'Não foi possível cadastrar o colaborador.';
    throw new Error(mensagem);
  }
  return data as { mensagem: string };
}

export async function desativarColaborador(id: string): Promise<{ mensagem: string }> {
  const { error } = await supabase.from('profiles').update({ status: 'Inativo' }).eq('id', id);
  tratarErro(error);
  return { mensagem: 'Colaborador desativado com sucesso!' };
}

export async function ativarColaborador(id: string): Promise<{ mensagem: string }> {
  const { error } = await supabase.from('profiles').update({ status: 'Ativo' }).eq('id', id);
  tratarErro(error);
  return { mensagem: 'Colaborador ativado com sucesso!' };
}

export async function atualizarPerfilSetor(
  id: string,
  perfil: string,
  setor: string
): Promise<{ mensagem: string }> {
  const { error } = await supabase.from('profiles').update({ perfil, setor, cargo: perfil }).eq('id', id);
  tratarErro(error);
  return { mensagem: 'Dados atualizados com sucesso!' };
}

function mapPermissoes(row: any): Permissoes {
  return {
    registrarRecebimentos: !!row.registrar_recebimentos,
    cadastrarClientes: !!row.cadastrar_clientes,
    adicionarFotos: !!row.adicionar_fotos,
    registrarProblemas: !!row.registrar_problemas,
    definirCausaRaiz: !!row.definir_causa_raiz,
    encerrarAcoes: !!row.encerrar_acoes,
    avaliarEficacia: !!row.avaliar_eficacia,
  };
}

export async function buscarPermissoesColaborador(id: string): Promise<{ permissoes: Permissoes }> {
  const { data, error } = await supabase.from('permissoes_usuario').select('*').eq('usuario_id', id).single();
  tratarErro(error);
  return { permissoes: mapPermissoes(data) };
}

export async function salvarPermissoesColaborador(
  id: string,
  permissoes: Permissoes
): Promise<{ mensagem: string }> {
  const { error } = await supabase
    .from('permissoes_usuario')
    .update({
      registrar_recebimentos: permissoes.registrarRecebimentos,
      cadastrar_clientes: permissoes.cadastrarClientes,
      adicionar_fotos: permissoes.adicionarFotos,
      registrar_problemas: permissoes.registrarProblemas,
      definir_causa_raiz: permissoes.definirCausaRaiz,
      encerrar_acoes: permissoes.encerrarAcoes,
      avaliar_eficacia: permissoes.avaliarEficacia,
    })
    .eq('usuario_id', id);
  tratarErro(error);
  return { mensagem: 'Permissões salvas com sucesso.' };
}

// ---- Registros / dashboard ----
export interface DashboardResposta {
  overview: {
    opsEmAndamento: number;
    ocorrenciasAbertas: number;
    acoesAtrasadas: number;
    aguardandoAvaliacao: number;
  };
  recentes: Registro[];
}

export async function buscarDashboard(): Promise<DashboardResposta> {
  const contar = async (montar: (q: any) => any) => {
    const { count, error } = await montar(
      supabase.from('registros').select('id', { count: 'exact', head: true })
    );
    tratarErro(error);
    return count ?? 0;
  };

  const [opsEmAndamento, ocorrenciasAbertas, acoesAtrasadas, aguardandoAvaliacao, recentesResp] =
    await Promise.all([
      contar((q) => q.eq('tipo', 'op').eq('status', 'Em andamento')),
      contar((q) => q.eq('tipo', 'ocorrencia').eq('status', 'Aberta')),
      contar((q) => q.eq('status', 'Atrasada')),
      contar((q) => q.eq('status', 'Aguardando avaliação')),
      supabase
        .from('registros')
        .select('*')
        .is('op_id', null)
        .not('tipo', 'in', '(cliente,fornecedor)')
        .order('id', { ascending: false })
        .limit(5),
    ]);
  tratarErro(recentesResp.error);

  return {
    overview: { opsEmAndamento, ocorrenciasAbertas, acoesAtrasadas, aguardandoAvaliacao },
    recentes: (recentesResp.data ?? []).map(mapRegistro),
  };
}

export async function listarRegistros(tipo = 'todos', q = ''): Promise<{ registros: Registro[] }> {
  let query = supabase.from('registros').select('*').is('op_id', null);

  if (tipo && tipo !== 'todos') {
    query = query.eq('tipo', tipo);
  } else {
    query = query.not('tipo', 'in', '(cliente,fornecedor)');
  }
  if (q) {
    const like = `%${q}%`;
    query = query.or(`codigo.ilike.${like},titulo.ilike.${like},descricao.ilike.${like}`);
  }

  const { data, error } = await query.order('id', { ascending: false });
  tratarErro(error);
  return { registros: (data ?? []).map(mapRegistro) };
}

export async function listarFavoritos(): Promise<{ registros: Registro[] }> {
  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .eq('favorito', true)
    .is('op_id', null)
    .not('tipo', 'in', '(cliente,fornecedor)')
    .order('id', { ascending: false });
  tratarErro(error);
  return { registros: (data ?? []).map(mapRegistro) };
}

export async function alternarFavorito(id: number): Promise<{ id: number; favorito: number }> {
  const { data: atual, error: erroSelect } = await supabase
    .from('registros')
    .select('favorito')
    .eq('id', id)
    .single();
  tratarErro(erroSelect);

  const novoValor = !atual!.favorito;
  const { error } = await supabase.from('registros').update({ favorito: novoValor }).eq('id', id);
  tratarErro(error);

  return { id, favorito: novoValor ? 1 : 0 };
}

export async function criarRegistro(dados: {
  tipo: string;
  titulo: string;
  descricao?: string;
  status?: string;
  codigo?: string;
  responsavel?: string;
  produto?: string;
  processo?: string;
  opId?: number;
  data?: string;
  lote?: string;
  quantidade?: string;
  disposicao?: string;
  origem?: string;
  metodoAnalise?: string;
  analiseCausa?: string;
  opRelacionadaId?: number;
  ocorrenciaRelacionadaId?: number;
  clienteFornecedorId?: number;
  notaFiscal?: string;
  comProblema?: boolean;
}): Promise<{ id: number; sucesso: boolean }> {
  if (!dados.titulo) {
    throw new Error('O título/nome é obrigatório.');
  }

  const payload = {
    tipo: dados.tipo || 'op',
    titulo: dados.titulo,
    descricao: dados.descricao || '',
    status: dados.status || undefined,
    codigo: dados.codigo || undefined,
    responsavel: dados.responsavel || null,
    produto: dados.produto || null,
    processo: dados.processo || null,
    op_id: dados.opId || null,
    data: dados.data || undefined,
    lote: dados.lote || null,
    quantidade: dados.quantidade || null,
    disposicao: dados.disposicao || null,
    origem: dados.origem || null,
    metodo_analise: dados.metodoAnalise || null,
    analise_causa: dados.analiseCausa || null,
    op_relacionada_id: dados.opRelacionadaId || null,
    ocorrencia_relacionada_id: dados.ocorrenciaRelacionadaId || null,
    cliente_fornecedor_id: dados.clienteFornecedorId || null,
    nota_fiscal: dados.notaFiscal || null,
    com_problema: !!dados.comProblema,
  };

  const { data, error } = await supabase.from('registros').insert(payload).select('id').single();
  tratarErro(error);

  return { id: data!.id, sucesso: true };
}

export async function buscarRegistro(id: number): Promise<{ registro: Registro }> {
  const { data, error } = await supabase.from('registros').select('*').eq('id', id).single();
  tratarErro(error);
  return { registro: mapRegistro(data) };
}

export async function atualizarRegistro(
  id: number,
  dados: {
    tipo?: string;
    titulo?: string;
    descricao?: string;
    status?: string;
    responsavel?: string;
    produto?: string;
    processo?: string;
    data?: string;
    lote?: string;
    quantidade?: string;
    disposicao?: string;
    origem?: string;
    metodoAnalise?: string;
    analiseCausa?: string;
    opRelacionadaId?: number | null;
    ocorrenciaRelacionadaId?: number | null;
    clienteFornecedorId?: number | null;
    notaFiscal?: string;
    comProblema?: boolean;
    avaliacaoEficacia?: string;
  }
): Promise<{ sucesso: boolean }> {
  const payload: Record<string, any> = {};
  if (dados.tipo !== undefined) payload.tipo = dados.tipo;
  if (dados.titulo !== undefined) payload.titulo = dados.titulo;
  if (dados.descricao !== undefined) payload.descricao = dados.descricao;
  if (dados.status !== undefined) payload.status = dados.status;
  if (dados.responsavel !== undefined) payload.responsavel = dados.responsavel;
  if (dados.produto !== undefined) payload.produto = dados.produto;
  if (dados.processo !== undefined) payload.processo = dados.processo;
  if (dados.data !== undefined) payload.data = dados.data;
  if (dados.lote !== undefined) payload.lote = dados.lote;
  if (dados.quantidade !== undefined) payload.quantidade = dados.quantidade;
  if (dados.disposicao !== undefined) payload.disposicao = dados.disposicao;
  if (dados.origem !== undefined) payload.origem = dados.origem;
  if (dados.metodoAnalise !== undefined) payload.metodo_analise = dados.metodoAnalise;
  if (dados.analiseCausa !== undefined) payload.analise_causa = dados.analiseCausa;
  if (dados.opRelacionadaId !== undefined) payload.op_relacionada_id = dados.opRelacionadaId;
  if (dados.ocorrenciaRelacionadaId !== undefined)
    payload.ocorrencia_relacionada_id = dados.ocorrenciaRelacionadaId;
  if (dados.clienteFornecedorId !== undefined) payload.cliente_fornecedor_id = dados.clienteFornecedorId;
  if (dados.notaFiscal !== undefined) payload.nota_fiscal = dados.notaFiscal;
  if (dados.comProblema !== undefined) payload.com_problema = !!dados.comProblema;
  if (dados.avaliacaoEficacia !== undefined) payload.avaliacao_eficacia = dados.avaliacaoEficacia;

  const { error } = await supabase.from('registros').update(payload).eq('id', id);
  tratarErro(error);

  return { sucesso: true };
}

export async function buscarTimelineOp(id: number): Promise<{ timeline: Registro[] }> {
  const { data, error } = await supabase.from('registros').select('*').eq('op_id', id).order('id');
  tratarErro(error);
  return { timeline: (data ?? []).map(mapRegistro) };
}

export async function listarUsuarios(): Promise<{ usuarios: UsuarioResumo[] }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, cargo')
    .eq('status', 'Ativo')
    .order('nome');
  tratarErro(error);
  return { usuarios: data ?? [] };
}

// Clientes e fornecedores juntos, usado no dropdown "Cliente ou fornecedor"
export async function listarClientesFornecedores() {
  const [clientes, fornecedores] = await Promise.all([
    listarRegistros('cliente'),
    listarRegistros('fornecedor'),
  ]);
  return [...clientes.registros, ...fornecedores.registros].sort((a, b) =>
    a.titulo.localeCompare(b.titulo)
  );
}

export async function listarAnexos(registroId: number): Promise<{ anexos: Anexo[] }> {
  const { data, error } = await supabase
    .from('anexos')
    .select('*')
    .eq('registro_id', registroId)
    .order('id');
  tratarErro(error);

  return {
    anexos: (data ?? []).map((a: any) => ({
      ...a,
      url: supabase.storage.from('anexos').getPublicUrl(a.caminho).data.publicUrl,
    })),
  };
}

export async function excluirAnexo(anexoId: number): Promise<{ sucesso: boolean }> {
  const { data: anexo, error: erroSelect } = await supabase
    .from('anexos')
    .select('caminho')
    .eq('id', anexoId)
    .single();
  tratarErro(erroSelect);

  const { error } = await supabase.from('anexos').delete().eq('id', anexoId);
  tratarErro(error);

  // Best-effort: se o arquivo já não existir no Storage, ignora o erro.
  await supabase.storage.from('anexos').remove([anexo!.caminho]);

  return { sucesso: true };
}

// Upload de arquivo: manda direto pro Storage do Supabase (antes ia por
// multipart/form-data pro Express). O jeito de ler o arquivo a partir da uri
// é o mesmo já usado aqui antes pro caso web (fetch + blob), e funciona
// igual no app nativo com o Expo.
export async function enviarAnexo(
  registroId: number,
  arquivo: { uri: string; name: string; type: string }
): Promise<Anexo> {
  let blob: Blob;
  try {
    const respostaArquivo = await fetch(arquivo.uri);
    blob = await respostaArquivo.blob();
  } catch (e) {
    throw new Error('Não foi possível ler o arquivo selecionado.');
  }

  const extensao = arquivo.name.includes('.') ? arquivo.name.split('.').pop() : '';
  const nomeUnico = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extensao ? '.' + extensao : ''}`;
  const caminho = `${registroId}/${nomeUnico}`;

  const { error: erroUpload } = await supabase.storage
    .from('anexos')
    .upload(caminho, blob, { contentType: arquivo.type || undefined });
  if (erroUpload) {
    throw new Error(erroUpload.message || 'Erro ao enviar o arquivo.');
  }

  const { data, error } = await supabase
    .from('anexos')
    .insert({
      registro_id: registroId,
      nome_arquivo: arquivo.name,
      caminho,
      tamanho: blob.size,
      tipo_mime: arquivo.type,
    })
    .select('*')
    .single();
  tratarErro(error);

  return { ...data, url: supabase.storage.from('anexos').getPublicUrl(caminho).data.publicUrl };
}

// ---- Indicadores ----
// Antes era calculado no servidor (SQL agregando no SQLite); agora busca os
// registros do período (a tabela é pequena o bastante pra isso) e faz a
// mesma conta no app.
export interface IndicadoresResposta {
  resumo: {
    opsEmAndamento: number;
    ocorrenciasAbertas: number;
    acoesAtrasadas: number;
    recebimentosProblemas: number;
    taxaNaoConformidade: number;
    tempoMedio: string;
  };
  grafico: {
    labels: string[];
    valores: number[];
    alturas: number[];
    chaves: (string | number)[];
  };
}

const TIPOS_CANONICOS = [
  { valor: 'op', rotulo: 'OP' },
  { valor: 'ocorrencia', rotulo: 'Ocorrência' },
  { valor: 'acao', rotulo: 'Ação' },
  { valor: 'recebimento', rotulo: 'Recebimento' },
];

const SETORES_CANONICOS = ['Produção', 'Qualidade', 'Almoxarifado', 'Laminação', 'Corte', 'Acabamento'];

// "DD/MM/AAAA" -> "AAAA-MM-DD" (mesma conversão que o backend antigo fazia)
function converterDataBR(data?: string): string {
  if (!data) return new Date().toISOString().slice(0, 10);
  const partes = data.split('/');
  if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
  return data;
}

async function buscarRegistrosParaIndicadores(clienteId?: number | null): Promise<Registro[]> {
  let query = supabase.from('registros').select('*').not('tipo', 'in', '(cliente,fornecedor)');
  if (clienteId) query = query.eq('cliente_fornecedor_id', clienteId);
  const { data, error } = await query;
  tratarErro(error);
  return (data ?? []).map(mapRegistro);
}

export async function buscarIndicadores(
  inicio: string,
  fim: string,
  clienteId?: number | null,
  filtro = 'periodo'
): Promise<IndicadoresResposta> {
  const inicioIso = converterDataBR(inicio);
  const fimIso = converterDataBR(fim);
  const todos = await buscarRegistrosParaIndicadores(clienteId);

  const noPeriodo = todos.filter(
    (r) => !!r.data_iso && r.data_iso >= inicioIso && r.data_iso <= fimIso
  );

  const totalOps = noPeriodo.filter((r) => r.tipo === 'op').length;
  const totalOcorrenciasPeriodo = noPeriodo.filter((r) => r.tipo === 'ocorrencia').length;

  const concluidasNoPeriodo = todos.filter((r) => {
    if (r.tipo !== 'ocorrencia' || !r.concluido_em) return false;
    const dia = r.concluido_em.slice(0, 10);
    return dia >= inicioIso && dia <= fimIso;
  });
  let tempoMedio = 'Sem dados';
  if (concluidasNoPeriodo.length > 0) {
    const mediaDias =
      concluidasNoPeriodo.reduce((soma, r) => {
        const criado = new Date(r.criado_em as string).getTime();
        const concluido = new Date(r.concluido_em as string).getTime();
        return soma + (concluido - criado) / 86400000;
      }, 0) / concluidasNoPeriodo.length;
    tempoMedio = `${mediaDias.toFixed(1)} dias`;
  }

  const resumo = {
    opsEmAndamento: noPeriodo.filter((r) => r.tipo === 'op' && r.status === 'Em andamento').length,
    ocorrenciasAbertas: noPeriodo.filter((r) => r.tipo === 'ocorrencia' && r.status === 'Aberta').length,
    acoesAtrasadas: noPeriodo.filter((r) => r.tipo === 'acao' && r.status === 'Atrasada').length,
    recebimentosProblemas: noPeriodo.filter((r) => r.tipo === 'recebimento' && !!r.com_problema).length,
    taxaNaoConformidade:
      totalOps > 0 ? Math.round((totalOcorrenciasPeriodo / totalOps) * 100) : 0,
    tempoMedio,
  };

  let labels: string[];
  let valores: number[];
  let chaves: (string | number)[];

  if (filtro === 'tipo') {
    labels = TIPOS_CANONICOS.map((t) => t.rotulo);
    chaves = TIPOS_CANONICOS.map((t) => t.valor);
    valores = TIPOS_CANONICOS.map((t) => noPeriodo.filter((r) => r.tipo === t.valor).length);
  } else if (filtro === 'setor') {
    const mapa: Record<string, number> = {};
    let semSetor = 0;
    noPeriodo.forEach((r) => {
      if (r.processo && SETORES_CANONICOS.includes(r.processo)) {
        mapa[r.processo] = (mapa[r.processo] || 0) + 1;
      } else {
        semSetor += 1;
      }
    });
    labels = [...SETORES_CANONICOS, 'Sem setor'];
    valores = [...SETORES_CANONICOS.map((s) => mapa[s] || 0), semSetor];
    chaves = labels;
  } else {
    labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    valores = Array(12).fill(0);
    noPeriodo.forEach((r) => {
      const mes = Number(r.data.split('/')[1]);
      if (mes >= 1 && mes <= 12) valores[mes - 1] += 1;
    });
    chaves = Array.from({ length: 12 }, (_, i) => i + 1);
  }

  const maiorValor = Math.max(...valores, 1);
  const alturas = valores.map((v) => (v === 0 ? 4 : Math.max((v / maiorValor) * 90, 8)));

  return { resumo, grafico: { labels, valores, alturas, chaves } };
}

export async function buscarIndicadoresDetalhe(
  inicio: string,
  fim: string,
  clienteId: number | null | undefined,
  filtro: string,
  valor: string | number
): Promise<{ registros: Registro[] }> {
  const inicioIso = converterDataBR(inicio);
  const fimIso = converterDataBR(fim);
  const todos = await buscarRegistrosParaIndicadores(clienteId);

  let registros = todos.filter((r) => !!r.data_iso && r.data_iso >= inicioIso && r.data_iso <= fimIso);

  if (filtro === 'tipo') {
    registros = registros.filter((r) => r.tipo === valor);
  } else if (filtro === 'setor') {
    if (valor === 'Sem setor') {
      registros = registros.filter((r) => !r.processo || !SETORES_CANONICOS.includes(r.processo));
    } else {
      registros = registros.filter((r) => r.processo === valor);
    }
  } else {
    registros = registros.filter((r) => Number(r.data.split('/')[1]) === Number(valor));
  }

  registros.sort((a, b) => b.id - a.id);
  return { registros };
}
