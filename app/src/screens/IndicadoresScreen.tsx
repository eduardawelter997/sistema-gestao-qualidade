import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { colors } from '../theme/colors';

export default function IndicadoresScreen() {
  const navigation = useNavigation<any>();
  
  // Estados para gerenciar as abas de filtro superior (Período, Setor, Tipo)
  const [abaAtiva, setAbaAtiva] = useState<'periodo' | 'setor' | 'tipo'>('periodo');
  const [clienteSelecionado, setClienteSelecionado] = useState('Todos os clientes e fornecedores');

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
            <Text style={styles.subtituloTela}>Acompanhe o desempenho e métricas da qualidade</Text>
          </View>
        </View>

        {/* Abas de Filtro superior (Período | Setor | Tipo) */}
        <View style={styles.containerAbas}>
          <TouchableOpacity 
            style={[styles.abaBotao, abaAtiva === 'periodo' && styles.abaBotaoAtiva]}
            onPress={() => setAbaAtiva('periodo')}
          >
            <Text style={[styles.abaTexto, abaAtiva === 'periodo' && styles.abaTextoAtiva]}>Período</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.abaBotao, abaAtiva === 'setor' && styles.abaBotaoAtiva]}
            onPress={() => setAbaAtiva('setor')}
          >
            <Text style={[styles.abaTexto, abaAtiva === 'setor' && styles.abaTextoAtiva]}>Setor</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.abaBotao, abaAtiva === 'tipo' && styles.abaBotaoAtiva]}
            onPress={() => setAbaAtiva('tipo')}
          >
            <Text style={[styles.abaTexto, abaAtiva === 'tipo' && styles.abaTextoAtiva]}>Tipo</Text>
          </TouchableOpacity>
        </View>

        {/* Inputs de Data (se aba for período) ou seletores */}
        {abaAtiva === 'periodo' && (
          <View style={styles.containerDatas}>
            <View style={styles.inputDataBox}>
              <Text style={styles.labelData}>Data inicial</Text>
              <View style={styles.inputDataInterno}>
                <Text style={styles.textoDataValor}>XX/XX/XXXX</Text>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              </View>
            </View>

            <View style={styles.inputDataBox}>
              <Text style={styles.labelData}>Data final</Text>
              <View style={styles.inputDataInterno}>
                <Text style={styles.textoDataValor}>XX/XX/XXXX</Text>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              </View>
            </View>
          </View>
        )}

        {/* Dropdown de Cliente ou Fornecedor */}
        <Text style={styles.labelCampo}>Cliente ou fornecedor</Text>
        <TouchableOpacity style={styles.dropdownBox} activeOpacity={0.8}>
          <Text style={styles.dropdownTexto}>{clienteSelecionado}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Bloco do Gráfico */}
        <View style={styles.cardGrafico}>
          <Text style={styles.tituloGrafico}>
            {abaAtiva === 'periodo' && 'Registros por período'}
            {abaAtiva === 'setor' && 'Registros por setor'}
            {abaAtiva === 'tipo' && 'Ocorrências por tipo'}
          </Text>
          <Text style={styles.subtituloGrafico}>
            {abaAtiva === 'periodo' && 'Quantidade de registros da qualidade'}
            {abaAtiva === 'setor' && 'Quantidade de registros em cada setor'}
            {abaAtiva === 'tipo' && 'Quantidade de ocorrências de cada tipo'}
          </Text>

          {/* Área visual das barras do gráfico */}
          <View style={styles.graficoBarrasContainer}>
            {abaAtiva === 'periodo' && (
              <>
                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((mes, index) => {
                  const alturas = [40, 30, 50, 25, 45, 60, 35, 70, 55, 30, 45, 65];
                  const valores = [5, 3, 7, 2, 6, 9, 4, 10, 8, 3, 5, 9];
                  return (
                    <View key={mes} style={styles.colunaBarra}>
                      <Text style={styles.valorBarra}>{valores[index]}</Text>
                      <View style={[styles.barraPreenchida, { height: alturas[index] }]} />
                      <Text style={styles.legendaBarra}>{mes}</Text>
                    </View>
                  );
                })}
              </>
            )}

            {abaAtiva === 'setor' && (
              <>
                {['Produção', 'Qualidade', 'Almoxarifado'].map((setor, index) => {
                  const alturas = [80, 50, 40];
                  const valores = [10, 6, 4];
                  return (
                    <View key={setor} style={[styles.colunaBarra, { flex: 1 }]}>
                      <Text style={styles.valorBarra}>{valores[index]}</Text>
                      <View style={[styles.barraPreenchida, { height: alturas[index] }]} />
                      <Text style={styles.legendaBarra}>{setor}</Text>
                    </View>
                  );
                })}
              </>
            )}

            {abaAtiva === 'tipo' && (
              <>
                {['Erro de processo', 'Extravio', 'Reparo', 'Desperdício'].map((tipo, index) => {
                  const alturas = [70, 60, 45, 30];
                  const valores = [5, 4, 3, 2];
                  return (
                    <View key={tipo} style={[styles.colunaBarra, { flex: 1 }]}>
                      <Text style={styles.valorBarra}>{valores[index]}</Text>
                      <View style={[styles.barraPreenchida, { height: alturas[index] }]} />
                      <Text style={styles.legendaBarra}>{tipo}</Text>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        </View>

        {/* Cards de Resumo dos Indicadores */}
        <Text style={styles.tituloSecaoResumo}>Resumo dos indicadores</Text>

        <View style={styles.linhaCardsResumo}>
          <View style={styles.cardResumoItem}>
            <Text style={styles.cardResumoLabel}>Ocorrências abertas</Text>
            <Text style={[styles.cardResumoValor, { color: '#D97706' }]}>5</Text>
          </View>

          <View style={styles.cardResumoItem}>
            <Text style={styles.cardResumoLabel}>Ações atrasadas</Text>
            <Text style={[styles.cardResumoValor, { color: '#DC2626' }]}>2</Text>
          </View>
        </View>

        <View style={styles.linhaCardsResumo}>
          <View style={styles.cardResumoItem}>
            <Text style={styles.cardResumoLabel}>Recebimentos com problemas</Text>
            <Text style={[styles.cardResumoValor, { color: '#7C3AED' }]}>3</Text>
          </View>

          <View style={styles.cardResumoItem}>
            <Text style={styles.cardResumoLabel}>Tempo médio de resolução</Text>
            <Text style={[styles.cardResumoValor, { color: '#2563EB' }]}>4 dias</Text>
          </View>
        </View>

      </ScrollView>
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
  
  // Abas superiores
  containerAbas: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 4, marginBottom: 16 },
  abaBotao: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  abaBotaoAtiva: { backgroundColor: colors.primary },
  abaTexto: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  abaTextoAtiva: { color: '#FFF' },

  // Datas
  containerDatas: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  inputDataBox: { flex: 1, marginRight: 8 },
  labelData: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  inputDataInterno: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, height: 40 },
  textoDataValor: { fontSize: 12, color: colors.textSecondary },

  // Dropdown
  labelCampo: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  dropdownBox: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, height: 44, marginBottom: 16 },
  dropdownTexto: { fontSize: 13, color: colors.textPrimary },

  // Gráfico
  cardGrafico: { backgroundColor: '#FFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  tituloGrafico: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
  subtituloGrafico: { fontSize: 11, color: colors.textSecondary, marginBottom: 16 },
  graficoBarrasContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  colunaBarra: { alignItems: 'center', flex: 1 },
  valorBarra: { fontSize: 10, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  barraPreenchida: { width: 10, backgroundColor: colors.primary, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  legendaBarra: { fontSize: 9, color: colors.textSecondary, marginTop: 4 },

  // Resumo
  tituloSecaoResumo: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 10 },
  linhaCardsResumo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardResumoItem: { flex: 1, backgroundColor: '#FFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  cardResumoLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 6 },
  cardResumoValor: { fontSize: 18, fontWeight: 'bold' },
});