/**
 * Tela de Detalhe do Recebimento.
 * Mostra os dados registrados e permite abrir uma ocorrência caso um
 * problema seja identificado no material recebido.
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

export default function RecebimentoDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppTabParamList, 'RecebimentoDetalhe'>>();
  const { recebimentoId } = route.params;

  const [recebimento, setRecebimento] = useState<Registro | null>(null);
  const [opRelacionada, setOpRelacionada] = useState<Registro | null>(null);
  const [clienteFornecedor, setClienteFornecedor] = useState<Registro | null>(null);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const [{ registro }, { anexos: anexosResp }] = await Promise.all([
        buscarRegistro(recebimentoId),
        listarAnexos(recebimentoId),
      ]);
      setRecebimento(registro);
      setAnexos(anexosResp);

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
  }, [recebimentoId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function onFavoritar() {
    if (!recebimento) return;
    const novoValor = recebimento.favorito ? 0 : 1;
    setRecebimento({ ...recebimento, favorito: novoValor });
    try {
      await alternarFavorito(recebimento.id);
    } catch {
      carregar();
    }
  }

  async function onAdicionarFoto() {
    const foto = await escolherFoto();
    if (!foto) return;
    try {
      await enviarAnexo(recebimentoId, foto);
      const { anexos: novos } = await listarAnexos(recebimentoId);
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

  if (!recebimento) {
    return (
      <View style={styles.container}>
        <Text style={styles.vazio}>Registro não encontrado.</Text>
      </View>
    );
  }

  const comProblema = !!recebimento.com_problema;
  const tipoClienteFornecedor =
    clienteFornecedor?.tipo === 'cliente' ? 'Cliente' : 'Fornecedor';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{recebimento.codigo}</Text>
        <TouchableOpacity onPress={onFavoritar} hitSlop={8}>
          <Ionicons
            name={recebimento.favorito ? 'star' : 'star-outline'}
            size={22}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.card}>
          <View style={styles.linhaTopo}>
            <Text style={styles.titulo}>Recebimento de: {tipoClienteFornecedor}</Text>
            <StatusBadge status={recebimento.status} />
          </View>
          {!!clienteFornecedor && (
            <Text style={styles.linha}>
              {tipoClienteFornecedor}: {clienteFornecedor.titulo}
            </Text>
          )}
          {!!recebimento.produto && <Text style={styles.linha}>Material: {recebimento.produto}</Text>}
          {!!recebimento.nota_fiscal && (
            <Text style={styles.linha}>Nota fiscal: {recebimento.nota_fiscal}</Text>
          )}
          {!!recebimento.responsavel && (
            <Text style={styles.linha}>Responsável: {recebimento.responsavel}</Text>
          )}
          <Text style={styles.linha}>Data: {recebimento.data}</Text>
          {!!opRelacionada && (
            <Text style={styles.linha}>OP relacionada: {opRelacionada.codigo}</Text>
          )}
          {!!recebimento.descricao && (
            <Text style={styles.linha}>Observações: {recebimento.descricao}</Text>
          )}
          <Text style={styles.linha}>Problema no recebimento? {comProblema ? 'Sim' : 'Não'}</Text>
        </View>

        {/* Fotos e documentos */}
        <Text style={styles.tituloSecao}>Fotos e documentos</Text>
        <TouchableOpacity style={styles.botaoSecundario} onPress={onAdicionarFoto}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
          <Text style={styles.botaoSecundarioTexto}> Adicionar foto</Text>
        </TouchableOpacity>
        {anexos.length === 0 ? (
          <Text style={styles.vazio}>Nenhum arquivo anexado ainda.</Text>
        ) : (
          <LinhaFotos anexos={anexos} />
        )}

        {/* Resultado do recebimento */}
        <Text style={styles.tituloSecao}>Resultado do recebimento</Text>
        <View style={styles.resultadoCard}>
          <Text style={styles.resultadoTitulo}>
            {comProblema ? 'Problema identificado' : 'Recebimento aprovado'}
          </Text>
          <Text style={styles.resultadoTexto}>
            {comProblema
              ? 'Foi identificado um problema neste recebimento. Registre uma ocorrência para dar andamento à avaliação.'
              : 'Material recebido e conferido sem problemas identificados.'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botaoSalvar}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('NovaOcorrencia', {
              tipoPreSelecionado: 'Problema no recebimento',
              opRelacionadaId: opRelacionada?.id,
              opRelacionadaCodigo: opRelacionada?.codigo,
              clienteFornecedorId: clienteFornecedor?.id,
              clienteFornecedorLabel: clienteFornecedor
                ? `${clienteFornecedor.titulo} - ${tipoClienteFornecedor}`
                : undefined,
            })
          }
        >
          <Text style={styles.botaoSalvarTexto}>Registrar problema</Text>
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
    fontSize: 15,
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
  resultadoCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultadoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resultadoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  botaoSalvar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
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
    paddingHorizontal: 8,
  },
});
