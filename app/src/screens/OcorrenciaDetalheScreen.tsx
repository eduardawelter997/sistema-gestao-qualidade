/**
 * Tela de Detalhe da Ocorrência (não conformidade).
 * Mostra os dados registrados e a ação corretiva vinculada, se existir.
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
import * as ImagePicker from 'expo-image-picker';

import { colors } from '../theme/colors';
import { API_URL } from '../config/api';
import StatusBadge from '../components/StatusBadge';
import { AppTabParamList } from '../navigation/types';
import {
  Registro,
  Anexo,
  buscarRegistro,
  listarRegistros,
  listarAnexos,
  enviarAnexo,
  alternarFavorito,
} from '../services/api';
import { alertar } from '../utils/alerta';

async function escolherFoto() {
  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (resultado.canceled || !resultado.assets?.[0]) return null;
  const asset = resultado.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName || `foto-${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  };
}

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

export default function OcorrenciaDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppTabParamList, 'OcorrenciaDetalhe'>>();
  const { ocorrenciaId } = route.params;

  const [ocorrencia, setOcorrencia] = useState<Registro | null>(null);
  const [opRelacionada, setOpRelacionada] = useState<Registro | null>(null);
  const [clienteFornecedor, setClienteFornecedor] = useState<Registro | null>(null);
  const [acaoVinculada, setAcaoVinculada] = useState<Registro | null>(null);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const [{ registro }, { anexos: anexosResp }, { registros: acoes }] = await Promise.all([
        buscarRegistro(ocorrenciaId),
        listarAnexos(ocorrenciaId),
        listarRegistros('acao'),
      ]);
      setOcorrencia(registro);
      setAnexos(anexosResp);
      setAcaoVinculada(
        acoes.find((a) => a.ocorrencia_relacionada_id === ocorrenciaId) || null
      );

      setOpRelacionada(
        registro.op_relacionada_id
          ? (await buscarRegistro(registro.op_relacionada_id)).registro
          : null
      );
      setClienteFornecedor(
        registro.cliente_fornecedor_id
          ? (await buscarRegistro(registro.cliente_fornecedor_id)).registro
          : null
      );
    } catch (e: any) {
      alertar('Erro', e.message);
    } finally {
      setCarregando(false);
    }
  }, [ocorrenciaId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function onFavoritar() {
    if (!ocorrencia) return;
    const novoValor = ocorrencia.favorito ? 0 : 1;
    setOcorrencia({ ...ocorrencia, favorito: novoValor });
    try {
      await alternarFavorito(ocorrencia.id);
    } catch {
      carregar();
    }
  }

  async function onAdicionarFoto() {
    const foto = await escolherFoto();
    if (!foto) return;
    try {
      await enviarAnexo(ocorrenciaId, foto);
      const { anexos: novos } = await listarAnexos(ocorrenciaId);
      setAnexos(novos);
    } catch (e: any) {
      alertar('Erro', e.message);
    }
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (!ocorrencia) {
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
        <Text style={styles.headerTitulo}>{ocorrencia.codigo}</Text>
        <TouchableOpacity onPress={onFavoritar} hitSlop={8}>
          <Ionicons
            name={ocorrencia.favorito ? 'star' : 'star-outline'}
            size={22}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.card}>
          <View style={styles.linhaTopo}>
            <Text style={styles.titulo}>{ocorrencia.titulo}</Text>
            <StatusBadge status={ocorrencia.status} />
          </View>
          {!!ocorrencia.produto && <Text style={styles.linha}>Produto: {ocorrencia.produto}</Text>}
          {!!ocorrencia.lote && <Text style={styles.linha}>Lote: {ocorrencia.lote}</Text>}
          {!!ocorrencia.quantidade && (
            <Text style={styles.linha}>Quantidade afetada: {ocorrencia.quantidade}</Text>
          )}
          {!!ocorrencia.processo && (
            <Text style={styles.linha}>Setor ou processo: {ocorrencia.processo}</Text>
          )}
          {!!ocorrencia.responsavel && (
            <Text style={styles.linha}>Responsável: {ocorrencia.responsavel}</Text>
          )}
          <Text style={styles.linha}>Data: {ocorrencia.data}</Text>
          {!!ocorrencia.descricao && (
            <Text style={styles.linha}>Descrição: {ocorrencia.descricao}</Text>
          )}
          {!!opRelacionada && (
            <Text style={styles.linha}>OP relacionada: {opRelacionada.codigo}</Text>
          )}
          {!!ocorrencia.disposicao && (
            <Text style={styles.linha}>Disposição: {ocorrencia.disposicao}</Text>
          )}
          {!!clienteFornecedor && (
            <Text style={styles.linha}>
              Cliente/fornecedor: {clienteFornecedor.titulo} (
              {clienteFornecedor.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'})
            </Text>
          )}
        </View>

        {/* Fotos e evidências */}
        <Text style={styles.tituloSecao}>Fotos e evidências</Text>
        <TouchableOpacity style={styles.botaoSecundario} onPress={onAdicionarFoto}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
          <Text style={styles.botaoSecundarioTexto}> Adicionar foto</Text>
        </TouchableOpacity>
        {anexos.length === 0 ? (
          <Text style={styles.vazio}>Nenhuma evidência anexada ainda.</Text>
        ) : (
          <LinhaFotos anexos={anexos} />
        )}

        {/* Ação corretiva */}
        <Text style={styles.tituloSecao}>Ação corretiva</Text>
        {acaoVinculada ? (
          <TouchableOpacity
            style={styles.itemAcao}
            onPress={() =>
              navigation.navigate('AcaoDetalhe', { acaoId: acaoVinculada.id })
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemAcaoCodigo}>{acaoVinculada.codigo}</Text>
              <Text style={styles.itemAcaoTitulo}>{acaoVinculada.titulo}</Text>
            </View>
            <StatusBadge status={acaoVinculada.status} />
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.vazio}>
              Nenhuma ação corretiva vinculada. Avalie a ocorrência e crie uma
              ação corretiva, se necessário.
            </Text>
            <TouchableOpacity
              style={styles.botaoSalvar}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('NovaAcaoCorretiva', {
                  ocorrenciaId: ocorrencia.id,
                  ocorrenciaCodigo: ocorrencia.codigo,
                })
              }
            >
              <Text style={styles.botaoSalvarTexto}>Criar ação corretiva</Text>
            </TouchableOpacity>
          </>
        )}
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
    marginTop: 4,
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
    marginBottom: 8,
  },
  botaoSecundarioTexto: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  fotosLinha: { marginTop: 4 },
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
  itemAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemAcaoCodigo: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  itemAcaoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
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
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
});
