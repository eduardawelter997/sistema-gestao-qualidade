/**
 * Mapeia um registro pra sua tela de detalhe (usado em Busca, Favoritos,
 * Início — qualquer lista que mostre cards de registros mistos).
 */
import { Registro } from '../services/api';

const TIPOS_COM_DETALHE = ['op', 'ocorrencia', 'acao', 'recebimento'];

export function temTelaDeDetalhe(tipo: string) {
  return TIPOS_COM_DETALHE.includes(tipo);
}

export function abrirDetalhe(navigation: any, registro: Registro) {
  if (registro.tipo === 'op') {
    navigation.navigate('OpDetalhe', { opId: registro.id });
  } else if (registro.tipo === 'ocorrencia') {
    navigation.navigate('OcorrenciaDetalhe', { ocorrenciaId: registro.id });
  } else if (registro.tipo === 'acao') {
    navigation.navigate('AcaoDetalhe', { acaoId: registro.id });
  } else if (registro.tipo === 'recebimento') {
    navigation.navigate('RecebimentoDetalhe', { recebimentoId: registro.id });
  }
}
