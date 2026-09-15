/**
 * Contexto de autenticação.
 * Antes guardava o token manualmente no AsyncStorage; agora a sessão é
 * controlada pelo próprio Supabase Auth (supabase.auth), que já persiste
 * e renova o login sozinho. Este contexto só reflete esse estado pro
 * resto do app e expõe entrar/ativarAcesso/sair com a mesma assinatura de
 * antes, pra não precisar mexer nas telas que os usam.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase } from '../config/supabase';
import * as api from '../services/api';
import { Usuario } from '../services/api';

interface AuthContextData {
  usuario: Usuario | null;
  carregando: boolean; // true enquanto verifica se já havia login salvo
  modoRecuperacaoSenha: boolean; // true depois de abrir o link de "esqueci minha senha"
  entrar: (email: string, senha: string) => Promise<void>;
  ativarAcesso: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  finalizarRecuperacaoSenha: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modoRecuperacaoSenha, setModoRecuperacaoSenha] = useState(false);

  async function carregarUsuarioDaSessao() {
    try {
      const { usuario } = await api.buscarPerfil();
      if (usuario.status === 'Ativo') {
        setUsuario(usuario);
      } else {
        // Sessão de um acesso Pendente/Inativo (ex: token antigo salvo no
        // navegador): não deixa continuar logado.
        await supabase.auth.signOut();
        setUsuario(null);
      }
    } catch {
      setUsuario(null);
    }
  }

  useEffect(() => {
    let montado = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!montado) return;
      if (session) {
        await carregarUsuarioDaSessao();
      }
      setCarregando(false);
    });

    const { data: assinatura } = supabase.auth.onAuthStateChange(async (evento, session) => {
      if (!montado) return;

      if (evento === 'PASSWORD_RECOVERY') {
        setModoRecuperacaoSenha(true);
        setCarregando(false);
        return;
      }
      if (evento === 'SIGNED_OUT') {
        setUsuario(null);
        return;
      }
      // SIGNED_IN já é tratado direto por entrar()/ativarAcesso() (que
      // conferem o status da conta e chamam setUsuario sozinhos). Reagir de
      // novo aqui cria uma corrida: as duas checagens de status rodam ao
      // mesmo tempo e, pra uma conta Pendente/Inativa, as duas tentam
      // encerrar a sessão simultaneamente — uma delas some com a sessão no
      // meio da outra ainda estar buscando o perfil, e o login termina com
      // um erro genérico de "não foi possível carregar o perfil" em vez da
      // mensagem certa.
      if (session && evento !== 'SIGNED_IN') {
        await carregarUsuarioDaSessao();
      }
    });

    return () => {
      montado = false;
      assinatura.subscription.unsubscribe();
    };
  }, []);

  async function entrar(email: string, senha: string) {
    const { usuario } = await api.login(email, senha);
    setUsuario(usuario);
  }

  async function ativarAcesso(nome: string, email: string, senha: string) {
    const { usuario } = await api.ativarAcesso(nome, email, senha);
    setUsuario(usuario);
  }

  async function sair() {
    await supabase.auth.signOut();
    setUsuario(null);
  }

  async function finalizarRecuperacaoSenha() {
    await supabase.auth.signOut();
    setModoRecuperacaoSenha(false);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        modoRecuperacaoSenha,
        entrar,
        ativarAcesso,
        sair,
        finalizarRecuperacaoSenha,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto facilmente nas telas
export function useAuth() {
  return useContext(AuthContext);
}
