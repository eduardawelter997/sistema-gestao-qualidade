/**
 * Paleta de cores central do aplicativo.
 * Manter as cores num único arquivo facilita a manutenção e a consistência
 * visual entre as telas.
 */
export const colors = {
  // Azuis principais
  background: '#1E5A8E',   // Azul de fundo das telas de login/cadastro
  headerBlue: '#1E5A8E',   // Azul do cabeçalho "GRUPO SETTI"
  primaryDark: '#154C7C',  // Azul mais escuro
  primary: '#1E5A8E',

  // Telas internas (fundo claro)
  screenBg: '#F4F6F8',
  cardBg: '#FFFFFF',
  border: '#E3E8EF',

  // Textos
  white: '#FFFFFF',
  textOnBlue: '#FFFFFF',
  textDark: '#154C7C',
  textPrimary: '#1A2B3C',
  textSecondary: '#6B7A90',
  placeholder: '#9AA5B1',

  // Inputs
  inputBackground: '#FFFFFF',
  inputText: '#1A1A1A',

  link: '#FFFFFF',
  danger: '#D64545',
};

/**
 * Cores dos "badges" de status, conforme o protótipo.
 * Recebe o texto do status e devolve cor de fundo e cor do texto.
 */
export function corDoStatus(status: string): { bg: string; text: string } {
  switch (status) {
    case 'Em andamento':
      return { bg: '#CFF5F3', text: '#0E8C8C' };
    case 'Aberta':
      return { bg: '#FDECC8', text: '#9A6700' };
    case 'Concluído':
      return { bg: '#D7F5DD', text: '#1F9D57' };
    case 'Atrasada':
      return { bg: '#FBD5D5', text: '#C53030' };
    case 'Aguardando avaliação':
      return { bg: '#E5E1FB', text: '#5B4BC4' };
    default:
      return { bg: '#E3E8EF', text: '#54637A' };
  }
}
