import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { colors } from '../theme/colors';
import {
  listarClientesFornecedores,
  buscarIndicadores,
} from '../services/api';



export default function IndicadoresScreen() {
  const navigation = useNavigation<any>();
  
  const [abaAtiva, setAbaAtiva] = useState<'periodo' | 'setor' | 'tipo'>('periodo');
  
  // Estados interativos para as datas, ID e Nome do cliente selecionado
  const [dataInicio, setDataInicio] = useState('01/01/2026');
  const [dataFim, setDataFim] = useState('31/12/2026');
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);
  const [clienteSelecionadoNome, setClienteSelecionadoNome] = useState('Todos os clientes e fornecedores');
  
  // Estados para o modal de seleção de clientes/fornecedores
  const [modalClienteVisivel, setModalClienteVisivel] = useState(false);
  const [listaClientes, setListaClientes] = useState<any[]>([]);

  const [carregando, setCarregando] = useState(false);
  const [dadosResumo, setDadosResumo] = useState({
    ocorrenciasAbertas: 5,
    acoesAtrasadas: 2,
    recebimentosProblemas: 3,
    tempoMedio: '4 dias',
  });
  const [dadosGrafico, setDadosGrafico] = useState({
  valores: Array(12).fill(0),
  alturas: Array(12).fill(4),
});

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
          onPress={() => setModalClienteVisivel(true)}
        >
          <Text style={styles.dropdownTexto}>{clienteSelecionadoNome}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

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
          ) : (
            <View style={styles.graficoBarrasContainer}>
              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((mes, index) => {
                
                return (
                  <View key={mes} style={styles.colunaBarra}>
                    <Text style={styles.valorBarra}>
                        {dadosGrafico.valores[index]}
                    </Text>
                    <View style={[styles.barraPreenchida,{ height: dadosGrafico.alturas[index] },]}/>
                    <Text style={styles.legendaBarra}>{mes}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Cards de Resumo */}
        <Text style={styles.tituloSecaoResumo}>Resumo dos indicadores</Text>

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

      {/* Modal para Seleção de Cliente / Fornecedor */}
      <Modal visible={modalClienteVisivel} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Selecione o cliente ou fornecedor</Text>
              <TouchableOpacity onPress={() => setModalClienteVisivel(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <TouchableOpacity 
                style={styles.opcaoModal}
                onPress={() => {
                  setClienteSelecionadoId(null);
                  setClienteSelecionadoNome('Todos os clientes e fornecedores');
                  setModalClienteVisivel(false);
                }}
              >
                <Text style={styles.opcaoModalTextoDestaque}>Todos os clientes e fornecedores</Text>
              </TouchableOpacity>

              {listaClientes.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.opcaoModal}
                  onPress={() => {
                    setClienteSelecionadoId(item.id);
                    setClienteSelecionadoNome(item.titulo || 'Cliente');
                    setModalClienteVisivel(false);
                  }}
                >
                  <Text style={styles.opcaoModalTexto}>
                    {item.titulo} - <Text style={styles.tipoTexto}>{item.tipo || 'Cliente'}</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  dropdownBox: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, height: 44, marginBottom: 16 },
  dropdownTexto: { fontSize: 13, color: colors.textPrimary },

  cardGrafico: { backgroundColor: '#FFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  tituloGrafico: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
  subtituloGrafico: { fontSize: 11, color: colors.textSecondary, marginBottom: 16 },
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#FFF', borderRadius: 12, maxHeight: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  modalTitulo: { fontSize: 15, fontWeight: 'bold', color: colors.primary },
  modalScroll: { maxHeight: 350 },
  opcaoModal: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  opcaoModalTexto: { fontSize: 13, color: colors.textPrimary },
  opcaoModalTextoDestaque: { fontSize: 13, fontWeight: 'bold', color: colors.primary },
  tipoTexto: { color: colors.textSecondary, fontSize: 11 },
});