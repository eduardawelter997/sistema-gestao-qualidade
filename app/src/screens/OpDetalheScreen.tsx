/**
 * Tela de Detalhe da OP.
 * Mostra os dados da ordem de produção e a linha do tempo de registros
 * associados a ela (recebimento, ocorrência, retrabalho, inspeção...).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  RouteProp,
} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { API_URL } from '../config/api';
import StatusBadge from '../components/StatusBadge';
import { AppTabParamList } from '../navigation/types';
import {
  Registro,
  Anexo,
  buscarRegistro,
  buscarTimelineOp,
  listarAnexos,
  alternarFavorito,
} from '../services/api';
import { alertar } from '../utils/alerta';

const rotuloTipoTimeline: Record<string, string> = {
  recebimento: 'Recebimento',
  ocorrencia: 'Ocorrência',
  retrabalho: 'Retrabalho',
  reparo: 'Reparo',
  inspecao: 'Inspeção',
  inspecao_final: 'Inspeção final',
};

const iconeTipoTimeline: Record<string, keyof typeof Ionicons.glyphMap> = {
  recebimento: 'cube',
  ocorrencia: 'warning',
  retrabalho: 'build',
  reparo: 'construct',
  inspecao: 'document-text',
  inspecao_final: 'checkmark-done',
};

function LinhaFotos({ anexos }: { anexos: Anexo[] }) {
  if (!anexos.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotosLinha}>
      {anexos.map((a) => (
        <Image key={a.id} source={{ uri: `${API_URL}${a.url}` }} style={styles.foto} />
      ))}
    </ScrollView>
  );
}

// Miniaturas de um registro da linha do tempo (busca os próprios anexos)
function AnexosDoItem({ registroId }: { registroId: number }) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);

  useEffect(() => {
    listarAnexos(registroId)
      .then((r) => setAnexos(r.anexos))
      .catch(() => {});
  }, [registroId]);

  return <LinhaFotos anexos={anexos} />;
}

export default function OpDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppTabParamList, 'OpDetalhe'>>();
  const { opId } = route.params;

  const [op, setOp] = useState<Registro | null>(null);
  const [timeline, setTimeline] = useState<Registro[]>([]);
  const [anexosOp, setAnexosOp] = useState<Anexo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const [{ registro }, { timeline: linha }, { anexos }] = await Promise.all([
        buscarRegistro(opId),
        buscarTimelineOp(opId),
        listarAnexos(opId),
      ]);
      setOp(registro);
      setTimeline(linha);
      setAnexosOp(anexos);
    } catch (e: any) {
      alertar('Erro', e.message);
    } finally {
      setCarregando(false);
    }
  }, [opId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function onFavoritar() {
    if (!op) return;
    const novoValor = op.favorito ? 0 : 1;
    setOp({ ...op, favorito: novoValor });
    try {
      await alternarFavorito(op.id);
    } catch {
      carregar();
    }
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (!op) {
    return (
      <View style={styles.container}>
        <Text style={styles.vazio}>Registro não encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{op.codigo}</Text>
        <TouchableOpacity onPress={onFavoritar} hitSlop={8}>
          <Ionicons
            name={op.favorito ? 'star' : 'star-outline'}
            size={22}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        {/* Cabeçalho da OP */}
        <View style={styles.card}>
          <View style={styles.linhaTopo}>
            <Text style={styles.titulo}>{op.titulo}</Text>
            <StatusBadge status={op.status} />
          </View>
          {!!op.produto && <Text style={styles.linha}>Produto: {op.produto}</Text>}
          <Text style={styles.linha}>Data de abertura: {op.data}</Text>
          {!!op.responsavel && (
            <Text style={styles.linha}>Responsável: {op.responsavel}</Text>
          )}
        </View>

        {/* Fotos e anexos */}
        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() =>
            navigation.navigate('FotosAnexos', {
              registroId: op.id,
              registroCodigo: op.codigo,
              registroTipo: 'op',
            })
          }
        >
          <Ionicons name="images-outline" size={16} color={colors.primary} />
          <Text style={styles.botaoSecundarioTexto}> Ver anexos ({anexosOp.length})</Text>
        </TouchableOpacity>

        {/* Linha do tempo */}
        <Text style={styles.tituloSecao}>Linha do tempo</Text>
        {timeline.length === 0 && (
          <Text style={styles.vazio}>
            Nenhum registro ainda. Toque em "Criar Registro" para adicionar o
            primeiro evento desta OP.
          </Text>
        )}
        {timeline.map((item) => {
          const editavel = item.status === 'Em andamento';
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.itemTimeline}
              activeOpacity={editavel ? 0.7 : 1}
              disabled={!editavel}
              onPress={() =>
                navigation.navigate('NovoRegistroOp', {
                  opId: op.id,
                  opCodigo: op.codigo,
                  opTitulo: op.titulo,
                  opProduto: op.produto || undefined,
                  registroId: item.id,
                })
              }
            >
              <View style={styles.itemTopo}>
                <Ionicons
                  name={iconeTipoTimeline[item.tipo] || 'document-text'}
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={styles.itemTitulo} numberOfLines={1}>
                  {item.titulo || rotuloTipoTimeline[item.tipo] || item.tipo}
                </Text>
                <StatusBadge status={item.status} />
                {editavel && (
                  <Ionicons name="pencil" size={14} color={colors.textSecondary} />
                )}
              </View>
              <Text style={styles.itemMeta}>
                {item.data}
                {item.responsavel ? ` · ${item.responsavel}` : ''}
              </Text>
              {!!item.descricao && (
                <Text style={styles.itemDetalhes}>Detalhes: {item.descricao}</Text>
              )}
              <AnexosDoItem registroId={item.id} />
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.botaoSalvar}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('NovoRegistroOp', {
              opId: op.id,
              opCodigo: op.codigo,
              opTitulo: op.titulo,
              opProduto: op.produto || undefined,
            })
          }
        >
          <Text style={styles.botaoSalvarTexto}>Criar Registro</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  botaoVoltar: { marginRight: 16 },
  headerTitulo: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  conteudo: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linhaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  linha: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  botaoSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D9EE',
    paddingVertical: 10,
    marginTop: 12,
  },
  botaoSecundarioTexto: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  fotosLinha: { marginTop: 8 },
  foto: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: colors.border,
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 22,
    marginBottom: 8,
  },
  itemTimeline: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  itemDetalhes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  botaoSalvar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 12,
  },
  botaoSalvarTexto: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  vazio: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    paddingHorizontal: 8,
  },
});
