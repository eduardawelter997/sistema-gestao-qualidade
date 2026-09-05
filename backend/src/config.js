/**
 * Configurações gerais da API.
 * Em um projeto de produção, o SECRET viria de uma variável de ambiente.
 * Para este trabalho, deixamos fixo para facilitar a execução.
 */
module.exports = {
  PORT: process.env.PORT || 3000,
  SECRET: process.env.JWT_SECRET || 'chave-secreta-gestao-qualidade-setti',
  TOKEN_EXPIRA_EM: '7d',
  // Código padrão usado na recuperação de senha (fluxo "Esqueci minha
  // senha"). Fixo para facilitar a demonstração, sem depender de e-mail.
  CODIGO_RECUPERACAO_MESTRE: '123456',
};
