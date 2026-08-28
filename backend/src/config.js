/**
 * Configurações gerais da API.
 * Em um projeto de produção, o SECRET viria de uma variável de ambiente.
 * Para este trabalho, deixamos fixo para facilitar a execução.
 */
module.exports = {
  PORT: process.env.PORT || 3000,
  SECRET: process.env.JWT_SECRET || 'chave-secreta-gestao-qualidade-setti',
  TOKEN_EXPIRA_EM: '7d',
};
