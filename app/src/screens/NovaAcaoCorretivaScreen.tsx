/**
 * Tela "Nova Ação Corretiva" — abre uma ação corretiva, opcionalmente
 * vinculada a uma ocorrência (quando aberta a partir da tela de detalhe dela).
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { colors } from '../theme/colors';
import { AppTabParamList } from '../navigation/types';
import {
  criarRegistro,
  enviarAnexo,
  listarRegistros,
  listarUsuarios,
  listarClientesFornecedores,
  Registro,
  UsuarioResumo,
} from '../services/api';
import { alertar } from '../utils/alerta';

const ORIGENS = [
  'Ocorrência',
  'Auditoria',
  'Reclamação de cliente',
  'Fornecedor',
  'Indicador',
  'Análise crítica da gestão',
];

const METODOS_ANALISE = ['5 Porquês', 'Diagrama de Ishikawa', 'Análise de Pareto', '8D', 'Outro'];

const SETORES = ['Produção', 'Qualidade', 'Almoxarifado'];

function dataDeHoje() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${hoje.getFullYear()}`;
}

function aplicarMascaraData(texto: string) {
  const apenasNumeros = texto.replace(/\D/g, '').slice(0, 8);
  if (apenasNumeros.length > 4) {
    return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`;
  }
  if (apenasNumeros.length > 2) {
    return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
  }
  return apenasNumeros;
}

async function escolherFotos() {
  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsMultipleSelection: true,
  });
  if (resultado.canceled || !resultado.assets?.length) return [];
  return resultado.assets.map((asset, i) => ({
    uri: asset.uri,
    name: asset.fileName || `foto-${Date.now()}-${i}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  }));
}

export default function NovaAcaoCorretivaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppTabParamList, 'NovaAcaoCorretiva'>>();
  const { ocorrenciaId, ocorrenciaCodigo } = route.params || {};
  const ocorrenciaTravada = !!ocorrenciaId;

  const [origem, setOrigem] = useState('');
  const [mostrarOrigens, setMostrarOrigens] = useState(false);

  const [metodoAnalise, setMetodoAnalise] = useState('');
  const [mostrarMetodos, setMostrarMetodos] = useState(false);

  const [ocorrencias, setOcorrencias] = useState<Registro[]>([]);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<Registro | null>(null);
  const [mostrarOcorrencias, setMostrarOcorrencias] = useState(false);

  const [clientesFornecedores, setClientesFornecedores] = useState<Registro[]>([]);
  const [clienteFornecedor, setClienteFornecedor] = useState<Registro | null>(null);
  const [mostrarClientesFornecedores, setMostrarClientesFornecedores] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [responsavel, setResponsavel] = useState('');
  const [mostrarResponsaveis, setMostrarResponsaveis] = useState(false);

  const [setorResponsavel, setSetorResponsavel] = useState('');
  const [mostrarSetores, setMostrarSetores] = useState(false);

  const [prazo, setPrazo] = useState(dataDeHoje());
  const [analiseCausa, setAnaliseCausa] = useState('');
  const [acaoProposta, setAcaoProposta] = useState('');
  const [fotos, setFotos] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [salvando, setSalvando] = useState(false);

  // A tela fica registrada como "aba escondida" no navegador, então o React
  // não a desmonta ao voltar — sem isso, o formulário reapareceria com os
  // dados da última vez que foi preenchido. Recalcula o pré-preenchimento a
  // partir dos parâmetros de rota (quando vem de uma Ocorrência) toda vez
  // que a tela ganha foco, em vez de só na primeira montagem.
  useFocusEffect(
    useCallback(() => {
      setOrigem(ocorrenciaTravada ? 'Ocorrência' : '');
      setMetodoAnalise('');
      setOcorrenciaSelecionada(null);
      setClienteFornecedor(null);
      setResponsavel('');
      setSetorResponsavel('');
      setPrazo(dataDeHoje());
      setAnaliseCausa('');
      setAcaoProposta('');
      setFotos([]);
      setSalvando(false);
      setMostrarOrigens(false);
      setMostrarMetodos(false);
      setMostrarOcorrencias(false);
      setMostrarClientesFornecedores(false);
      setMostrarResponsaveis(false);
      setMostrarSetores(false);

      listarRegistros('ocorrencia')
        .then((r) => {
          setOcorrencias(r.registros);
          if (ocorrenciaId) {
            const encontrada = r.registros.find((o) => o.id === ocorrenciaId);
            if (encontrada) setOcorrenciaSelecionada(encontrada);
          }
        })
        .catch(() => {});
      listarClientesFornecedores()
        .then(setClientesFornecedores)
        .catch(() => {});
      listarUsuarios()
        .then((r) => setUsuarios(r.usuarios))
        .catch(() => {});
    }, [ocorrenciaId, ocorrenciaTravada])
  );

  async function onEscolherFotos() {
    const novas = await escolherFotos();
    if (novas.length) setFotos((atual) => [...atual, ...novas]);
  }

  function onRemoverFoto(index: number) {
    setFotos((atual) => atual.filter((_, i) => i !== index));
  }

  async function handleSalvar() {
    if (salvando) return; // evita registrar duplicado se a pessoa clicar mais de uma vez
    if (!origem) {
      alertar('Atenção', 'Por favor, selecione a origem da ação corretiva.');
      return;
    }

    setSalvando(true);
    try {
      const resultado = await criarRegistro({
        tipo: 'acao',
        titulo: 'Ação Corretiva',
        status: 'Aberta',
        origem,
        metodoAnalise,
        ocorrenciaRelacionadaId: ocorrenciaSelecionada?.id,
        clienteFornecedorId: clienteFornecedor?.id,
        responsavel,
        processo: setorResponsavel,
        data: prazo || undefined,
        analiseCausa,
        descricao: acaoProposta,
      });

      if (fotos.length) {
        await Promise.all(fotos.map((f) => enviarAnexo(resultado.id, f)));
      }

      alertar('Sucesso', 'Ação corretiva salva com sucesso!');
      navigation.goBack();
    } catch (error: any) {
      alertar('Erro', error.message || 'Não foi possível conectar ao servidor.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>NOVA AÇÃO CORRETIVA</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formulario}>
        {/* Origem */}
        <Text style={styles.label}>Origem da ação corretiva <Text style={styles.obrigatorio}>*</Text></Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarOrigens(!mostrarOrigens)}
        >
          <Text style={[styles.inputTextoSimples, !origem && { color: colors.textSecondary }]}>
            {origem || 'Selecione a origem'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarOrigens && (
          <View style={styles.dropdownContainer}>
            {ORIGENS.map((o) => (
              <TouchableOpacity
                key={o}
                style={styles.dropdownItem}
                onPress={() => {
                  setOrigem(o);
                  setMostrarOrigens(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{o}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Método de análise e Ocorrência lado a lado */}
        <View style={styles.linhaDupla}>
          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Método de análise</Text>
            <TouchableOpacity
              style={styles.inputSeletor}
              onPress={() => setMostrarMetodos(!mostrarMetodos)}
            >
              <Text style={[styles.inputTextoSimples, !metodoAnalise && { color: colors.textSecondary }]}>
                {metodoAnalise || 'Selecione'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {mostrarMetodos && (
              <View style={styles.dropdownContainer}>
                {METODOS_ANALISE.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setMetodoAnalise(m);
                      setMostrarMetodos(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Ocorrência (opcional)</Text>
            <TouchableOpacity
              style={[styles.inputSeletor, ocorrenciaTravada && styles.inputDesabilitado]}
              onPress={() => !ocorrenciaTravada && setMostrarOcorrencias(!mostrarOcorrencias)}
              disabled={ocorrenciaTravada}
            >
              <Text style={styles.inputTextoSimples} numberOfLines={1}>
                {ocorrenciaSelecionada?.codigo || ocorrenciaCodigo || 'Nenhuma'}
              </Text>
              {!ocorrenciaTravada && (
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
            {mostrarOcorrencias && (
              <View style={styles.dropdownContainer}>
                <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setOcorrenciaSelecionada(null);
                      setMostrarOcorrencias(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>Nenhuma</Text>
                  </TouchableOpacity>
                  {ocorrencias.map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setOcorrenciaSelecionada(o);
                        setMostrarOcorrencias(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{o.codigo}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Cliente ou fornecedor */}
        <Text style={styles.label}>Cliente ou fornecedor (opcional)</Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarClientesFornecedores(!mostrarClientesFornecedores)}
        >
          <Text style={styles.inputTextoSimples}>
            {clienteFornecedor
              ? `${clienteFornecedor.titulo} - ${clienteFornecedor.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'}`
              : 'Nenhuma, se necessário'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarClientesFornecedores && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setClienteFornecedor(null);
                  setMostrarClientesFornecedores(false);
                }}
              >
                <Text style={styles.dropdownItemText}>Nenhuma</Text>
              </TouchableOpacity>
              {clientesFornecedores.map((cf) => (
                <TouchableOpacity
                  key={cf.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setClienteFornecedor(cf);
                    setMostrarClientesFornecedores(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {cf.titulo} - {cf.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Responsável */}
        <Text style={styles.label}>Responsável</Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarResponsaveis(!mostrarResponsaveis)}
        >
          <Text style={[styles.inputTextoSimples, !responsavel && { color: colors.textSecondary }]}>
            {responsavel || 'Selecione'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarResponsaveis && (
          <View style={styles.dropdownContainer}>
            {usuarios.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setResponsavel(u.nome);
                  setMostrarResponsaveis(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{u.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Setor responsável */}
        <Text style={styles.label}>Setor responsável</Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarSetores(!mostrarSetores)}
        >
          <Text style={[styles.inputTextoSimples, !setorResponsavel && { color: colors.textSecondary }]}>
            {setorResponsavel || 'Selecione o setor'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarSetores && (
          <View style={styles.dropdownContainer}>
            {SETORES.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.dropdownItem}
                onPress={() => {
                  setSetorResponsavel(s);
                  setMostrarSetores(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Prazo */}
        <Text style={styles.label}>Prazo</Text>
        <View style={styles.inputSeletor}>
          <TextInput
            placeholder="Selecione uma data limite"
            placeholderTextColor={colors.textSecondary}
            value={prazo}
            onChangeText={(texto) => setPrazo(aplicarMascaraData(texto))}
            keyboardType="numeric"
            style={styles.inputTextoSimples}
          />
          <Ionicons name="calendar" size={18} color={colors.textSecondary} />
        </View>

        {/* Análise da causa */}
        <Text style={styles.label}>Análise da causa</Text>
        <TextInput
          placeholder="Descreva a causa identificada ou a análise realizada"
          placeholderTextColor={colors.textSecondary}
          value={analiseCausa}
          onChangeText={setAnaliseCausa}
          multiline
          style={styles.inputAreaTexto}
        />

        {/* Ação proposta */}
        <Text style={styles.label}>Ação proposta</Text>
        <TextInput
          placeholder="Descreva a ação que será realizada"
          placeholderTextColor={colors.textSecondary}
          value={acaoProposta}
          onChangeText={setAcaoProposta}
          multiline
          style={styles.inputAreaTexto}
        />

        {/* Fotos e evidências */}
        <Text style={styles.label}>Fotos e evidências</Text>
        <TouchableOpacity style={styles.botaoSecundario} activeOpacity={0.7} onPress={onEscolherFotos}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
          <Text style={styles.botaoSecundarioTexto}>
            {fotos.length ? ' Adicionar mais fotos' : ' Adicionar foto ou documento'}
          </Text>
        </TouchableOpacity>
        {!!fotos.length && (
          <View style={styles.previewLinha}>
            {fotos.map((f, index) => (
              <View key={f.uri + index} style={styles.previewItem}>
                <Image source={{ uri: f.uri }} style={styles.previewFoto} />
                <TouchableOpacity
                  style={styles.previewRemover}
                  onPress={() => onRemoverFoto(index)}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.botaoSalvar, salvando && styles.botaoSalvarDesabilitado]}
          activeOpacity={0.8}
          onPress={handleSalvar}
          disabled={salvando}
        >
          <Text style={styles.botaoSalvarTexto}>
            {salvando ? 'Salvando...' : 'Salvar ação corretiva'}
          </Text>
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
  formulario: { padding: 16, paddingBottom: 40 },
  obrigatorio: {
    color: colors.danger,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  inputSeletor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'space-between',
  },
  inputDesabilitado: {
    backgroundColor: '#F0F4F8',
  },
  inputTextoSimples: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.textPrimary,
  },
  dropdownContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  linhaDupla: {
    flexDirection: 'row',
    gap: 12,
  },
  colunaMetade: {
    flex: 1,
  },
  inputAreaTexto: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.textPrimary,
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
  },
  botaoSecundarioTexto: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  previewLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  previewItem: {
    position: 'relative',
  },
  previewRemover: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  previewFoto: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  botaoSalvar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 24,
  },
  botaoSalvarDesabilitado: {
    opacity: 0.6,
  },
  botaoSalvarTexto: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
