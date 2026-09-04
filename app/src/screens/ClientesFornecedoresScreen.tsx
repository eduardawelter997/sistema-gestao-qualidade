import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { listarClientesFornecedores } from '../services/api';
import Header from '../components/Header';
import { colors } from '../theme/colors';

export default function ClientesFornecedoresScreen() {
  const navigation = useNavigation<any>();
  const [busca, setBusca] = useState('');
  const [itens, setItens] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
  try {
    setCarregando(true);

    const lista = await listarClientesFornecedores();
    setItens(lista);
  } catch (error: any) {
    console.log('Erro ao buscar clientes/fornecedores:', error);
    Alert.alert(
      'Erro',
      error.message || 'Falha ao conectar com o servidor.'
    );
  } finally {
    setCarregando(false);
  }
};

  // Filtra por título (nome) ou tipo
  const itensFiltrados = itens.filter((item) =>
    (item.titulo && item.titulo.toLowerCase().includes(busca.toLowerCase())) ||
    (item.tipo && item.tipo.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Cabeçalho */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloTela}>Clientes e fornecedores</Text>
            <Text style={styles.subtituloTela}>Consulte os cadastros do sistema</Text>
          </View>

          {/* Botão de Adicionar novo */}
          <TouchableOpacity 
            style={styles.botaoAdicionar}
            onPress={() => navigation.navigate('CadastrarCliente')}
          >
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Barra de busca */}
        <View style={styles.containerBusca}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.inputBusca}
            placeholder="Buscar por nome ou tipo..."
            placeholderTextColor={colors.textSecondary}
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {/* Indicador de Carregamento */}
        {carregando ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {itensFiltrados.map((item) => (
              <View key={item.id} style={styles.cardItem}>
                <View style={styles.cardInfo}>
                  <Text style={styles.itemNome}>{item.titulo || 'Sem nome'}</Text>
                  <Text style={styles.itemDetalhe}>Tipo: <Text style={styles.bold}>{item.tipo || 'Cliente'}</Text></Text>
                  {item.descricao ? <Text style={styles.itemDetalhe} numberOfLines={1}>{item.descricao}</Text> : null}
                </View>
                <View style={[styles.badgeTipo, item.tipo === 'Fornecedor' ? styles.badgeFornecedor : styles.badgeCliente]}>
                  <Text style={styles.badgeTexto}>{item.tipo || 'Cliente'}</Text>
                </View>
              </View>
            ))}

            {itensFiltrados.length === 0 && !carregando && (
              <Text style={styles.nenhumResultado}>Nenhum registro encontrado.</Text>
            )}
          </>
        )}

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
  botaoAdicionar: { backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  containerBusca: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 46, marginBottom: 16 },
  inputBusca: { flex: 1, fontSize: 14, color: colors.textPrimary },
  cardItem: { backgroundColor: '#FFF', borderRadius: 8, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  cardInfo: { flex: 1, marginRight: 12 },
  itemNome: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  itemDetalhe: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  bold: { color: colors.textPrimary, fontWeight: '600' },
  badgeTipo: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeCliente: { backgroundColor: '#E3F2FD' },
  badgeFornecedor: { backgroundColor: '#E8F5E9' },
  badgeTexto: { fontSize: 11, fontWeight: '700', color: colors.primary },
  nenhumResultado: { textAlign: 'center', fontSize: 13, color: colors.textSecondary, marginTop: 30 },
});