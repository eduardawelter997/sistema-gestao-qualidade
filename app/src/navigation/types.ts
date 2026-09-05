/**
 * Tipos das rotas de navegação.
 */
export type AuthStackParamList = {
  Login: undefined;
  PrimeiroAcesso: undefined;
  RecuperarSenha: undefined;
  VerificarCodigo: { email: string };
  RedefinirSenha: { email: string; codigo: string };
  AlterarSenha: undefined;
};

export type AppTabParamList = {
  Inicio: undefined;
  Busca: undefined;
  Favoritos: undefined;
  Mais: undefined;
  NovaOp: undefined;
  CadastrarCliente: undefined;
  OpDetalhe: { opId: number };
  NovoRegistroOp: {
    opId: number;
    opCodigo: string;
    opTitulo: string;
    opProduto?: string;
    registroId?: number;
  };
  GestaoColaboradores: undefined;
  ConvidarColaborador: undefined;
  DetalhesColaborador: { colaborador: any };
  Perfil: undefined;
  AlterarSenha: undefined;
  NovaOcorrencia: {
    tipoPreSelecionado?: string;
    opRelacionadaId?: number;
    opRelacionadaCodigo?: string;
    clienteFornecedorId?: number;
    clienteFornecedorLabel?: string;
  } | undefined;
  OcorrenciaDetalhe: { ocorrenciaId: number };
  NovaAcaoCorretiva: { ocorrenciaId?: number; ocorrenciaCodigo?: string };
  AcaoDetalhe: { acaoId: number };
  NovoRecebimento: undefined;
  RecebimentoDetalhe: { recebimentoId: number };
  NovoProdutoNaoConforme: undefined;
  FotosAnexos: { registroId: number; registroCodigo: string; registroTipo: string };
  ClientesFornecedores: undefined;
  Sobre: undefined;
  Ajuda: undefined;
  Indicadores: undefined;
};
