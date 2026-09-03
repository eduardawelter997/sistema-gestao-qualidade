/**
 * Tela compartilhada "Fotos e Anexos" — usada pelas telas de detalhe de OP,
 * Ocorrência, Ação Corretiva e Recebimento pra ver, adicionar e excluir
 * fotos/documentos anexados a um registro.
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
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import { colors } from '../theme/colors';
import { API_URL } from '../config/api';
import { AppTabParamList } from '../navigation/types';
import { Anexo, listarAnexos, enviarAnexo, excluirAnexo } from '../services/api';
import { alertar, confirmar } from '../utils/alerta';

const ROTULO_TIPO: Record<string, string> = {
  op: 'Ordem de Produção',
  ocorrencia: 'Ocorrência',
  acao: 'Ação Corretiva',
  recebimento: 'Recebimento',
};

function formatarTamanho(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatarData(dataIso?: string) {
  if (!dataIso) return '';
  const d = new Date(dataIso.replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()}`;
}

async function escolherArquivo() {
  const resultado = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'application/pdf'],
    copyToCacheDirectory: true,
  });
  if (resultado.canceled || !resultado.assets?.[0]) return null;
  const asset = resultado.assets[0];
  return {
    uri: asset.uri,
    name: asset.name || `arquivo-${Date.now()}`,
    type: asset.mimeType || 'application/octet-stream',
  };
}

export default function FotosAnexosScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppTabParamList, 'FotosAnexos'>>();
  const { registroId, registroCodigo, registroTipo } = route.params;

  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { anexos: lista } = await listarAnexos(registroId);
      setAnexos(lista);
    } catch (e: any) {
      alertar('Erro', e.message);
    } finally {
      setCarregando(false);
    }
  }, [registroId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function onAdicionar() {
    const arquivo = await escolherArquivo();
    if (!arquivo) return;
    setEnviando(true);
    try {
      await enviarAnexo(registroId, arquivo);
      await carregar();
    } catch (e: any) {
      alertar('Erro', e.message);
    } finally {
      setEnviando(false);
    }
  }

  function onExcluir(anexo: Anexo) {
    confirmar(
      'Excluir anexo',
      `Remover "${anexo.nome_arquivo}"?`,
      async () => {
        try {
          await excluirAnexo(anexo.id);
          setAnexos((atual) => atual.filter((a) => a.id !== anexo.id));
        } catch (e: any) {
          alertar('Erro', e.message);
        }
      },
      'Excluir'
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>FOTOS E ANEXOS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.resumo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.resumoCodigo}>{registroCodigo}</Text>
            <Text style={styles.resumoTipo}>{ROTULO_TIPO[registroTipo] || registroTipo}</Text>
          </View>
          <Text style={styles.resumoContagem}>{anexos.length} arquivos anexados</Text>
        </View>

        <TouchableOpacity
          style={styles.botaoAdicionar}
          activeOpacity={0.7}
          onPress={onAdicionar}
          disabled={enviando}
        >
          <Ionicons name="camera-outline" size={18} color={colors.primary} />
          <Text style={styles.botaoAdicionarTexto}>
            {enviando ? 'Enviando...' : '+ Adicionar foto ou documento'}
          </Text>
        </TouchableOpacity>

        {carregando ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
        ) : (
          <>
            <Text style={styles.tituloSecao}>Arquivos anexados ({anexos.length})</Text>
            {anexos.length === 0 ? (
              <Text style={styles.vazio}>Nenhum arquivo anexado ainda.</Text>
            ) : (
              <View style={styles.grade}>
                {anexos.map((a) => {
                  const ehImagem = (a.tipo_mime || '').startsWith('image/');
                  return (
                    <View key={a.id} style={styles.item}>
                      <TouchableOpacity
                        style={styles.itemExcluir}
                        onPress={() => onExcluir(a)}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                      {ehImagem ? (
                        <Image source={{ uri: `${API_URL}${a.url}` }} style={styles.itemImagem} />
                      ) : (
                        <View style={styles.itemDocumento}>
                          <Ionicons name="document-text-outline" size={32} color={colors.primary} />
                        </View>
                      )}
                      <Text style={styles.itemNome} numberOfLines={1}>
                        {a.nome_arquivo}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {ehImagem ? formatarData(a.criado_em) : `PDF • ${formatarTamanho(a.tamanho)}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <Text style={styles.formatos}>Formatos permitidos: JPG, JPEG, PNG e PDF</Text>

        <TouchableOpacity
          style={styles.botaoSalvar}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.botaoSalvarTexto}>Salvar anexos</Text>
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
  },
  conteudo: { padding: 16, paddingBottom: 40 },
  resumo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resumoCodigo: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  resumoTipo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resumoContagem: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  botaoAdicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D9EE',
    paddingVertical: 12,
    marginTop: 12,
    gap: 6,
  },
  botaoAdicionarTexto: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  tituloSecao: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 22,
    marginBottom: 10,
  },
  vazio: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 12,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  item: {
    width: '47%',
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
  },
  itemExcluir: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  itemImagem: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  itemDocumento: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNome: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 6,
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formatos: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 20,
  },
  botaoSalvar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  botaoSalvarTexto: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
