/**
 * Camada de comunicação com a API.
 * Centraliza as chamadas HTTP (fetch) e adiciona o token de autenticação.
 */
import { Platform } from 'react-native';
import { API_URL } from '../config/api';

// Token do usuário logado. É definido pelo AuthContext após o login.
let tokenAtual: string | null = null;

export function definirToken(token: string | null) {
  tokenAtual = token;
}

// Tipos usados pelas telas
export interface Usuario {
  id: number;
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
  favorito: number;
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
  id: number;
  nome: string;
  cargo: string;
}

/**
 * Função base: faz a requisição, envia o token e trata erros.
 */
async function request<T>(caminho: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (tokenAtual) headers.Authorization = `Bearer ${tokenAtual}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { ...options, headers });
  } catch (e) {
    throw new Error(
      'Não foi possível conectar à API. Verifique se o back-end está rodando e se a URL em src/config/api.ts está correta.'
    );
  }

  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error((corpo as any).erro || 'Erro na requisição.');
  }
  return corpo as T;
}

// ---- Autenticação ----
export function login(email: string, senha: string) {
  return request<{ token: string; usuario: Usuario }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

export function ativarAcesso(nome: string, email: string, senha: string) {
  return request<{ token: string; usuario: Usuario }>('/api/auth/ativar-acesso', {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha }),
  });
}

export function verificarCodigoRecuperacao(email: string, codigo: string) {
  return request<{ valido: boolean }>('/api/auth/verificar-codigo', {
    method: 'POST',
    body: JSON.stringify({ email, codigo }),
  });
}

export function redefinirSenhaComCodigo(email: string, codigo: string, novaSenha: string) {
  return request<{ mensagem: string }>('/api/auth/redefinir-senha', {
    method: 'POST',
    body: JSON.stringify({ email, codigo, novaSenha }),
  });
}

export function buscarPerfil() {
  return request<{ usuario: Usuario }>('/api/auth/me');
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

export function buscarDashboard() {
  return request<DashboardResposta>('/api/dashboard');
}

export function listarRegistros(tipo = 'todos', q = '') {
  const params = new URLSearchParams();
  if (tipo) params.append('tipo', tipo);
  if (q) params.append('q', q);
  return request<{ registros: Registro[] }>(`/api/registros?${params.toString()}`);
}

export function listarFavoritos() {
  return request<{ registros: Registro[] }>('/api/registros/favoritos');
}

export function alternarFavorito(id: number) {
  return request<{ id: number; favorito: number }>(
    `/api/registros/${id}/favorito`,
    { method: 'PATCH' }
  );
}

export function criarRegistro(dados: {
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
}) {
  return request<{ id: number; sucesso: boolean }>('/api/registros', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export function buscarRegistro(id: number) {
  return request<{ registro: Registro }>(`/api/registros/${id}`);
}

export function atualizarRegistro(
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
  }
) {
  return request<{ sucesso: boolean }>(`/api/registros/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}

export function buscarTimelineOp(id: number) {
  return request<{ timeline: Registro[] }>(`/api/registros/${id}/timeline`);
}

export function listarUsuarios() {
  return request<{ usuarios: UsuarioResumo[] }>('/api/usuarios');
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

export function listarAnexos(registroId: number) {
  return request<{ anexos: Anexo[] }>(`/api/registros/${registroId}/anexos`);
}

export function excluirAnexo(anexoId: number) {
  return request<{ sucesso: boolean }>(`/api/anexos/${anexoId}`, { method: 'DELETE' });
}

// Upload de arquivo: não usa o helper request() porque o corpo é
// multipart/form-data (FormData), não JSON.
export async function enviarAnexo(
  registroId: number,
  arquivo: { uri: string; name: string; type: string }
) {
  const form = new FormData();
  if (Platform.OS === 'web') {
    // No navegador o FormData precisa de um Blob de verdade, não do
    // objeto { uri, name, type } (esse formato só funciona no Android/iOS).
    const respostaArquivo = await fetch(arquivo.uri);
    const blob = await respostaArquivo.blob();
    form.append('arquivo', blob, arquivo.name);
  } else {
    form.append('arquivo', arquivo as any);
  }

  const headers: Record<string, string> = {};
  if (tokenAtual) headers.Authorization = `Bearer ${tokenAtual}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}/api/registros/${registroId}/anexos`, {
      method: 'POST',
      headers,
      body: form,
    });
  } catch (e) {
    throw new Error('Não foi possível enviar o arquivo. Verifique sua conexão.');
  }

  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error((corpo as any).erro || 'Erro ao enviar o arquivo.');
  }
  return corpo as Anexo;
}

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
  };
}

export function buscarIndicadores(
  inicio: string,
  fim: string,
  clienteId?: number | null,
  filtro = 'periodo'
) {
  const params = new URLSearchParams({
    inicio,
    fim,
    filtro,
  });

  if (clienteId) {
    params.append('clienteId', String(clienteId));
  }

  return request<IndicadoresResposta>(
    `/api/auth/indicadores?${params.toString()}`
  );
}
