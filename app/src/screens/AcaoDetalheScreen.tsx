/**
 * Tela de Detalhe da Ação Corretiva — totalmente editável (mesmo padrão de
 * campos do NovaAcaoCorretivaScreen.tsx), com o "Problema" e a "OP
 * relacionada" herdados da ocorrência vinculada, e um resumo de
 * acompanhamento (execução, evidências, avaliação da eficácia).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
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
import StatusBadge from '../components/StatusBadge';
import { AppTabParamList } from '../navigation/types';
import {
  Registro,
  buscarRegistro,
  atualizarRegistro,
  listarRegistros,
  listarUsuarios,
  listarClientesFornecedores,
  listarAnexos,
  alternarFavorito,
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

export default function AcaoDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppTabParamList, 'AcaoDetalhe'>>();
  const { acaoId } = route.params;

  const [acao, setAcao] = useState<Registro | null>(null);
  const [anexosCount, setAnexosCount] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [origem, setOrigem] = useState('');
  const [mostrarOrigens, setMostrarOrigens] = useState(false);

  const [metodoAnalise, setMetodoAnalise] = useState('');
  const [mostrarMetodos, setMostrarMetodos] = useState(false);

  const [ocorrencias, setOcorrencias] = useState<Registro[]>([]);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<Registro | null>(null);
  const [mostrarOcorrencias, setMostrarOcorrencias] = useState(false);
  const [opDaOcorrencia, setOpDaOcorrencia] = useState<Registro | null>(null);

  const [clientesFornecedores, setClientesFornecedores] = useState<Registro[]>([]);
  const [clienteFornecedor, setClienteFornecedor] = useState<Registro | null>(null);
  const [mostrarClientesFornecedores, setMostrarClientesFornecedores] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [responsavel, setResponsavel] = useState('');
  const [mostrarResponsaveis, setMostrarResponsaveis] = useState(false);

  const [setorResponsavel, setSetorResponsavel] = useState('');
  const [mostrarSetores, setMostrarSetores] = useState(false);

  const [prazo, setPrazo] = useState('');
  const [analiseCausa, setAnaliseCausa] = useState('');
  const [acaoProposta, setAcaoProposta] = useState('');

  const carregar = useCallback(async () => {
    try {
      const [{ registro }, ocorrenciasResp, listaClientesFornecedores, usuariosResp, anexosResp] =
        await Promise.all([
          buscarRegistro(acaoId),
          listarRegistros('ocorrencia'),
          listarClientesFornecedores(),
          listarUsuarios(),
          listarAnexos(acaoId),
        ]);

      setAcao(registro);
      setOcorrencias(ocorrenciasResp.registros);
      setClientesFornecedores(listaClientesFornecedores);
      setUsuarios(usuariosResp.usuarios);
      setAnexosCount(anexosResp.anexos.length);

      setOrigem(registro.origem || '');
      setMetodoAnalise(registro.metodo_analise || '');
      setResponsavel(registro.responsavel || '');
      setSetorResponsavel(registro.processo || '');
      setPrazo(registro.data || '');
      setAnaliseCausa(registro.analise_causa || '');
      setAcaoProposta(registro.descricao || '');

      setOcorrenciaSelecionada(
        registro.ocorrencia_relacionada_id
          ? ocorrenciasResp.registros.find((o) => o.id === registro.ocorrencia_relacionada_id) ||
              null
          : null
      );
      setClienteFornecedor(
        registro.cliente_fornecedor_id
          ? listaClientesFornecedores.find((cf) => cf.id === registro.cliente_fornecedor_id) ||
              null
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

  // Resolve a OP relacionada à ocorrência escolhida (exibida como "OP relacionada")
  useEffect(() => {
    if (ocorrenciaSelecionada?.op_relacionada_id) {
      buscarRegistro(ocorrenciaSelecionada.op_relacionada_id)
        .then((r) => setOpDaOcorrencia(r.registro))
        .catch(() => setOpDaOcorrencia(null));
    } else {
      setOpDaOcorrencia(null);
    }
  }, [ocorrenciaSelecionada]);

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

  async function handleAtualizar() {
    if (!origem) {
      alertar('Atenção', 'Por favor, selecione a origem da ação corretiva.');
      return;
    }

    setSalvando(true);
    try {
      await atualizarRegistro(acaoId, {
        origem,
        metodoAnalise,
        ocorrenciaRelacionadaId: ocorrenciaSelecionada?.id ?? null,
        clienteFornecedorId: clienteFornecedor?.id ?? null,
        responsavel,
        processo: setorResponsavel,
        data: prazo,
        analiseCausa,
        descricao: acaoProposta,
      });

      alertar('Sucesso', 'Ação corretiva atualizada com sucesso!');
      carregar();
    } catch (error: any) {
      alertar('Erro', error.message || 'Não foi possível conectar ao servidor.');
    } finally {
      setSalvando(false);
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

      <ScrollView contentContainerStyle={styles.formulario}>
        {/* Ocorrência e Origem lado a lado */}
        <View style={styles.linhaDupla}>
          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Ocorrência (opcional)</Text>
            <TouchableOpacity
              style={styles.inputSeletor}
              onPress={() => setMostrarOcorrencias(!mostrarOcorrencias)}
            >
              <Text style={styles.inputTextoSimples} numberOfLines={1}>
                {ocorrenciaSelecionada?.codigo || 'Nenhuma'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
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

          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Origem <Text style={styles.obrigatorio}>*</Text></Text>
            <TouchableOpacity
              style={styles.inputSeletor}
              onPress={() => setMostrarOrigens(!mostrarOrigens)}
            >
              <Text style={[styles.inputTextoSimples, !origem && { color: colors.textSecondary }]}>
                {origem || 'Selecione'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
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
              : 'Nenhuma'}
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

        {/* Card com resumo herdado da ocorrência + status */}
        <View style={styles.card}>
          <View style={styles.linhaTopo}>
            <Ionicons name="construct" size={18} color={colors.textSecondary} />
            <Text style={styles.cardCodigo}>{acao.codigo}</Text>
            <StatusBadge status={acao.status} />
          </View>
          {!!ocorrenciaSelecionada?.descricao && (
            <>
              <Text style={styles.cardLabel}>Problema</Text>
              <Text style={styles.cardValor}>{ocorrenciaSelecionada.descricao}</Text>
            </>
          )}
          {!!acaoProposta && (
            <>
              <Text style={styles.cardLabel}>Ação proposta</Text>
              <Text style={styles.cardValor}>{acaoProposta}</Text>
            </>
          )}
          {!!setorResponsavel && (
            <Text style={styles.cardLinha}>Setor ou processo: {setorResponsavel}</Text>
          )}
          {!!responsavel && <Text style={styles.cardLinha}>Responsável: {responsavel}</Text>}
          {!!prazo && <Text style={styles.cardLinha}>Prazo: {prazo}</Text>}
          {!!opDaOcorrencia && (
            <Text style={styles.cardLinha}>OP relacionada: {opDaOcorrencia.codigo}</Text>
          )}
        </View>

        {/* Método de análise e Setor responsável lado a lado */}
        <View style={styles.linhaDupla}>
          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Método de análise</Text>
            <TouchableOpacity
              style={styles.inputSeletor}
              onPress={() => setMostrarMetodos(!mostrarMetodos)}
            >
              <Text
                style={[styles.inputTextoSimples, !metodoAnalise && { color: colors.textSecondary }]}
              >
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
            <Text style={styles.label}>Setor responsável</Text>
            <TouchableOpacity
              style={styles.inputSeletor}
              onPress={() => setMostrarSetores(!mostrarSetores)}
            >
              <Text
                style={[styles.inputTextoSimples, !setorResponsavel && { color: colors.textSecondary }]}
              >
                {setorResponsavel || 'Selecione'}
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
          </View>
        </View>

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

        {/* Prazo */}
        <Text style={styles.label}>Prazo</Text>
        <View style={styles.inputSeletor}>
          <TextInput
            placeholder="DD/MM/AAAA"
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

        {/* Acompanhamento */}
        <Text style={styles.tituloSecao}>Acompanhamento</Text>
        <View style={styles.acompanhamentoCard}>
          <View style={styles.acompanhamentoLinha}>
            <Text style={styles.acompanhamentoLabel}>Execução</Text>
            <StatusBadge status={acao.status} />
          </View>
          <TouchableOpacity
            style={styles.acompanhamentoLinha}
            onPress={() =>
              navigation.navigate('FotosAnexos', {
                registroId: acao.id,
                registroCodigo: acao.codigo,
                registroTipo: 'acao',
              })
            }
          >
            <Text style={styles.acompanhamentoLabel}>Evidências</Text>
            <Text style={styles.acompanhamentoValorLink}>{anexosCount} anexos</Text>
          </TouchableOpacity>
          <View style={styles.acompanhamentoLinha}>
            <Text style={styles.acompanhamentoLabel}>Avaliação da eficácia</Text>
            <Text style={styles.acompanhamentoValor}>
              {acao.avaliacao_eficacia || 'Aguardando avaliação'}
            </Text>
          </View>
        </View>

        {/* Botão Atualizar */}
        <TouchableOpacity
          style={styles.botaoSalvar}
          activeOpacity={0.8}
          onPress={handleAtualizar}
          disabled={salvando}
        >
          <Text style={styles.botaoSalvarTexto}>
            {salvando ? 'Salvando...' : 'Atualizar ação corretiva'}
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
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardCodigo: {
    flex: 1,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 8,
  },
  cardValor: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
  },
  cardLinha: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 22,
    marginBottom: 8,
  },
  acompanhamentoCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  acompanhamentoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  acompanhamentoLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  acompanhamentoValor: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  acompanhamentoValorLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
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
    marginTop: 20,
    paddingHorizontal: 8,
  },
});
