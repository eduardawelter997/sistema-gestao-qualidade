import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { colors } from '../theme/colors';
import {
  listarClientesFornecedores,
  buscarIndicadores,
  buscarIndicadoresDetalhe,
  Registro,
} from '../services/api';
import { abrirDetalhe, temTelaDeDetalhe } from '../navigation/navegarDetalhe';
import { alertar } from '../utils/alerta';

const rotuloTipo: Record<string, string> = {
  op: 'Ordem de Produção',
  ocorrencia: 'Ocorrência',
  acao: 'Ação Corretiva',
  recebimento: 'Recebimento',
};



export default function IndicadoresScreen() {
  const navigation = useNavigation<any>();
  
  const [abaAtiva, setAbaAtiva] = useState<'periodo' | 'setor' | 'tipo'>('periodo');
  
  // Estados interativos para as datas, ID e Nome do cliente selecionado
  const [dataInicio, setDataInicio] = useState('01/01/2026');
  const [dataFim, setDataFim] = useState('31/12/2026');
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);
  const [clienteSelecionadoNome, setClienteSelecionadoNome] = useState('Todos os clientes e fornecedores');
  
  // Estado para o dropdown de seleção de clientes/fornecedores
  const [mostrarClientes, setMostrarClientes] = useState(false);
  const [listaClientes, setListaClientes] = useState<any[]>([]);

  const [carregando, setCarregando] = useState(false);
  const [dadosResumo, setDadosResumo] = useState({
    opsEmAndamento: 0,
    ocorrenciasAbertas: 0,
    acoesAtrasadas: 0,
    recebimentosProblemas: 0,
    taxaNaoConformidade: 0,
    tempoMedio: 'Sem dados',
  });
  const [dadosGrafico, setDadosGrafico] = useState<{
    labels: string[];
    valores: number[];
    alturas: number[];
    chaves: (string | number)[];
  }>({
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    valores: Array(12).fill(0),
    alturas: Array(12).fill(4),
    chaves: Array.from({ length: 12 }, (_, i) => i + 1),
  });

  // Modal com a lista de registros por trás da barra clicada
  const [modalVisivel, setModalVisivel] = useState(false);
  const [tituloModal, setTituloModal] = useState('');
  const [registrosModal, setRegistrosModal] = useState<Registro[]>([]);
  const [carregandoModal, setCarregandoModal] = useState(false);

  useEffect(() => {
    carregarClientesCadastrados();
  }, []);

  useEffect(() => {
    carregarIndicadores();
  }, [abaAtiva, dataInicio, dataFim, clienteSelecionadoId]);

  const carregarClientesCadastrados = async () => {
  try {
    const lista = await listarClientesFornecedores();
    setListaClientes(lista);
  } catch (error) {
    console.log('Erro ao buscar lista para o filtro:', error);
  }
};

  const carregarIndicadores = async () => {
  try {
    setCarregando(true);

    const dados = await buscarIndicadores(
        dataInicio,
        dataFim,
        clienteSelecionadoId ? Number(clienteSelecionadoId) : null,
        abaAtiva
    );

    setDadosResumo(dados.resumo);
    setDadosGrafico(dados.grafico);
  } catch (error: any) {
    console.log('Erro ao buscar indicadores:', error);
  } finally {
    setCarregando(false);
  }
};

  const abrirDetalheBarra = async (index: number) => {
    if (!dadosGrafico.valores[index]) return; // barra vazia, nada pra mostrar

    setTituloModal(dadosGrafico.labels[index]);
    setModalVisivel(true);
    setCarregandoModal(true);
    setRegistrosModal([]);
    try {
      const { registros } = await buscarIndicadoresDetalhe(
        dataInicio,
        dataFim,
        clienteSelecionadoId ? Number(clienteSelecionadoId) : null,
        abaAtiva,
        dadosGrafico.chaves[index]
      );
      setRegistrosModal(registros);
    } catch (error: any) {
      alertar('Erro', error.message || 'Não foi possível carregar os registros.');
    } finally {
      setCarregandoModal(false);
    }
  };

  const handleAbrirRegistro = (registro: Registro) => {
    setModalVisivel(false);
    abrirDetalhe(navigation, registro);
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Cabeçalho */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.tituloTela}>Indicadores gerenciais</Text>
            <Text style={styles.subtituloTela}>Filtre e acompanhe o desempenho</Text>
          </View>
        </View>

        {/* Abas de Filtro superior */}
        <View style={styles.containerAbas}>
          <TouchableOpacity 
            style={[styles.abaBotao, abaAtiva === 'periodo' && styles.abaBotaoAtiva]}
            onPress={() => setAbaAtiva('periodo')}
            activeOpacity={0.8}
          >
            <Text style={[styles.abaTexto, abaAtiva === 'periodo' && styles.abaTextoAtiva]}>Período</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.abaBotao, abaAtiva === 'setor' && styles.abaBotaoAtiva]}
            onPress={() => setAbaAtiva('setor')}
            activeOpacity={0.8}
          >
            <Text style={[styles.abaTexto, abaAtiva === 'setor' && styles.abaTextoAtiva]}>Setor</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.abaBotao, abaAtiva === 'tipo' && styles.abaBotaoAtiva]}
            onPress={() => setAbaAtiva('tipo')}
            activeOpacity={0.8}
          >
            <Text style={[styles.abaTexto, abaAtiva === 'tipo' && styles.abaTextoAtiva]}>Tipo</Text>
          </TouchableOpacity>
        </View>

        {/* Seletor de Datas Interativo (visível se aba for Período) */}
        {abaAtiva === 'periodo' && (
          <View style={styles.containerDatas}>
            <View style={styles.inputDataBox}>
              <Text style={styles.labelData}>Data inicial</Text>
              <View style={styles.inputDataInterno}>
                <TextInput
                  style={styles.inputDataTexto}
                  value={dataInicio}
                  onChangeText={setDataInicio}
                  placeholder="DD/MM/AAAA"
                />
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              </View>
            </View>

            <View style={styles.inputDataBox}>
              <Text style={styles.labelData}>Data final</Text>
              <View style={styles.inputDataInterno}>
                <TextInput
                  style={styles.inputDataTexto}
                  value={dataFim}
                  onChangeText={setDataFim}
                  placeholder="DD/MM/AAAA"
                />
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              </View>
            </View>
          </View>
        )}

        {/* Dropdown Interativo de Cliente ou Fornecedor */}
        <Text style={styles.labelCampo}>Cliente ou fornecedor</Text>
        <TouchableOpacity
          style={styles.dropdownBox}
          activeOpacity={0.8}
          onPress={() => setMostrarClientes(!mostrarClientes)}
        >
          <Text style={styles.dropdownTexto}>{clienteSelecionadoNome}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarClientes && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setClienteSelecionadoId(null);
                  setClienteSelecionadoNome('Todos os clientes e fornecedores');
                  setMostrarClientes(false);
                }}
              >
                <Text style={styles.dropdownItemTextoDestaque}>Todos os clientes e fornecedores</Text>
              </TouchableOpacity>

              {listaClientes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setClienteSelecionadoId(item.id);
                    setClienteSelecionadoNome(item.titulo || 'Cliente');
                    setMostrarClientes(false);
                  }}
                >
                  <Text style={styles.dropdownItemTexto}>
                    {item.titulo} - <Text style={styles.tipoTexto}>{item.tipo || 'Cliente'}</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bloco do Gráfico */}
        <View style={styles.cardGrafico}>
          <Text style={styles.tituloGrafico}>
            {abaAtiva === 'periodo' && 'Registros por período'}
            {abaAtiva === 'setor' && 'Registros por setor'}
            {abaAtiva === 'tipo' && 'Ocorrências por tipo'}
          </Text>
          <Text style={styles.subtituloGrafico}>Exibindo métricas filtradas</Text>

          {carregando ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 40 }} />
          ) : dadosGrafico.labels.length === 0 ? (
            <Text style={styles.semDados}>Nenhum dado no período selecionado.</Text>
          ) : (
            <View style={styles.graficoBarrasContainer}>
              {dadosGrafico.labels.map((rotulo, index) => (
                <TouchableOpacity
                  key={rotulo}
                  style={styles.colunaBarra}
                  activeOpacity={0.7}
                  onPress={() => abrirDetalheBarra(index)}
                >
                  <Text style={styles.valorBarra}>{dadosGrafico.valores[index]}</Text>
                  <View style={[styles.barraPreenchida, { height: dadosGrafico.alturas[index] }]} />
                  <Text style={styles.legendaBarra} numberOfLines={1}>
                    {rotulo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Cards de Resumo */}
        <Text style={styles.tituloSecaoResumo}>Resumo dos indicadores</Text>

        <View style={styles.linhaCardsResumo}>
          <View style={styles.cardResumoItem}>
            <Text style={styles.cardResumoLabel}>OPs em andamento</Text>
            <Text style={[styles.cardResumoValor, { color: colors.primary }]}>{dadosResumo.opsEmAndamento}</Text>
          </View>

          <View style={styles.cardResumoItem}>
            <Text style={styles.cardResumoLabel}>Taxa de não conformidade</Text>
            <Text style={[styles.cardResumoValor, { color: '#D97706' }]}>{dadosResumo.taxaNaoConformidade}%</Text>
          </View>
        </View>

        <View style={styles.linhaCardsResumo}>
          <View style={styles.cardResumoItem}>
            <Text style={styles.cardResumoLabel}>Ocorrências abertas</Text>
            <Text style={[styles.cardResumoValor, { color: '#D97706' }]}>{dadosResumo.ocorrenciasAbertas}</Text>
          </View>

          <View style={styles.cardResumoItem}>
            <Text style={styles.cardResumoLabel}>Ações atrasadas</Text>
            <Text style={[styles.cardResumoValor, { color: '#DC2626' }]}>{dadosResumo.acoesAtrasadas}</Text>
          </View>
        </View>

        <View style={styles.linhaCardsResumo}>
          <View style={styles.cardResumoItem}>
            <Text style={styles.cardResumoLabel}>Recebimentos com problemas</Text>
            <Text style={[styles.cardResumoValor, { color: '#7C3AED' }]}>{dadosResumo.recebimentosProblemas}</Text>
          </View>

          <View style={styles.cardResumoItem}>
            <Text style={styles.cardResumoLabel}>Tempo médio de resolução</Text>
            <Text style={[styles.cardResumoValor, { color: '#2563EB' }]}>{dadosResumo.tempoMedio}</Text>
          </View>
        </View>

      </ScrollView>

      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Registros — {tituloModal}</Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {carregandoModal ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 30 }} />
            ) : registrosModal.length === 0 ? (
              <Text style={styles.modalVazio}>Nenhum registro encontrado.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 420 }}>
                {registrosModal.map((registro) => {
                  const tocavel = temTelaDeDetalhe(registro.tipo);
                  return (
                    <TouchableOpacity
                      key={registro.id}
                      style={styles.modalItem}
                      activeOpacity={tocavel ? 0.7 : 1}
                      disabled={!tocavel}
                      onPress={() => handleAbrirRegistro(registro)}
                    >
                      <View style={styles.modalItemTopo}>
                        <Text style={styles.modalItemCodigo}>{registro.codigo}</Text>
                        <StatusBadge status={registro.status} />
                      </View>
                      <Text style={styles.modalItemTitulo} numberOfLines={1}>
                        {registro.titulo}
                      </Text>
                      <Text style={styles.modalItemSubtitulo} numberOfLines={1}>
                        {rotuloTipo[registro.tipo] || registro.tipo} · {registro.data}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  content: { padding: 16, paddingBottom: 40 },
  subHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  botaoVoltar: { marginRight: 12 },
  tituloTela: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  subtituloTela: { fontSize: 12, color: colors.textSecondary },
  
  containerAbas: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 4, marginBottom: 16 },
  abaBotao: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  abaBotaoAtiva: { backgroundColor: colors.primary },
  abaTexto: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  abaTextoAtiva: { color: '#FFF' },

  containerDatas: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  inputDataBox: { flex: 1, marginRight: 8 },
  labelData: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  inputDataInterno: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, height: 40 },
  inputDataTexto: { flex: 1, fontSize: 12, color: colors.textPrimary },

  labelCampo: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  dropdownBox: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, height: 44 },
  dropdownTexto: { fontSize: 13, color: colors.textPrimary },
  dropdownContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemTexto: { fontSize: 13, color: colors.textPrimary },
  dropdownItemTextoDestaque: { fontSize: 13, fontWeight: 'bold', color: colors.primary },

  cardGrafico: { backgroundColor: '#FFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  tituloGrafico: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
  subtituloGrafico: { fontSize: 11, color: colors.textSecondary, marginBottom: 16 },
  semDados: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginVertical: 40 },
  graficoBarrasContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  colunaBarra: { alignItems: 'center', flex: 1 },
  valorBarra: { fontSize: 10, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  barraPreenchida: { width: 10, backgroundColor: colors.primary, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  legendaBarra: { fontSize: 9, color: colors.textSecondary, marginTop: 4 },

  tituloSecaoResumo: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 10 },
  linhaCardsResumo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardResumoItem: { flex: 1, backgroundColor: '#FFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  cardResumoLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 6 },
  cardResumoValor: { fontSize: 18, fontWeight: 'bold' },
  tipoTexto: { color: colors.textSecondary, fontSize: 11 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitulo: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 12,
  },
  modalVazio: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    marginVertical: 30,
  },
  modalItem: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalItemTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalItemCodigo: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  modalItemTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalItemSubtitulo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});