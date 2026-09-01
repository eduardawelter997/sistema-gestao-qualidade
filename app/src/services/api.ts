/**
 * Camada de comunicação com a API.
 * Centraliza as chamadas HTTP (fetch) e adiciona o token de autenticação.
 */
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
  tipo: 'op' | 'ocorrencia' | 'acao' | 'recebimento';
  codigo: string;
  titulo: string;
  descricao: string;
  status: string;
  data: string;
  favorito: number;
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

export function register(nome: string, email: string, senha: string) {
  return request<{ token: string; usuario: Usuario }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha }),
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
}) {
  return request<{ id: number; sucesso: boolean }>('/api/registros', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
