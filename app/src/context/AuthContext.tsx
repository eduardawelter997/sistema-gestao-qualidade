/**
 * Contexto de autenticação.
 * Guarda o usuário logado e o token, persiste no dispositivo (AsyncStorage)
 * e expõe as funções de login, cadastro e logout para o app inteiro.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as api from '../services/api';
import { Usuario } from '../services/api';

const CHAVE_TOKEN = '@gestao_qualidade:token';

interface AuthContextData {
  usuario: Usuario | null;
  carregando: boolean; // true enquanto verifica se já havia login salvo
  entrar: (email: string, senha: string) => Promise<void>;
  ativarAcesso: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Ao abrir o app, tenta recuperar um login salvo
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(CHAVE_TOKEN);
        if (token) {
          api.definirToken(token);
          const { usuario } = await api.buscarPerfil();
          setUsuario(usuario);
        }
      } catch {
        // token inválido/expirado: limpa
        await AsyncStorage.removeItem(CHAVE_TOKEN);
        api.definirToken(null);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  async function entrar(email: string, senha: string) {
    const { token, usuario } = await api.login(email, senha);
    api.definirToken(token);
    await AsyncStorage.setItem(CHAVE_TOKEN, token);
    setUsuario(usuario);
  }

  async function ativarAcesso(nome: string, email: string, senha: string) {
    const { token, usuario } = await api.ativarAcesso(nome, email, senha);
    api.definirToken(token);
    await AsyncStorage.setItem(CHAVE_TOKEN, token);
    setUsuario(usuario);
  }

  async function sair() {
    await AsyncStorage.removeItem(CHAVE_TOKEN);
    api.definirToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, carregando, entrar, ativarAcesso, sair }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto facilmente nas telas
export function useAuth() {
  return useContext(AuthContext);
}
