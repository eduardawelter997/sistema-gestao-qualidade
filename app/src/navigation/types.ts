/**
 * Tipos das rotas de navegação.
 */
export type AuthStackParamList = {
  Login: undefined;
  Cadastro: undefined;
};

export type AppTabParamList = {
  Inicio: undefined;
  Busca: undefined;
  Favoritos: undefined;
  Mais: undefined;
  NovaOp: undefined;
  CadastrarCliente: undefined;
<<<<<<< Updated upstream
  OpDetalhe: { opId: number };
  NovoRegistroOp: {
    opId: number;
    opCodigo: string;
    opTitulo: string;
    opProduto?: string;
    registroId?: number;
  };
=======
  GestaoFuncionarios: undefined;
  ConvidarFuncionario: undefined;
>>>>>>> Stashed changes
};
