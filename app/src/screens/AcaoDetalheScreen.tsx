/**
 * Tela de Detalhe da Ação Corretiva. Só visualização por enquanto.
 */
import React, { useCallback, useState } from 'react';
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

export default function AcaoDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppTabParamList, 'AcaoDetalhe'>>();
  const { acaoId } = route.params;

  const [acao, setAcao] = useState<Registro | null>(null);
  const [ocorrenciaRelacionada, setOcorrenciaRelacionada] = useState<Registro | null>(null);
  const [clienteFornecedor, setClienteFornecedor] = useState<Registro | null>(null);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const [{ registro }, { anexos: anexosResp }] = await Promise.all([
        buscarRegistro(acaoId),
        listarAnexos(acaoId),
      ]);
      setAcao(registro);
      setAnexos(anexosResp);

      setOcorrenciaRelacionada(
        registro.ocorrencia_relacionada_id
          ? (await buscarRegistro(registro.ocorrencia_relacionada_id)).registro
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
  }, [acaoId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function onFavoritar() {
    if (!acao) return;
    const novoValor = acao.favorito ? 0 : 1;
    setAcao({ ...acao, favorito: novoValor });
    try {
      await alternarFavorito(acao.id);
    } catch {
      carregar();
    }
  }

  async function onAdicionarFoto() {
    const foto = await escolherFoto();
    if (!foto) return;
    try {
      await enviarAnexo(acaoId, foto);
      const { anexos: novos } = await listarAnexos(acaoId);
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

  if (!acao) {
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
        <Text style={styles.headerTitulo}>{acao.codigo}</Text>
        <TouchableOpacity onPress={onFavoritar} hitSlop={8}>
          <Ionicons name={acao.favorito ? 'star' : 'star-outline'} size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.card}>
          <View style={styles.linhaTopo}>
            <Text style={styles.titulo}>{acao.titulo}</Text>
            <StatusBadge status={acao.status} />
          </View>
          {!!acao.origem && <Text style={styles.linha}>Origem: {acao.origem}</Text>}
          {!!acao.metodo_analise && (
            <Text style={styles.linha}>Método de análise: {acao.metodo_analise}</Text>
          )}
          {!!ocorrenciaRelacionada && (
            <Text style={styles.linha}>Ocorrência relacionada: {ocorrenciaRelacionada.codigo}</Text>
          )}
          {!!clienteFornecedor && (
            <Text style={styles.linha}>
              Cliente/fornecedor: {clienteFornecedor.titulo} (
              {clienteFornecedor.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'})
            </Text>
          )}
          {!!acao.responsavel && (
            <Text style={styles.linha}>Responsável: {acao.responsavel}</Text>
          )}
          {!!acao.processo && (
            <Text style={styles.linha}>Setor responsável: {acao.processo}</Text>
          )}
          <Text style={styles.linha}>Prazo: {acao.data}</Text>
          {!!acao.analise_causa && (
            <Text style={styles.linha}>Análise da causa: {acao.analise_causa}</Text>
          )}
          {!!acao.descricao && (
            <Text style={styles.linha}>Ação proposta: {acao.descricao}</Text>
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
  vazio: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 8,
    paddingHorizontal: 8,
  },
});
